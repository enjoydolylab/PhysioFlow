import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile, rename, rm } from 'node:fs/promises';
import { dirname } from 'node:path';
import { createPhysioDBRunMapping } from '../src/physioDBRunMapping.js';
const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(k => [k, canonical(value[k])])) : value;
const hash = value => createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
const fail = (message, status = 409) => Object.assign(new Error(message), { status });
const key = (actor, sessionId) => JSON.stringify([actor.tenantId, actor.actorId, sessionId]);
const uuid = value => typeof value === 'string' && /^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(value);
function micros(time) {
  if (typeof time !== 'string' || !/(Z|[+-]\d{2}:\d{2})$/.test(time) || !Number.isFinite(Date.parse(time))) throw fail('Sample time must have a timezone', 400);
  const fraction = time.match(/\.(\d+)(?:Z|[+-]\d{2}:\d{2})$/)?.[1] || '';
  if (fraction.length > 6) throw fail('Samples support up to microsecond precision', 400);
  return BigInt(Date.parse(time)) * 1000n + BigInt(fraction.padEnd(6, '0').slice(3) || '0');
}
const normalized = rows => rows.map(row => ({ time: String(micros(row.time)), values: row.values }));
export async function createPhysioDBRuns({ filePath, bridge }) {
  let state = { schemaVersion: 1, runs: {} }, queue = Promise.resolve();
  try { state = JSON.parse(await readFile(filePath, 'utf8')); if (state.schemaVersion !== 1 || !state.runs || typeof state.runs !== 'object' || Array.isArray(state.runs)) throw new Error('Invalid run journal'); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  const persist = async () => {
    await mkdir(dirname(filePath), { recursive: true, mode: 0o700 }); const temporary = `${filePath}.${randomUUID()}.tmp`;
    try { await writeFile(temporary, JSON.stringify(state), { flag: 'wx', mode: 0o600 }); await rename(temporary, filePath); } catch (e) { await rm(temporary, { force: true }); throw e; }
  };
  const serial = fn => { const job = queue.then(fn); queue = job.catch(() => {}); return job; };
  const summary = r => ({ sessionId: r.plan.sessionId, destination: r.plan.destination, provenance: r.provenance, status: r.status, report: r.report || null, confirmedOperations: Object.values(r.ops).filter(op => op.status === 'done').length, uncertainOperations: Object.keys(r.ops).filter(k => r.ops[k].status === 'pending') });
  const operation = async (r, name, write, reconcile) => {
    if (r.ops[name]?.status === 'done') return r.ops[name].value;
    if (r.ops[name]?.status === 'pending') {
      const found = await reconcile();
      if (found === undefined) throw fail(`Write outcome uncertain (${name}); recheck before uploading again`);
      r.ops[name] = { status: 'done', value: found }; await persist(); return found;
    }
    r.ops[name] = { status: 'pending' }; await persist();
    const value = await write(); r.ops[name] = { status: 'done', value: value ?? null }; await persist(); return value;
  };
  const list = async actor => globalThis.structuredClone(Object.entries(state.runs).filter(([k]) => { const ids = JSON.parse(k); return ids[0] === actor.tenantId && ids[1] === actor.actorId; }).map(([, r]) => summary(r)));
  const sync = (actor, input) => serial(async () => {
    const plan = globalThis.structuredClone(input);
    if (!plan || Object.keys(plan).some(k => !['sessionId', 'protocol', 'destination', 'streams', 'events'].includes(k)) || !plan.destination || !['researchId', 'experimentId', 'participantId'].every(k => uuid(plan.destination[k])) || !Array.isArray(plan.streams) || plan.streams.length > 32 || !Array.isArray(plan.events) || !plan.events.length || plan.events.length > 10000 || JSON.stringify(plan).length > 9 * 1024 * 1024) throw fail('Invalid run upload plan', 400);
    let mapping; try { mapping = createPhysioDBRunMapping(plan); } catch (e) { throw fail(e.message, 400); }
    const events = plan.events.map(e => { try { return mapping.event(e); } catch (error) { throw fail(error.message, 400); } });
    if (new Set(plan.events.map(e => e.eventId)).size !== events.length || plan.events.some((e, i) => e.sequence !== i + 1)) throw fail('Run events must have unique identities and contiguous sequence', 400);
    if (new Set(plan.streams.map(s => s.name)).size !== plan.streams.length) throw fail('Run stream names must be unique', 400);
    let count = 0;
    for (const stream of plan.streams) {
      try { mapping.stream(stream); } catch (e) { throw fail(e.message, 400); }
      if (!Array.isArray(stream.samples) || !stream.samples.length || stream.fields.some(f => !f || typeof f.name !== 'string' || !f.name.trim() || f.name.length > 100 || f.type !== 'float' || (f.unit != null && (typeof f.unit !== 'string' || f.unit.length > 50))) || new Set(stream.fields.map(f => f.name)).size !== stream.fields.length) throw fail('Numeric stream fields and samples are required', 400);
      let last = null;
      for (const row of stream.samples) { const time = micros(row.time); if ((last !== null && time <= last) || !Array.isArray(row.values) || row.values.length !== stream.fields.length || row.values.some(v => !Number.isFinite(v))) throw fail('Samples must be ordered and match numeric fields', 400); last = time; }
      count += stream.samples.length;
    }
    if (count > 100000) throw fail('Upload plan exceeds 100000 samples; retain the local raw recording', 400);
    const identity = key(actor, plan.sessionId), digest = hash(plan);
    let r = state.runs[identity];
    if (r && r.digest !== digest) {
      const core = value => ({ sessionId: value.sessionId, protocol: value.protocol, destination: value.destination, events: value.events });
      const appendOnly = hash(core(r.plan)) === hash(core(plan)) && plan.streams.length > r.plan.streams.length && r.plan.streams.every((stream, i) => hash(stream) === hash(plan.streams[i]));
      if (!appendOnly) throw fail('This run already has a different design, destination or payload');
    }
    const destination = plan.destination;
    const [researches, experiments, participants] = await Promise.all([bridge(actor, 'researches', {}), bridge(actor, 'experiments', { researchId: destination.researchId }), bridge(actor, 'participants', { researchId: destination.researchId })]);
    if (!researches.some(x => x.id === destination.researchId) || !experiments.some(x => x.id === destination.experimentId) || !participants.some(x => x.id === destination.participantId)) throw fail('Run destination is outside the selected Research', 400);
    if (!r) { r = { plan, digest, provenance: mapping.provenance, ops: {}, status: 'uploading' }; state.runs[identity] = r; await persist(); }
    if (r.digest !== digest) { r.plan = plan; r.digest = digest; r.status = 'uploading'; await persist(); }
    const args = { experimentId: destination.experimentId, participantId: destination.participantId };
    const only = matches => { if (matches.length > 1) throw fail('Duplicate run objects require operator review'); return matches[0]; };
    const readSamples = async (streamId, rows) => {
      const output = [], first = Date.parse(rows[0].time), end = Date.parse(rows.at(-1).time) + 1;
      for (let start = first; start < end; start += 299000) output.push(...await bridge(actor, 'samples', { streamId, start: new Date(start).toISOString(), end: new Date(Math.min(end, start + 299000)).toISOString() }));
      const low = micros(rows[0].time), high = micros(rows.at(-1).time);
      return output.filter(row => micros(row.time) >= low && micros(row.time) <= high);
    };
    const report = [];
    for (let i = 0; i < plan.streams.length; i++) {
      const s = plan.streams[i], model = mapping.stream(s);
      const stream = await operation(r, `stream:${i}`, () => bridge(actor, 'createStream', { ...args, stream: model }), async () => only((await bridge(actor, 'streams', args)).filter(x => x.name === model.name && hash(x.metadata?.physioflow) === hash(mapping.provenance) && hash(x.fields) === hash(model.fields))));
      for (let offset = 0; offset < s.samples.length; offset += 500) {
        const rows = s.samples.slice(offset, offset + 500);
        await operation(r, `samples:${i}:${offset}`, () => bridge(actor, 'appendSamples', { streamId: stream.id, samples: rows }), async () => hash(normalized(await readSamples(stream.id, rows))) === hash(normalized(rows)) ? null : undefined);
      }
      const actual = await readSamples(stream.id, s.samples), meta = await bridge(actor, 'stream', { streamId: stream.id });
      report.push({ streamId: stream.id, expected: s.samples.length, actual: actual.length, matched: meta.sample_count === s.samples.length && hash(normalized(actual)) === hash(normalized(s.samples)) });
    }
    for (let i = 0; i < events.length; i++) await operation(r, `event:${i}`, () => bridge(actor, 'createEvent', { ...args, event: events[i] }), async () => only((await bridge(actor, 'events', args)).filter(e => e.data?.physioflow?.run_id === plan.sessionId && e.data?.physioflow?.event_id === plan.events[i].eventId && hash({ event_type: e.event_type, started_at: String(micros(e.started_at)), data: e.data }) === hash({ ...events[i], started_at: String(micros(events[i].started_at)) }))));
    const actualEvents = (await bridge(actor, 'events', args)).filter(e => e.data?.physioflow?.run_id === plan.sessionId).sort((a, b) => a.data.physioflow.sequence - b.data.physioflow.sequence);
    const comparable = e => ({ event_type: e.event_type, started_at: String(micros(e.started_at)), data: e.data });
    r.report = { streams: report, expectedEvents: events.length, actualEvents: actualEvents.length, eventsMatched: hash(actualEvents.map(comparable)) === hash(events.map(comparable)), verifiedAt: new Date().toISOString() };
    r.status = report.every(s => s.matched) && r.report.eventsMatched ? 'verified' : 'mismatch'; await persist(); return summary(r);
  });
  const snapshot = async (actor, sessionId) => { const r = state.runs[key(actor, sessionId)]; if (!r) throw fail('Run not found', 404); return globalThis.structuredClone({ ...summary(r), protocolSnapshot: r.plan.protocol }); };
  return { list, sync, snapshot };
}
