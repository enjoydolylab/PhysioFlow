import test from 'node:test';
import assert from 'node:assert/strict';
import { createBrainFlowAdapter } from '../src/devices/brainflowConnector.js';
import { DeviceConnectorSession } from '../src/devices/deviceConnector.js';
import { createDeviceSampler } from '../src/runtime/deviceRuntime.js';
const connector = {brainflow:{boardId:-1},channels:[{id:'eeg_1',direction:'input',dataType:'number',unit:'uV'}],approvedPermissions:['device.connect','device.read','device.write']};
function fixture(batch) {
  const calls=[];
  const adapter=createBrainFlowAdapter({token:'test-token',session:{sessionId:'s'},connector,fetchImpl:async(url,init)=>{
    calls.push({url,init});
    const value=url.endsWith('/status')?{manifest:connector,boardId:-1}:url.endsWith('/attach')?{cursor:10,runId:'run',boardId:-1}:url.includes('/samples')?batch:{};
    return {ok:true,json:async()=>value};
  }});return {adapter,calls};
}
test('BrainFlow batches preserve timestamps and sequence, and consume using cursor',async()=>{
  const {adapter,calls}=fixture({runId:'run',cursor:11,gap:0,samples:[{sequence:11,timestamp:123.456,values:{eeg_1:42}}]});
  await adapter.connect();assert.deepEqual(await adapter.readBatch(),[{channelId:'eeg_1',value:42,timestamp:123.456,sampleSequence:11,runId:'run'}]);
  assert.match(calls.at(-1).url,/after=10/);
  await adapter.disconnect();assert.match(calls.at(-1).url,/detach$/);
});
test('BrainFlow refuses buffer gaps, restarted agents and invalid sequences',async()=>{
  for(const batch of [{runId:'run',gap:20},{runId:'other'},{runId:'run',cursor:12,samples:[{sequence:12,timestamp:1,values:{eeg_1:1}}]}]){
    const {adapter}=fixture(batch);await adapter.connect();await assert.rejects(()=>adapter.readBatch());
  }
});
test('BrainFlow only accepts loopback URLs and requires a runtime credential',()=>{
  for(const endpoint of ['https://example.com','http://localhost:8765','http://127.0.0.1:8765/path'])assert.throws(()=>createBrainFlowAdapter({endpoint,token:'x'}));
  assert.throws(()=>createBrainFlowAdapter({token:''}));
});
test('batch sampler keeps provenance and stop waits for in-flight batch',async()=>{
  let release;const events=[];
  const session=new DeviceConnectorSession({connector,sessionId:'s',adapter:{connect:async()=>({}),readBatch:()=>new Promise(resolve=>{release=resolve;})},services:{idFactory:()=>String(events.length),clock:{now:()=>({epochMs:1,monotonicMs:1,iso:'now'})}},onEvent:e=>events.push(e)});
  await session.connect();const sampler=createDeviceSampler({session,channels:connector.channels});sampler.start();const stopped=sampler.stop();release([{channelId:'eeg_1',value:7,timestamp:10,sampleSequence:12,runId:'run'}]);await stopped;
  assert.equal(sampler.isRunning(),false);assert.equal(events.at(-1).payload.sampleSequence,12);assert.equal(events.at(-1).payload.deviceTimestamp,10);
});

test('bounded preview retains lifecycle events and newest samples',async()=>{
  const {trimBrainFlowPreview,BRAINFLOW_CONNECTOR_ID}=await import('../src/devices/brainflowConnector.js');
  const sample=n=>({connector:{id:BRAINFLOW_CONNECTOR_ID},eventType:'device_sample_received',n});
  const marker={connector:{id:BRAINFLOW_CONNECTOR_ID},eventType:'device_marker_sent'};
  const result=trimBrainFlowPreview([sample(1),marker,sample(2),sample(3)],2);
  assert.equal(result.dropped,1);assert.deepEqual(result.events,[marker,sample(2),sample(3)]);
});
