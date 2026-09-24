import test from 'node:test';
import assert from 'node:assert/strict';
import { createProtocolGraph, addNode, connect, createCoreComponentRegistry, validateProtocolGraphConfiguration, freezeProtocolGraph } from '../src/core/index.js';
import { createRuntimeState, startRuntime, completeCurrentNode, restoreRuntime, snapshotRuntime, createRuntimeReplay, pauseRuntime, resumeRuntime } from '../src/runtime/index.js';
const registry = createCoreComponentRegistry();
function nested(outer = 2, inner = 3) {
  let p = createProtocolGraph({ name: 'Nested repetitions' });
  const start = p.graph.entryNodeId, end = p.graph.nodes.find(n => n.component.type === 'core.end').id;
  p.graph.edges = [];
  for (const [id, type, config] of [['outer', 'logic.loop', { maxIterations: outer }], ['inner', 'logic.loop', { maxIterations: inner }], ['body', 'timing.wait', { durationMs: 1 }]]) p = addNode(p, type, { id, config: { ...registry.get(type).defaultConfig, ...config } }).protocol;
  for (const [from, port, to] of [[start,'next','outer'],['outer','body','inner'],['inner','body','body'],['body','next','inner'],['inner','exit','outer'],['outer','exit',end]]) p = connect(p,'control',{nodeId:from,portId:port},{nodeId:to,portId:'in'}).protocol;
  return p;
}
function svc() { let n=0; return { idFactory: p=>p+ ++n, clock:{now:()=>({epochMs:1000+n,monotonicMs:n,iso:new Date(1000+n).toISOString()})} }; }
function initial(p) { return createRuntimeState(p,{sessionId:'regression',startedAtEpochMs:1000,startedAtMonotonicMs:0}); }
for (const [outer,inner] of [[2,3],[3,2]]) test(`nested ${outer} x ${inner} loop survives pause/restore and replay keeps every visit`, async()=>{
  const p=await freezeProtocolGraph(nested(outer,inner),registry), services=svc();
  let result=startRuntime(initial(p),p,registry,services), events=[...result.events], visits=0;
  while(result.state.status==='waiting' && visits<20){
    if(visits===2){
      const paused=pauseRuntime(result.state,p,services);events.push(...paused.events);
      const restored=restoreRuntime(snapshotRuntime(paused.state),p);
      result=resumeRuntime(restored,p,services);events.push(...result.events);
    }
    visits++;
    result=completeCurrentNode(result.state,p,registry,services);events.push(...result.events);
  }
  assert.equal(visits,outer*inner);
  assert.equal(result.state.status,'completed');
  const replay=createRuntimeReplay(p,events).finalState;
  assert.deepEqual(replay.completedNodeIds,result.state.completedNodeIds);
  assert.deepEqual(replay.loopCounts,result.state.loopCounts);
  assert.deepEqual(replay.loopStack,[]);
});
test('an inner until rule can exit early and starts fresh on next activation',()=>{
  const p=nested(2,5), inner=p.graph.nodes.find(n=>n.id==='inner');
  inner.bindings={until:{kind:'variable',variable:'again'}};
  inner.config.untilRule={operator:'is_truthy'};
  p.variables=[{name:'again',type:'boolean',scope:'session',defaultValue:true}];
  // End the first activation; the next activation exits immediately on the false rule.
  let result=startRuntime(initial(p),p,registry,svc());
  result=completeCurrentNode(result.state,p,registry,svc(),{variables:{again:false}});
  assert.equal(result.state.status,'completed');
  assert.equal(result.state.completedNodeIds.length,1);
  assert.equal(result.state.loopCounts.inner,0,'second activation exits without inheriting first count');
});
test('legacy checkpoint without loopStack retains its original run semantics',()=>{
  const p=nested(), state=initial(p);delete state.loopStack;
  let result=startRuntime(state,p,registry,svc()), visits=0;
  while(result.state.status==='waiting'&&visits<20){visits++;result=completeCurrentNode(result.state,p,registry,svc());}
  assert.equal(visits,3);
});
test('control fanout is blocked by editing, imported graph validation and freeze',async()=>{
  let p=createProtocolGraph();p=addNode(p,'core.end',{id:'second_end'}).protocol;
  const source=p.graph.edges[0].source,target={nodeId:'second_end',portId:'in'};
  assert.throws(()=>connect(p,'control',source,target),/already has a control connection/);
  p.graph.edges.push({id:'imported_extra',kind:'control',source:{...source},target});
  assert.ok(validateProtocolGraphConfiguration(p,registry).errors.some(e=>e.code==='port.control_output_multiple'));
  await assert.rejects(()=>freezeProtocolGraph(p,registry),/only one control connection/);
});

test('replay applies accepted variable changes, not raw submitted response fields',()=>{
  const p=nested(1,1), services=svc();
  const entered=startRuntime(initial(p),p,registry,services);
  const event={...entered.events.at(-1),sequence:entered.state.eventSequence+1,eventType:'response_submitted',payload:{values:{unapproved:'must not become a variable'}}};
  const done=completeCurrentNode({...entered.state,eventSequence:event.sequence},p,registry,services,{variables:{approved:1}});
  const replay=createRuntimeReplay(p,[...entered.events,event,...done.events]).finalState;
  assert.deepEqual(replay.variables,done.state.variables);
});
