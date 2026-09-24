import test from 'node:test';
import assert from 'node:assert/strict';
import { computeWindows } from '../src/analysis/windowData.js';
test('graph analysis windows pair repeated component visits and flag skips and pauses',()=>{
 const protocol={graph:{nodes:[{id:'n',label:'Image',component:{type:'display.media'},config:{isAnalysisWindow:true,analysisLabel:'stimulus',completion:{mode:'fixed',durationMs:100}}}]}};
 const events=[['component_entered',0],['component_retried',10],['component_entered',10],['session_paused',20],['component_completed',100],['component_entered',100],['component_skipped',110]].map(([eventType,elapsedMonotonicMs],i)=>({eventId:String(i),nodeId:'n',eventType,elapsedMonotonicMs}));
 const rows=computeWindows(events,protocol);
 assert.deepEqual(rows.map(x=>[x.durationMs,x.validity]),[[10,'attention'],[90,'attention'],[10,'invalid']]);
 assert.equal(rows[0].label,'stimulus');assert.equal(rows[1].pauseCount,1);
 assert.equal(rows[0].expectedMs,100);
 protocol.graph.nodes[0].config.isAnalysisWindow=false;
 assert.deepEqual(computeWindows(events,protocol),[]);
});
