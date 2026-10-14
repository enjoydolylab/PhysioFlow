import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {openTestBrowser} from './browser-harness.mjs';
const browser=await openTestBrowser();
try {
 await browser.evaluate(`(async()=>{localStorage.setItem('physioflow.ui-language','ja');const React=(await import('/node_modules/.vite/deps/react.js')).default;const {createRoot}=(await import('/node_modules/.vite/deps/react-dom_client.js')).default;const {LanguageProvider}=await import('/src/i18n.jsx');const {default:Runner}=await import('/src/GraphRuntimeRunnerPage.jsx');const core=await import('/src/core/index.js');window.assetStore=await import('/src/assetStore.js');window.originalFile=new File(['<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="green"/></svg>'],'synthetic.svg',{type:'image/svg+xml'});const {checksumBlob}=await import('/src/assetChecksum.js');const checksum=await checksumBlob(originalFile);let protocol=core.createProtocolGraph({name:'Media recheck test'});protocol=core.insertNodeOnControlEdge(protocol,protocol.graph.edges[0].id,'display.media',{config:{assetId:'recheck_test',mediaType:'image',completion:{mode:'manual'}}}).protocol;protocol.assets=[{id:'recheck_test',name:'synthetic.svg',mediaType:'image',checksum}];const host=document.createElement('div');host.id='media-recheck';document.body.append(host);document.getElementById('root').style.display='none';createRoot(host).render(React.createElement(LanguageProvider,null,React.createElement(Runner,{data:{protocol,session:{session_id:'media-test',participant_id:'synthetic',run_mode:'preview'}},onDone:()=>window.returned=true})));window.putTestAsset=async file=>{const request=indexedDB.open('physioflow-assets-v1',1);const db=await new Promise((resolve,reject)=>{request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)});await new Promise((resolve,reject)=>{const tx=db.transaction('assets','readwrite');tx.objectStore('assets').put({id:'recheck_test',name:'synthetic.svg',file,checksum});tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});db.close();};})()`);
 await browser.waitFor(`document.querySelector('#media-recheck')?.textContent.includes('Missing local asset')`,'missing asset blocked');
 const recheck=()=>browser.evaluate(`[...document.querySelectorAll('#media-recheck button')].find(b=>b.textContent==='素材を再確認').click()`);
 await browser.evaluate(`putTestAsset(new File(['wrong bytes'],'synthetic.svg',{type:'image/svg+xml'}))`);
 await recheck();
 await browser.waitFor(`document.querySelector('#media-recheck')?.textContent.includes('Checksum mismatch')`,'wrong bytes still blocked');
 assert.equal(await browser.evaluate(`!![...document.querySelectorAll('#media-recheck button')].find(b=>b.textContent==='実験を開始')`),false);
 await browser.evaluate('putTestAsset(originalFile)');await recheck();
 await browser.waitFor(`!!document.querySelector('#media-recheck .pf-preflight')`,'restored asset permits preparation');
 assert.equal(await browser.evaluate('Boolean(window.returned)'),false);
 await mkdir('artifacts/entry-ui-2026-10-15',{recursive:true});await writeFile('artifacts/entry-ui-2026-10-15/media-recheck.json',JSON.stringify({syntheticMedia:true,missingBlocked:true,wrongBytesBlockedAfterRetry:true,originalBytesRestorePreparation:true,noNavigationOrStart:true},null,2));
 console.log('Media recheck keeps checksum protection and recovers after original bytes restored');
}finally{await browser.close();}
