import test from 'node:test';
import assert from 'node:assert/strict';
import { transferBrainFlowSamples } from '../src/physioDBTransfer.js';
const channels=[{name:'eeg',row:0}];
const record=sequence=>({sequence,timestamp:sequence/250,rows:[sequence]});
test('raw transfer batches all samples and reports only acknowledged writes',async()=>{
 const calls=[];const progress=[];
 async function* records(){for(let i=1;i<=5;i++)yield record(i);}
 const result=await transferBrainFlowSamples({records:records(),channels,streamId:'s',batchSize:2,client:{appendSamples:async(id,body)=>calls.push({id,body})},onProgress:p=>progress.push(p)});
 assert.deepEqual(calls.map(c=>c.body.length),[2,2,1]);
 assert.deepEqual(calls.flatMap(c=>c.body.map(s=>s.values[0])),[1,2,3,4,5]);
 assert.deepEqual(result,{confirmedSamples:5,confirmedThroughSequence:5});
 assert.deepEqual(progress.map(p=>p.confirmedSamples),[2,4,5]);
});
test('cross-batch gaps stop before sending invalid data; acknowledged batches stay explicit',async()=>{
 let calls=0;
 await assert.rejects(transferBrainFlowSamples({records:[record(1),record(2),record(4)],channels,streamId:'s',batchSize:2,client:{appendSamples:async()=>calls++}}),e=>e.progress.confirmedSamples===2&&e.progress.uncertainBatch===null);
 assert.equal(calls,1);
});
test('network failures are not retried and identify the uncertain batch',async()=>{
 let calls=0;
 await assert.rejects(transferBrainFlowSamples({records:[record(1),record(2),record(3)],channels,streamId:'s',batchSize:2,client:{appendSamples:async()=>{calls++;throw new Error('disconnected');}}}),e=>e.progress.confirmedSamples===0&&e.progress.uncertainBatch.fromSequence===1&&e.progress.uncertainBatch.throughSequence===2);
 assert.equal(calls,1);
});
test('cancellation prevents subsequent batches without claiming in-flight cancellation',async()=>{
 const controller=new AbortController();let calls=0;
 await assert.rejects(transferBrainFlowSamples({records:[record(1),record(2)],channels,streamId:'s',batchSize:1,signal:controller.signal,client:{appendSamples:async()=>{calls++;controller.abort();}}}),e=>e.progress.confirmedSamples===1&&e.progress.uncertainBatch===null);
 assert.equal(calls,1);
});

test('verified transfer refuses schema or participant mismatches before the first write',async()=>{
 const {transferVerifiedBrainFlowRecording}=await import('../src/physioDBTransfer.js');
 const stream={id:'s',experiment_id:'e',participant_id:'p',fields:[{name:'eeg',type:'float',unit:'uV'}],deleted_at:null};
 let writes=0;
 const options={records:[record(1)],channels:[{name:'eeg',row:0,unit:'uV'}],streamId:'s',experimentId:'e',participantId:'p'};
 for(const patch of [{participant_id:'other'},{experiment_id:'other'},{deleted_at:'2026-09-24'},{fields:[{name:'eeg',type:'integer',unit:'uV'}]},{fields:[{name:'eeg',type:'float',unit:'mV'}]},{fields:[{name:'other',type:'float',unit:'uV'}]}]){
  await assert.rejects(transferVerifiedBrainFlowRecording({...options,client:{stream:async()=>({...stream,...patch}),appendSamples:async()=>writes++}}));
 }
 assert.equal(writes,0);
 const result=await transferVerifiedBrainFlowRecording({...options,client:{stream:async()=>stream,appendSamples:async()=>writes++}});
 assert.equal(writes,1);assert.equal(result.confirmedSamples,1);
});
