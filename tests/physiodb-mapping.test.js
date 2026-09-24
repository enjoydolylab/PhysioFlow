import test from 'node:test';
import assert from 'node:assert/strict';
import { toPhysioDBEvent } from '../src/physioDBMapping.js';
const event = { eventType: 'test_navigation_back', eventId: 'e1', sessionId: 's1', sequence: 8, timestampIso: '2026-09-24T12:00:00.123456+09:00', protocolId: 'p1', nodeId: 'n1', payload: { supersededFromSequence: 2, supersededThroughSequence: 7 } };
test('PhysioDB event mapping preserves provenance, submillisecond timestamp text and navigation ranges', () => {
 const mapped=toPhysioDBEvent(event);
 assert.equal(mapped.event_type,event.eventType);
 assert.equal(mapped.started_at,event.timestampIso);
 assert.equal(mapped.data.sessionId,'s1');
 assert.equal(mapped.data.eventId,'e1');
 assert.equal(mapped.data.sequence,8);
 assert.deepEqual(mapped.data.payload,event.payload);
 mapped.data.payload.supersededFromSequence=99;
 assert.equal(event.payload.supersededFromSequence,2);
 assert.equal('ended_at' in mapped,false);
});
test('mapping rejects untraceable events and ambiguous timestamps before any request', () => {
 for (const patch of [{eventId:''},{sessionId:''},{sequence:0},{eventType:'x'.repeat(101)},{timestampIso:'2026-09-24T12:00:00'},{timestampIso:'invalidZ'}]) assert.throws(()=>toPhysioDBEvent({...event,...patch}));
});

test('raw sample conversion preserves explicit channel order and microsecond time resolution', async () => {
 const {toPhysioDBSamples}=await import('../src/physioDBMapping.js');
 const channels=[{name:'eeg2',row:2},{name:'eeg1',row:1}];
 const samples=[{sequence:10,timestamp:1.000001,rows:[99,0,-1.25]},{sequence:11,timestamp:1.000002,rows:[98,2,3]}];
 assert.deepEqual(toPhysioDBSamples(samples,channels),[{time:'1970-01-01T00:00:01.000001Z',values:[-1.25,0]},{time:'1970-01-01T00:00:01.000002Z',values:[3,2]}]);
 assert.equal(samples[0].rows[1],0);
 for(const second of [{...samples[1],sequence:12},{...samples[1],timestamp:1.000001},{...samples[1],rows:[98,NaN,3]}]) assert.throws(()=>toPhysioDBSamples([samples[0],second],channels));
 assert.throws(()=>toPhysioDBSamples([{sequence:1,timestamp:1,values:{eeg1:1}}],channels),/Full raw/);
 assert.throws(()=>toPhysioDBSamples(samples,[channels[0],channels[0]]),/unique/);
});
