import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {resolve} from 'node:path';
import {mkdir,writeFile,stat} from 'node:fs/promises';
import {openTestBrowser} from './browser-harness.mjs';
import {createDeviceMonitorBridge} from '../server/deviceMonitorBridge.mjs';
import {createHostedNodeServer} from '../server/createHostedNodeServer.mjs';
import {normalizeDeviceSnapshot} from '../src/operator/deviceSnapshot.js';
const source=resolve('../研究室DB相关打工/imgNoBio_long_physiodb_connect_lab-main/src'),directory=resolve('artifacts/db-progression-2026-10-14/koguchi-mock');await mkdir(directory,{recursive:true});
const child=spawn(process.env.BRAINFLOW_PYTHON||'tools/brainflow/.venv/bin/python',['scripts/koguchi-mock-validation.py',source,directory],{stdio:['pipe','pipe','ignore']});
let browser,server;
try{
 const ready=await new Promise((resolve,reject)=>{let text='';child.stdout.on('data',chunk=>{text+=chunk;const line=text.split('\n')[0];try{resolve(JSON.parse(line));}catch{}});child.once('error',reject);child.once('exit',code=>reject(Error(`Reference mock exited: ${code}`)));});
 const actor={actorId:'validation',tenantId:'isolated',role:'owner',accessToken:'pf-koguchi-ui-validation'};
 const bridge=createDeviceMonitorBridge({sources:[{...actor,kind:'koguchi',baseUrl:ready.baseUrl,token:'pf-reference-mock-validation'}]});
 const received=await bridge(actor,'koguchi'),snapshot=normalizeDeviceSnapshot(received);assert.equal(snapshot.synthetic,true);assert.equal(snapshot.recording,true);assert.equal(snapshot.signals.filter(s=>s.id.startsWith('eeg_')).length,4);assert.ok(snapshot.signals.some(s=>s.id==='ecg'&&s.values.length>5));
 browser=await openTestBrowser();server=await createHostedNodeServer({actors:[actor],stateFile:`${directory}/pf-state-${Date.now()}.json`,credentialKeys:[{keyId:'test',secret:'pf-koguchi-validation-secret-over-32-characters'}],allowedOrigins:[browser.origin],deviceMonitorBridge:bridge});const {baseUrl}=await server.listen(0);
 await browser.evaluate(`(async()=>{localStorage.setItem('physioflow.ui-language','ja');document.getElementById('root').style.display='none';const React=(await import('/node_modules/.vite/deps/react.js')).default;const {createRoot}=(await import('/node_modules/.vite/deps/react-dom_client.js')).default;const {LanguageProvider}=await import('/src/i18n.jsx');const {default:Panel}=await import('/src/DeviceMonitorPanel.jsx');const {createPhysioDBServiceClient}=await import('/src/physioDBServiceClient.js');await import('/src/admin-monitor.css');const host=document.createElement('main');host.className='admin-monitor';host.id='koguchi-test';document.body.append(host);window.koguchiRoot=createRoot(host);koguchiRoot.render(React.createElement(LanguageProvider,null,React.createElement(Panel,{client:createPhysioDBServiceClient({baseUrl:${JSON.stringify(baseUrl)},accessToken:${JSON.stringify(actor.accessToken)}})})));})()`);
 await browser.waitFor(`!!document.querySelector('#koguchi-test select')`,'monitor mounted');await browser.evaluate(`(()=>{const select=document.querySelector('#koguchi-test select');select.value='koguchi';select.dispatchEvent(new Event('change',{bubbles:true}));})()`);await browser.evaluate(`document.querySelector('#koguchi-test button').click()`);
 await browser.waitFor(`document.querySelectorAll('#koguchi-test .pf-waveform').length===5`,'actual mock EEG and ECG waveforms');
 assert.match(await browser.evaluate(`document.querySelector('#koguchi-test').innerText`),/サンプル順/);assert.match(await browser.evaluate(`document.querySelector('#koguchi-test').innerText`),/模擬|シミュレーション/);
 await browser.send('Emulation.setDeviceMetricsOverride',{width:1280,height:1000,deviceScaleFactor:1,mobile:false});const metrics=await browser.send('Page.getLayoutMetrics');const image=await browser.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:0,y:0,width:metrics.cssContentSize.width,height:metrics.cssContentSize.height,scale:1}});await writeFile(`${directory}/monitor-ja.png`,Buffer.from(image.data,'base64'));
 await writeFile(`${directory}/result.json`,JSON.stringify({referenceSource:source,actualReferenceMockServer:true,hardware:false,eegChannels:4,ecgPreview:true,sampleOrderAxis:true,recording:true,syntheticClearlyMarked:true},null,2));console.log('Reference mock → PF bridge → Japanese EEG/ECG monitor passed');
}finally{await server?.close();await browser?.close();child.stdin.end('stop\n');if(child.exitCode===null)await new Promise(resolve=>child.once('exit',resolve));}
assert.ok((await stat(`${directory}/sensor_openbci_monitor.csv`)).size>100);assert.ok((await stat(`${directory}/sensor_mybeat_raw.csv`)).size>100);
