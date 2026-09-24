import { verifyComponentAcceptance } from './browser-component-acceptance.mjs';
import assert from 'node:assert/strict';
import { verifyRuntimeScenarios } from './browser-runtime-scenarios.mjs';
import { verifyPreparationScenarios } from './browser-preparation-scenarios.mjs';
import { verifyAuthoringScenarios } from './browser-authoring-scenarios.mjs';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createCoreComponentRegistry, createProtocolGraph, createSequentialIdFactory, freezeProtocolGraph, insertNodeOnControlEdge, participantUiTemplate } from '../src/core/index.js';
import { createDeploymentBundle } from '../src/deployment/index.js';
import { createHostedHttpHandler, HostedExecutionClient, LocalHostedExecutionService } from '../src/hosted/index.js';

const APP_PORT = Number(process.env.PHYSIOFLOW_PARTICIPANT_E2E_PORT || 14000 + process.pid % 10000);
const API_PORT = APP_PORT + 1;
const DEBUG_PORT = APP_PORT + 2;
const appUrl = `http://127.0.0.1:${APP_PORT}`;
const apiUrl = `http://127.0.0.1:${API_PORT}`;
const debugUrl = `http://127.0.0.1:${DEBUG_PORT}`;
const chrome = [process.env.CHROME_BIN, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser'].filter(Boolean).find(existsSync);
if (!chrome) throw new Error('Chrome/Chromium is required; set CHROME_BIN to its executable path');

const ids = createSequentialIdFactory();
let protocol = createProtocolGraph({ idFactory: ids, name: 'Public participant E2E', now: '2026-08-23T00:00:00.000Z' });
protocol = insertNodeOnControlEdge(protocol, protocol.graph.edges[0].id, 'display.screen', { idFactory: ids, label: 'Public welcome', config: { ui: participantUiTemplate('instruction'), completion: { mode: 'manual' } } }).protocol;
const secondEdge = protocol.graph.edges.find(edge => protocol.graph.nodes.find(node => node.id === edge.target.nodeId)?.component.type === 'core.end');
protocol = insertNodeOnControlEdge(protocol, secondEdge.id, 'display.screen', { idFactory: ids, label: 'Second welcome', config: { ui: participantUiTemplate('instruction'), completion: { mode: 'manual' } } }).protocol;
protocol.graph.groups = protocol.graph.nodes.filter(node => node.component.type === 'display.screen').map((node, index) => ({ id: `public-group-${index}`, name: `Group ${index}`, kind: 'container', nodeIds: [node.id], parameters: [], metadata: {} }));
protocol.groupRandomization = { enabled: true, groupIds: protocol.graph.groups.map(group => group.id) };
protocol = await freezeProtocolGraph(protocol, createCoreComponentRegistry(), { now: '2026-08-23T01:00:00.000Z' });
const bundle = await createDeploymentBundle(protocol, { bundleId: 'public_e2e_bundle', createdAt: '2026-08-23T02:00:00.000Z' });
let hostedId = 0;
const service = new LocalHostedExecutionService({ actors: [{ actorId: 'public-e2e-owner', role: 'owner', accessToken: 'public-e2e-owner-token' }], idFactory: prefix => `${prefix}_public_e2e_${++hostedId}` });
const owner = new HostedExecutionClient(service, 'public-e2e-owner-token');
const deployment = await owner.publish(bundle, { idempotencyKey: 'public-e2e-publish' });
owner.processNextDeployment();
const link = await owner.createLaunchLink(deployment.deploymentId, { idempotencyKey: 'public-e2e-link', maximumUses: 1 });
const hostedHandler = createHostedHttpHandler(service, { allowedOrigins: [appUrl] });
const apiServer = createServer(async (request, response) => {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const body = chunks.length ? Buffer.concat(chunks) : undefined;
  const result = await hostedHandler(new Request(`${apiUrl}${request.url}`, { method: request.method, headers: request.headers, body }));
  response.writeHead(result.status, Object.fromEntries(result.headers.entries()));
  response.end(Buffer.from(await result.arrayBuffer()));
});
await new Promise((resolve, reject) => apiServer.listen(API_PORT, '127.0.0.1', error => error ? reject(error) : resolve()));

const profileDirectory = mkdtempSync(join(tmpdir(), 'physioflow-participant-e2e-'));
const children = [];
const cleanup = async () => {
  children.forEach(child => { if (!child.killed) child.kill('SIGKILL'); });
  await Promise.all(children.map(child => child.exitCode != null ? undefined : new Promise(resolve => { const timer = setTimeout(resolve, 5000); child.once('exit', () => { clearTimeout(timer); resolve(); }); })));
  await new Promise(resolve => apiServer.close(resolve));
  try {
    rmSync(profileDirectory, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  } catch (cleanupError) {
    if (cleanupError.code !== 'ENOTEMPTY' && cleanupError.code !== 'EBUSY') throw cleanupError;
    console.warn(`profile directory could not be removed (${cleanupError.code}); it will be reaped by the host.`);
  }
};
process.on('exit', () => children.forEach(child => { if (!child.killed) child.kill('SIGKILL'); }));

async function waitForUrl(url, label, timeout = 15000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    try { if ((await fetch(url)).ok) return; } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out waiting for ${label}`);
}

const vite = spawn(process.execPath, ['./node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', String(APP_PORT)], { stdio: ['ignore', 'pipe', 'pipe'] });
children.push(vite);
await waitForUrl(appUrl, 'Vite');
const launchUrl = `${appUrl}/participant#launch=${encodeURIComponent(link.launchToken)}&api=${encodeURIComponent(apiUrl)}&participantId=PUBLIC-E2E`;
const chromeProcess = spawn(chrome, ['--headless=new', '--no-sandbox', '--disable-gpu', `--remote-debugging-port=${DEBUG_PORT}`, `--user-data-dir=${profileDirectory}`, launchUrl], { stdio: ['ignore', 'pipe', 'pipe'] });
children.push(chromeProcess);
await waitForUrl(`${debugUrl}/json/list`, 'Chrome DevTools');

const targets = await fetch(`${debugUrl}/json/list`).then(response => response.json());
const target = targets.find(item => item.type === 'page' && item.url.startsWith(`${appUrl}/participant`));
if (!target) throw new Error('Participant page target was not created');
const socket = new WebSocket(target.webSocketDebuggerUrl);
const pending = new Map();
let sequence = 0;
await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
socket.addEventListener('message', event => {
  const message = JSON.parse(event.data);
  const waiter = pending.get(message.id);
  if (!waiter) return;
  pending.delete(message.id);
  message.error ? waiter.reject(new Error(message.error.message)) : waiter.resolve(message.result);
});
const send = (method, params = {}) => new Promise((resolve, reject) => { const id = ++sequence; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })); });
const evaluate = async expression => {
  const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, userGesture: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
};
const waitFor = async (expression, label, timeout = 10000) => {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    try { if (await evaluate(expression)) return; } catch { /* navigation can briefly replace the document */ }
    await new Promise(resolve => setTimeout(resolve, 60));
  }
  const diagnostic = await evaluate(`({ text: document.body?.innerText || '', url: location.href })`);
  throw new Error(`Timed out waiting for ${label}: ${JSON.stringify(diagnostic)}`);
};
const clickText = async text => {
  const started = Date.now();
  while (Date.now() - started < 5000) {
    const clicked = await evaluate(`(() => { const button = [...document.querySelectorAll('button')].find(item => item.textContent.includes(${JSON.stringify(text)}) && !item.disabled); if (!button) return false; button.click(); return true; })()`);
    if (clicked) return;
    await new Promise(resolve => setTimeout(resolve, 60));
  }
  assert.fail(`Missing enabled button containing ${text}`);
};

try {
  await send('Page.enable');
  // The page is already loaded when CDP attaches, so pin the UI language (the product
  // default is now Japanese) and reload for it to take effect.
  await send('Page.addScriptToEvaluateOnNewDocument', { source: "try{localStorage.setItem('physioflow.ui-language','en')}catch(e){}" });
  await send('Page.reload', { ignoreCache: true });
  await send('Runtime.enable');
  await waitFor(`document.body.textContent.includes('RUNTIME V2 READY') && document.body.textContent.includes('PUBLIC-E2E')`, 'verified participant runtime');
  await clickText('Begin experiment');
  await waitFor(`document.body.textContent.includes('Welcome') && document.body.textContent.includes('Continue')`, 'participant instruction');
  const syncStarted = Date.now();
  while (![...service.sessions.values()][0]?.runtimeSnapshot && Date.now() - syncStarted < 5000) await new Promise(resolve => setTimeout(resolve, 50));
  assert.ok([...service.sessions.values()][0]?.runtimeSnapshot, 'Hosted recovery snapshot was not synchronized');
  assert.equal([...service.sessions.values()][0].runtimeSnapshot.stimulus_shuffle_version, 'mulberry32-v2');
  assert.equal([...service.sessions.values()][0].runtimeSnapshot.stimulus_assignment_policy, 'global-completion-v1');
  await evaluate(`new Promise((resolve, reject) => { const request = indexedDB.open('physioflow-data-v1', 1); request.onsuccess = () => { const transaction = request.result.transaction('current', 'readwrite'); transaction.objectStore('current').delete('active'); transaction.oncomplete = resolve; transaction.onerror = () => reject(transaction.error); }; request.onerror = () => reject(request.error); }).then(() => { localStorage.removeItem('physioflow.current-run-pointer.v2'); localStorage.setItem('physioflow.ui-language', 'en'); })`);
  await send('Page.reload', { ignoreCache: true });
  await waitFor(`document.body.textContent.includes('Welcome') && !document.body.textContent.includes('RUNTIME V2 READY') && [...document.querySelectorAll('button')].some(button => button.textContent.includes('Continue') && !button.disabled)`, 'participant refresh recovery');
  const groupBootstrap = await owner.bootstrap([...service.sessions.values()][0].sessionId);
  const firstNodeId = [...service.sessions.values()][0].runtimeSnapshot.currentNodeId;
  await clickText('Continue');
  const advancedAt = Date.now();
  while ([...service.sessions.values()][0].runtimeSnapshot.currentNodeId === firstNodeId && Date.now() - advancedAt < 5000) await new Promise(resolve => setTimeout(resolve, 50));
  assert.notEqual([...service.sessions.values()][0].runtimeSnapshot.currentNodeId, firstNodeId);
  await waitFor(`document.body.textContent.includes('Welcome') && [...document.querySelectorAll('button')].some(button => button.textContent.includes('Continue') && !button.disabled)`, 'second randomized group');
  await clickText('Continue');
  await waitFor(`document.body.textContent.includes('SESSION COMPLETE') && document.body.textContent.includes('Hosted sync complete')`, 'public participant completion');
  assert.equal(service.launchLinks.get(link.launchLinkId).useCount, 1);
  const session = [...service.sessions.values()][0];
  assert.equal(session.status, 'completed');
  assert.equal(session.runtimeSnapshot.stimulus_shuffle_version, 'mulberry32-v2', 'hosted refresh preserves the shuffle algorithm');
  assert.equal(session.runtimeSnapshot.stimulus_assignment_policy, 'global-completion-v1', 'hosted refresh preserves pool consumption');
  assert.ok(session.eventCount >= 4);
  assert.deepEqual(session.runtimeSnapshot.completedNodeIds, groupBootstrap.groupExecutionSnapshot.plan.nodeOrder);
  await verifyRuntimeScenarios(evaluate, waitFor, clickText);
  await verifyPreparationScenarios(evaluate, waitFor);
  await verifyComponentAcceptance(evaluate, waitFor);
  await verifyAuthoringScenarios(evaluate, waitFor, process.env.PHYSIOFLOW_CANVAS_SCREENSHOT ? async () => {
    await send('Emulation.setDeviceMetricsOverride', {width:1600, height:1000, deviceScaleFactor:1, mobile:false});
    await evaluate(`document.getElementById('root').style.display='none'; window.scrollTo(0,0); new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))`);
    const screenshot = await send('Page.captureScreenshot', {format:'png'});
    writeFileSync(process.env.PHYSIOFLOW_CANVAS_SCREENSHOT, Buffer.from(screenshot.data,'base64'));
  } : undefined, send);
  console.log(JSON.stringify({ status: 'passed', publicParticipantEntry: true, bootstrapVerified: true, refreshRecovery: true, hostedRuntimeSync: true }, null, 2));
} finally {
  socket.close();
  await cleanup();
}
