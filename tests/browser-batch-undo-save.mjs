import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {openTestBrowser} from './browser-harness.mjs';
const browser=await openTestBrowser();
try{
 await browser.evaluate(`(async()=>{const core=await import('/src/core/index.js'),storage=await import('/src/storage.js');let protocol=core.createProtocolGraph({name:'Batch undo acceptance'});let edge=protocol.graph.edges[0].id;const ids=[];for(const [label,durationMs] of [['source',750],['target-a',1000],['target-b',2000]]){const result=core.insertNodeOnControlEdge(protocol,edge,'timing.wait',{label,config:{...core.createCoreComponentRegistry().get('timing.wait').defaultConfig,durationMs}});protocol=result.protocol;ids.push(result.node.id);edge=protocol.graph.edges.find(e=>e.source.nodeId===result.node.id).id;}protocol=core.createNodeGroup(protocol,ids,{name:'group'}).protocol;await storage.saveProtocols([protocol]);localStorage.setItem('physioflow.onboarding-v1','1');localStorage.setItem('physioflow.ui-language','en');})()`);
 await browser.send('Page.reload');await browser.waitFor(`!!document.querySelector('.card-main')`,'saved project loaded');await browser.evaluate(`document.querySelector('.card-main').click()`);
 await browser.waitFor(`!!document.querySelector('.composer-layout')`,'actual editor');
 await browser.evaluate(`[...document.querySelectorAll('.sequence-select')].find(b=>b.textContent.includes('source')).click()`);
 await browser.waitFor(`document.querySelectorAll('.inspector-card[aria-label="Apply content within group"] input[type=checkbox]').length===2`,'batch targets');
 await browser.evaluate(`window.realDateNow=Date.now;Date.now=()=>1700000000000;document.querySelectorAll('.inspector-card[aria-label="Apply content within group"] input[type=checkbox]')[1].click()`);
 const batch=()=>browser.evaluate(`[...document.querySelectorAll('.inspector-card[aria-label="Apply content within group"] button')].find(b=>b.textContent.includes('Apply to selected nodes')).click()`);
 const save=async(expected)=>{await browser.evaluate(`[...document.querySelectorAll('.header-tools button')].find(b=>['Save','Saved'].includes(b.textContent.replace('✓','').trim())).click()`);await browser.waitFor(`JSON.parse(localStorage.getItem('physioflow.protocols.v1'))[0].graph.nodes.find(n=>n.label==='target-a').config.durationMs===${expected}`,'batch persisted '+expected);};
 await batch();await save(750);
 await browser.evaluate(`(()=>{const input=[...document.querySelectorAll('.composer-inspector label')].find(l=>l.textContent.includes('Duration (ms)')).querySelector('input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'900');input.dispatchEvent(new Event('input',{bubbles:true}));})()`);
 await browser.waitFor(`document.querySelector('.inspector-card[aria-label="Apply content within group"]').textContent.includes('900 ms')`,'source changed');await batch();await save(900);
 const undo=()=>browser.evaluate(`[...document.querySelectorAll('.header-tools button')].find(b=>b.textContent.includes('Undo')).click()`);
 await undo();await save(750);await undo();await save(1000);
 const redo=()=>browser.evaluate(`[...document.querySelectorAll('.header-tools button')].find(b=>b.textContent.includes('Redo')).click()`);
 await redo();await save(750);await redo();await save(900);
 await undo();await save(750);
 await browser.evaluate(`(()=>{const input=[...document.querySelectorAll('.composer-inspector label')].find(l=>l.textContent.includes('Duration (ms)')).querySelector('input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'850');input.dispatchEvent(new Event('input',{bubbles:true}));})()`);
 await browser.waitFor(`[...document.querySelectorAll('.header-tools button')].find(b=>b.textContent.includes('Redo')).disabled`,'new branch clears redo inside old throttle window');
 await batch();await save(850);
 const saved=await browser.evaluate(`JSON.parse(localStorage.getItem('physioflow.protocols.v1'))[0]`);assert.equal(saved.graph.nodes.find(n=>n.label==='target-b').config.durationMs,2000);
 await browser.evaluate(`Date.now=realDateNow`);await browser.send('Page.reload');await browser.waitFor(`!!document.querySelector('.card-main')`,'saved batch survives reload');
 const reloaded=await browser.evaluate(`JSON.parse(localStorage.getItem('physioflow.protocols.v1'))[0]`);assert.equal(reloaded.graph.nodes.find(n=>n.label==='target-a').config.durationMs,850);assert.equal(reloaded.graph.nodes.find(n=>n.label==='target-b').config.durationMs,2000);
 await mkdir('artifacts/editor-progression-2026-10-14',{recursive:true});await writeFile('artifacts/editor-progression-2026-10-14/batch-undo-save.json',JSON.stringify({actualApp:true,twoBatchesInsideThrottleWindow:true,separateUndoRedo:true,newBranchClearsRedo:true,persistenceAndReload:true,unselectedTargetUnchanged:true},null,2));console.log('Actual App batch actions remain separate inside throttle window, undo/redo and storage reload passed');
}finally{await browser.close();}
