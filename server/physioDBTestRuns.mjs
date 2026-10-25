import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { dirname } from 'node:path';
const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value;
const hash = value => createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
const fail = (message, status = 409) => Object.assign(new Error(message), { status });
const keyOf = (actor, sessionId) => JSON.stringify([actor.tenantId, actor.actorId, sessionId]);
const validId = value => typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(value);
const normalize = samples => samples.map(s => ({ time: new Date(s.time).toISOString(), values: s.values }));
export async function createPhysioDBTestRuns({ filePath, bridge }) {
  let state = { schemaVersion: 1, runs: {} }, queue = Promise.resolve();
  try { state = JSON.parse(await readFile(filePath, 'utf8')); if (state.schemaVersion !== 1 || !state.runs || typeof state.runs !== 'object' || Array.isArray(state.runs)) throw new Error('Invalid test run journal'); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  const persist = async () => {
    await mkdir(dirname(filePath), { recursive: true, mode: 0o700 });
    const tmp = `${filePath}.${randomUUID()}.tmp`;
    await writeFile(tmp, JSON.stringify(state), { mode: 0o600, flag: 'wx' }); await rename(tmp, filePath);
  };
  const serial = fn => { const job = queue.then(fn); queue = job.catch(() => {}); return job; };
  const result = r => ({ sessionId: r.sessionId, runId: r.runId, researchId: r.ops.research?.value?.id, experimentId: r.ops.experiment?.value?.id, participantId: r.ops.participant?.value?.id, status: r.status, report: r.report || null, source: r.payload?.source || null });
  const operation = async (r, name, write, reconcile) => {
    if (r.ops[name]?.status === 'done') return r.ops[name].value;
    if (r.ops[name]?.status === 'pending') {
      const recovered = await reconcile();
      if (recovered === undefined) throw fail(`Write outcome uncertain (${name}). Keep local data and recheck; no write was repeated.`);
      r.ops[name] = { status: 'done', value: recovered }; await persist(); return recovered;
    }
    r.ops[name] = { status: 'pending' }; await persist();
    const value = await write(); r.ops[name] = { status: 'done', value: value ?? null }; await persist(); return value;
  };
  const prepare = (actor, input) => serial(async () => {
    if (!input || !validId(input.sessionId) || !validId(input.protocolId) || !Number.isSafeInteger(input.protocolVersion) || input.protocolVersion < 1 || Object.keys(input).some(k => !['sessionId', 'protocolId', 'protocolVersion'].includes(k))) throw fail('Invalid test session', 400);
    const key = keyOf(actor, input.sessionId);
    let r = state.runs[key];
    if (r && (r.protocolId !== input.protocolId || r.protocolVersion !== input.protocolVersion)) throw fail('Test session protocol changed');
    if (!r) { r = { ...input, runId: randomUUID(), status: 'preparing', ops: {} }; state.runs[key] = r; await persist(); }
    const meta = { physioflow_test: true, runId: r.runId, protocolId: r.protocolId, protocolVersion: r.protocolVersion };
    const name = `[PF TEST] ${r.runId}`;
    const code = `PF-TEST-${r.runId}`;
    const unique = (list, field = 'name', value = name) => { const matches = list.filter(row => row[field] === value); if (matches.length > 1) throw fail('Duplicate test targets require operator review'); return matches[0]; };
    const research = await operation(r, 'research', () => bridge(actor, 'createResearch', { research: { name, description: 'PhysioFlow isolated test run. Synthetic identity; never use for formal research.', metadata: meta } }), async () => unique(await bridge(actor, 'researches', {})));
    await operation(r, 'experiment', () => bridge(actor, 'createExperiment', { researchId: research.id, experiment: { name, metadata: meta } }), async () => unique(await bridge(actor, 'experiments', { researchId: research.id })));
    await operation(r, 'participant', () => bridge(actor, 'createParticipant', { researchId: research.id, participant: { code, metadata: meta } }), async () => unique(await bridge(actor, 'participants', { researchId: research.id }), 'code', code));
    if (!r.payload) r.status = 'ready'; await persist(); return result(r);
  });
  const complete = (actor, input) => serial(async () => {
    const r = state.runs[keyOf(actor, input?.sessionId)];
    if (!r || !r.ops.participant?.value?.id) throw fail('Prepare this test session first', 404);
    const payload = input.payload;
    if (!payload || !['synthetic_probe', 'device_preview'].includes(payload.source) || !Array.isArray(payload.streams) || !payload.streams.length || payload.streams.length > 17 || !Array.isArray(payload.events) || payload.events.length > 1000) throw fail('Invalid test payload', 400);
    let total = 0;
    for (const stream of payload.streams) {
      if (!validId(stream.key) || !Array.isArray(stream.fields) || !stream.fields.length || stream.fields.length > 32 || !Array.isArray(stream.samples) || !stream.samples.length) throw fail('Invalid test stream', 400);
      if (stream.fields.some(f => typeof f.name !== 'string' || !f.name || f.name.length > 200 || f.type !== 'float' || (f.unit != null && (typeof f.unit !== 'string' || f.unit.length > 50)))) throw fail('Invalid test field definition', 400);
      total += stream.samples.length;
      if (Date.parse(stream.samples.at(-1).time) - Date.parse(stream.samples[0].time) > 300000) throw fail('Device test windows are limited to five minutes; local data is preserved.', 400);
      let last = -Infinity;
      for (const sample of stream.samples) {
        const time = Date.parse(sample.time);
        if (!Number.isFinite(time) || time <= last || !Array.isArray(sample.values) || sample.values.length !== stream.fields.length || sample.values.some(v => v !== null && typeof v !== 'string' && !Number.isFinite(v))) throw fail('Invalid test samples', 400);
        last = time;
      }
    }
    if (total > 20000 || new Set(payload.streams.map(s => s.key)).size !== payload.streams.length || JSON.stringify(payload).length > 8 * 1024 * 1024) throw fail('Test payload too large', 400);
    const digest = r.digest || hash(payload);
    if (r.digest && hash(r.payload) !== hash(payload)) throw fail('Test payload changed; do not mix data in an existing test run');
    if (!r.digest) { r.digest = digest; r.payload = payload; r.status = 'uploading'; await persist(); }
    const args = { experimentId: r.ops.experiment.value.id, participantId: r.ops.participant.value.id };
    const readSamples = async (id, samples) => {
      const output = []; const first = Date.parse(samples[0].time), end = Date.parse(samples.at(-1).time) + 1;
      for (let start = first; start < end; start += 299000) {
        output.push(...await bridge(actor, 'samples', { streamId: id, start: new Date(start).toISOString(), end: new Date(Math.min(end, start + 299000)).toISOString() }));
      }
      return output;
    };
    const report = [];
    for (const plan of payload.streams) {
      const name = `[PF TEST] ${r.runId} ${plan.key}`;
      const stream = await operation(r, `stream:${plan.key}`, () => bridge(actor, 'createStream', { ...args, stream: { name, fields: plan.fields, metadata: { physioflow_test: true, runId: r.runId, source: payload.source, payloadHash: digest } } }), async () => (await bridge(actor, 'streams', args)).find(s => s.name === name && s.metadata?.runId === r.runId && !s.deleted_at));
      const expected = normalize(plan.samples);
      const read = async () => {
        const actual = await readSamples(stream.id, plan.samples);
        return hash(normalize(actual)) === hash(expected) ? null : undefined;
      };
      await operation(r, `samples:${plan.key}`, () => bridge(actor, 'appendSamples', { streamId: stream.id, samples: plan.samples }), read);
      const actual = await readSamples(stream.id, plan.samples);
      const metadata = await bridge(actor, 'stream', { streamId: stream.id });
      const matched = hash(normalize(actual)) === hash(expected) && metadata.sample_count === expected.length;
      report.push({ streamId: stream.id, key: plan.key, expected: expected.length, actual: actual.length, matched, preview: actual.slice(0, 500), fields: plan.fields });
    }
    const event = { event_type: 'physioflow.test_run', started_at: payload.streams[0].samples[0].time, ended_at: payload.streams[0].samples.at(-1).time, description: '[PF TEST] Runtime timeline; not formal collection', data: { physioflow_test: true, runId: r.runId, payloadHash: digest, source: payload.source, events: payload.events } };
    await operation(r, 'timeline', () => bridge(actor, 'createEvent', { ...args, event }), async () => (await bridge(actor, 'events', args)).find(e => e.data?.runId === r.runId && e.data?.payloadHash === digest));
    const timeline = (await bridge(actor, 'events', args)).filter(e => e.data?.runId === r.runId);
    const eventsMatched = timeline.length === 1 && hash(timeline[0].data?.events) === hash(payload.events);
    r.report = { streams: report, expectedEvents: payload.events.length, actualEvents: timeline[0]?.data?.events?.length || 0, eventsMatched, verifiedAt: new Date().toISOString() };
    r.status = report.every(s => s.matched) && eventsMatched ? 'verified' : 'mismatch'; await persist(); return result(r);
  });
  return { prepare, complete };
}
