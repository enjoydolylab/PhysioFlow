import test from 'node:test';
import assert from 'node:assert/strict';
import {buildPhysioDBReview,physioDBRunId} from '../src/physioDBReview.js';
test('run review separates repeated runs and preserves zero and superseded answers with design labels',()=>{
 const event=(run,id,sequence,value)=>({id,started_at:'2026-10-14T00:00:00Z',event_type:'physioflow.response_recorded',data:{physioflow:{run_id:run,sequence,node_id:'rating'},payload:{response:{name:'q1',value,supersededByEventId:sequence===1?'later':null}}}});
 const events=[event('r1','e2',2,5),event('r2','e3',1,99),event('r1','e1',1,0)];
 const protocol={graph:{nodes:[{id:'rating',label:'Mood rating',config:{questionnaire:{questions:[{question_id:'q1',text:'How do you feel?'}]}}}]}};
 const rows=buildPhysioDBReview(events,{runId:'r1',protocol});assert.deepEqual(rows.map(r=>r.id),['e1','e2']);assert.equal(rows[0].responseValue,0);assert.equal(rows[0].superseded,true);assert.equal(rows[0].questionLabel,'How do you feel?');assert.equal(rows[0].nodeLabel,'Mood rating');
 assert.equal(physioDBRunId({metadata:{physioflow:{run_id:'r1'}}}),'r1');assert.equal(events[0].data.payload.response.value,5);
});
