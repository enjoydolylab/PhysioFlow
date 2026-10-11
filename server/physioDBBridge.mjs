import { setTimeout, clearTimeout } from 'node:timers';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const project = fileURLToPath(new URL('../tools/physiodb/', import.meta.url));
export const PHYSIODB_READ_OPERATIONS = new Set(['me', 'researches', 'experiments', 'participants', 'streams', 'stream', 'samples', 'events']);
export const PHYSIODB_WRITE_OPERATIONS = new Set(['createResearch', 'createExperiment', 'createParticipant', 'createStream', 'appendSamples', 'createEvent']);

export function createPhysioDBBridge({ credentials = [], uvCommand = 'uv', execute } = {}) {
  const byActor = new Map();
  for (const credential of credentials) {
    if (!credential.actorId || !credential.tenantId || !credential.token?.trim()) throw new Error('PhysioDB credentials require actorId, tenantId and token');
    const url = new URL(credential.baseUrl);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) throw new Error('Invalid PhysioDB server URL');
    url.pathname = `${url.pathname.replace(/\/+$/, '').replace(/\/api\/v1$/, '')}/api/v1`;
    const key = JSON.stringify([credential.tenantId, credential.actorId]);
    if (byActor.has(key)) throw new Error('Duplicate PhysioDB actor credentials');
    byActor.set(key, { apiUrl: url.href, token: credential.token.trim() });
  }
  return async (actor, operation, args = {}) => {
    if (!PHYSIODB_READ_OPERATIONS.has(operation) && !PHYSIODB_WRITE_OPERATIONS.has(operation)) throw Object.assign(new Error('Unsupported PhysioDB operation'), { status: 400 });
    const credential = byActor.get(JSON.stringify([actor.tenantId, actor.actorId]));
    if (!credential) throw Object.assign(new Error('PhysioDB is not configured for this administrator'), { status: 503 });
    const rpc = { ...credential, operation, args };
    const reply = await (execute ? execute(rpc) : runSdk(uvCommand, rpc));
    if (reply.error) throw Object.assign(new Error(reply.error.message), { status: reply.error.status });
    return reply.result;
  };
}

function runSdk(command, rpc) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, ['run', '--frozen', '--project', project, 'python', `${project}bridge.py`], { stdio: ['pipe', 'pipe', 'pipe'] });
    let output = '', bytes = 0, settled = false;
    const finish = (error, value) => { if (settled) return; settled = true; clearTimeout(timer); if (error) reject(error); else resolve(value); };
    const fail = (status, message) => { child.kill(); finish(Object.assign(new Error(message), { status })); };
    const timer = setTimeout(() => fail(504, 'PhysioDB SDK timed out; verify writes before retrying'), 45000);
    child.stdout.on('data', chunk => { bytes += chunk.length; if (bytes > 16 * 1024 * 1024) return fail(502, 'PhysioDB response is too large'); output += chunk.toString(); });
    child.stderr.resume(); // Never forward SDK diagnostics that may contain credentials or data.
    child.on('error', () => fail(503, 'PhysioDB SDK runtime unavailable; run uv sync'));
    child.stdin.on('error', () => fail(502, 'PhysioDB SDK input failed'));
    child.on('close', code => {
      if (settled) return;
      if (code !== 0) return fail(502, 'PhysioDB SDK exited unsuccessfully');
      try { finish(null, JSON.parse(output)); } catch { fail(502, 'Invalid PhysioDB SDK response'); }
    });
    child.stdin.end(JSON.stringify(rpc));
  });
}
