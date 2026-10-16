import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {openTestBrowser} from './browser-harness.mjs';
const browser=await openTestBrowser();
try {
 await browser.evaluate(`(async()=>{localStorage.setItem('physioflow.ui-language','ja');const React=(await import('/node_modules/.vite/deps/react.js')).default;const {createRoot}=(await import('/node_modules/.vite/deps/react-dom_client.js')).default;const {LanguageProvider}=await import('/src/i18n.jsx');const {default:Builder}=await import('/src/ParticipantUiBuilder.jsx');const core=await import('/src/core/index.js');window.previewSchema=core.participantUiTemplate('rating');const input=previewSchema.root.children.find(e=>e.type==='Input');input.props={...input.props,inputType:'number',min:0,max:2};const button=previewSchema.root.children.find(e=>e.type==='Button');button.actions=[{event:'click',action:'setVariable',name:'conditionFlag',value:'ready'},{event:'click',action:'submit'}];document.getElementById('root').style.display='none';const host=document.createElement('div');host.id='interactive-test';document.body.append(host);const root=createRoot(host);window.renderPreview=()=>root.render(React.createElement(LanguageProvider,null,React.createElement(Builder,{schema:previewSchema,onChange:next=>{previewSchema=next;renderPreview()}})));renderPreview();})()`);
 await browser.waitFor(`!!document.querySelector('#interactive-test .ui-preview-btn')`,'builder');
 await browser.evaluate(`(async()=>{window.schemaBefore=JSON.stringify(previewSchema);window.sessionsBefore=JSON.stringify(await(await import('/src/storage.js')).loadSessions());document.querySelector('#interactive-test .ui-preview-btn').click()})()`);
 await browser.waitFor(`!!document.querySelector('.ui-preview-tools')`,'appearance preview');
 assert.equal(await browser.evaluate(`document.querySelector('.ui-builder-preview .participant-ui-button').disabled`),true);
 await browser.evaluate(`[...document.querySelectorAll('.ui-preview-tools button')].find(b=>b.textContent==='回答を試す').click()`);
 await browser.waitFor(`!document.querySelector('.ui-builder-preview .participant-ui-button').disabled`,'interactive preview');
 const submit=()=>browser.evaluate(`document.querySelector('.ui-builder-preview .participant-ui-button').click()`);
 await submit();await browser.waitFor(`!!document.querySelector('.ui-builder-preview [role=alert]')`,'required error');
 const enter=async value=>browser.evaluate(`(()=>{const input=document.querySelector('.ui-builder-preview input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,${JSON.stringify(value)});input.dispatchEvent(new Event('input',{bubbles:true}));})()`);
 await enter('3');await submit();assert.equal(await browser.evaluate(`!!document.querySelector('.ui-preview-result')`),false);
 await enter('0');await submit();await browser.waitFor(`!!document.querySelector('.ui-preview-result pre')`,'accepted values');
 const values=await browser.evaluate(`JSON.parse(document.querySelector('.ui-preview-result pre').textContent)`);assert.equal(values.rating,0);assert.equal(values.conditionFlag,'ready');
 await mkdir('artifacts/participant-design-stage',{recursive:true});
 for(const width of [1280,375]) {
  await browser.send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
  await browser.evaluate(`(async()=>{await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));await Promise.all(document.getAnimations().filter(a=>a.effect?.getTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})));})()`);
  assert.ok(await browser.evaluate(`(()=>{const tools=document.querySelector('.ui-preview-tools');return tools.scrollWidth<=tools.clientWidth+1})()`),'preview tools fit');
  const screenshot=await browser.send('Page.captureScreenshot',{format:'png'});await writeFile(`artifacts/participant-design-stage/preview-${width}.png`,Buffer.from(screenshot.data,'base64'));
 }
 await enter('1');await browser.waitFor(`!document.querySelector('.ui-preview-result')`,'old result removed after edit');
 await browser.evaluate(`[...document.querySelectorAll('.ui-preview-tools button')].find(b=>b.textContent==='回答をリセット').click()`);
 await browser.waitFor(`document.querySelector('.ui-builder-preview input').value===''`,'reset answers');
 assert.equal(await browser.evaluate('JSON.stringify(previewSchema)===schemaBefore'),true);
 assert.equal(await browser.evaluate(`(async()=>JSON.stringify(await(await import('/src/storage.js')).loadSessions())===sessionsBefore)()`),true);
 await mkdir('artifacts/participant-design-stage',{recursive:true});await writeFile('artifacts/participant-design-stage/interactive-preview.json',JSON.stringify({actualBuilder:true,defaultAppearanceOnly:true,requiredAndRangeValidation:true,zeroAndButtonVariables:true,resultClearsAfterEdit:true,resetAnswers:true,schemaUnchanged:true,noSavedSession:true},null,2));
 console.log('Interactive preview validates answers, shows values, resets and leaves protocol/session storage unchanged');
}finally{await browser.close();}
