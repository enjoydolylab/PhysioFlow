import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {openTestBrowser} from './browser-harness.mjs';
const browser=await openTestBrowser();
try{
 await browser.evaluate(`(async()=>{
 localStorage.setItem('physioflow.ui-language','ja');location.hash='#session=recovery-test&key=test-key';
 const React=(await import('/node_modules/.vite/deps/react.js')).default;
 const {createRoot}=(await import('/node_modules/.vite/deps/react-dom_client.js')).default;
 const {LanguageProvider}=await import('/src/i18n.jsx');const {default:Monitor}=await import('/src/OperatorMonitorPage.jsx');
 const {openRuntimeMonitor}=await import('/src/operator/runtimeMonitor.js');
 window.actionCalls=0;let dropped=false;
 const connection=new BroadcastChannel('physioflow.operator.v1:recovery-test:test-key');
 const post=connection.postMessage.bind(connection);connection.postMessage=message=>{if(message.type==='command-result'&&!dropped){dropped=true;return;}post(message);};
 window.runtimeMonitor=openRuntimeMonitor({sessionId:'recovery-test',key:'test-key',getSnapshot:()=>({status:'waiting',nodeId:'n',attempt:1,total:1,completed:0,...window.monitorExtras}),channelFactory:()=>connection,onCommand:()=>{window.actionCalls++;return true;}});
 document.getElementById('root').style.display='none';const host=document.createElement('div');document.body.append(host);createRoot(host).render(React.createElement(LanguageProvider,null,React.createElement(Monitor)));
 window.publishTimer=setInterval(()=>runtimeMonitor.publish(),500);
 })()`);
 await browser.waitFor(`!!document.querySelector('textarea')`,'monitor connected');
 await browser.evaluate(`(()=>{const input=document.querySelector('textarea');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(input,'movement');input.dispatchEvent(new Event('input',{bubbles:true}));})()`);
 await browser.evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent==='観察メモを記録').click()`);
 await browser.waitFor(`window.actionCalls===1`,'action applied');
 await browser.waitFor(`[...document.querySelectorAll('button')].some(b=>b.textContent==='操作結果を確認')`,'timeout offers query',10000);
 assert.equal(await browser.evaluate(`document.querySelector('textarea').disabled`),true);
 await browser.evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent==='操作結果を確認').click()`);
 await browser.waitFor(`!document.querySelector('textarea').disabled`,'cached acknowledgement resolved');
 assert.equal(await browser.evaluate('window.actionCalls'),1);assert.equal(await browser.evaluate(`document.querySelector('textarea').value`),'');
 await browser.evaluate(`window.monitorExtras={saveStatus:'error',saveError:'Disk full',hostedSaveStatus:'error',hostedSaveError:'Offline'}`);
 await browser.waitFor(`document.body.innerText.includes('実験ウィンドウを開いたまま')&&document.body.innerText.includes('Disk full')&&document.body.innerText.includes('サーバ保存の確認')`,'local and server saving alerts');
 await browser.evaluate('clearInterval(publishTimer);runtimeMonitor.close()');
 await mkdir('artifacts/db-progression-2026-10-14/operator-recovery',{recursive:true});await writeFile('artifacts/db-progression-2026-10-14/operator-recovery/browser-result.json',JSON.stringify({saveFailureGuidance:true,droppedAcknowledgement:true,timeoutKeepsActionsLocked:true,queryResolves:true,executionCount:1,japanese:true,synthetic:true},null,2));
 console.log('Operator timeout recovery: dropped acknowledgement resolved without duplicate action');
}finally{await browser.close();}
