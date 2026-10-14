import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {openTestBrowser} from './browser-harness.mjs';
const browser=await openTestBrowser();
try {
 await browser.evaluate(`(async()=>{localStorage.setItem('physioflow.ui-language','ja');location.hash='#session=ui-test&key=synthetic-key';const React=(await import('/node_modules/.vite/deps/react.js')).default;const {createRoot}=(await import('/node_modules/.vite/deps/react-dom_client.js')).default;const {LanguageProvider}=await import('/src/i18n.jsx');const {default:Monitor}=await import('/src/OperatorMonitorPage.jsx');document.getElementById('root').style.display='none';const host=document.createElement('div');document.body.append(host);createRoot(host).render(React.createElement(LanguageProvider,null,React.createElement(Monitor)));window.testConnection=new BroadcastChannel('physioflow.operator.v1:ui-test:synthetic-key');window.revision=0;window.publish=()=>testConnection.postMessage({protocol:'physioflow.operator.v1',type:'snapshot',revision:++revision,status:'waiting',protocolName:'Synthetic UI experiment',nodeLabel:'Long step '+ 'x'.repeat(100),nodeId:'n',attempt:1,total:2,completed:0});})()`);
 await browser.waitFor(`!!document.querySelector('.operator-monitor .pf-empty')`,'initial wait');
 assert.ok(await browser.evaluate(`document.querySelector('.operator-monitor .pf-tag').textContent==='実験待ち'`));
 await browser.evaluate('publish()');
 await browser.waitFor(`!!document.querySelector('.operator-monitor textarea')`,'connected');
 assert.ok(await browser.evaluate(`document.body.innerText.includes('理由または観察メモを入力')`));
 await browser.waitFor(`!!document.querySelector('.pf-operator-notice')`,'stale guidance',7000);
 assert.ok(await browser.evaluate(`[...document.querySelectorAll('.operator-monitor .pf-analysis-toolbar button')].every(b=>b.disabled)`));
 await browser.evaluate('publish()');
 await browser.waitFor(`!document.querySelector('.pf-operator-notice')`,'connection recovery');
 assert.equal(await browser.evaluate(`document.querySelector('.operator-monitor button.primary').disabled`),false);
 await browser.send('Emulation.setDeviceMetricsOverride',{width:375,height:667,deviceScaleFactor:1,mobile:false});
 await browser.evaluate(`document.documentElement.classList.remove('light-mode');document.documentElement.classList.add('dark-mode')`);
 assert.ok(await browser.evaluate('document.documentElement.scrollWidth<=innerWidth'));
 await mkdir('artifacts/entry-ui-2026-10-15',{recursive:true});
 await browser.evaluate(`(async()=>{await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));await Promise.all(document.getAnimations().filter(a=>a.effect?.getTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})));})()`);
 const screenshot=await browser.send('Page.captureScreenshot',{format:'png'});await writeFile('artifacts/entry-ui-2026-10-15/operator-dark.png',Buffer.from(screenshot.data,'base64'));
 await writeFile('artifacts/entry-ui-2026-10-15/operator.json',JSON.stringify({synthetic:true,initialWaitDistinctFromDisconnected:true,reasonGuidance:true,staleGuidanceAndLock:true,recoveryUnlock:true,narrowNoOverflow:true},null,2));
 console.log('Operator waiting, stale lock, recovery and narrow layout passed');
} finally {await browser.close();}
