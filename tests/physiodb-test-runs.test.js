import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createPhysioDBTestRuns } from '../server/physioDBTestRuns.mjs';
import { buildTestRunPayload } from '../src/analysis/testRunPayload.js';
function db() {
  const research = [], experiments = [], participants = [], streams = [], events = [], rows = new Map(), calls = [];
  let sequence = 0, failWrite = false;
  const bridge = async (_, op, args) => {
    calls.push(op);
    const make = (target, value) => { const item = { id: `id-${++sequence}`, ...value }; target.push(item); return item; };
    if (op === 'createResearch') return make(research, args.research);
    if (op === 'researches') return research;
    if (op === 'createExperiment') return make(experiments, args.experiment);
    if (op === 'experiments') return experiments;
    if (op === 'createParticipant') return make(participants, args.participant);
    if (op === 'participants') return participants;
    if (op === 'createStream') { const s = make(streams, { ...args.stream, sample_count: 0 }); rows.set(s.id, []); return s; }
    if (op === 'streams') return streams;
    if (op === 'stream') return streams.find(s => s.id === args.streamId);
    if (op === 'appendSamples') { rows.get(args.streamId).push(...args.samples); streams.find(s => s.id === args.streamId).sample_count += args.samples.length; if (failWrite) { failWrite = false; throw new Error('Response lost after commit'); } return null; }
    if (op === 'samples') return rows.get(args.streamId).filter(s => s.time >= args.start && s.time < args.end);
    if (op === 'createEvent') return make(events, args.event);
    if (op === 'events') return events.map(e => ({ ...e, data: { ...e.data, events: e.data.events.map(event => Object.fromEntries(Object.entries(event).reverse())) } }));
    throw new Error(op);
  };
  return { bridge, calls, rows, streams, events, loseNextWrite: () => { failWrite = true; } };
}
const actor = { actorId: 'operator', tenantId: 'lab' }, session = { sessionId: 'test-session', protocolId: 'protocol', protocolVersion: 1 };
const payload = () => buildTestRunPayload({ events: [{ eventId: 'e1', eventType: 'component_entered', timestampEpochMs: Date.parse('2026-10-07T00:00:00Z'), payload: { label: 'test' } }], deviceEvents: [], protocol: {}, startedAt: '2026-10-07T00:00:00Z' });
test('prepare sends participant code and unchanged metadata without name or email', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'pf-test-participant-')); t.after(() => rm(dir, { recursive: true, force: true }));
  const fake = db();
  let participantArgs;
  const bridge = async (actor, op, args) => {
    if (op === 'createParticipant') participantArgs = args;
    return fake.bridge(actor, op, args);
  };
  const api = await createPhysioDBTestRuns({ filePath: join(dir, 'journal.json'), bridge });
  const ready = await api.prepare(actor, session);
  assert.equal(ready.status, 'ready');
  assert.deepEqual(participantArgs, {
    researchId: ready.researchId,
    participant: {
      code: `PF-TEST-${ready.runId}`,
      metadata: { physioflow_test: true, runId: ready.runId, protocolId: session.protocolId, protocolVersion: session.protocolVersion },
    },
  });
  assert.equal(Object.hasOwn(participantArgs.participant, 'name'), false);
  assert.equal(Object.hasOwn(participantArgs.participant, 'email'), false);
  assert.ok(participantArgs.participant.code.length <= 200);
});

test('participant response lost after commit is reconciled by code after restart', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'pf-test-participant-recover-')); t.after(() => rm(dir, { recursive: true, force: true }));
  const fake = db();
  const options = { filePath: join(dir, 'journal.json'), bridge: async (actor, op, args) => {
    const result = await fake.bridge(actor, op, args);
    if (op === 'createParticipant') throw new Error('Participant response lost after commit');
    return result;
  } };
  const api = await createPhysioDBTestRuns(options);
  await assert.rejects(api.prepare(actor, session), /Participant response lost/);
  const restored = await createPhysioDBTestRuns(options);
  assert.equal((await restored.prepare(actor, session)).status, 'ready');
  assert.equal(fake.calls.filter(op => op === 'createParticipant').length, 1);
  const verified = await restored.complete(actor, { sessionId: session.sessionId, payload: payload() });
  assert.equal(verified.status, 'verified');
  assert.equal(verified.report.streams[0].matched, true);
});

test('isolated real-DB test pipeline verifies values, counts and runtime events and is idempotent', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'pf-test-db-')); t.after(() => rm(dir, { recursive: true, force: true }));
  const fake = db(), options = { filePath: join(dir, 'journal.json'), bridge: fake.bridge };
  const api = await createPhysioDBTestRuns(options);
  await api.prepare(actor, session);
  const report = await api.complete(actor, { sessionId: session.sessionId, payload: payload() });
  assert.equal(report.status, 'verified'); assert.equal(report.report.streams[0].actual, 500); assert.equal(report.report.eventsMatched, true);
  assert.equal(report.report.streams[0].matched, true);
  const restored = await createPhysioDBTestRuns(options);
  await restored.prepare(actor, session); await restored.complete(actor, { sessionId: session.sessionId, payload: payload() });
  for (const op of ['createResearch', 'createExperiment', 'createParticipant', 'createStream', 'appendSamples', 'createEvent']) assert.equal(fake.calls.filter(c => c === op).length, 1, `${op} must not repeat`);
  await assert.rejects(restored.complete({ ...actor, tenantId: 'other' }, { sessionId: session.sessionId, payload: payload() }), e => e.status === 404);
  const changed = payload(); changed.streams[0].samples[0].values[0] = 7;
  await assert.rejects(restored.complete(actor, { sessionId: session.sessionId, payload: changed }), /changed/);
});
test('lost write response is reconciled after restart without appending duplicate samples', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'pf-test-recover-')); t.after(() => rm(dir, { recursive: true, force: true }));
  const fake = db(), options = { filePath: join(dir, 'journal.json'), bridge: fake.bridge };
  const api = await createPhysioDBTestRuns(options); await api.prepare(actor, session); fake.loseNextWrite();
  await assert.rejects(api.complete(actor, { sessionId: session.sessionId, payload: payload() }), /Response lost/);
  const restored = await createPhysioDBTestRuns(options);
  assert.equal((await restored.complete(actor, { sessionId: session.sessionId, payload: payload() })).status, 'verified');
  assert.equal(fake.calls.filter(c => c === 'appendSamples').length, 1);
});
test('numeric device preview retains real values and rejects timestamp collisions', () => {
  const event = { eventType: 'device_sample_received', timestampEpochMs: 1000, connector: { id: 'test' }, payload: { channelId: 'eeg', value: 2 } };
  const args = { events: [], deviceEvents: [event], protocol: {}, startedAt: '2026-10-07T00:00:00Z' };
  const p = buildTestRunPayload(args); assert.equal(p.source, 'device_preview'); assert.deepEqual(p.streams[0].samples[0].values, [2]);
  assert.throws(() => buildTestRunPayload({ ...args, deviceEvents: [event, event] }), /collide/);
});

test('device verification uses BrainFlow acquisition time rather than batch receipt time', () => {
  const samples = [10, 10.004].map((time, i) => ({ eventType: 'device_sample_received', connector: { id: 'org.physioflow.brainflow' }, timestampEpochMs: 100000, payload: { channelId: 'eeg', deviceTimestamp: time, value: i + 1 } }));
  const p = buildTestRunPayload({ events: [], deviceEvents: samples, protocol: {}, startedAt: '2026-10-07T00:00:00Z' });
  assert.deepEqual(p.streams[0].samples.map(s => s.time), ['1970-01-01T00:00:10.000Z', '1970-01-01T00:00:10.004Z']);
  assert.throws(() => buildTestRunPayload({ events: [], deviceEvents: [{ ...samples[0], payload: { channelId: 'eeg', value: NaN } }], protocol: {}, startedAt: '2026-10-07T00:00:00Z' }), /omitted/);
});
test('test-run endpoints deny participants and viewers before any database writes', async t => {
  const { createHostedNodeServer } = await import('../server/createHostedNodeServer.mjs');
  const { createPhysioDBServiceClient } = await import('../src/physioDBServiceClient.js');
  const dir = await mkdtemp(join(tmpdir(), 'pf-test-auth-')); t.after(() => rm(dir, { recursive: true, force: true }));
  const fake = db();
  const server = await createHostedNodeServer({ actors: [{ ...actor, role: 'owner', accessToken: 'owner' }, { actorId: 'viewer', tenantId: 'lab', role: 'viewer', accessToken: 'viewer' }], stateFile: join(dir, 'state.json'), credentialKeys: [{ keyId: 'test', secret: 'test-runs-credential-secret-at-least-32-characters' }], physioDBBridge: fake.bridge });
  const { baseUrl } = await server.listen(0); t.after(() => server.close());
  server.service.participantTokens.set('participant', { active: true, sessionId: session.sessionId, participantId: 'P01', tenantId: 'lab' });
  for (const accessToken of ['participant', 'viewer']) {
    const client = createPhysioDBServiceClient({ baseUrl, accessToken });
    await assert.rejects(client.prepareTestRun(session), e => e.status === 403);
    await assert.rejects(client.completeTestRun({ sessionId: session.sessionId, payload: payload() }), e => e.status === 403);
  }
  assert.equal(fake.calls.length, 0);
  const client = createPhysioDBServiceClient({ baseUrl, accessToken: 'owner' });
  await client.prepareTestRun(session);
  assert.equal((await client.completeTestRun({ sessionId: session.sessionId, payload: payload() })).status, 'verified');
});
