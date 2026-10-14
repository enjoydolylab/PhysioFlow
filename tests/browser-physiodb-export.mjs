import assert from 'node:assert/strict';
import {mkdtemp,readFile,readdir,rm,mkdir,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {openTestBrowser} from './browser-harness.mjs';
const downloads=await mkdtemp(join(tmpdir(),'pf-export-'));
const browser=await openTestBrowser();
try {
 await browser.send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:downloads});
 await browser.evaluate(`(async()=>{
 const React=(await import('/node_modules/.vite/deps/react.js')).default;
 const {createRoot}=(await import('/node_modules/.vite/deps/react-dom_client.js')).default;
 const {LanguageProvider}=await import('/src/i18n.jsx');const {default:Review}=await import('/src/PhysioDBRunReview.jsx');
 const {createPhysioDBRunMapping}=await import('/src/physioDBRunMapping.js');
 localStorage.setItem('physioflow.ui-language','ja');
 const protocol={protocolId:'p',version:{number:1},graph:{nodes:[]}};
 const mapping=createPhysioDBRunMapping({sessionId:'export-test',protocol});
 const run={sessionId:'export-test',protocolSnapshot:protocol,provenance:mapping.provenance,destination:{experimentId:'exp',participantId:'subject'}};
 const events=Array.from({length:30},(_,i)=>({id:'e'+i,event_type:'physioflow.response_recorded',data:{physioflow:{...mapping.provenance,sequence:i+1},payload:{response:{responseId:'r'+i,value:i}}}}));
 window.exportReads=0;
 const client={runSnapshot:async()=>run,events:async(exp,subject)=>{if(exp!=='exp'||subject!=='subject')throw Error('wrong destination');window.exportReads++;return events;}};
 document.getElementById('root').style.display='none';const host=document.createElement('div');document.body.append(host);createRoot(host).render(React.createElement(LanguageProvider,null,React.createElement(Review,{events,runId:run.sessionId,client})));
 })()`);
 await browser.waitFor(`document.querySelector('.pf-run-review button.primary')?.disabled===false`,'export ready');
 await browser.evaluate(`(()=>{const input=document.querySelector('input[type=search]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'no-match');input.dispatchEvent(new Event('input',{bubbles:true}));})()`);
 await browser.waitFor(`document.querySelectorAll('.pf-run-review li').length===0`,'search hides rows');
 await browser.evaluate(`document.querySelector('.pf-run-review button.primary').click()`);
 await browser.waitFor(`document.body.innerText.includes('データパッケージを作成')`,'Japanese download confirmation');
 assert.equal(await browser.evaluate('window.exportReads'),1);
 let zip;for(let i=0;i<100;i++){zip=(await readdir(downloads)).find(n=>n.endsWith('.zip'));if(zip)break;await new Promise(r=>setTimeout(r,100));}
 assert.ok(zip,'actual browser ZIP download');
 const bytes=await readFile(join(downloads,zip));const files={};let offset=0;
 while(bytes.readUInt32LE(offset)===0x04034b50){const size=bytes.readUInt32LE(offset+18),nameSize=bytes.readUInt16LE(offset+26),extra=bytes.readUInt16LE(offset+28),start=offset+30+nameSize+extra;files[bytes.subarray(offset+30,offset+30+nameSize).toString()]=bytes.subarray(start,start+size).toString();offset=start+size;}
 assert.equal(JSON.parse(files['manifest.json']).counts.responses,30);assert.equal(JSON.parse(files['responses.json']).length,30);
 const directory=resolve('artifacts/db-progression-2026-10-14/export');await mkdir(directory,{recursive:true});await writeFile(join(directory,'browser-result.json'),JSON.stringify({actualBrowserZipDownload:true,japanese:true,freshFetch:true,searchIndependent:true,responses:30,synthetic:true},null,2));
 console.log('Japanese run export: actual ZIP download, fresh fetch and all 30 records despite empty search passed');
}finally{await browser.close();await rm(downloads,{recursive:true,force:true});}
