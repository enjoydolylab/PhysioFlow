import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {openTestBrowser} from './browser-harness.mjs';
const browser=await openTestBrowser();
try {
 await browser.send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 await browser.evaluate(`(async()=>{const core=await import('/src/core/index.js'),storage=await import('/src/storage.js');let protocol=core.createProtocolGraph({name:'Batch undo acceptance'});let edge=protocol.graph.edges[0].id;const ids=[];for(const [label,durationMs] of [['source',750],['target-a',1000],['target-b','']]){const result=core.insertNodeOnControlEdge(protocol,edge,'timing.wait',{label,config:{...core.createCoreComponentRegistry().get('timing.wait').defaultConfig,durationMs}});protocol=result.protocol;ids.push(result.node.id);edge=protocol.graph.edges.find(e=>e.source.nodeId===result.node.id).id;}protocol=core.createNodeGroup(protocol,ids,{name:'group'}).protocol;await storage.saveProtocols([protocol]);localStorage.setItem('physioflow.onboarding-v1','1');localStorage.setItem('physioflow.ui-language','ja');})()`);

 await browser.send('Page.reload');await browser.waitFor(`!!document.querySelector('.card-main')`,'dashboard');await browser.evaluate(`document.querySelector('.card-main').click()`);
 await browser.waitFor(`!!document.querySelector('.sequence-select')`,'editor');await browser.evaluate(`[...document.querySelectorAll('.sequence-select')].find(b=>b.textContent.includes('source')).click()`);
 await browser.waitFor(`!!document.querySelector('.group-batch-editor')`,'batch panel');
 assert.ok(await browser.evaluate(`document.querySelector('.composer-mode-description').textContent.includes('実験の流れ')`),'Japanese task description');
 assert.equal(await browser.evaluate(`document.querySelector('.composer-title').value`),'Batch undo acceptance','authored title preserved');
 assert.ok(await browser.evaluate(`[...document.querySelectorAll('.composer-palette section button b')].some(b=>b.textContent==='説明画面')`),'localized screen component');
 assert.ok(await browser.evaluate(`document.querySelector('.composer-mode-switch button').title.includes('基本設定')`),'localized mode tooltip');
 const directory='artifacts/editor-ui-2026-10-15';await mkdir(directory,{recursive:true});
 for(const [name,width,dark] of [['wide',1440,false],['narrow',960,false],['dark',1440,true]]) {
  await browser.send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});
  await browser.evaluate(`document.documentElement.classList.toggle('dark-mode',${dark});document.body.classList.toggle('dark-mode',${dark});document.documentElement.classList.toggle('light-mode',${!dark});document.body.classList.toggle('light-mode',${!dark})`);
  const dimensions=await browser.evaluate(`(()=>{const card=document.querySelector('.group-batch-editor');return {width:card.clientWidth,scrollWidth:card.scrollWidth,checkboxWidth:card.querySelector('input[type=checkbox]').getBoundingClientRect().width};})()`);
  assert.ok(dimensions.scrollWidth<=dimensions.width+2,name+' card overflow');assert.equal(dimensions.checkboxWidth,16);
  await browser.evaluate(`(async()=>{await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));await Promise.all(document.getAnimations().filter(animation=>animation.effect?.getTiming().iterations!==Infinity).map(animation=>animation.finished.catch(()=>{})));})()`);
  const screenshot=await browser.send('Page.captureScreenshot',{format:'png'});await writeFile(directory+'/'+name+'.png',Buffer.from(screenshot.data,'base64'));
 }
 console.log('Japanese editor UI: wide, narrow and dark screenshots; batch panel has no horizontal overflow');
} finally {await browser.close();}
