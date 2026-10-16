import assert from 'node:assert/strict';
import {openTestBrowser} from './browser-harness.mjs';
const browser=await openTestBrowser();
try {
 await browser.evaluate(`(async()=>{const {createProtocolGraph,insertNodeOnControlEdge,participantUiTemplate}=await import('/src/core/index.js');const {saveProtocols}=await import('/src/storage.js');let p=createProtocolGraph();p=insertNodeOnControlEdge(p,p.graph.edges[0].id,'display.screen',{config:{ui:participantUiTemplate('rating'),completion:{mode:'manual'}}}).protocol;await saveProtocols([p]);localStorage.setItem('physioflow.guide-seen.v1','1');location.reload()})()`);
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
 console.log('Save shortcut: Ctrl+S and Cmd+S inside focused field persist edits, prevent Save Page, preserve native text undo, survive reload; fullscreen save status and button persist participant edits at 375/1280');
}finally{await browser.close();}
