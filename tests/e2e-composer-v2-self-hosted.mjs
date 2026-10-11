import assert from 'node:assert/strict';
import { layoutAcceptance, pageControlsAcceptance, screenControlsAcceptance, readableLayoutAcceptance, reachableControlsAcceptance } from './browser-layout-acceptance.mjs';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const APP_PORT = Number(process.env.PHYSIOFLOW_E2E_PORT || 10000 + process.pid % 20000);
const DEBUG_PORT = APP_PORT + 1;
const appUrl = `http://127.0.0.1:${APP_PORT}`;
const debugUrl = `http://127.0.0.1:${DEBUG_PORT}`;
const chromeCandidates = [
  process.env.CHROME_BIN,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean);
const chrome = chromeCandidates.find(executable => existsSync(executable));
if (!chrome) throw new Error('Chrome/Chromium is required; set CHROME_BIN to its executable path');

const profileDirectory = mkdtempSync(join(tmpdir(), 'physioflow-e2e-'));
const children = [];
const terminateChildren = () => {
  children.forEach(child => { if (!child.killed) child.kill('SIGKILL'); });
};
const waitForChildExit = child => {
  if (child.exitCode != null || child.signalCode != null) return Promise.resolve();
  return new Promise(resolve => {
    const timeout = setTimeout(resolve, 5000);
    child.once('exit', () => { clearTimeout(timeout); resolve(); });
    if (!child.killed) child.kill('SIGKILL');
  });
};
const cleanup = async () => {
  await Promise.all(children.map(waitForChildExit));
  // Chromium leaves helper processes that briefly hold the profile directory
  // even after the main process exits. rmSync's force/retry does not suppress
  // ENOTEMPTY on Linux, so wrap the call: a leftover temp directory is not
  // worth failing the run for, and the host OS reaps /tmp on its own.
  try {
    rmSync(profileDirectory, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  } catch (cleanupError) {
    if (cleanupError.code !== 'ENOTEMPTY' && cleanupError.code !== 'EBUSY') throw cleanupError;
    console.warn(`profile directory could not be removed (${cleanupError.code}); it will be reaped by the host.`);
  }
};
process.on('exit', terminateChildren);
process.on('SIGINT', async () => { await cleanup(); process.exit(130); });

async function waitForUrl(url, label, timeout = 15000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    try { const response = await fetch(url); if (response.ok) return response; } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out waiting for ${label}`);
}

const vite = spawn(process.execPath, ['./node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', String(APP_PORT)], { stdio: ['ignore', 'pipe', 'pipe'] });
children.push(vite);
await waitForUrl(appUrl, 'Vite');
const chromeProcess = spawn(chrome, ['--headless=new', '--no-sandbox', '--disable-gpu', `--remote-debugging-port=${DEBUG_PORT}`, `--user-data-dir=${profileDirectory}`, appUrl], { stdio: ['ignore', 'pipe', 'pipe'] });
children.push(chromeProcess);
await waitForUrl(`${debugUrl}/json/list`, 'Chrome DevTools');

const targets = await fetch(`${debugUrl}/json/list`).then(response => response.json());
const target = targets.find(item => item.type === 'page' && item.url.startsWith(appUrl));
if (!target) throw new Error('Composer E2E page target was not created');
const socket = new WebSocket(target.webSocketDebuggerUrl);
const pending = new Map();
let commandSequence = 0;
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});
socket.addEventListener('message', event => {
  const message = JSON.parse(event.data);
  const waiter = pending.get(message.id);
  if (!waiter) return;
  pending.delete(message.id);
  message.error ? waiter.reject(new Error(message.error.message)) : waiter.resolve(message.result);
});
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++commandSequence;
  pending.set(id, { resolve, reject });
  socket.send(JSON.stringify({ id, method, params }));
});
const evaluate = async expression => {
  const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, userGesture: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
};
const waitFor = async (expression, label, timeout = 10000) => {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    if (await evaluate(expression)) return;
    await new Promise(resolve => setTimeout(resolve, 60));
  }
  throw new Error(`Timed out waiting for ${label}: ${await evaluate("document.body.innerText.slice(-3500)")}`);
};
const clickText = async text => {
  const clicked = await evaluate(`(() => { const element = [...document.querySelectorAll('button')].find(item => item.textContent.trim().includes(${JSON.stringify(text)}) && !item.disabled); if (!element) return false; element.click(); return true; })()`);
  assert.equal(clicked, true, `Missing enabled button containing ${text}`);
};
const field = async (ariaLabel, value, eventName = 'input') => {
  const changed = await evaluate(`(() => { const element = document.querySelector('[aria-label=${JSON.stringify(ariaLabel)}]'); if (!element) return false; const prototype = element instanceof HTMLSelectElement ? HTMLSelectElement.prototype : element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(prototype, 'value').set.call(element, ${JSON.stringify(String(value))}); element.dispatchEvent(new Event(${JSON.stringify(eventName)}, { bubbles: true })); element.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`);
  assert.equal(changed, true, `Missing field ${ariaLabel}`);
};

try {
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.addScriptToEvaluateOnNewDocument', {source: "localStorage.removeItem('physioflow.onboarding-v1');"});
  await waitFor(`!!document.querySelector('nav[aria-label="Workspace navigation"]')`, 'workspace');
  await evaluate(`Promise.all(['physioflow-data-v1','physioflow-assets-v1','physioflow-workspace-v1'].map(name => new Promise(resolve => { const request = indexedDB.deleteDatabase(name); request.onsuccess = request.onerror = request.onblocked = () => resolve(); }))).then(() => { localStorage.clear(); localStorage.setItem('physioflow.guide-seen.v1','1'); localStorage.setItem('physioflow.ui-language','en'); location.reload(); })`);
  await waitFor(`document.body.textContent.includes('Your first study starts here')`, 'clean dashboard');
  await waitFor(`!!document.querySelector('.welcome-guide')`, 'first-use task introduction');
  await readableLayoutAcceptance({send,evaluate},'.welcome-guide','First-use introduction readable layout');
  await pageControlsAcceptance({send,evaluate},'.welcome-guide button','First-use introduction controls');
  await clickText('Explore the workspace');
  await clickText('User guide');
  await waitFor(`!!document.querySelector('.task-guide')`, 'task-based user guide');
  await clickText('Run and verify');
  assert.ok(await evaluate(`document.querySelector('.task-guide').textContent.includes('Local saving and database verification are separate')`), 'guide distinguishes local saving from database verification');
  await readableLayoutAcceptance({send,evaluate},'.guide-panel','User guide readable layout');
  await pageControlsAcceptance({send,evaluate},'.guide-panel button','User guide controls');
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
  await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
  await waitFor(`!document.querySelector('.task-guide')`, 'guide closes with Escape');
  await clickText('New protocol');
  await waitFor(`document.body.textContent.includes('Composer V2')`, 'Composer V2');
  await waitFor(`!!document.querySelector('.composer-sequence')`, 'default sequential editor');
  await clickText('Wait');
  const firstStepId = await evaluate(`document.querySelectorAll('.composer-sequence li')[1].dataset.nodeId`);
  await evaluate(`document.querySelector('.composer-sequence li:last-child button').click()`);
  await clickText('Wait');
  await waitFor(`document.querySelectorAll('.composer-sequence li').length === 4`, 'two sequential steps inserted');
  assert.equal(await evaluate(`document.querySelectorAll('.composer-sequence li')[1].dataset.nodeId`), firstStepId, 'adding at End appends without reversing existing steps');
  const sequenceIds = await evaluate(`Array.from(document.querySelectorAll('.composer-sequence li'), el => el.dataset.nodeId)`);
  await readableLayoutAcceptance({send,evaluate},'.composer-sequence','Sequence readable layout');
  await pageControlsAcceptance({send,evaluate},'.composer-sequence button','Sequence controls');
  await reachableControlsAcceptance({send,evaluate},'.composer-sequence button','Sequence pointer reachability');
  await evaluate(`document.querySelector('.sequence-actions button[aria-label^="Move down"]:not(:disabled)').click()`);
  await waitFor(`document.querySelectorAll('.composer-sequence li')[1].dataset.nodeId === ${JSON.stringify(sequenceIds[2])}`, 'sequence reordered');
  await clickText('Undo');
  await waitFor(`document.querySelectorAll('.composer-sequence li')[1].dataset.nodeId === ${JSON.stringify(sequenceIds[1])}`, 'sequence reorder undone');
  await clickText('Flow graph');
  await waitFor(`!!document.querySelector('.composer-canvas')`, 'graph shares same protocol');
  await clickText('Sequence view');
  await waitFor(`document.querySelectorAll('.composer-sequence li').length === 4`, 'sequence restored without converting protocol');
  await evaluate(`document.querySelector('.composer-more summary').click()`);
  await waitFor(`document.querySelector('.composer-more').open`, 'more actions opened');
  await pageControlsAcceptance({send,evaluate},'.composer-header button','Composer expanded actions');
  await evaluate(`document.querySelector('.composer-more summary').click()`);
  await clickText('Freeze version');
  await waitFor(`[...document.querySelectorAll('button')].some(button => button.textContent.includes('Create editable version'))`, 'frozen protocol version');
  assert.equal(await evaluate(`Array.from(document.querySelectorAll('.sequence-actions button')).every(button => button.disabled)`), true, 'frozen sequence cannot be reordered');
  await clickText('Advanced');
  await waitFor(`document.body.textContent.includes('Portable deployment')`, 'frozen deployment panel');
  await clickText('Publish to local hosted sandbox');
  await waitFor(`document.body.textContent.includes('Hosted sandbox') && document.body.textContent.includes('ready')`, 'ready hosted sandbox deployment');
  await clickText('Create one-use launch token');
  await waitFor(`document.body.textContent.includes('Created revocable launch token') && document.body.textContent.includes('Launch launch_link_')`, 'hosted sandbox launch token');
  await clickText('Redeem launch token');
  await waitFor(`document.body.textContent.includes('Redeemed launch token') && document.body.textContent.includes('Session hosted_session_') && document.body.textContent.includes('Bootstrap verified')`, 'hosted sandbox participant bootstrap');
  await clickText('Run hosted session');
  await waitFor(`!!document.querySelector('.pf-preflight')`, 'hosted Runtime V2');
  await pageControlsAcceptance({send,evaluate},'.graph-runner-ready button','Runtime ready screen');
  // .graph-operator is not swept here: GraphRuntimeRunnerPage.jsx:469 gates it
  // behind operatorVisible, which is off during a run (Ctrl+Shift+O toggles it).
  // It is already the codebase's reference overflow implementation (the
  // .graph-operator rules in participant-ui.css) and is covered at rest.
  await clickText('Begin experiment');
  await waitFor(`document.body.textContent.includes('SESSION COMPLETE') && document.body.textContent.includes('Hosted sync complete')`, 'completed hosted runtime sync');
  await waitFor(`[...document.querySelectorAll('button')].some(button => button.textContent.includes('Return to projects') && !button.disabled)`, 'saved hosted session');
  await readableLayoutAcceptance({send,evaluate},'.pf-completion','Completion readable layout');
  await screenControlsAcceptance({send,evaluate},'Completion controls');
  await clickText('Return to projects');
  await waitFor(`!!document.querySelector('nav[aria-label="Workspace navigation"]')`, 'workspace after hosted run');
  await clickText('New version');
  await waitFor(`[...document.querySelectorAll('button')].some(button => button.textContent.includes('Freeze version') && !button.disabled)`, 'editable protocol version');
  await clickText('Design');
  // The flow editor's .flow-overlay-head / .canvas-bar are NOT swept here: this
  // run stays in Composer V2 (viewMode 'v2'), while FlowWorkspaceOverlay only
  // mounts for viewMode 'visual' (App.jsx:441). Switching modes mid-run would put
  // the rest of this linear scenario at risk, so those two toolbars are covered by
  // tests/button-overflow-audit.mjs (cases flow-editor-bars, operator-bar) and by
  // `npm run test:button-overflow`.
  await field('New variable name', 'score');
  await field('New variable type', 'number', 'change');
  await clickText('Add variable');
  await clickText('input.rating');
  await waitFor(`[...document.querySelectorAll('button')].some(button => button.textContent.includes('Edit participant screen'))`, 'Rating inspector');
  await clickText('Create group from node');
  await field('Rating group group kind', 'subflow', 'change');
  await clickText('Add parameter');
  await field('Rating group parameter 1 name', 'result');
  await clickText('Publish reusable template');
  await waitFor(`document.body.textContent.includes('Reusable subflows')`, 'subflow template library');
  await clickText('Create instance');
  await waitFor(`document.body.textContent.includes('Created Rating group instance')`, 'subflow instance');
  assert.equal(await evaluate(`document.querySelectorAll('.composer-node').length`), 6);
  await clickText('logic.value-switch');
  await waitFor(`document.body.textContent.includes('Match value')`, 'Value switch inspector');
  assert.equal(await evaluate(`[...document.querySelectorAll('.composer-node')].some(node => node.textContent.includes('Value switch'))`), true);
  assert.equal(await evaluate(`document.body.textContent.includes('Match') && document.body.textContent.includes('Default')`), true);

  await clickText('Advanced');
  await waitFor(`document.body.textContent.includes('Collaboration change sets')`, 'collaboration change-set panel');
  await waitFor(`document.body.textContent.includes('Portable deployment')`, 'portable deployment panel');
  assert.equal(await evaluate(`[...document.querySelectorAll('button')].some(button => button.textContent.includes('Export deployment bundle') && button.disabled)`), true);
  assert.equal(await evaluate(`[...document.querySelectorAll('button')].some(button => button.textContent.includes('Publish to local hosted sandbox') && button.disabled)`), true);
  await clickText('Use current as baseline');
  await waitFor(`document.body.textContent.includes('Collaboration baseline updated')`, 'collaboration baseline');
  await clickText('Install Reaction Button example');
  await waitFor(`document.body.textContent.includes('org.physioflow.examples.reaction-button@1.0.0')`, 'SDK package installation');
  assert.equal(await evaluate(`[...document.querySelectorAll('button')].some(button => button.textContent.includes('example.reaction-button'))`), true);
  await clickText('Install simulated sensor');
  await waitFor(`document.body.textContent.includes('org.physioflow.simulated-sensor@1.0.0')`, 'device connector installation');
  assert.equal(await evaluate(`document.body.textContent.includes('input signal:number') && document.body.textContent.includes('device.connect, device.read, device.write')`), true);
  await clickText('Export changes');
  await waitFor(`document.body.textContent.includes('Exported') && document.body.textContent.includes('collaboration operation')`, 'collaboration change-set export');

  console.log(JSON.stringify({ status: 'passed', composer: 'v2', nodes: 7, reusableSubflow: true, controlHandler: 'core.value-switch@1.0.0', collaborationChangeSet: true, portableDeployment: true, hostedService: true, hostedSandboxLifecycle: true, hostedPublicLaunch: true, participantBootstrap: true, hostedRuntimeSync: true, sdkComponent: 'example.reaction-button@1.0.0', deviceConnector: 'org.physioflow.simulated-sensor@1.0.0' }, null, 2));
  await clickText('Code');
  await waitFor(`!!document.querySelector('[aria-label="Protocol JSON"]')`, 'full JSON editor');
  const originalJson = await evaluate(`document.querySelector('[aria-label="Protocol JSON"]').value`);
  await field('Protocol JSON', '{');
  await clickText('Apply changes');
  await waitFor(`!!document.querySelector('.composer-code-error')`, 'invalid JSON rejected');
  await field('Protocol JSON', originalJson);
  await clickText('Apply changes');
  await waitFor(`document.querySelector('.composer-code-error')?.textContent.includes('Required')`, 'semantic graph errors rejected');
  const changedProtocol = await evaluate(`import('/src/core/index.js').then(core => core.createProtocolGraph({name:'JSON acceptance'}))`);
  changedProtocol.metadata.name = 'JSON round-trip acceptance';
  const simulated = await evaluate(`import('/src/devices/exampleSimulatedConnector.js').then(module => module.exampleSimulatedConnector())`);
  simulated.approvedPermissions = simulated.permissions;
  changedProtocol.deviceConnectors = [simulated];
  changedProtocol.graph.nodes[0].config = { ...changedProtocol.graph.nodes[0].config, deviceConnectorId: simulated.connectorId, deviceRequired: true };
  await field('Protocol JSON', JSON.stringify(changedProtocol));
  await clickText('Apply changes');
  await waitFor(`document.querySelector('[aria-label="Protocol name"]')?.value === 'JSON round-trip acceptance'`, 'valid JSON applied');
  await clickText('Code');
  assert.equal(JSON.parse(await evaluate(`document.querySelector('[aria-label="Protocol JSON"]').value`)).metadata.name, 'JSON round-trip acceptance');
  await clickText('Close');
  await layoutAcceptance({ send, evaluate, waitFor });
  await field('Protocol name', '長い実験名 · 多语言长标题 · Long study title / ' + 'PhysioFlow'.repeat(16));
  await clickText('Save');
  await waitFor(`!document.querySelector('.unsaved-dot')`, 'JSON protocol saved');
  await clickText('Projects');
  await waitFor(`!!document.querySelector('.dashboard')`, 'dashboard acceptance');
  await pageControlsAcceptance({send,evaluate},'.dashboard header button','Dashboard primary controls');
  await screenControlsAcceptance({send,evaluate},'Dashboard controls');
  await readableLayoutAcceptance({send,evaluate},'.dashboard','Dashboard readable layout');
  // The app is Japanese-first (src/i18n.jsx DEFAULT_LANGUAGE = 'ja') and label
  // lengths differ per language, but this run forces 'en' throughout. Sweep the
  // same screen in the other language too. Switching goes through the in-app
  // LanguageToggle (React state + localStorage) rather than a reload, so the rest
  // of this linear scenario keeps its state.
  const clickLanguage = async label => {
    const clicked = await evaluate(`(() => { const el = [...document.querySelectorAll('.language-toggle button')].find(b => b.textContent.trim() === ${JSON.stringify(label)}); if (!el) return false; el.click(); return true; })()`);
    assert.equal(clicked, true, `Missing language toggle button ${label}`);
    await waitFor(`document.querySelector('.language-toggle button.active')?.textContent.trim() === ${JSON.stringify(label)}`, `UI language ${label}`);
  };
  await clickLanguage('日本語');
  await screenControlsAcceptance({send,evaluate},'Dashboard controls (ja)');
  await readableLayoutAcceptance({send,evaluate},'.dashboard','Dashboard readable layout (ja)');
  await clickLanguage('中文');
  await readableLayoutAcceptance({send,evaluate},'.dashboard','Dashboard readable layout (zh)');
  await clickLanguage('EN');
  await evaluate(`document.querySelector('.dark-mode-btn').click()`);
  await waitFor(`document.documentElement.classList.contains('dark-mode')`, 'dark theme applied');
  await readableLayoutAcceptance({send,evaluate},'.dashboard','Dashboard readable layout (dark)');
  await evaluate(`document.querySelector('.dark-mode-btn').click()`);
  await waitFor(`!document.documentElement.classList.contains('dark-mode')`, 'light theme restored');
  await clickText('Manage sessions');
  await waitFor(`!!document.querySelector('.session-manager')`, 'session manager acceptance');
  await pageControlsAcceptance({send,evaluate},'.session-manager-head button','Session manager primary controls');
  await screenControlsAcceptance({send,evaluate},'Session manager controls');
  assert.equal(await evaluate(`document.querySelector('.session-manager').classList.contains('session-manager-embedded')`), true, 'records live inside workspace');
  await waitFor(`!!document.querySelector('.session-manager-body > aside > button')`, 'saved record available');
  await evaluate(`document.querySelector('.session-manager-body > aside > button').click()`);
  await waitFor(`!!document.querySelector('.session-detail')`, 'saved record detail');
  const recordParticipant = await evaluate(`document.querySelector('.session-detail h2').textContent`);
  await clickText('Analyze this session');
  await waitFor(`!!document.querySelector('.analytics-session-card')`, 'selected record analysis');
  await clickText('Review saved record');
  await waitFor(`document.querySelector('.session-detail h2')?.textContent === ${JSON.stringify(recordParticipant)}`, 'analysis returns to same saved record');
  await readableLayoutAcceptance({send,evaluate},'.session-manager','Selected record readable layout');
  await screenControlsAcceptance({send,evaluate},'Selected record controls');
  await clickText('Close');
  await clickText('Continue editing');
  await waitFor(`!!document.querySelector('.composer-header')`, 'recent project opened');
  await clickText('Preview run');
  await waitFor(`!!document.querySelector('.pf-preparation')`, 'original preparation');
  await readableLayoutAcceptance({send,evaluate},'.pf-preparation','Preparation readable layout');
  await screenControlsAcceptance({send,evaluate},'Preparation controls');
  await clickLanguage('日本語');
  await readableLayoutAcceptance({send,evaluate},'.pf-preparation','Preparation readable layout (ja)');
  await clickLanguage('中文');
  await readableLayoutAcceptance({send,evaluate},'.pf-preparation','Preparation readable layout (zh)');
  await clickLanguage('EN');
  await evaluate(`(() => { const input = document.querySelector('#participant-id'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'PF_UNIFIED_PREP'); input.dispatchEvent(new Event('input',{bubbles:true})); })()`);
  await clickText('Continue to test run');
  await waitFor(`!!document.querySelector('.pf-preparation .pf-preflight')`, 'signals inside original preparation');
  assert.equal(await evaluate(`document.querySelector('.preparation-details fieldset').disabled`), true, 'confirmed participant settings locked during device preparation');
  await readableLayoutAcceptance({send,evaluate},'.pf-preparation','Unified preparation readable layout');
  await screenControlsAcceptance({send,evaluate},'Unified preparation controls');
  await clickText('Check signals');
  await waitFor(`!!document.querySelector('.pf-signal-item .pf-tag.ready')`, 'simulated signal receiving in unified preparation');
  assert.equal(await evaluate(`!!document.querySelector('.pf-completion')`), false, 'checking signals does not begin participant experiment');
  await clickText('Edit run details');
  await waitFor(`!document.querySelector('.pf-preflight') && !document.querySelector('.preparation-details fieldset').disabled`, 'run details editable again');
  await clickText('Continue to test run');
  await waitFor(`!!document.querySelector('.pf-preparation .pf-preflight')`, 'reconfirmed unified preparation');
  await clickText('Check signals');
  await waitFor(`!!document.querySelector('.pf-signal-item .pf-tag.ready')`, 'signals reconnected after editing');
  await clickText('Begin experiment');
  await waitFor(`!!document.querySelector('.pf-completion') && document.body.textContent.includes('Session data saved.')`, 'unified preparation run saved');
  assert.equal(await evaluate(`!!document.querySelector('.pf-preparation')`), false, 'administrator preparation chrome removed from running and completed display');
  assert.ok(await evaluate(`document.querySelector('.pf-completion').textContent.includes('PF_UNIFIED_PREP')`), 'confirmed participant preserved through run');
  await clickText('Return to projects');
  await waitFor(`!!document.querySelector('.dashboard')`, 'workspace after preparation');
  await clickText('Data & settings');
  await clickText('Analytics');
  await waitFor(`!!document.querySelector('.analytics-dashboard')`, 'analytics acceptance');
  await pageControlsAcceptance({send,evaluate},'.analytics-dashboard header button','Analytics primary controls');
  await screenControlsAcceptance({send,evaluate},'Analytics controls');
  await send('Page.navigate',{url:appUrl + '/admin'});
  await waitFor(`!!document.querySelector('.admin-monitor')`, 'admin desk layout');
  await readableLayoutAcceptance({send,evaluate},'.admin-monitor','Admin connection readable layout');
  await screenControlsAcceptance({send,evaluate},'Admin connection controls');
} finally {
  socket.close();
  await cleanup();
}
