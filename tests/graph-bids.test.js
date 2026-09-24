import assert from 'node:assert/strict';
import test from 'node:test';
import { buildGraphBidsBundle } from '../src/data/index.js';
import { createProtocolGraph, createSequentialIdFactory } from '../src/core/index.js';

function fixture() {
  const ids = createSequentialIdFactory();
  const protocol = createProtocolGraph({ idFactory: ids, name: 'Stroop Task', now: '2026-08-23T00:00:00.000Z' });
  return protocol;
}

test('BIDS bundle projects graph events into BIDS events files', () => {
  const protocol = fixture();
  const session = { session_id: 'S1', participant_id: 'P01', status: 'completed' };
  const events = [
    { eventId: 'e1', sequence: 1, sessionId: 'S1', protocolId: protocol.protocolId, protocolVersion: 1, nodeId: 'n1', componentType: 'display.screen', componentVersion: '1.0.0', eventType: 'protocol_started', timestampIso: 't', timestampEpochMs: 1, elapsedMonotonicMs: 0, payload: {} },
    { eventId: 'e2', sequence: 2, sessionId: 'S1', protocolId: protocol.protocolId, protocolVersion: 1, nodeId: 'n2', componentType: 'input.rating', componentVersion: '1.0.0', eventType: 'response_submitted', timestampIso: 't', timestampEpochMs: 2, elapsedMonotonicMs: 500, payload: { value: 5 } },
    { eventId: 'e3', sequence: 3, sessionId: 'S1', protocolId: protocol.protocolId, protocolVersion: 1, nodeId: 'n3', componentType: 'core.end', componentVersion: '1.0.0', eventType: 'protocol_completed', timestampIso: 't', timestampEpochMs: 3, elapsedMonotonicMs: 700, payload: {} },
  ];
  const responses = [{ nodeId: 'n2', name: 'value', value: 5, is_correct: true }];
  const bundle = buildGraphBidsBundle(session, protocol, events, responses);
  const tsvPath = Object.keys(bundle).find(key => key.endsWith('_events.tsv'));
  assert.ok(tsvPath, 'has a BIDS events .tsv');
  assert.ok(tsvPath.startsWith('sub-P01/ses-S1/func/'), `BIDS path structure ${tsvPath}`);
  const tsv = bundle[tsvPath];
  const rows = tsv.trimEnd().split('\n').map(line => line.split('\t'));
  assert.deepEqual(rows[0], ['onset', 'duration', 'sample', 'trial_type', 'component_type', 'node_id', 'stim_file', 'value', 'accuracy']);
  assert.ok(rows.every(row => row.length === 9));
  assert.match(tsv, /response_submitted/);
  assert.deepEqual(rows[1], ['0.000','0.500','0','protocol_started','display.screen','n1','n/a','n/a','n/a']);
  assert.deepEqual(rows[2], ['0.500','0.200','500','response_submitted','input.rating','n2','n/a','5','1']);
  assert.ok(bundle['participants.tsv'].includes('P01'));
  assert.ok(bundle['dataset_description.json'].includes('"BIDSVersion": "1.8.0"'));
});


test('TSV preserves commas and escapes tabs/newlines without creating extra rows', () => {
  const protocol = fixture();
  const bundle = buildGraphBidsBundle({ session_id: 'S1', participant_id: 'P01' }, protocol, [
    { sequence: 1, eventType: 'stimulus_assigned', nodeId: 'media', elapsedMonotonicMs: 0, payload: { sourceUrl: 'image,a\tb\nc.png' } },
  ]);
  const text = bundle[Object.keys(bundle).find(key => key.endsWith('_events.tsv'))];
  const rows = text.trimEnd().split('\n').map(line => line.split('\t'));
  assert.equal(rows.length, 2);
  assert.equal(rows[1].length, 9);
  assert.equal(rows[1][6], 'image,a\\tb\\nc.png');
});

test('session manager exporters route Graph sessions to Graph data without legacy blocks', async () => {
  const { bundle, bundleSimple } = await import('../src/exporter.js');
  const protocol = fixture();
  const session = { session_id:'S1',participant_id:'P01' };
  const responses = [{name:'value',value:'yes',nodeId:'r1',reactionTimeMs:235,nodeDurationMs:1235}];
  const complete = bundle(session,protocol,[],responses);
  assert.ok(complete['protocol_snapshot.json']);
  assert.ok(Object.keys(complete).some(name=>name.endsWith('_events.tsv')));
  const simple = bundleSimple(session,protocol,[],responses);
  assert.equal(Object.keys(simple).length,5);
  assert.match(simple['responses.csv'],/235,1235/);
  assert.doesNotMatch(simple['events.csv'],/NaN/);
});
