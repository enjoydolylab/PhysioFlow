import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { dirname } from 'node:path';
const invalid = message => Object.assign(new Error(message), { status: 400 });
const id = value => typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(value);
const uuid = value => typeof value === 'string' && /^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(value);
const identity = value => JSON.stringify([value.tenantId, value.actorId, value.sessionId]);
const fields = ['sessionId', 'protocolId', 'protocolVersion', 'researchId', 'experimentId', 'participantId', 'streamIds'];
export async function createPhysioDBBindings({ filePath, bridge }) {
  let records = [], queue = Promise.resolve();
  try {
    const state = JSON.parse(await readFile(filePath, 'utf8'));
    if (state.schemaVersion !== 1 || !Array.isArray(state.records) || state.records.some(r => !id(r.sessionId) || !id(r.actorId) || !id(r.tenantId) || !uuid(r.researchId) || !uuid(r.experimentId) || !uuid(r.participantId) || !Array.isArray(r.streamIds) || !r.streamIds.every(uuid))) throw new Error('Invalid PhysioDB binding state');
    records = state.records;
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const list = async actor => { await queue; return globalThis.structuredClone(records.filter(r => r.tenantId === actor.tenantId && r.actorId === actor.actorId)); };
  const put = (actor, input) => {
    const job = queue.then(async () => {
      if (!input || Object.keys(input).some(key => !fields.includes(key)) || !id(input.sessionId) || !id(input.protocolId) || !Number.isSafeInteger(input.protocolVersion) || input.protocolVersion < 1 || ![input.researchId, input.experimentId, input.participantId].every(uuid) || !Array.isArray(input.streamIds) || !input.streamIds.length || input.streamIds.length > 32 || !input.streamIds.every(uuid) || new Set(input.streamIds).size !== input.streamIds.length) throw invalid('Valid session, protocol version and PhysioDB target IDs are required');
      const candidate = { ...input, streamIds: [...input.streamIds].sort(), tenantId: actor.tenantId, actorId: actor.actorId };
      const previous = records.find(r => identity(r) === identity(candidate));
      if (previous) {
        if (fields.some(key => JSON.stringify(previous[key]) !== JSON.stringify(candidate[key]))) throw Object.assign(new Error('Session already has a different database binding; use a new session to avoid mixing records.'), { status: 409 });
        return globalThis.structuredClone(previous);
      }
      if (!bridge) throw Object.assign(new Error('PhysioDB bridge is not configured'), { status: 503 });
      const [researches, experiments, participants, streams] = await Promise.all([
        bridge(actor, 'researches', {}), bridge(actor, 'experiments', { researchId: input.researchId }),
        bridge(actor, 'participants', { researchId: input.researchId }), bridge(actor, 'streams', { experimentId: input.experimentId, participantId: input.participantId }),
      ]);
      if (!researches.some(r => r.id === input.researchId) || !experiments.some(r => r.id === input.experimentId) || !participants.some(r => r.id === input.participantId) || !input.streamIds.every(streamId => streams.some(s => s.id === streamId && !s.deleted_at && s.experiment_id === input.experimentId && s.participant_id === input.participantId))) throw invalid('Database targets do not belong to the selected research, experiment and participant');
      const record = { ...candidate, verifiedAt: new Date().toISOString(), syncStatus: 'binding_only' };
      const next = [...records, record];
      await mkdir(dirname(filePath), { recursive: true, mode: 0o700 });
      const temporary = `${filePath}.${randomUUID()}.tmp`;
      try {
        await writeFile(temporary, JSON.stringify({ schemaVersion: 1, records: next }), { mode: 0o600, flag: 'wx' });
        await rename(temporary, filePath);
      } catch (error) { await rm(temporary, { force: true }); throw error; }
      records = next; return globalThis.structuredClone(record);
    });
    queue = job.catch(() => {}); return job;
  };
  return { list, put };
}
