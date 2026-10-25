/** Local experiment desk: repeatable credentials, loopback hosting, no secret logging. */
import { randomBytes } from 'node:crypto';
import { mkdir, readFile, writeFile, stat } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { createHostedNodeServer } from '../server/createHostedNodeServer.mjs';
import { createPhysioDBBridge } from '../server/physioDBBridge.mjs';
import { createDeviceMonitorBridge } from '../server/deviceMonitorBridge.mjs';

const directory = resolve('.physioflow/local-desk');
await mkdir(directory, { recursive: true, mode: 0o700 });
const secretsFile = join(directory, 'credentials.json');
let credentials;
try {
  // Windows reports synthetic POSIX modes (0666) regardless of ACLs, so the
  // group/world-readable guard is only meaningful on POSIX filesystems.
  if (process.platform !== 'win32' && (await stat(secretsFile)).mode & 0o077) throw new Error('Local credentials must be readable only by their owner (chmod 600).');
  credentials = JSON.parse(await readFile(secretsFile, 'utf8'));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
  credentials = { accessToken: randomBytes(32).toString('base64url'), credentialSecret: randomBytes(48).toString('base64url'), databaseToken: null };
  await writeFile(secretsFile, JSON.stringify(credentials), { mode: 0o600, flag: 'wx' });
}
if (!credentials.accessToken || !credentials.credentialSecret) throw new Error('Invalid local desk credentials');
if (process.argv.includes('--db-token-stdin')) {
  let token = ''; for await (const chunk of process.stdin) token += chunk;
  if (!token.trim().startsWith('physiodb_')) throw new Error('Expected a PhysioDB API token on stdin');
  credentials.databaseToken = token.trim();
  await writeFile(secretsFile, JSON.stringify(credentials), { mode: 0o600 });
  console.log('Database credential configured locally.');
  if (process.argv.includes('--configure-only')) process.exit(0);
}
const port = Number(process.env.PORT || 8787);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid port');
let sources = [];
if (process.env.PHYSIOFLOW_DEVICE_SOURCES_JSON) sources = JSON.parse(process.env.PHYSIOFLOW_DEVICE_SOURCES_JSON);
const actor = { actorId: 'local-operator', tenantId: 'default', role: 'owner', accessToken: credentials.accessToken };
const server = await createHostedNodeServer({
  actors: [actor], host: '127.0.0.1', port,
  stateFile: join(directory, 'state.json'), staticDirectory: resolve('dist'),
  credentialKeys: [{ keyId: 'local', secret: credentials.credentialSecret }],
  physioDBBridge: createPhysioDBBridge({ uvCommand: process.env.PHYSIOFLOW_UV_COMMAND || 'uv', credentials: credentials.databaseToken ? [{ actorId: actor.actorId, tenantId: actor.tenantId, baseUrl: process.env.PHYSIOFLOW_PHYSIODB_URL || 'https://physiodb.jmessk.net', token: credentials.databaseToken }] : [] }),
  deviceMonitorBridge: createDeviceMonitorBridge({ sources }),
});
const { baseUrl } = await server.listen();
await writeFile(join(directory, 'admin-access.txt'), `${baseUrl}/admin#access=${encodeURIComponent(credentials.accessToken)}\n`, { mode: 0o600 });
console.log(`PF experiment desk: ${baseUrl}/admin`);
console.log('Open the private .physioflow/local-desk/admin-access.txt link to connect.');
console.log(`Database: ${credentials.databaseToken ? 'configured' : 'not configured'}. Device sources: ${sources.length}.`);
process.on('SIGINT', async () => { await server.close(); process.exit(0); });
process.on('SIGTERM', async () => { await server.close(); process.exit(0); });
