import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createPhysioDBRecordings } from '../server/physioDBRecordings.mjs';
function fixture(count=100501){
 const all=[],streams=[];let writes=0,lose=false;
 const bridge=async(_,op,args)=>{
  if(op==='createStream'){const s={id:'stream',...args.stream};streams.push(s);return s;}
  if(op==='streams')return streams;
  if(op==='stream')return {...streams[0],sample_count:all.length};
  if(op==='appendSamples'){all.push(...args.samples);writes++;if(lose){lose=false;throw Error('Response lost');}return null;}
  if(op==='samples')return all.filter(s=>Date.parse(s.time)>=Date.parse(args.start)&&Date.parse(s.time)<Date.parse(args.end));
  throw Error(op);
 };
 const actor={actorId:'owner',tenantId:'lab'}, rows=Array.from({length:count},(_,i)=>({time:new Date(1791910000000+i*4).toISOString(),values:[i]}));
 const input={sessionId:'run1',recordingId:'raw',sourceSha256:'a'.repeat(64),sampleCount:count,firstTime:rows[0].time,lastTime:rows.at(-1).time,fields:[{name:'C3',type:'float',unit:'uV'}]};
 const runs={list:async a=>a.tenantId==='lab'?[{sessionId:'run1',status:'verified',destination:{experimentId:'experiment',participantId:'participant'},provenance:{run_id:'run1'}}]:[]};
 return {bridge,actor,rows,input,runs,lose:()=>{lose=true;},writes:()=>writes};
}
test('long recording exceeds old limit, survives restart, and retains hashes instead of confirmed samples',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'pf-long-'));t.after(()=>rm(dir,{recursive:true,force:true}));const f=fixture(),options={filePath:join(dir,'recordings.json'),bridge:f.bridge,runs:f.runs};
 let service=await createPhysioDBRecordings(options);await service.begin(f.actor,f.input);
 for(let offset=0;offset<f.rows.length;offset+=5000){await service.append(f.actor,{...f.input,offset,samples:f.rows.slice(offset,offset+5000)});if(offset===10000)service=await createPhysioDBRecordings(options);}
 assert.equal((await service.finish(f.actor,f.input)).status,'verified');assert.equal(f.writes(),21);
 const journal=JSON.parse(await readFile(options.filePath,'utf8'));const saved=Object.values(journal.recordings)[0];assert.equal(saved.pending,null);assert.ok(saved.chunks.every(c=>!c.samples));
 assert.ok((await readFile(options.filePath)).length<15000);
 assert.equal((await service.list({...f.actor,tenantId:'other'})).length,0);
});
test('lost commit response is reconciled exactly once; changed source and batch are rejected',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'pf-pending-'));t.after(()=>rm(dir,{recursive:true,force:true}));const f=fixture(500),options={filePath:join(dir,'state.json'),bridge:f.bridge,runs:f.runs};let service=await createPhysioDBRecordings(options);await service.begin(f.actor,f.input);f.lose();
 const batch={...f.input,offset:0,samples:f.rows};await assert.rejects(service.append(f.actor,batch),/Response lost/);service=await createPhysioDBRecordings(options);
 await assert.rejects(service.append(f.actor,{...batch,samples:batch.samples.map(s=>({...s,values:[99]}))}),/changed/);
 assert.equal((await service.append(f.actor,batch)).confirmedSamples,500);assert.equal(f.writes(),1);assert.equal((await service.finish(f.actor,f.input)).status,'verified');
 await assert.rejects(service.begin(f.actor,{...f.input,sourceSha256:'b'.repeat(64)}),/changed/);
});
test('recording endpoints deny viewer access before creating streams',async t=>{
 const {createHostedNodeServer}=await import('../server/createHostedNodeServer.mjs');const {createPhysioDBServiceClient}=await import('../src/physioDBServiceClient.js');
 const dir=await mkdtemp(join(tmpdir(),'pf-recording-auth-'));t.after(()=>rm(dir,{recursive:true,force:true}));let calls=0;
 const server=await createHostedNodeServer({actors:[{actorId:'viewer',tenantId:'lab',role:'viewer',accessToken:'viewer'}],stateFile:join(dir,'state.json'),credentialKeys:[{keyId:'test',secret:'recording-auth-test-secret-over-32-characters'}],physioDBBridge:async()=>{calls++;}});const {baseUrl}=await server.listen(0);t.after(()=>server.close());const client=createPhysioDBServiceClient({baseUrl,accessToken:'viewer'});
 for(const operation of ['beginRecording','appendRecording','finishRecording'])await assert.rejects(client[operation]({}),e=>e.status===403);
 await assert.rejects(client.recordings(),e=>e.status===403);assert.equal(calls,0);
});
