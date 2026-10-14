import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {openTestBrowser} from './browser-harness.mjs';
const origin=process.env.PF_PACKAGE_ORIGIN;if(!origin)throw Error('Package origin required');
const browser=await openTestBrowser();
try{
 await browser.send('Page.navigate',{url:origin});await browser.waitFor(`!!document.querySelector('.workspace-templates')`,'production dashboard');
 await browser.evaluate(`document.querySelector('.workspace-templates').open=true;[...document.querySelectorAll('.workspace-templates button')].find(b=>['Emotion','感情','情绪'].includes(b.textContent.trim())).click()`);
 await browser.waitFor(`!!document.querySelector('.workspace-templates .setup-note input')`,'packaged emotion configuration');
 await browser.evaluate(`(()=>{const input=document.querySelector('.workspace-templates .setup-note input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'700');input.dispatchEvent(new Event('input',{bubbles:true}));})()`);
 await browser.evaluate(`document.querySelector('.workspace-templates .setup-note button.primary').click()`);
 await browser.waitFor(`!!document.querySelector('.composer-layout')`,'created draft opened in editor');
 const stored=await browser.evaluate(`Object.keys(localStorage).filter(k=>k.startsWith('physioflow.')).map(k=>localStorage.getItem(k)).filter(v=>v?.includes('"durationMs":700'))`);assert.ok(stored.length,'configured duration persisted by actual packaged app');
 await browser.send('Page.navigate',{url:origin});await browser.waitFor(`!!document.querySelector('.workspace-templates')`,'return to production dashboard');
 await browser.evaluate(`document.querySelector('.workspace-templates').open=true;[...document.querySelectorAll('.workspace-templates button')].find(b=>['Emotion','感情','情绪'].includes(b.textContent.trim())).click()`);
 await browser.waitFor(`!!document.querySelector('.workspace-templates .setup-note button.primary')`,'second template configuration');
 await browser.evaluate(`document.querySelector('.workspace-templates .setup-note button.primary').click()`);
 await browser.waitFor(`!!document.querySelector('.composer-layout')`,'second draft opened');
 const projects=await browser.evaluate(`JSON.parse(localStorage.getItem('physioflow.protocols.v1'))`);
 assert.equal(projects.length,2);assert.equal(new Set(projects.map(p=>p.protocolId)).size,2);
 assert.ok(projects.some(p=>p.graph.nodes.some(n=>n.config?.completion?.durationMs===700)),'first template config retained');
 const directory=process.env.PF_PACKAGE_ARTIFACTS || 'artifacts/editor-progression-2026-10-14/package-beta11';await mkdir(directory,{recursive:true});await writeFile(`${directory}/template.json`,JSON.stringify({productionAssets:true,templateConfiguration:true,createdDraftOpensEditor:true,configuredDurationPersisted:true,repeatedTemplatesIndependent:true,projects:2},null,2));
 console.log('Packaged template configured, saved and opened in editor');
}finally{await browser.close();}
