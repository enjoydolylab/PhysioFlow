import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {openTestBrowser} from './browser-harness.mjs';
const browser=await openTestBrowser();
try{
 await browser.evaluate(`(async()=>{
 localStorage.setItem('physioflow.ui-language','ja');const React=(await import('/node_modules/.vite/deps/react.js')).default;const {createRoot}=(await import('/node_modules/.vite/deps/react-dom_client.js')).default;const {LanguageProvider}=await import('/src/i18n.jsx');const {default:Batch}=await import('/src/composer/GroupBatchEditor.jsx');
 const node=(id,durationMs)=>({id,label:id,component:{type:'timing.wait'},config:{durationMs,ui:{id:'screen-'+id}}});window.batchProtocol={version:{status:'draft'},graph:{nodes:[node('source',750),node('target-a',1000),node('target-b',2000),node('outside',3000)],groups:[{id:'g',name:'group',nodeIds:['source','target-a','target-b']}]}};
 document.getElementById('root').style.display='none';const host=document.createElement('div');host.id='batch-test';document.body.append(host);const root=createRoot(host);window.mountBatch=invalid=>root.render(React.createElement(LanguageProvider,null,React.createElement(Batch,{key:String(invalid),protocol:batchProtocol,node:invalid?{...batchProtocol.graph.nodes[0],config:{durationMs:''}}:batchProtocol.graph.nodes[0],onApply:result=>window.batchResult=result})));mountBatch(false);
 })()`);
 await browser.waitFor(`document.querySelectorAll('#batch-test input[type=checkbox]').length===2`,'only group targets listed');
 await browser.evaluate(`document.querySelectorAll('#batch-test input[type=checkbox]')[1].click()`);
 await browser.waitFor(`document.querySelector('#batch-test').innerText.includes('1 / 2')`,'one target selected');
 await browser.evaluate(`[...document.querySelectorAll('#batch-test button')].find(b=>b.textContent.includes('選択ノードに適用')).click()`);
 const result=await browser.evaluate('window.batchResult');assert.equal(result.count,1);
 const nodes=result.protocol.graph.nodes;assert.equal(nodes.find(n=>n.id==='target-a').config.durationMs,750);assert.equal(nodes.find(n=>n.id==='target-b').config.durationMs,2000);assert.equal(nodes.find(n=>n.id==='outside').config.durationMs,3000);assert.equal(nodes.find(n=>n.id==='target-a').config.ui.id,'screen-target-a');
 await browser.evaluate(`mountBatch(true)`);await browser.waitFor(`!!document.querySelector('#batch-test [role=alert]')`,'blank source guidance');
 assert.equal(await browser.evaluate(`[...document.querySelectorAll('#batch-test button')].find(b=>b.textContent.includes('選択ノードに適用')).disabled`),true);
 await mkdir('artifacts/editor-progression-2026-10-14',{recursive:true});await writeFile('artifacts/editor-progression-2026-10-14/group-batch-selection.json',JSON.stringify({selectiveGroupUpdate:true,unselectedAndOtherGroupsPreserved:true,targetDisplayPreserved:true,blankSourceBlocked:true,japanese:true},null,2));
 console.log('Selective batch update: selected wait only, display and other nodes preserved, invalid source blocked');
}finally{await browser.close();}
