// Button overflow audit.
//
// Measures every button the participant-facing components render, across the
// shared viewports from layout acceptance (320px phones through 4K,
// including short landscape and zoom-equivalent windows). Unlike pageControlsAcceptance in browser-layout-acceptance.mjs this
// never calls scrollIntoView before measuring: scrolling an ancestor into place
// can move an overflowing button back inside the viewport and hide the very
// defect we are looking for. Each button is also annotated with whether a
// horizontally scrollable ancestor still makes it reachable, which separates
// "clipped and unreachable" from "merely off-screen scrollable".
//
// Usage: node tests/button-overflow-audit.mjs [--json]

import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { LAYOUT_VIEWPORTS } from './browser-layout-acceptance.mjs';

const VIEWPORTS = LAYOUT_VIEWPORTS;
const APP_PORT = Number(process.env.PHYSIOFLOW_AUDIT_PORT || 13000 + (process.pid % 20000));
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

const profileDirectory = mkdtempSync(join(tmpdir(), 'physioflow-button-audit-'));
const children = [];
const terminateChildren = () => { children.forEach(child => { if (!child.killed) child.kill('SIGKILL'); }); };
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
  try {
    rmSync(profileDirectory, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  } catch (cleanupError) {
    if (cleanupError.code !== 'ENOTEMPTY' && cleanupError.code !== 'EBUSY') throw cleanupError;
    console.warn(`profile directory could not be removed (${cleanupError.code}); it will be reaped by the host.`);
  }
};
process.on('exit', terminateChildren);
process.on('SIGINT', async () => { await cleanup(); process.exit(130); });

async function waitForUrl(url, label, timeout = 20000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    try { const response = await fetch(url); if (response.ok) return response; } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out waiting for ${label}`);
}

// The measurement itself. Runs in the page, mutates nothing, and reports the
// buttons whose border box escapes the viewport at the current device metrics.
const MEASURE = `(() => {
  const root = window.__auditHost;
  if (!root) return { error: 'audit host missing' };
  const scrollableAncestor = element => {
    let node = element.parentElement;
    while (node && node !== document.documentElement) {
      const style = getComputedStyle(node);
      if ((style.overflowX === 'auto' || style.overflowX === 'scroll') && node.scrollWidth > node.clientWidth + 1) return true;
      node = node.parentElement;
    }
    return false;
  };
  const label = element => {
    const text = (element.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 48);
    return text || element.getAttribute('aria-label') || element.getAttribute('title') || '(no label)';
  };
  const buttons = [...root.querySelectorAll('button')];
  const escapes = [];
  for (const element of buttons) {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    if (rect.width <= 0 || rect.height <= 0 || style.visibility === 'hidden' || style.display === 'none') continue;
    const outside = rect.left < -1 || rect.right > innerWidth + 1 || rect.top < -1 || rect.bottom > innerHeight + 1;
    if (!outside) continue;
    escapes.push({
      label: label(element),
      className: typeof element.className === 'string' ? element.className : '',
      left: Math.round(rect.left), right: Math.round(rect.right),
      top: Math.round(rect.top), bottom: Math.round(rect.bottom),
      overflowRight: Math.max(0, Math.round(rect.right - innerWidth)),
      reachableByScroll: scrollableAncestor(element),
    });
  }
  // Buttons alone under-report: a container whose grid/flex track is floored at
  // the buttons' min-content can be pushed out of the viewport while the buttons
  // themselves still sit inside it. Measure the container and the document too.
  // Toolbar heights: the wrap fixes convert fixed height to min-height, so the
  // single-row (desktop) height is the thing that must not move.
  const bars = ['.flow-overlay-head', '.canvas-bar', '.operator', '.workspace-topbar'].map(sel => {
    const el = root.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {sel, height: Math.round(r.height), width: Math.round(r.width)};
  }).filter(Boolean);
  const container = root.querySelector('.participant-ui-screen, .graph-runner-ready, .response-runner') || root.firstElementChild;
  const containerRect = container ? container.getBoundingClientRect() : null;
  const doc = document.documentElement;
  const geometry = buttons.map(element => {
    const rect = element.getBoundingClientRect();
    const parent = element.parentElement;
    return {
      label: (element.textContent || '').trim().slice(0, 24),
      cls: typeof element.className === 'string' ? element.className : '',
      left: Math.round(rect.left), right: Math.round(rect.right), width: Math.round(rect.width),
      parent: parent ? (typeof parent.className === 'string' ? parent.className : '') : '',
      parentRight: parent ? Math.round(parent.getBoundingClientRect().right) : null,
      parentContentRight: parent ? Math.round(parent.getBoundingClientRect().right - parseFloat(getComputedStyle(parent).paddingRight || '0')) : null,
      parentScrollWidth: parent ? parent.scrollWidth : null,
      parentClientWidth: parent ? parent.clientWidth : null,
    };
  });
  return {
    total: buttons.length,
    escapes,
    geometry,
    documentOverflow: Math.max(0, Math.round(doc.scrollWidth - innerWidth)),
    bars,
    container: containerRect ? {
      selector: container.className,
      left: Math.round(containerRect.left),
      right: Math.round(containerRect.right),
      overflowsViewport: containerRect.left < -1 || containerRect.right > innerWidth + 1,
    } : null,
  };
})()`;

const cases = [
  { id: 'questionnaire-ja', advance: 1, describe: 'QuestionnaireFormV2 question 2 of 2, Japanese (PREV + SUBMIT visible)' },
  { id: 'questionnaire-en', advance: 1, describe: 'QuestionnaireFormV2 question 2 of 2, English (PREV + SUBMIT visible)' },
  { id: 'participant-button-long-label', describe: 'ParticipantRenderer stack screen, protocol-authored long label' },
  { id: 'response-options-long-label', describe: 'ResponseRunner, data-driven option labels' },
  { id: 'operator-bar', describe: 'Legacy runtime .operator bar, preview mode (30-char test-exit-button)' },
  { id: 'flow-editor-bars', describe: 'Flow editor .flow-overlay-head + .canvas-bar' },
];

const screenshotIndex = process.argv.indexOf('--screenshot');
const screenshotDir = screenshotIndex >= 0 ? process.argv[screenshotIndex + 1] : null;
const selections = process.argv.slice(2).filter((argument, index, all) => !argument.startsWith('-') && all[index - 1] !== '--screenshot');
const activeCases = selections.length ? cases.filter(item => selections.includes(item.id)) : cases;
if (!activeCases.length) throw new Error(`No case matches ${selections.join(', ')}; known: ${cases.map(item => item.id).join(', ')}`);

const vite = spawn(process.execPath, ['./node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', String(APP_PORT)], { stdio: ['ignore', 'pipe', 'pipe'] });
children.push(vite);
await waitForUrl(appUrl, 'Vite');
const chromeProcess = spawn(chrome, ['--headless=new', '--no-sandbox', '--disable-gpu', `--remote-debugging-port=${DEBUG_PORT}`, `--user-data-dir=${profileDirectory}`, appUrl], { stdio: ['ignore', 'pipe', 'pipe'] });
children.push(chromeProcess);
await waitForUrl(`${debugUrl}/json/list`, 'Chrome DevTools');

const targets = await fetch(`${debugUrl}/json/list`).then(response => response.json());
const target = targets.find(item => item.type === 'page' && item.url.startsWith(appUrl));
if (!target) throw new Error('Audit page target was not created');
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
const waitFor = async (expression, label, timeout = 15000) => {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    if (await evaluate(expression)) return;
    await new Promise(resolve => setTimeout(resolve, 60));
  }
  throw new Error(`Timed out waiting for ${label}`);
};

const report = [];
try {
  await send('Page.enable');
  await send('Runtime.enable');
  await waitFor(`!!document.querySelector('nav[aria-label="Workspace navigation"]')`, 'workspace (loads the app stylesheets)');

  // Park the app behind the audit host so the components under test own the viewport.
  await evaluate(`(async () => {
    const React = (await import('/node_modules/.vite/deps/react.js')).default;
    const { createRoot } = (await import('/node_modules/.vite/deps/react-dom_client.js')).default;
    const core = await import('/src/core/index.js');
    const QuestionnaireFormV2 = (await import('/src/QuestionnaireFormV2.jsx')).default;
    const ParticipantRenderer = (await import('/src/ParticipantRenderer.jsx')).default;
    const ResponseRunner = (await import('/src/ResponseRunner.jsx')).default;
    const participantUi = await import('/src/core/participantUi.js');

    const appRoot = document.getElementById('root');
    if (appRoot) appRoot.style.display = 'none';
    const host = document.createElement('div');
    host.id = 'button-overflow-audit';
    // Mirrors body{overflow-x:clip} (src/theme/base.css:6): the real app clips
    // horizontal overflow instead of scrolling it, so an escaping button is
    // genuinely unreachable rather than reachable by scrolling. An unclipped
    // host here would both invent a scroll container and hide the defect.
    host.style.cssText = 'position:fixed;inset:0;background:#eef1f5;z-index:99999;overflow-x:clip;overflow-y:auto';
    document.body.append(host);
    window.__auditHost = host;
    const root = createRoot(host);
    const frame = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    window.__renderAuditCase = async (id, advance = 0) => {
      // Unmount first: re-rendering the same component type preserves its state,
      // so the second viewport would advance an already-advanced questionnaire
      // (question 2 -> SUBMIT -> completion screen, which has no buttons at all).
      root.render(null);
      await frame();
      if (id === 'questionnaire-ja' || id === 'questionnaire-en') {
        const questionnaire = core.createQuestionnaire();
        // required:false so the nav can advance without answering; the nav row
        // is what we measure and it renders identically either way.
        questionnaire.questions = [core.newQuestion(), core.newQuestion()].map(question => ({...question, required: false}));
        // No inline overrides on the container: .graph-participant's own
        // padding (clamp(20px,5vw,70px)) and grid layout are part of what
        // decides whether a button actually escapes.
        root.render(React.createElement('div', {className:'graph-participant'},
          React.createElement(QuestionnaireFormV2, {questionnaire, language: id.endsWith('-ja') ? 'ja' : 'en', onSubmit: () => {}})));
        // Question 1 renders a single nav button (PREV is guarded by current > 0),
        // which cannot reproduce the two-button row. Advance to question 2.
        for (let step = 0; step < advance; step++) {
          await frame();
          const next = host.querySelector('.qf-nav button.primary');
          if (!next) throw new Error('questionnaire case could not advance: no primary nav button');
          next.click();
        }
        return;
      }
      if (id === 'participant-button-long-label') {
        const schema = participantUi.createParticipantScreen({props:{free:false}, children:[
          participantUi.createUiElement('Button', {props:{label:'neurophysiological_calibration_baseline_measurement'}, actions:[{event:'click',action:'submit'}]}),
        ]});
        root.render(React.createElement('div', {className:'graph-participant'},
          React.createElement(ParticipantRenderer, {schema, onSubmit: () => {}})));
        return;
      }
      // The two cases below replicate markup rather than mounting the real
      // components: .operator lives inside RuntimeRunnerPage and .canvas-bar inside
      // FlowCanvas, both of which need a whole runtime/app context to render. The
      // class names, element nesting and label text are copied from
      // RuntimeRunnerPage.jsx:478-490 and FlowWorkspaceOverlay.jsx:85-126 +
      // CanvasToolbar.jsx:5-41, so the CSS contract under test is the real one.
      if (id === 'operator-bar') {
        const h = React.createElement;
        // preview run_mode is the worst case: it injects TestRunExitButton, whose
        // label is 30 characters, into an already-full fixed-position action bar.
        const action = (label, key) => h('button', {key}, h('svg', {width:13, height:13}), label);
        root.render(h('div', {className:'runner'}, h('div', {className:'operator'},
          h('div', null, h('b', null, 'Pilot protocol with a deliberately long name'), h('span', null, 'Trial 4/12 · 37 steps done')),
          h('div', null, 'Trial 4/12 · 37 steps done'),
          h('div', {className:'operator-actions'},
            action('Retry save', 'retry-save'), action('Fullscreen', 'fs'), action('Pause', 'pause'),
            action('Retry', 'retry'), action('Skip', 'skip'),
            h('button', {className:'test-exit-button', key:'exit'}, 'Exit test and return to editor'),
            action('Abort', 'abort')))));
        return;
      }
      if (id === 'flow-editor-bars') {
        const h = React.createElement;
        root.render(h('div', {className:'flow-overlay'},
          h('div', {className:'flow-overlay-head'},
            h('div', {className:'flow-head-left'},
              h('button', {className:'icon-btn', key:'back'}, '←'),
              h('div', {className:'flow-project'},
                h('span', {className:'flow-logo', key:'logo'}, 'PF'),
                h('input', {key:'name', defaultValue:'Protocol name', style:{width:'180px'}}),
                h('small', {className:'unsaved-dot', key:'dot'}, '●'))),
            h('select', {className:'trial-switcher', defaultValue:'t1'}, h('option', {value:'t1'}, 'Block A / Trial 1')),
            h('div', {className:'flow-top-actions'},
              h('button', {className:'hint', key:'undo'}, '↩'),
              h('button', {className:'hint', key:'redo'}, '↪'),
              h('button', {className:'hint save-flow-btn', key:'save'}, 'Save flow'),
              h('button', {className:'hint', key:'help'}, '?'),
              h('div', {className:'language-toggle', key:'lang'}, ['中','日','EN'].map(lang => h('button', {key:lang}, lang))),
              h('span', {className:'badge draft', key:'badge'}, 'draft'),
              h('button', {className:'primary', key:'run'}, 'Run'),
              h('button', {className:'hint', key:'more'}, '⋯'))),
          h('div', {className:'canvas-bar'},
            h('div', {className:'view-toggle', key:'view'}, h('button', null, 'Canvas'), h('button', null, 'Code')),
            h('div', {key:'title'}, h('b', null, 'Trial 1'), h('span', null, '12 nodes · 14 connections')),
            h('div', {className:'connection-hint', key:'hint'}),
            h('label', {className:'check-row', key:'snap'}, h('input', {type:'checkbox', defaultChecked:true}), ' Snap'),
            h('button', {className:'icon-btn', key:'undo'}), h('button', {className:'icon-btn', key:'redo'}),
            h('button', {key:'auto'}, 'Auto layout'),
            h('button', {className:'icon-btn', key:'fit'}),
            h('button', {key:'shots'}, '📸 3'),
            h('span', {className:'flow-status valid', key:'status'}, '✓ Ready'))));
        return;
      }
      if (id === 'response-options-long-label') {
        root.render(React.createElement('div', {className:'graph-participant'},
          React.createElement(ResponseRunner, {language:'ja', onSubmit: () => {}, config:{options:[
            {key:'f', value:'left', label:'forced_choice_left_alternative_response'},
            {key:'j', value:'right', label:'forced_choice_right_alternative_response'},
          ]}})));
        return;
      }
      root.render(null);
    };
  })()`);

  for (const auditCase of activeCases) {
    const perViewport = [];
    for (const [width, height] of VIEWPORTS) {
      await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
      await evaluate(`window.__renderAuditCase(${JSON.stringify(auditCase.id)}, ${auditCase.advance || 0})`);
      await evaluate(`new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))`);
      const measured = await evaluate(MEASURE);
      if (measured.error) throw new Error(`${auditCase.id}: ${measured.error}`);
      if (screenshotDir) {
        const shot = await send('Page.captureScreenshot', {format: 'png'});
        mkdirSync(screenshotDir, {recursive: true});
        writeFileSync(join(screenshotDir, `${auditCase.id}-${width}x${height}.png`), Buffer.from(shot.data, 'base64'));
      }
      perViewport.push({ width, height, total: measured.total, escapes: measured.escapes, documentOverflow: measured.documentOverflow, container: measured.container, geometry: measured.geometry, bars: measured.bars });
      if (measured.total === 0) throw new Error(`${auditCase.id} rendered no buttons at ${width}x${height}; the case is not measuring anything`);
    }
    report.push({ case: auditCase.id, describe: auditCase.describe, perViewport });
  }
  await evaluate(`window.__auditHost && window.__auditHost.remove()`);
  await send('Emulation.clearDeviceMetricsOverride');
} finally {
  socket.close();
  await cleanup();
}

if (process.argv.includes('--geometry')) {
  const targetWidth = Number(process.env.WIDTH || 375);
  for (const entry of report) {
    const viewport = entry.perViewport.find(item => item.width === targetWidth);
    console.log(`\n--- ${entry.case} @ ${targetWidth}px  docOverflow=${viewport.documentOverflow}  screen=${JSON.stringify(viewport.container)}  bars=${JSON.stringify(viewport.bars)}`);
    for (const g of viewport.geometry) {
      console.log(`   x=${String(g.left).padStart(4)}..${String(g.right).padStart(4)} w=${String(g.width).padStart(4)}  parent<${g.parent}> contentRight=${g.parentContentRight} scrollW=${g.parentScrollWidth} clientW=${g.parentClientWidth}  ${JSON.stringify(g.label)}`);
    }
  }
} else if (process.argv.includes('--json')) {
  console.log(JSON.stringify(report, null, 2));
} else {
  let failures = 0;
  for (const entry of report) {
    console.log(`\n=== ${entry.case} — ${entry.describe}`);
    for (const viewport of entry.perViewport) {
      const head = `  ${String(viewport.width).padStart(4)}x${String(viewport.height).padEnd(4)}  ${String(viewport.total).padStart(3)} buttons`;
      // documentOverflow is NOT a usable signal: body{overflow-x:clip} makes the
      // root a non-scroll container, so scrollWidth always equals clientWidth and
      // the spill is invisible to it. The container box is what catches it.
      const containerSpill = viewport.container?.overflowsViewport;
      if (!viewport.escapes.length && !containerSpill) { console.log(`${head}  ok`); continue; }
      failures += viewport.escapes.length + (containerSpill ? 1 : 0);
      const note = containerSpill ? `  container <${viewport.container.selector}> right=${viewport.container.right} (+${viewport.container.right - viewport.width}px)` : '';
      console.log(`${head}  ${viewport.escapes.length} button(s) escaping${note}`);
      for (const escape of viewport.escapes) {
        console.log(`        +${escape.overflowRight}px right  ${escape.reachableByScroll ? '[scrollable]' : '[UNREACHABLE]'}  ${JSON.stringify(escape.label)}  <${escape.className}>`);
      }
    }
  }
  console.log(`\n${failures} overflow finding(s) (escaping buttons + spilling containers) across ${report.length} case(s).`);
  if (failures) process.exitCode = 1;
}
