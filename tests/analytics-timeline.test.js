import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTimeline } from '../src/analysis/timelineData.js';

test('graph timeline matches exact node IDs, preserves zero starts and does not mutate events', () => {
 const events = [
  {eventType:'component_entered',nodeId:'a1',elapsedMonotonicMs:0},
  {eventType:'component_entered',nodeId:'a',elapsedMonotonicMs:2},
  {eventType:'component_completed',nodeId:'a',elapsedMonotonicMs:5},
  {eventType:'component_skipped',nodeId:'a1',elapsedMonotonicMs:9},
 ];
 const protocol={graph:{nodes:[{id:'a1',label:'First',component:{type:'display.media'}},{id:'a',label:'Second',component:{type:'display.screen'}}]}};
 const original=structuredClone(events);
 const result=buildTimeline(events,protocol);
 assert.deepEqual(result.items.map(x=>[x.name,x.startMs,x.endMs,x.status]),[['First',0,9,'skipped'],['Second',2,5,'completed']]);
 assert.deepEqual(buildTimeline(events,protocol),result);
 assert.deepEqual(events,original);
});
