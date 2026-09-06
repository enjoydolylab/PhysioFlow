import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';

export async function pageControlsAcceptance({send,evaluate}, selector, label) {
  assert.ok(await evaluate(`document.querySelectorAll(${JSON.stringify(selector)}).length`), `Missing controls for ${label}`);
  const failures=[];
  for (const [width,height] of [[2560,1440],[1920,1080],[1366,768],[1093,614],[911,512],[768,540],[640,480],[375,667]]) {
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
    await evaluate(`new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))`);
    const bad=await evaluate(`(() => [...document.querySelectorAll(${JSON.stringify(selector)})].filter(el=>{el.scrollIntoView({block:'nearest',inline:'nearest'});const r=el.getBoundingClientRect();return r.width>0 && (r.left < -1 || r.right>innerWidth+1 || r.bottom>innerHeight+1 || r.top< -1);}).map(el=>el.textContent))()`);
    if(bad.length) failures.push({width,height,buttons:bad});
  }
  await send('Emulation.clearDeviceMetricsOverride');
  assert.deepEqual(failures,[],label);
  console.log(`${label}: 8 viewports passed (primary controls only)`);
}

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
