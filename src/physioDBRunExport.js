import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import { physioDBRunId, buildPhysioDBReview } from './physioDBReview.js';
import { createPhysioDBRunMapping } from './physioDBRunMapping.js';
const digest = text => bytesToHex(sha256(new TextEncoder().encode(text)));
function csvCell(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  let text = typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value ?? '');
  if (/^\s*[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}
const csv = rows => '\ufeff' + rows.map(row => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
export function buildPhysioDBRunExport({ events, run, retrievedAt, language = 'en' }) {
  if (!run?.sessionId || !run.protocolSnapshot || !Array.isArray(events) || !Number.isFinite(Date.parse(retrievedAt))) throw new Error('A saved run and freshly retrieved events are required');
  const mapping = createPhysioDBRunMapping({ sessionId: run.sessionId, protocol: run.protocolSnapshot });
  if (Object.entries(mapping.provenance).some(([key, value]) => run.provenance?.[key] !== value)) throw new Error('Saved design fingerprint does not match this run');
  const selected = events.filter(e => physioDBRunId(e) === run.sessionId);
  const ids = new Set(), sequences = new Set();
  for (const event of selected) {
    const p = event.data?.physioflow;
    if (!event.id || ids.has(event.id) || !Number.isSafeInteger(p?.sequence) || p.sequence < 1 || sequences.has(p.sequence) || p?.protocol_sha256 !== run.provenance.protocol_sha256 || p.protocol_id !== run.provenance.protocol_id || p.protocol_version !== run.provenance.protocol_version) throw new Error('Database events do not match the selected run design');
    ids.add(event.id); sequences.add(p.sequence);
    if (event.event_type === 'physioflow.response_recorded' && (!event.data?.payload?.response || typeof event.data.payload.response !== 'object' || Array.isArray(event.data.payload.response))) throw new Error('Database events do not match the selected run design');
  }
  selected.sort((a, b) => a.data.physioflow.sequence - b.data.physioflow.sequence);
  const answers = selected.filter(e => e.event_type === 'physioflow.response_recorded');
  const labels = new Map(buildPhysioDBReview(selected, { runId: run.sessionId, protocol: run.protocolSnapshot, language }).map(row => [row.id, row]));
  const files = {
    'events.jsonl': selected.map(e => JSON.stringify(e)).join('\n') + (selected.length ? '\n' : ''),
    'events.csv': csv([['db_event_id','run_id','sequence','event_type','started_at','ended_at','node_id','node_label','description','data_json'], ...selected.map(e => [e.id,run.sessionId,e.data.physioflow.sequence,e.event_type,e.started_at,e.ended_at,e.data.physioflow.node_id,labels.get(e.id)?.nodeLabel,e.description,e.data])]),
    'responses.csv': csv([['db_event_id','run_id','response_id','node_id','node_label','field','question_label','value','superseded_by_event_id','record_json'], ...answers.map(e => { const r=e.data.payload.response;return [e.id,run.sessionId,r.responseId,r.nodeId,labels.get(e.id)?.nodeLabel,r.name,labels.get(e.id)?.questionLabel,r.value,r.supersededByEventId,r]; })]),
    'responses.json': JSON.stringify(answers.map(e => e.data.payload.response), null, 2) + '\n',
    'protocol.json': JSON.stringify(run.protocolSnapshot, null, 2) + '\n',
  };
  files['manifest.json'] = JSON.stringify({ schemaVersion: 1, source: 'PhysioDB', sessionId: run.sessionId, destination: run.destination, provenance: run.provenance, retrievedAt, counts: { events: selected.length, responses: answers.length }, lastVerification: run.report || null, scope: 'All stored events and response records for this run; independent of screen search and pagination. Raw signals are exported separately.', files: Object.fromEntries(Object.entries(files).map(([name,text]) => [name,{sha256:digest(text),bytes:new TextEncoder().encode(text).length}])) }, null, 2) + '\n';
  return files;
}
