// Traceability check: PhysioFlow session <-> BrainFlow raw acquisition.
//
// Verifies that experiment ID, participant ID, session ID and acquisition runId
// really do line up across the app record and the acquisition agent's raw files,
// and that every browser preview sample and marker can be found back in the raw
// recording. This is the evidence behind "实验ID＋参加者ID が採集とデータ管理を貫く".
//
// Usage:
//   node scripts/verify-demo-traceability.mjs <session_bundle.zip | extracted_dir>
//   node scripts/verify-demo-traceability.mjs <session_bundle.zip> --recording brainflow-recordings/<runId>
//   node scripts/verify-demo-traceability.mjs --recording brainflow-recordings/<runId>   # agent side only
//
// Exit code 0 = every check passed, 1 = at least one failed.

import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const RECORDINGS_ROOT = resolve('brainflow-recordings');
const args = process.argv.slice(2);
const asJson = args.includes('--json');
const flagValue = name => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : null;
};
const positional = args.filter((value, index) => !value.startsWith('--') && args[index - 1] !== '--recording');
const sessionInput = positional[0] ? resolve(positional[0]) : null;
const recordingInput = flagValue('--recording');

const results = [];
const check = (id, title, ok, detail) => results.push({ id, title, ok, detail });

/** Reads the bundle whether it was handed over as a zip or already extracted. */
function openBundle(input) {
  if (!input || !existsSync(input)) return null;
  if (statSync(input).isDirectory()) {
    const read = name => {
      const path = join(input, name);
      return existsSync(path) ? readFileSync(path, 'utf8') : null;
    };
    return { kind: 'dir', root: input, read };
  }
  if (input.endsWith('.zip')) {
    const root = mkdtempSync(join(tmpdir(), 'pf-trace-'));
    const unpack = spawnSync('unzip', ['-o', '-q', input, '-d', root], { encoding: 'utf8' });
    if (unpack.status !== 0) throw new Error(`Could not extract ${input}: ${unpack.stderr}`);
    const read = name => {
      const path = join(root, name);
      return existsSync(path) ? readFileSync(path, 'utf8') : null;
    };
    return { kind: 'zip', root, read };
  }
  if (input.endsWith('.json')) {
    const read = name => name === 'session.json' ? readFileSync(input, 'utf8') : null;
    return { kind: 'session', root: null, read };
  }
  throw new Error(`Unsupported session input: ${input}`);
}

async function readJsonl(path) {
  const rows = [];
  const reader = createInterface({ input: createReadStream(path), crlfDelay: Infinity });
  for await (const line of reader) if (line.trim()) rows.push(JSON.parse(line));
  return rows;
}

/** Picks the recording directory: explicit, else the newest, else the one whose runId matches. */
function resolveRecording(explicit, wantedRunId) {
  if (explicit) {
    const path = resolve(explicit);
    if (!existsSync(path)) throw new Error(`Recording directory not found: ${path}`);
    return path;
  }
  if (!existsSync(RECORDINGS_ROOT)) return null;
  const dirs = readdirSync(RECORDINGS_ROOT)
    .map(name => join(RECORDINGS_ROOT, name))
    .filter(path => statSync(path).isDirectory() && existsSync(join(path, 'metadata.json')))
    .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
  if (wantedRunId) {
    const match = dirs.find(path => path.endsWith(wantedRunId));
    if (match) return match;
  }
  return dirs[0] || null;
}

const bundle = openBundle(sessionInput);
let tempRoot = null;
if (bundle?.kind === 'zip') tempRoot = bundle.root;

try {
  // ── App side ───────────────────────────────────────────────────────────────
  let session = null, protocol = null, deviceEvents = [], events = [], responses = [];
  if (bundle) {
    const sessionText = bundle.read('session.json');
    if (sessionText) session = JSON.parse(sessionText);
    const protocolText = bundle.read('protocol_snapshot.json');
    if (protocolText) protocol = JSON.parse(protocolText);
    const deviceText = bundle.read('device_events.jsonl');
    if (deviceText) deviceEvents = deviceText.split('\n').filter(line => line.trim()).map(line => JSON.parse(line));
    const eventsText = bundle.read('events.jsonl');
    if (eventsText) events = eventsText.split('\n').filter(line => line.trim()).map(line => JSON.parse(line));
    const responsesText = bundle.read('responses.jsonl');
    if (responsesText) responses = responsesText.split('\n').filter(line => line.trim()).map(line => JSON.parse(line));
  }
  // Omitting the bundle is a supported mode (agent-side checks only), so only an
  // unreadable or incomplete bundle counts as a failure.
  check('app.bundle', 'PhysioFlow session bundle present',
    sessionInput ? Boolean(session) : true,
    session ? `session.json loaded (${bundle.kind})`
      : sessionInput ? `could not read session.json from ${sessionInput}`
      : 'skipped: no session bundle given, running agent-side checks only');

  // ── Agent side ─────────────────────────────────────────────────────────────
  const wantedRunId = deviceEvents.map(row => row.payload?.runId).find(Boolean) || null;
  const recording = resolveRecording(recordingInput, wantedRunId);
  check('agent.recording', 'BrainFlow recording directory located', Boolean(recording),
    recording ? recording.replace(`${process.cwd()}/`, '') : 'none found under brainflow-recordings/');

  if (!recording) {
    report();
    process.exit(1);
  }

  const metadata = JSON.parse(readFileSync(join(recording, 'metadata.json'), 'utf8'));
  const agentEvents = await readJsonl(join(recording, 'events.jsonl'));
  const runId = metadata.runId;
  const markerChannel = metadata.boardDescription.marker_channel;
  const attached = agentEvents.find(event => event.type === 'session_attached');
  const accepted = agentEvents.filter(event => event.type === 'marker_accepted').map(event => event.markerId);

  check('agent.runId', 'Recording runId matches exported preview samples', !wantedRunId || wantedRunId === runId,
    `recording=${runId.slice(0, 8)}… export=${wantedRunId ? wantedRunId.slice(0, 8) + '…' : '(no device events)'}`);

  check('agent.board', 'Acquisition board identified', true,
    `boardId=${metadata.boardId}${metadata.boardId === -1 ? ' (BrainFlow Synthetic)' : ''} · ${metadata.samplingRateHz} Hz · ${runId.slice(0, 8)}…`);

  // C1/C2/C3 — the identity chain the meeting asks for.
  if (session && attached) {
    check('chain.session', 'session_id agrees between app and acquisition agent',
      session.session_id === attached.session.sessionId,
      `app=${session.session_id} agent=${attached.session.sessionId}`);
    const appExperiment = protocol?.biodb?.experimentId || session.protocol_id;
    check('chain.experiment', 'experimentId threads through protocol and acquisition',
      appExperiment === attached.session.experimentId,
      `protocol=${appExperiment} agent=${attached.session.experimentId}`);
    check('chain.participant', 'participant_id agrees between app and acquisition agent',
      session.participant_id === attached.session.participantId,
      `app=${session.participant_id} agent=${attached.session.participantId}`);
  } else if (session && !attached) {
    check('chain.session', 'session_id agrees between app and acquisition agent', false,
      'recording has no session_attached event for this session');
  } else {
    check('chain.session', 'session_id agrees between app and acquisition agent', true,
      'skipped: pass a session bundle to check the app↔agent identity chain');
  }

  // ── Marker integrity: accepted must be contiguous AND land in raw frames ──
  const contiguous = accepted.every((value, index) => value === index + 1);
  const neededMarkers = new Set(accepted);
  const landedMarkers = new Set();
  // One raw frame carries every preview channel, so group the exported samples by
  // frame. Keying by runId:sequence alone would keep only the last channel and
  // silently leave channels 1..n-1 unverified.
  const neededByFrame = new Map();
  let neededSampleCount = 0;
  for (const row of deviceEvents) {
    const payload = row.payload || {};
    if (!payload.runId || !Number.isInteger(payload.sampleSequence) || !payload.channelId) continue;
    const key = `${payload.runId}:${payload.sampleSequence}`;
    if (!neededByFrame.has(key)) neededByFrame.set(key, []);
    neededByFrame.get(key).push(payload);
    neededSampleCount += 1;
  }
  const matchedFrames = new Map();

  const raw = createInterface({ input: createReadStream(join(recording, 'samples.jsonl')), crlfDelay: Infinity });
  let rawRows = 0;
  for await (const line of raw) {
    if (!line.trim()) continue;
    rawRows += 1;
    const frame = JSON.parse(line);
    const markerValue = frame.rows?.[markerChannel];
    if (markerValue && neededMarkers.has(Number(markerValue))) landedMarkers.add(Number(markerValue));
    if (neededByFrame.size) {
      const key = `${runId}:${frame.sequence}`;
      const payloads = neededByFrame.get(key);
      if (payloads) matchedFrames.set(key, { frame, payloads });
    }
  }

  const missingMarkers = accepted.filter(value => !landedMarkers.has(value));
  check('marker.contiguous', 'Every accepted marker id is contiguous (no lost request)', contiguous,
    `${accepted.length} accepted${contiguous ? ', ids 1..' + accepted.length : ' — GAPS PRESENT'}`);
  check('marker.landed', 'Every accepted marker is present in the raw marker channel', missingMarkers.length === 0,
    `${landedMarkers.size}/${accepted.length} found${missingMarkers.length ? ` (missing ${missingMarkers.slice(0, 8).join(', ')})` : ''}`);

  // ── Preview sample -> raw frame, value and timestamp must match exactly ──
  if (neededByFrame.size) {
    let valueMismatch = 0, timeMismatch = 0;
    const examples = [];
    for (const { frame, payloads } of matchedFrames.values()) {
      for (const payload of payloads) {
        const rowIndex = Number(String(payload.channelId).split('_')[1]);
        const expectedRow = metadata.boardDescription.eeg_channels?.[rowIndex - 1];
        if (frame.rows?.[expectedRow] !== payload.value) {
          valueMismatch += 1;
          if (examples.length < 3) examples.push(`${payload.channelId}@seq${frame.sequence} export=${payload.value} raw=${frame.rows?.[expectedRow]}`);
        }
        if (frame.timestamp !== payload.deviceTimestamp) timeMismatch += 1;
      }
    }
    check('sample.lookup', 'Every exported preview sample exists in the raw recording',
      matchedFrames.size === neededByFrame.size,
      `${matchedFrames.size}/${neededByFrame.size} frames located in ${rawRows.toLocaleString()} raw rows`);
    check('sample.values', `Preview values match the raw frames exactly (${neededSampleCount} samples)`, valueMismatch === 0,
      valueMismatch ? `${valueMismatch} mismatched value(s): ${examples.join('; ')}` : `all ${neededSampleCount} channel samples identical`);
    check('sample.timestamps', 'Preview device timestamps match the raw frames exactly', timeMismatch === 0,
      timeMismatch ? `${timeMismatch} mismatched timestamp(s)` : 'all timestamps identical');
  } else {
    check('sample.lookup', 'Every exported preview sample exists in the raw recording', true,
      'skipped: no device_events in this input');
  }

  check('counts', 'Record sizes', true,
    `raw rows=${rawRows.toLocaleString()} · preview samples=${deviceEvents.length} · events=${events.length} · responses=${responses.length}`);

  const failed = results.filter(item => !item.ok);
  report();
  process.exit(failed.length ? 1 : 0);
} finally {
  if (tempRoot) { try { rmSync(tempRoot, { recursive: true, force: true }); } catch {} }
}

function report() {
  if (asJson) { console.log(JSON.stringify({ results }, null, 2)); return; }
  console.log('\n  PhysioFlow × BrainFlow  —  会话 / 原始采集 贯通核对\n' + '  ' + '─'.repeat(72));
  for (const item of results) {
    console.log(`  ${item.ok ? '✓' : '✗'}  ${item.title}`);
    if (item.detail) console.log(`       ${item.detail}`);
  }
  const failed = results.filter(item => !item.ok).length;
  console.log('  ' + '─'.repeat(72));
  console.log(failed ? `  ${failed} 项未通过\n` : '  全部通过\n');
}
