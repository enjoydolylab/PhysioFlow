import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createCoreComponentRegistry,freezeProtocolGraph} from '../src/core/index.js';
import {prepareGroupSequence} from '../src/core/groupSequence.js';
import {resolveStimulusAssignments} from '../src/core/stimulusRandomization.js';
import {createRuntimeState,startRuntime,completeCurrentNode} from '../src/runtime/index.js';
const source=JSON.parse(readFileSync(new URL('../examples/lab-meeting-2026-09-25/01_READY_TO_RUN.protocol.json',import.meta.url)));
const registry=createCoreComponentRegistry();
test('meeting demo freezes, embeds matching QA videos, and executes both group orders with four bounded branch visits',async()=>{
 const frozen=await freezeProtocolGraph(source,registry);const orders=new Set();
 for(const asset of source.assets){const bytes=Buffer.from(asset.sourceUrl.split(',')[1],'base64');assert.equal(createHash('sha256').update(bytes).digest('hex'),asset.checksum);assert.equal(asset.condition,'QA-only');}
 for(let index=0;index<12;index++){
  const seed=`meeting-${index}`;const {protocol,plan}=prepareGroupSequence(frozen,frozen.groupRandomization.groupIds,seed,registry);orders.add(plan.groupOrder.join(','));
  const assignments=resolveStimulusAssignments(protocol,seed,[]);const assigned=[...assignments.values()].map(a=>a.assetId);assert.equal(new Set(assigned).size,4);
  for(const half of [1,2]){const nodes=protocol.graph.nodes.filter(n=>n.metadata?.half===half);const categories=nodes.map(n=>protocol.assets.find(a=>a.id===assignments.get(n.id).assetId).category).sort();assert.deepEqual(categories,['pulse','slow']);}
  let tick=0;const services={idFactory:prefix=>prefix+ ++tick,clock:{now:()=>({epochMs:1000+ ++tick,monotonicMs:tick,iso:new Date(1000+tick).toISOString()})}};
  let {state}=startRuntime(createRuntimeState(protocol,{sessionId:seed,randomSeed:seed,startedAtEpochMs:1000,startedAtMonotonicMs:0}),protocol,registry,services);const visits=[];
  while(state.status==='waiting'&&visits.length<60){visits.push(state.currentNodeId);state=completeCurrentNode(state,protocol,registry,services,{}).state;}
  assert.equal(state.status,'completed');assert.equal(visits.filter(id=>['A_質問A','A_質問B'].includes(id)).length,4);
  assert.equal(visits.filter(id=>/^T[1-4]_映像$/.test(id)).length,4);assert.equal(visits.filter(id=>id==='B_途中復元質問票').length,1);
 }
 assert.equal(orders.size,2);
});

test('four short meeting prototypes validate and freeze with distinct experiment identities',async()=>{
 const ids=new Set([source.protocolId]);
 for(const name of ['02_NESTED','03_RECOVERY','04_STROOP','05_GONOGO']){
  const p=JSON.parse(readFileSync(new URL(`../examples/lab-meeting-2026-09-25/patterns/${name}.protocol.json`,import.meta.url)));
  assert.ok(!ids.has(p.protocolId));ids.add(p.protocolId);assert.equal(p.biodb.experimentId,p.protocolId);
  await freezeProtocolGraph(p,registry);
  if(name==='04_STROOP')assert.equal(p.graph.nodes.find(n=>n.component.type==='experiment.cognitive-task').config.trials.length,8);
  if(name==='05_GONOGO')assert.equal(p.graph.nodes.find(n=>n.component.type==='experiment.cognitive-task').config.trials.length,10);
 }
 assert.equal(ids.size,5);
});
