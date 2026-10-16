import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {openTestBrowser} from './browser-harness.mjs';
const browser=await openTestBrowser();
try {
 await browser.evaluate(`(async()=>{localStorage.setItem('physioflow.ui-language','ja');const React=(await import('/node_modules/.vite/deps/react.js')).default;const {createRoot}=(await import('/node_modules/.vite/deps/react-dom_client.js')).default;const {LanguageProvider}=await import('/src/i18n.jsx');const {default:Builder}=await import('/src/ParticipantUiBuilder.jsx');window.core=await import('/src/core/index.js');window.librarySchema=core.participantUiTemplate('instruction');document.getElementById('root').style.display='none';const host=document.createElement('div');host.id='library-test';document.body.append(host);const root=createRoot(host);window.renderLibrary=()=>root.render(React.createElement(LanguageProvider,null,React.createElement(Builder,{schema:librarySchema,onChange:next=>{librarySchema=next;renderLibrary()}})));renderLibrary();window.libraryInputs=()=>librarySchema.root.children.filter(e=>e.type==='Input');})()`);
 await browser.waitFor(`!!document.querySelector('[data-library-type=NumberInput]')`,'shortcuts');
 await browser.evaluate(`document.querySelector('[data-library-type=NumberInput]').focus()`);
 await browser.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',text:'\r',windowsVirtualKeyCode:13});await browser.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
 await browser.waitFor('libraryInputs().length===1','keyboard insert');
 for(const kind of ['SingleChoice','MultipleChoice'])await browser.evaluate(`document.querySelector('[data-library-type=${kind}]').click()`);
 await browser.waitFor('libraryInputs().length===3','click insert');
 await browser.send('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false});
 await browser.evaluate(`(async()=>{await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));await Promise.all(document.getAnimations().filter(a=>a.effect?.getTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})));})()`);
 await mkdir('artifacts/participant-library-stage',{recursive:true});const screenshot=await browser.send('Page.captureScreenshot',{format:'png'});await writeFile('artifacts/participant-library-stage/library.png',Buffer.from(screenshot.data,'base64'));
 await browser.evaluate(`(()=>{const target=document.querySelector('.ui-canvas-root [data-ui-id="'+librarySchema.root.id+'"]');const transfer=new DataTransfer();transfer.setData('application/x-physioflow-ui',JSON.stringify({action:'add',type:'SingleChoice'}));const rect=target.getBoundingClientRect();target.dispatchEvent(new DragEvent('drop',{bubbles:true,cancelable:true,dataTransfer:transfer,clientX:rect.left+50,clientY:rect.top+50}));})()`);
 await browser.waitFor('libraryInputs().length===4','canvas drop');
 await browser.evaluate(`document.querySelector('[role=tab][aria-selected=false]:last-child').click()`);
 await browser.waitFor(`!!document.querySelector('.ui-tree [data-ui-id="'+librarySchema.root.id+'"]')`,'tree');
 await browser.evaluate(`(()=>{window.libraryTransfer=new DataTransfer();libraryTransfer.setData('application/x-physioflow-ui',JSON.stringify({action:'add',type:'MultipleChoice'}));document.querySelector('.ui-tree [data-ui-id="'+librarySchema.root.id+'"]').dispatchEvent(new DragEvent('dragover',{bubbles:true,cancelable:true,dataTransfer:libraryTransfer}));})()`);
 await browser.evaluate(`document.querySelector('.ui-tree [data-ui-id="'+librarySchema.root.id+'"]').dispatchEvent(new DragEvent('drop',{bubbles:true,cancelable:true,dataTransfer:libraryTransfer}))`);
 await browser.waitFor('libraryInputs().length===5','tree drop');
 assert.equal(await browser.evaluate('new Set(libraryInputs().map(e=>e.props.name)).size'),5);
 assert.equal(await browser.evaluate('core.validateParticipantUi(librarySchema).valid'),true);
 await browser.evaluate(`document.querySelector('[title="Undo (Ctrl+Z)"]').click()`);await browser.waitFor('libraryInputs().length===4','undo');
 await browser.evaluate(`document.querySelector('[title="Redo (Ctrl+Shift+Z)"]').click()`);await browser.waitFor('libraryInputs().length===5','redo');
 await mkdir('artifacts/participant-library-stage',{recursive:true});await writeFile('artifacts/participant-library-stage/browser.json',JSON.stringify({actualBuilder:true,keyboardInsert:true,clickInsert:true,canvasDrop:true,treeDrop:true,uniqueResponseNames:true,validInputSchemas:true,undoRedo:true},null,2));
 console.log('Input shortcuts: keyboard, click, both drop targets, unique names and undo/redo passed');
}finally{await browser.close();}
