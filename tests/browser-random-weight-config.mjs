import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {openTestBrowser} from './browser-harness.mjs';
const browser=await openTestBrowser();
try {
 await browser.evaluate(`(async()=>{localStorage.setItem('physioflow.ui-language','en');const React=(await import('/node_modules/.vite/deps/react.js')).default;const {createRoot}=(await import('/node_modules/.vite/deps/react-dom_client.js')).default;const {LanguageProvider}=await import('/src/i18n.jsx');const {default:Composer}=await import('/src/ComposerV2.jsx');const core=await import('/src/core/index.js');const result=core.addNode(core.createProtocolGraph(),'logic.random',{config:{probabilityA:0,probabilityB:0.4,probabilityC:1}});window.weightProtocol=result.protocol;window.weightId=result.node.id;const end=weightProtocol.graph.nodes.find(n=>n.component.type==='core.end');for(const portId of ['a','b'])weightProtocol=core.connect(weightProtocol,'control',{nodeId:weightId,portId},{nodeId:end.id,portId:'in'}).protocol;document.getElementById('root').style.display='none';const host=document.createElement('div');host.id='weight-test';document.body.append(host);const root=createRoot(host);window.renderWeights=()=>root.render(React.createElement(LanguageProvider,null,React.createElement(Composer,{protocol:weightProtocol,onChange:next=>{weightProtocol=next;renderWeights()}})));renderWeights();window.setWeight=value=>{const label=[...document.querySelectorAll('#weight-test .composer-inspector label')].find(l=>l.textContent.startsWith('Probability of B'));const input=label.querySelector('input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,value);input.dispatchEvent(new Event('input',{bubbles:true}));};})()`);
 await browser.waitFor(`!!document.querySelector('#weight-test [data-node-id="'+weightId+'"]')`,'random node');
 await browser.evaluate(`document.querySelector('#weight-test [data-node-id="'+weightId+'"]').click()`);
 await browser.waitFor(`[...document.querySelectorAll('#weight-test .composer-inspector label')].some(l=>l.textContent.startsWith('Probability of B'))`,'weight field');
 await browser.evaluate(`setWeight('')`);
 await browser.waitFor(`weightProtocol.graph.nodes.find(n=>n.id===weightId).config.probabilityB===null`,'blank returns default');
 await browser.evaluate(`setWeight('0')`);
 await browser.waitFor(`weightProtocol.graph.nodes.find(n=>n.id===weightId).config.probabilityB===0`,'zero retained');
 assert.ok(!await browser.evaluate(`document.querySelector('#weight-test .composer-validation').textContent.includes('config.random_probability_invalid')`));
 await browser.waitFor(`document.querySelector('#weight-test .composer-validation').textContent.includes('config.random_weight_total_invalid')`,'zero connected total blocked');
 await browser.evaluate(`setWeight('1')`);
 await browser.waitFor(`!document.querySelector('#weight-test .composer-validation').textContent.includes('config.random_weight_total_invalid')`,'positive connected total clears issue');
 await mkdir('artifacts/component-config-2026-10-15',{recursive:true});await writeFile('artifacts/component-config-2026-10-15/random-weights.json',JSON.stringify({actualComposer:true,blankOptionalWeightStoredNull:true,explicitZeroRetained:true,zeroConnectedTotalBlocked:true,unconnectedPositiveWeightIgnored:true,positiveConnectedWeightClearsIssue:true},null,2));
 console.log('Actual random editor: blank restores default and explicit zero stays zero');
} finally {await browser.close();}
