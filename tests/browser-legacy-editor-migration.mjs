import assert from 'node:assert/strict';
import {isGraphProtocol} from '../src/core/index.js';
import {openTestBrowser} from './browser-harness.mjs';
const browser=await openTestBrowser();
try {
 await browser.evaluate(`(async()=>{localStorage.setItem('physioflow.ui-language','en');localStorage.setItem('physioflow.guide-seen.v1','1');const {protocol}=await import('/src/domain.js');const {saveProtocols}=await import('/src/storage.js');const original=protocol({name:'Legacy cleanup regression'});await saveProtocols([original]);localStorage.setItem('cleanup-original',JSON.stringify(original));location.reload()})()`);
 await browser.waitFor(`!!document.querySelector('.card-main')`,'legacy project');
 await browser.evaluate(`document.querySelector('.card-main').click()`);
 await browser.waitFor(`!!document.querySelector('.legacy-migration-notice')`,'migration notice');
 assert.equal(await browser.evaluate(`!!document.querySelector('.flow-overlay,.builder-grid')`),false);
 for(const width of [375,1280]) {
  await browser.send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
  assert.ok(await browser.evaluate(`document.documentElement.scrollWidth<=innerWidth+1`),'migration notice fits viewport');
 }
 await browser.evaluate(`document.querySelector('.legacy-migration-notice .primary').click()`);
 await browser.waitFor(`!!document.querySelector('.composer-v2')`,'converted current editor');
 const saved=await browser.evaluate(`(async()=>{const {loadProtocols}=await import('/src/storage.js');const protocols=await loadProtocols();return {protocols,original:JSON.parse(localStorage.getItem('cleanup-original'))}})()`);
 assert.equal(saved.protocols.length,2);
 assert.deepEqual(saved.protocols.find(p=>p.protocol_id===saved.original.protocol_id),saved.original);
 assert.ok(saved.protocols.some(p=>isGraphProtocol(p)),'graph draft saved');
 console.log('Legacy editor removal: migration entry, 375/1280 layout, current editor, preserved original and persisted graph draft passed');
} finally {await browser.close();}
