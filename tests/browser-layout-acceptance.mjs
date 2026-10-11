import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';

/** Narrow phones through 4K; viewport pixels, not OS DPI emulation. */
export const LAYOUT_VIEWPORTS = [[3840,2160],[2560,1440],[1920,1080],[1366,768],[1093,614],[911,512],[768,540],[683,384],[640,480],[568,320],[375,667],[320,568]];

/** Every interactive control, not just the hand-picked header buttons. */
export const ALL_CONTROLS = 'button, summary, [role="button"]';

/**
 * One measurement pass at the CURRENT viewport.
 *
 * Horizontal overflow is measured on the element's UNSCROLLED rect. The previous
 * implementation called scrollIntoView first, which scrolls an ancestor
 * overflow-x container into place and can leave the element at r.right <=
 * innerWidth — hiding exactly the defect being looked for. Vertical keeps the
 * historical scrolled-rect semantics so existing call sites are unaffected.
 *
 * An element that escapes horizontally but sits inside an ancestor that really
 * can scroll to it (the SAM continuum, the matrix table) is reachable and is not
 * reported, unless allowScrollReachable is false.
 */
export async function collectControlOverflow({evaluate}, selector, options = {}) {
  const { includeHidden = false, allowScrollReachable = true } = options;
  return evaluate(`(() => {
    const visible = el => (el.checkVisibility?.({checkOpacity:true, checkVisibilityCSS:true})
      ?? (el.offsetParent !== null || getComputedStyle(el).position === 'fixed'));
    const scrollReachable = el => {
      for (let p = el.parentElement; p; p = p.parentElement) {
        const s = getComputedStyle(p);
        if (/auto|scroll/.test(s.overflowX) && p.scrollWidth > p.clientWidth + 1) return true;
      }
      return false;
    };
    const out = [];
    for (const el of document.querySelectorAll(${JSON.stringify(selector)})) {
      if (!${includeHidden} && !visible(el)) continue;
      const before = el.getBoundingClientRect();
      if (!(before.width > 0)) continue;
      const horizontal = before.left < -1 || before.right > innerWidth + 1;
      el.scrollIntoView({block:'nearest', inline:'nearest'});
      const after = el.getBoundingClientRect();
      const vertical = after.width > 0 && (after.top < -1 || after.bottom > innerHeight + 1);
      if ((horizontal && !(${allowScrollReachable} && scrollReachable(el))) || vertical)
        out.push({label: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 56), horizontal, vertical});
    }
    return out;
  })()`);
}

export async function pageControlsAcceptance({send,evaluate}, selector, label, options = {}) {
  const { vertical = true, includeHidden = false, allowScrollReachable = true } = options;
  assert.ok(await evaluate(`document.querySelectorAll(${JSON.stringify(selector)}).length`), `Missing controls for ${label}`);
  const failures=[];
  for (const [width,height] of LAYOUT_VIEWPORTS) {
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
    await evaluate(`new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))`);
    let bad = await collectControlOverflow({evaluate}, selector, { includeHidden, allowScrollReachable });
    if (!vertical) bad = bad.filter(item => item.horizontal);
    if(bad.length) failures.push({width,height,buttons:bad.map(item=>item.label)});
  }
  await send('Emulation.clearDeviceMetricsOverride');
  // Report-only mode: lets a before/after diff be captured without turning the
  // run red, because the "before" tree is expected to fail these assertions.
  if (process.env.LAYOUT_REPORT) { console.log(`LAYOUT_REPORT ${label} ${JSON.stringify(failures)}`); return; }
  assert.deepEqual(failures,[],label);
  console.log(`${label}: ${LAYOUT_VIEWPORTS.length} viewports passed (${selector})`);
}

/** All controls on the current screen, horizontal axis only (vertical is a
 *  separate concern and already covered per-screen). */
export const screenControlsAcceptance = (driver, label, options = {}) =>
  pageControlsAcceptance(driver, ALL_CONTROLS, label, { vertical: false, ...options });

export async function layoutAcceptance({ send, evaluate, waitFor }) {
  const artifacts = resolve('release-desktop/acceptance-2026-09-05');
  mkdirSync(artifacts, {recursive:true});
  const headerFailures = [];
  for (const [width,height] of [[2560,1440],[1920,1080],[1366,768],[1093,614],[911,512],[768,540],[640,480],[375,667]]) {
    await send('Emulation.setDeviceMetricsOverride', {width,height,deviceScaleFactor:1,mobile:false});
    await evaluate(`new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))`);
    const bad = await evaluate(`(() => [...document.querySelectorAll('.composer-header button')].filter(el=>{const r=el.getBoundingClientRect(); return r.left < -1 || r.right > innerWidth+1 || r.bottom>innerHeight || r.width<10;}).map(el=>el.textContent))()`);
    if (bad.length) headerFailures.push({width,height,buttons:bad});
  }
  assert.deepEqual(headerFailures, [], 'Main Composer toolbar must fit the viewport');
  await evaluate(`(async () => {
    const React = (await import('/node_modules/.vite/deps/react.js')).default;
    const { createRoot } = (await import('/node_modules/.vite/deps/react-dom_client.js')).default;
    const Builder = (await import('/src/ParticipantUiBuilder.jsx')).default;
    const { CodeView } = await import('/src/composer/NodeInspector.jsx');
    const core = await import('/src/core/participantUi.js');
    window.layoutHost = document.createElement('div');
    layoutHost.style.cssText = 'position:fixed;inset:0;background:white;z-index:9999;overflow:auto';
    document.body.append(layoutHost);
    window.layoutRoot = createRoot(layoutHost);
    window.renderLayoutCase = (mode) => {
      const child = mode === 'code' ? React.createElement(CodeView, {text:'{}', onChange:()=>{},onApply:()=>{},onFormat:()=>{},onClose:()=>{}})
        : React.createElement(Builder, {schema:core.participantUiTemplate('instruction'), onChange:()=>{}});
      layoutRoot.render(React.createElement('div', {className:mode === 'full' ? 'node-editor-fullscreen' : '', style:mode === 'embedded' ? {width:300,maxWidth:'100%'} : {}}, child));
    };
  })()`);
  const failures = [];
  for (const [width, height] of [[2560,1440],[1920,1080],[1366,768],[1093,614],[911,512],[768,540],[640,480],[375,667]]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
    for (const mode of ['embedded', 'full', 'code']) {
      await evaluate(`renderLayoutCase(${JSON.stringify(mode)})`);
      await waitFor(mode === 'code' ? `!!layoutHost.querySelector('textarea')` : `!!layoutHost.querySelector('.ui-canvas-layout')`, mode);
      await evaluate(`new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))`);
      const result = await evaluate(`(() => {
        const selector = ${JSON.stringify(mode === 'code' ? '.composer-code-toolbar button' : '.ui-element-library, .ui-canvas-wrap, .ui-inspector')};
        return [...layoutHost.querySelectorAll(selector)].map(el => {const r=el.getBoundingClientRect(); return {name:el.className||el.textContent, left:r.left,right:r.right,width:r.width};});
      })()`);
      const available = mode === 'embedded' ? Math.min(width,300) : width;
      for (const r of result) if (r.left < -1 || r.right > available + 1 || r.width < 20) failures.push({width,height,mode,...r});
      if (mode === 'full' && [1366,375].includes(width)) {
        const screenshot = await send('Page.captureScreenshot', {format:'png'});
        writeFileSync(join(artifacts, `ui-editor-${width}.png`), Buffer.from(screenshot.data,'base64'));
      }
    }
  }
  await evaluate(`(async () => {
    const React = (await import('/node_modules/.vite/deps/react.js')).default;
    const Renderer = (await import('/src/ParticipantRenderer.jsx')).default;
    const {createParticipantScreen,createUiElement} = await import('/src/core/participantUi.js');
    const schema = createParticipantScreen({props:{free:true},children:[
      createUiElement('Button',{props:{label:'Sized button',x:600,y:100,width:280,height:70},actions:[{event:'click',action:'submit'}]}),
      createUiElement('Html',{props:{html:'<p>Custom content</p>',x:0,y:200,width:240,height:90}})
    ]});
    window.acceptedSubmission = false;
    layoutRoot.render(React.createElement(Renderer,{schema,onSubmit:()=>{window.acceptedSubmission=true;}}));
  })()`);
  await waitFor(`!!layoutHost.querySelector('.participant-ui-button')`, 'free layout render');
  const dimensions = await evaluate(`(() => {
    const button=layoutHost.querySelector('button'), frame=layoutHost.querySelector('iframe');
    const screen=layoutHost.querySelector('.participant-ui-screen');
    screen.scrollLeft=screen.scrollWidth;
    return {buttonWidth:button.getBoundingClientRect().width,buttonHeight:button.getBoundingClientRect().height,htmlWidth:frame.getBoundingClientRect().width,htmlHeight:frame.getBoundingClientRect().height,scrollable:screen.scrollLeft>0,sandbox:frame.getAttribute('sandbox')};
  })()`);
  assert.deepEqual(dimensions, {buttonWidth:280,buttonHeight:70,htmlWidth:240,htmlHeight:90,scrollable:true,sandbox:''});
  const point = await evaluate(`(() => {const r=layoutHost.querySelector('button').getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};})()`);
  await send('Input.dispatchMouseEvent', {type:'mousePressed',button:'left',clickCount:1,...point});
  await send('Input.dispatchMouseEvent', {type:'mouseReleased',button:'left',clickCount:1,...point});
  assert.equal(await evaluate('acceptedSubmission'), true, 'Overflowing free-layout button is reachable with a real pointer click');
  await evaluate('layoutRoot.unmount(); layoutHost.remove()');
  await send('Emulation.clearDeviceMetricsOverride');
  assert.deepEqual(failures, [], 'Authoring controls must remain within the available width');
  console.log('Layout acceptance: 8 viewports x 3 editor contexts passed (CSS viewport simulation, not Windows DPI testing)');
}

/** Verify layout text and controls do not clip horizontally inside their own boxes. */
export async function readableLayoutAcceptance({send,evaluate}, root, label) {
  const failures = [];
  for (const [width,height] of LAYOUT_VIEWPORTS) {
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
    await evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
    const clipped = await evaluate(`(() => {
      const root = document.querySelector(${JSON.stringify(root)});
      if (!root) return ['Missing page'];
      const nodes = [...root.querySelectorAll('h1,h2,h3,p,button,summary,label')];
      return nodes.filter(el => el.checkVisibility({checkVisibilityCSS:true}) && el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 2)
        .map(el => (el.textContent || '').trim().slice(0,80));
    })()`);
    if (clipped.length) failures.push({width,height,clipped});
  }
  await send('Emulation.clearDeviceMetricsOverride');
  assert.deepEqual(failures,[],label);
  console.log(`${label}: ${LAYOUT_VIEWPORTS.length} viewports passed (text and controls)`);
}

/** Visible controls must accept pointer clicks, including under sidebar layouts. */
export async function reachableControlsAcceptance({send,evaluate},selector,label) {
  const failures=[];
  for (const [width,height] of LAYOUT_VIEWPORTS) {
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
    await evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
    const covered=await evaluate(`(() => {
      const bad=[];
      for(const el of document.querySelectorAll(${JSON.stringify(selector)})) {
        if(el.disabled || !el.checkVisibility({checkVisibilityCSS:true})) continue;
        el.scrollIntoView({block:'center',inline:'nearest'});
        const r=el.getBoundingClientRect();
        const hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
        if(!hit || !el.contains(hit)) bad.push({label:(el.textContent || el.getAttribute('aria-label') || '').slice(0,80),hit:hit?.className,top:r.top,bottom:r.bottom,scrollY});
      }
      return bad;
    })()`);
    if(covered.length) failures.push({width,height,covered});
  }
  await send('Emulation.clearDeviceMetricsOverride');
  assert.deepEqual(failures,[],label);
  console.log(`${label}: ${LAYOUT_VIEWPORTS.length} viewports passed (pointer reachability)`);
}
