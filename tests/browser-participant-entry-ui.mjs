import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {openTestBrowser} from './browser-harness.mjs';
const browser=await openTestBrowser();
const directory='artifacts/entry-ui-2026-10-15';
try {
 await mkdir(directory,{recursive:true});
 for(const language of ['ja','zh','en']) {
  await browser.evaluate(`localStorage.setItem('physioflow.ui-language',${JSON.stringify(language)})`);
  await browser.send('Page.navigate',{url:browser.origin+'/participant'});
  await browser.waitFor(`!!document.querySelector('.participant-launch [role=alert] button')`,'missing token recovery');
  const text=await browser.evaluate('document.body.innerText');
  assert.ok(text.includes(language==='ja'?'実験担当者':language==='zh'?'实验员':'experimenter'));
  assert.ok(!text.includes('undefined'));
  await browser.evaluate(`document.querySelector('.participant-launch button').click()`);
  await browser.waitFor(`!!document.querySelector('.participant-launch [role=alert] button')`,'retry returns recoverable error');
 }
 await browser.evaluate(`localStorage.setItem('physioflow.ui-language','ja')`);
 await browser.send('Page.navigate',{url:browser.origin+'/participant'});
 await browser.waitFor(`document.documentElement.lang==='ja'&&!!document.querySelector('[role=alert]')`,'Japanese entry');
 await browser.send('Emulation.setDeviceMetricsOverride',{width:375,height:568,deviceScaleFactor:1,mobile:false});
 await browser.evaluate(`document.documentElement.classList.remove('light-mode');document.documentElement.classList.add('dark-mode')`);
 const dimensions=await browser.evaluate(`(()=>{const card=document.querySelector('.participant-launch>section');const r=card.getBoundingClientRect();return {left:r.left,right:r.right,scroll:document.documentElement.scrollWidth,width:innerWidth,background:getComputedStyle(card).backgroundColor};})()`);
 assert.ok(dimensions.left>=0&&dimensions.right<=375&&dimensions.scroll<=375);
 await browser.evaluate(`(async()=>{await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));await Promise.all(document.getAnimations().filter(a=>a.effect?.getTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})));})()`);
 const screenshot=await browser.send('Page.captureScreenshot',{format:'png'});await writeFile(directory+'/participant-dark.png',Buffer.from(screenshot.data,'base64'));
 await writeFile(directory+'/participant.json',JSON.stringify({localizedRecovery:['ja','zh','en'],retry:true,narrowNoHorizontalOverflow:true,dimensions},null,2));
 console.log('Participant entry localization, retry and narrow layout passed');
} finally {await browser.close();}
