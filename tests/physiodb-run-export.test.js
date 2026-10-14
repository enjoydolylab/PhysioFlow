import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { buildPhysioDBRunExport } from '../src/physioDBRunExport.js';
import { createPhysioDBRunMapping } from '../src/physioDBRunMapping.js';
function fixture() {
 const protocol={protocolId:'p',version:{number:1},graph:{nodes:[{id:'n',label:'評価',config:{questionnaire:{questions:[{question_id:'q',text:'気分'}]}}}]}};
 const {provenance}=createPhysioDBRunMapping({sessionId:'run',protocol});
 const run={sessionId:'run',protocolSnapshot:protocol,provenance,destination:{experimentId:'exp',participantId:'subject'}};
 const values=[0,-2,['a','b'],null,'=SUM(1,2)','quoted " text\nnext'];
 const events=values.map((value,i)=>({id:`db-${i}`,event_type:'physioflow.response_recorded',started_at:'2026-10-14T00:00:00Z',data:{physioflow:{...provenance,sequence:i+1,node_id:'n'},payload:{response:{responseId:`r-${i}`,nodeId:'n',name:'q',value,supersededByEventId:i===0?'replacement':null}}}}));
 return {run,events,retrievedAt:'2026-10-14T01:00:00Z'};
}
test('export includes all selected run records, exact answers and frozen design with independently verifiable hashes',()=>{
 const input=fixture(), original=structuredClone(input);
 input.events.reverse();input.events.push({...input.events[0],id:'other',data:{physioflow:{run_id:'other'}}});
 const files=buildPhysioDBRunExport(input), manifest=JSON.parse(files['manifest.json']);
 assert.deepEqual(manifest.counts,{events:6,responses:6});
 assert.deepEqual(JSON.parse(files['responses.json']),original.events.map(e=>e.data.payload.response));
 assert.deepEqual(JSON.parse(files['protocol.json']),input.run.protocolSnapshot);
 assert.equal(files['events.jsonl'].trim().split('\n').length,6);
 for(const [name,entry] of Object.entries(manifest.files)) {
  assert.equal(entry.sha256,createHash('sha256').update(files[name]).digest('hex'));assert.equal(entry.bytes,Buffer.byteLength(files[name]));
 }
 assert.ok(files['responses.csv'].startsWith('\ufeff'));
 assert.match(files['responses.csv'],/,0,/);assert.match(files['responses.csv'],/,-2,/);
 assert.ok(files['responses.csv'].includes(`"'=SUM(1,2)"`));assert.ok(files['responses.csv'].includes('quoted "" text\nnext'));assert.ok(files['responses.csv'].includes('気分'));
});
test('export rejects changed snapshots, duplicate sequencing, legacy or malformed records',()=>{
 for(const mutate of [f=>f.run.protocolSnapshot.version.number++,f=>f.run.provenance={...f.run.provenance,protocol_id:'wrong'},f=>f.events[1].data.physioflow.sequence=1,f=>delete f.events[0].data.payload.response,f=>{f.events[0].metadata={physioflow:{run_id:'run'}};delete f.events[0].data;},f=>f.events[0].data.physioflow.protocol_sha256='wrong']) {
  const f=fixture();mutate(f);assert.throws(()=>buildPhysioDBRunExport(f),/design/);
 }
});
test('empty stored run exports an explicit zero count and valid CSV headers',()=>{
 const f=fixture();f.events=[];const files=buildPhysioDBRunExport(f);assert.deepEqual(JSON.parse(files['manifest.json']).counts,{events:0,responses:0});assert.deepEqual(JSON.parse(files['responses.json']),[]);
});
