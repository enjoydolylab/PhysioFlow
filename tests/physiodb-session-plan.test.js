import test from 'node:test';
import assert from 'node:assert/strict';
import {buildPhysioDBSessionPlan} from '../src/physioDBSessionPlan.js';
import {createPhysioDBRunMapping} from '../src/physioDBRunMapping.js';
test('saved run upload preserves original response records including superseded answers',()=>{
 const session={session_id:'run1',status:'completed',protocol_snapshot:{protocolId:'p1',version:{number:1}},events:[{sessionId:'run1',protocolId:'p1',protocolVersion:1,eventId:'e1',sequence:1,eventType:'session_completed',timestampIso:'2026-10-14T00:00:02Z'}],responses:[{responseId:'r1',timestampIso:'2026-10-14T00:00:01Z',value:5,supersededByEventId:'e1',nodeId:'n1'}]};
 const plan=buildPhysioDBSessionPlan(session,{researchId:'research'});const mapped=createPhysioDBRunMapping(plan).event(plan.events[1]);
 assert.equal(mapped.data.payload.response.value,5);assert.equal(mapped.data.payload.response.supersededByEventId,'e1');assert.equal(plan.events[1].sequence,2);
 plan.events[1].payload.response.value=99;assert.equal(session.responses[0].value,5);
 assert.throws(()=>buildPhysioDBSessionPlan({...session,status:'running'},{}),/completed/);
});
