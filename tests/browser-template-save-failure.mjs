import assert from 'node:assert/strict';
import {openTestBrowser} from './browser-harness.mjs';
const browser=await openTestBrowser();
try{
 await browser.waitFor(`!!document.querySelector('.workspace-templates')`,'dashboard ready');
 await browser.evaluate(`document.querySelector('.workspace-templates').open=true;[...document.querySelectorAll('.workspace-templates button')].find(b=>['Emotion','感情','情绪'].includes(b.textContent.trim())).click()`);
 await browser.waitFor(`!!document.querySelector('.workspace-templates .setup-note button.primary')`,'emotion form opened');
 await browser.evaluate(`window.originalStorageSet=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key.startsWith('physioflow.'))throw Error('Injected template save failure');return originalStorageSet.call(this,key,value)};document.querySelector('.workspace-templates .setup-note button.primary').click()`);
 await browser.waitFor(`document.querySelector('.workspace-templates .setup-note [role=alert]')?.textContent.includes('Injected template save failure')`,'creation failure retained in form');
 assert.equal(await browser.evaluate(`document.querySelectorAll('.workspace-templates .setup-note input').length`),3);
 await browser.evaluate(`Storage.prototype.setItem=originalStorageSet`);
 console.log('Actual App template save failure propagates to configuration and keeps entered parameters');
}finally{await browser.close();}
