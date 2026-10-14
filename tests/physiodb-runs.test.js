import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createPhysioDBRuns } from '../server/physioDBRuns.mjs';
const actor = { tenantId: 'lab', actorId: 'researcher' };
function fixture() {
 const destination = {researchId:randomUUID(),experimentId:randomUUID(),participantId:randomUUID()};
 const streams=[], events=[], samples=new Map(), calls=[]; let lose=null;
 const bridge=async (_,op,args) => {
  calls.push(op);
  if(op==='researches')return [{id:destination.researchId}];
  if(op==='experiments')return [{id:destination.experimentId}];
  if(op==='participants')return [{id:destination.participantId,code:'P01'}];
  if(op==='streams')return streams;
  if(op==='createStream'){const stream={id:randomUUID(),...args.stream,sample_count:0};streams.push(stream);samples.set(stream.id,[]);return stream;}
  if(op==='stream')return streams.find(s=>s.id===args.streamId);
  if(op==='appendSamples'){samples.get(args.streamId).push(...args.samples);streams.find(s=>s.id===args.streamId).sample_count+=args.samples.length; if(lose===op){lose=null;throw new Error('Response lost');} return null;}
  if(op==='samples')return samples.get(args.streamId).filter(s=>Date.parse(s.time)>=Date.parse(args.start)&&Date.parse(s.time)<Date.parse(args.end));
  if(op==='createEvent'){const e={id:randomUUID(),...args.event};events.push(e);if(lose===op){lose=null;throw new Error('Response lost');}return e;}
  if(op==='events')return events;
  throw new Error(op);
 };
 const plan={sessionId:'run1',destination,protocol:{protocolId:'p1',version:{number:1},graph:{nodes:[],edges:[]}},streams:[{name:'EEG',fields:[{name:'C3',type:'float',unit:'uV'}],samples:Array.from({length:502},(_,i)=>({time:`2026-10-14T00:00:00.${String(i+1).padStart(6,'0')}Z`,values:[i]}))}],events:[{eventId:'e1',sequence:1,sessionId:'run1',protocolId:'p1',protocolVersion:1,eventType:'response_submitted',timestampIso:'2026-10-14T00:00:00Z',payload:{attempt:1,answer:7}}]};
 return {bridge,plan,calls,streams,events,lose:op=>{lose=op;}};
}
test('formal run roundtrip survives restart, isolates repeats and rejects mixed payloads',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'pf-formal-'));t.after(()=>rm(dir,{recursive:true,force:true}));const f=fixture(), options={filePath:join(dir,'runs.json'),bridge:f.bridge};
 const service=await createPhysioDBRuns(options);assert.equal((await service.sync(actor,f.plan)).status,'verified');
 const restored=await createPhysioDBRuns(options);assert.equal((await restored.sync(actor,f.plan)).status,'verified');assert.equal(f.calls.filter(x=>x==='appendSamples').length,2);
 assert.equal((await restored.list({...actor,tenantId:'other'})).length,0);
 await assert.rejects(restored.sync(actor,{...f.plan,protocol:{...f.plan.protocol,version:{number:2}}}),/does not belong/);
 const changed=structuredClone(f.plan);changed.streams[0].samples[0].values=[99];await assert.rejects(restored.sync(actor,changed),/different design/);
 const repeat=structuredClone(f.plan);repeat.sessionId='run2';repeat.events[0].sessionId='run2';assert.equal((await restored.sync(actor,repeat)).status,'verified');assert.equal(f.streams.length,2);
});
for(const op of ['appendSamples','createEvent'])test(`committed ${op} response loss reconciles without duplicate writes`,async t=>{
 const dir=await mkdtemp(join(tmpdir(),'pf-reconcile-'));t.after(()=>rm(dir,{recursive:true,force:true}));const f=fixture(),options={filePath:join(dir,'runs.json'),bridge:f.bridge};f.lose(op);
 await assert.rejects((await createPhysioDBRuns(options)).sync(actor,f.plan),/Response lost/);
 const restored=await createPhysioDBRuns(options);assert.equal((await restored.sync(actor,f.plan)).status,'verified');assert.equal(f.calls.filter(x=>x===op).length,op==='appendSamples'?2:1);
});
test('run HTTP endpoints require owner authorization and expose persistent verification',async t=>{
 const {createHostedNodeServer}=await import('../server/createHostedNodeServer.mjs');
 const {createPhysioDBServiceClient}=await import('../src/physioDBServiceClient.js');
 const dir=await mkdtemp(join(tmpdir(),'pf-runs-http-'));t.after(()=>rm(dir,{recursive:true,force:true}));const f=fixture();
 const server=await createHostedNodeServer({actors:[{...actor,role:'owner',accessToken:'owner'},{...actor,actorId:'viewer',role:'viewer',accessToken:'viewer'},{...actor,actorId:'other-owner',role:'owner',accessToken:'other-owner'}],stateFile:join(dir,'state.json'),credentialKeys:[{keyId:'test',secret:'formal-run-test-secret-at-least-32-characters'}],physioDBBridge:f.bridge});
 const {baseUrl}=await server.listen(0);t.after(()=>server.close());
 const viewer=createPhysioDBServiceClient({baseUrl,accessToken:'viewer'});
 await assert.rejects(viewer.syncRun(f.plan),e=>e.status===403);await assert.rejects(viewer.runs(),e=>e.status===403);assert.equal(f.calls.length,0);
 const owner=createPhysioDBServiceClient({baseUrl,accessToken:'owner'});
 assert.equal((await owner.syncRun(f.plan)).status,'verified');assert.equal((await owner.runs())[0].sessionId,'run1');assert.deepEqual((await owner.runSnapshot('run1')).protocolSnapshot,f.plan.protocol);
 await assert.rejects(viewer.runSnapshot('run1'),e=>e.status===403);await assert.rejects(createPhysioDBServiceClient({baseUrl,accessToken:'other-owner'}).runSnapshot('run1'),e=>e.status===404);
});
test('unknown uncommitted write is never repeated automatically',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'pf-unknown-'));t.after(()=>rm(dir,{recursive:true,force:true}));const f=fixture();let attempts=0;
 const bridge=async(...args)=>{if(args[1]==='appendSamples'){attempts++;throw new Error('Network failed before a response');}return f.bridge(...args);};
 const options={filePath:join(dir,'runs.json'),bridge};await assert.rejects((await createPhysioDBRuns(options)).sync(actor,f.plan),/Network failed/);
 const restored=await createPhysioDBRuns(options);await assert.rejects(restored.sync(actor,f.plan),/outcome uncertain/);assert.equal(attempts,1);assert.ok((await restored.list(actor))[0].uncertainOperations.includes('samples:0:0'));
});
test('malformed fields and event gaps are rejected before database requests',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'pf-invalid-'));t.after(()=>rm(dir,{recursive:true,force:true}));const f=fixture(),service=await createPhysioDBRuns({filePath:join(dir,'runs.json'),bridge:f.bridge});
 for(const invalid of [null,{name:42,type:'float'}]){const plan=structuredClone(f.plan);plan.streams[0].fields=[invalid];await assert.rejects(service.sync(actor,plan),e=>e.status===400);}
 const gap=structuredClone(f.plan);gap.events[0].sequence=2;await assert.rejects(service.sync(actor,gap),/contiguous/);assert.equal(f.calls.length,0);
});
test('signals may be added after event-only sync while existing records remain immutable',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'pf-add-signals-'));t.after(()=>rm(dir,{recursive:true,force:true}));const f=fixture(),service=await createPhysioDBRuns({filePath:join(dir,'runs.json'),bridge:f.bridge});
 const eventsOnly={...f.plan,streams:[]};assert.equal((await service.sync(actor,eventsOnly)).status,'verified');
 assert.equal((await service.sync(actor,f.plan)).status,'verified');assert.equal(f.calls.filter(x=>x==='createEvent').length,1);assert.equal(f.streams[0].sample_count,502);
 const changed=structuredClone(f.plan);changed.events[0].payload.answer=99;changed.streams.push({...changed.streams[0],name:'another'});await assert.rejects(service.sync(actor,changed),/different design/);
 await assert.rejects(service.sync(actor,eventsOnly),/different design/);
});
