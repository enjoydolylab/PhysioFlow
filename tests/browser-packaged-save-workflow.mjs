import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createProtocolGraph,insertNodeOnControlEdge,participantUiTemplate} from '../src/core/index.js';
import {openTestBrowser} from './browser-harness.mjs';
const origin=process.env.PF_PACKAGE_ORIGIN;if(!origin)throw Error('Package origin required');
let fixture=createProtocolGraph();fixture=insertNodeOnControlEdge(fixture,fixture.graph.edges[0].id,'display.screen',{config:{ui:participantUiTemplate('rating'),completion:{mode:'manual'}}}).protocol;
const browser=await openTestBrowser();
try {
 await browser.send('Page.navigate',{url:origin});await browser.waitFor(`location.origin===${JSON.stringify(origin)}&&!!document.querySelector('main')`,'production app');
 await browser.evaluate(`localStorage.setItem('physioflow.protocols.v1',${JSON.stringify(JSON.stringify([fixture]))});localStorage.setItem('physioflow.ui-language','en');localStorage.setItem('physioflow.guide-seen.v1','1');location.reload()`);
 await browser.waitFor(`!!document.querySelector('.card-main')`,'project');
 await browser.evaluate(`document.querySelector('.card-main').click()`);await browser.waitFor(`!!document.querySelector('.composer-title')`,'editor');
 for(const [modifier,key,name] of [['ctrlKey','s','Saved while typing'],['metaKey','S','Saved with Command']]) {
  await browser.evaluate(`(()=>{const field=document.querySelector('.composer-title');field.focus();Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(field,${JSON.stringify(name)});field.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  await browser.waitFor(`!!document.querySelector('.unsaved-dot')`,'unsaved edit');
  const prevented=await browser.evaluate(`(()=>{const event=new KeyboardEvent('keydown',{key:${JSON.stringify(key)},${modifier}:true,bubbles:true,cancelable:true});document.activeElement.dispatchEvent(event);return event.defaultPrevented})()`);
  assert.equal(prevented,true,'browser Save Page prevented');
  await browser.waitFor(`!document.querySelector('.unsaved-dot')`,'saved edit');
  assert.equal(await browser.evaluate(`JSON.parse(localStorage.getItem('physioflow.protocols.v1'))[0].metadata.name`),name);
 }
 assert.equal(await browser.evaluate(`(()=>{const e=new KeyboardEvent('keydown',{key:'z',ctrlKey:true,bubbles:true,cancelable:true});document.activeElement.dispatchEvent(e);return e.defaultPrevented})()`),false,'native text undo retained');
 await browser.evaluate(`document.activeElement.blur();document.body.dispatchEvent(new KeyboardEvent('keydown',{key:'z',ctrlKey:true,bubbles:true,cancelable:true}))`);
 await browser.waitFor(`document.querySelector('.composer-title').value!=='Saved with Command'`,'protocol undo');
 await browser.evaluate(`document.body.dispatchEvent(new KeyboardEvent('keydown',{key:'Z',ctrlKey:true,shiftKey:true,bubbles:true,cancelable:true}))`);
 await browser.waitFor(`document.querySelector('.composer-title').value==='Saved with Command'`,'uppercase Shift+Z redo');
 await browser.evaluate(`document.querySelector('.composer-sequence li:nth-child(2) .sequence-select').click()`);
 await browser.waitFor(`!!document.querySelector('.edit-participant-ui')`,'screen edit entry');await browser.evaluate(`document.querySelector('.edit-participant-ui').click()`);
 await browser.waitFor(`!!document.querySelector('.participant-ui-builder')`,'screen builder');
 await browser.evaluate(`document.querySelector('.ui-response-fields').open=true;document.querySelector('.ui-response-field button').click()`);
 await browser.waitFor(`document.activeElement?.getAttribute('aria-label')==='Response name'`,'screen field');
 await browser.evaluate(`(()=>{const field=document.activeElement;Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(field,'saved_screen_answer');field.dispatchEvent(new Event('input',{bubbles:true}));})()`);
 await browser.waitFor(`document.querySelector('.node-editor-save-state')?.textContent==='Unsaved changes'`,'visible unsaved state');
 for(const width of [375,1280]) {await browser.send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});assert.ok(await browser.evaluate(`(()=>{const h=document.querySelector('.node-editor-header');return h.scrollWidth<=h.clientWidth+1})()`),'fullscreen save controls fit');}
 await browser.evaluate(`document.querySelector('.node-editor-save').click()`);
 await browser.waitFor(`document.querySelector('.node-editor-save-state')?.textContent==='Saved'`,'visible saved state');
 assert.ok(await browser.evaluate(`localStorage.getItem('physioflow.protocols.v1').includes('saved_screen_answer')`),'fullscreen change persisted');
 await browser.evaluate(`location.reload()`);await browser.waitFor(`!!document.querySelector('.card-main')`,'reload project');await browser.evaluate(`document.querySelector('.card-main').click()`);await browser.waitFor(`document.querySelector('.composer-title')?.value==='Saved with Command'`,'saved name survives reload');
 await browser.evaluate(`(()=>{const f=document.querySelector('.composer-title');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(f,'Production save and leave');f.dispatchEvent(new Event('input',{bubbles:true}))})()`);
 await browser.waitFor(`!!document.querySelector('.unsaved-dot')`,'unsaved before leaving');
 await browser.evaluate(`document.querySelector('.composer-header .header-tools>button:last-child').click()`);
 await browser.waitFor(`!!document.querySelector('.modal-confirm')`,'leave dialog');
 assert.deepEqual(await browser.evaluate(`[...document.querySelectorAll('.modal-confirm button')].map(b=>b.textContent)`),['Save & Leave','Discard & Leave','Cancel']);
 await browser.evaluate(`document.querySelector('.modal-confirm button.primary').click()`);await browser.waitFor(`!!document.querySelector('.dashboard')`,'saved and left');
 assert.equal(await browser.evaluate(`JSON.parse(localStorage.getItem('physioflow.protocols.v1'))[0].metadata.name`),'Production save and leave');
 const directory=process.env.PF_PACKAGE_ARTIFACTS||'artifacts/participant-save-stage/package-beta26';await mkdir(directory,{recursive:true});await writeFile(`${directory}/save-workflow.json`,JSON.stringify({productionAssets:true,focusedFieldShortcutSave:true,reloadPreservesEdit:true,nativeTextUndoPreserved:true,uppercaseRedo:true,fullscreenSaveAndStatus:true,headerWidths:[375,1280],saveAndLeave:true},null,2));
 console.log('Packaged save workflow passed');
}finally{await browser.close();}
