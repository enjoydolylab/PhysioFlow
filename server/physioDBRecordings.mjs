import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile, rename, rm } from 'node:fs/promises';
import { dirname } from 'node:path';
const canonical = x => Array.isArray(x) ? x.map(canonical) : x && typeof x === 'object' ? Object.fromEntries(Object.keys(x).sort().map(k => [k, canonical(x[k])])) : x;
const hash = x => createHash('sha256').update(JSON.stringify(canonical(x))).digest('hex');
const fail = (message, status = 409) => Object.assign(new Error(message), { status });
const identity = (actor, sessionId, recordingId) => JSON.stringify([actor.tenantId, actor.actorId, sessionId, recordingId]);
function time(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,6})?(?:Z|[+-]\d\d:\d\d)$/.test(value) || !Number.isFinite(Date.parse(value))) throw fail('Invalid recording timestamp', 400);
  const fraction = value.match(/\.(\d+)(?:Z|[+-]\d\d:\d\d)$/)?.[1] || '';
  return BigInt(Date.parse(value)) * 1000n + BigInt(fraction.padEnd(6, '0').slice(3) || '0');
}
const normalized = rows => rows.map(s => ({ time: String(time(s.time)), values: s.values }));
export async function createPhysioDBRecordings({ filePath, bridge, runs }) {
  let state = { schemaVersion: 1, recordings: {} }, queue = Promise.resolve();
  try { state = JSON.parse(await readFile(filePath, 'utf8')); if (state.schemaVersion !== 1 || !state.recordings || typeof state.recordings !== 'object' || Array.isArray(state.recordings)) throw new Error('Invalid recording journal'); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  const persist = async () => { await mkdir(dirname(filePath), { recursive: true, mode: 0o700 }); const tmp = `${filePath}.${randomUUID()}.tmp`; try { await writeFile(tmp, JSON.stringify(state), { mode: 0o600, flag: 'wx' }); await rename(tmp, filePath); } catch (e) { await rm(tmp, { force: true }); throw e; } };
  const serial = fn => { const job = queue.then(fn); queue = job.catch(() => {}); return job; };
  const summary = r => ({ sessionId: r.input.sessionId, recordingId: r.input.recordingId, streamId: r.streamId || null, expectedSamples: r.input.sampleCount, confirmedSamples: r.confirmed, status: r.status, pendingOffset: r.pending?.offset ?? null });
  const lookup = (actor, input) => { const r = state.recordings[identity(actor, input?.sessionId, input?.recordingId)]; if (!r) throw fail('Recording not prepared', 404); return r; };
  const read = async (actor, r, first, last) => { const rows = []; const end = Date.parse(last) + 1; for (let start = Date.parse(first); start < end; start += 299000) rows.push(...await bridge(actor, 'samples', { streamId: r.streamId, start: new Date(start).toISOString(), end: new Date(Math.min(end, start + 299000)).toISOString() })); return rows.filter(s => time(s.time) >= time(first) && time(s.time) <= time(last)); };
  const begin = (actor, input) => serial(async () => {
    if (!input || !/^[a-zA-Z0-9._:-]{1,100}$/.test(input.recordingId) || !/^[a-f0-9]{64}$/.test(input.sourceSha256) || !Number.isSafeInteger(input.sampleCount) || input.sampleCount < 1 || !Array.isArray(input.fields) || !input.fields.length || input.fields.length > 64 || input.fields.some(f => !f || typeof f.name !== 'string' || !f.name.trim() || f.name.length > 100 || f.type !== 'float' || (f.unit != null && (typeof f.unit !== 'string' || f.unit.length > 50))) || new Set(input.fields.map(f => f.name)).size !== input.fields.length || time(input.firstTime) > time(input.lastTime)) throw fail('Invalid recording manifest', 400);
    const run = (await runs.list(actor)).find(r => r.sessionId === input.sessionId);
    if (!run || run.status !== 'verified') throw fail('Verify the run events before uploading raw signals');
    const name = `Raw ${input.recordingId} · ${input.sessionId}`; if (name.length > 200) throw fail('Recording name is too long', 400);
    const key = identity(actor, input?.sessionId, input?.recordingId); let r = state.recordings[key];
    if (r && hash(r.input) !== hash(input)) throw fail('Recording source or mapping changed');
    if (!r) { r = { input: globalThis.structuredClone(input), destination: run.destination, provenance: run.provenance, confirmed: 0, chunks: [], status: 'creating', streamId: null }; state.recordings[key] = r; await persist();
      const stream = await bridge(actor, 'createStream', { experimentId: r.destination.experimentId, participantId: r.destination.participantId, stream: { name, fields: input.fields, metadata: { physioflow: { ...run.provenance, recording_id: input.recordingId, source_sha256: input.sourceSha256, expected_samples: input.sampleCount } } } }); r.streamId = stream.id;
    } else if (!r.streamId) {
      const matches = (await bridge(actor, 'streams', { experimentId: r.destination.experimentId, participantId: r.destination.participantId })).filter(s => s.name === name && s.metadata?.physioflow?.source_sha256 === input.sourceSha256 && s.metadata?.physioflow?.run_id === input.sessionId && hash(s.fields) === hash(input.fields));
      if (matches.length !== 1) throw fail('Stream creation outcome uncertain; no creation repeated'); r.streamId = matches[0].id;
    }
    if (r.status === 'creating') r.status = 'uploading'; await persist(); return summary(r);
  });
  const append = (actor, input) => serial(async () => {
    const r = lookup(actor, input), rows = globalThis.structuredClone(input.samples);
    if (!r.streamId || !Number.isSafeInteger(input.offset) || input.offset < 0 || !Array.isArray(rows) || !rows.length || rows.length > 5000) throw fail('Invalid recording batch', 400);
    let previous = null; for (const row of rows) { const current = time(row?.time); if (previous !== null && current <= previous || !Array.isArray(row.values) || row.values.length !== r.input.fields.length || row.values.some(v => !Number.isFinite(v))) throw fail('Invalid recording samples', 400); previous = current; }
    const digest = hash(normalized(rows)), stored = r.chunks.find(c => c.offset === input.offset);
    if (stored) { if (stored.digest !== digest) throw fail('Confirmed recording batch changed'); return summary(r); }
    if (input.offset !== r.confirmed || input.offset + rows.length > r.input.sampleCount || (r.chunks.length && time(rows[0].time) <= time(r.chunks.at(-1).last)) || (input.offset === 0 && time(rows[0].time) !== time(r.input.firstTime)) || time(rows.at(-1).time) > time(r.input.lastTime)) throw fail('Recording batches must be contiguous and match the manifest');
    if (r.status === 'verified') throw fail('Recording already completed');
    if (r.pending) { if (r.pending.offset !== input.offset || r.pending.digest !== digest) throw fail('Pending recording batch changed'); }
    else { r.pending = { offset: input.offset, digest, samples: rows }; await persist(); await bridge(actor, 'appendSamples', { streamId: r.streamId, samples: rows }); }
    const actual = await read(actor, r, rows[0].time, rows.at(-1).time);
    if (hash(normalized(actual)) !== digest) throw fail('Recording write outcome uncertain; no batch repeated');
    r.chunks.push({ offset: input.offset, count: rows.length, digest, first: rows[0].time, last: rows.at(-1).time }); r.confirmed += rows.length; r.pending = null; await persist(); return summary(r);
  });
  const finish = (actor, input) => serial(async () => {
    const r = lookup(actor, input); if (r.pending || r.confirmed !== r.input.sampleCount || time(r.chunks.at(-1).last) !== time(r.input.lastTime)) throw fail('Complete every recording batch before verification');
    for (const chunk of r.chunks) if (hash(normalized(await read(actor, r, chunk.first, chunk.last))) !== chunk.digest) { r.status = 'mismatch'; await persist(); throw fail('Recording readback changed'); }
    const stream = await bridge(actor, 'stream', { streamId: r.streamId }); if (stream.sample_count !== r.confirmed) { r.status = 'mismatch'; await persist(); throw fail('Recording sample count differs'); }
    r.status = 'verified'; await persist(); return summary(r);
  });
  const list = async actor => Object.entries(state.recordings).filter(([k]) => { const ids = JSON.parse(k); return ids[0] === actor.tenantId && ids[1] === actor.actorId; }).map(([, r]) => summary(r));
  return { begin, append, finish, list };
}
