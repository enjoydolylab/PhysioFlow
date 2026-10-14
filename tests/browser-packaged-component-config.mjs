import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createProtocolGraph,addNode,connect} from '../src/core/index.js';
import {openTestBrowser} from './browser-harness.mjs';
const origin=process.env.PF_PACKAGE_ORIGIN;if(!origin)throw Error('PF_PACKAGE_ORIGIN required');
let protocol=createProtocolGraph({name:'Packaged configuration verification'});protocol.variables=[{name:'score',type:'number',scope:'protocol',defaultValue:0}];
let added=addNode(protocol,'logic.random',{id:'random_check',config:{probabilityA:0,probabilityB:0,probabilityC:1},layout:{x:200,y:100}});protocol=added.protocol;
const end=protocol.graph.nodes.find(n=>n.component.type==='core.end');for(const portId of ['a','b'])protocol=connect(protocol,'control',{nodeId:'random_check',portId},{nodeId:end.id,portId:'in'}).protocol;
added=addNode(protocol,'logic.loop',{id:'loop_check',config:{maxIterations:2,untilRule:{operator:'less_than',expected:''}},layout:{x:400,y:100}});protocol=added.protocol;protocol.graph.nodes.find(n=>n.id==='loop_check').bindings={until:{kind:'variable',variable:'score'}};
const browser=await openTestBrowser();
try{
 await browser.send('Page.navigate',{url:origin});await browser.waitFor('!!document.querySelector("main")','production ready');
 await browser.evaluate(`localStorage.setItem('physioflow.protocols.v1',${JSON.stringify(JSON.stringify([protocol]))});localStorage.setItem('physioflow.ui-language','en');location.reload()`);
 await browser.waitFor(`!!document.querySelector('.workspace-resume button')`,'stored draft');await browser.evaluate(`document.querySelector('.workspace-resume button').click()`);
 await browser.waitFor(`!!document.querySelector('[data-node-id="random_check"]')`,'production editor');
 await browser.evaluate(`document.querySelector('[data-node-id="random_check"]').click()`);
 await browser.waitFor(`document.querySelector('.composer-validation')?.textContent.includes('config.random_weight_total_invalid')`,'zero weights blocked');
 await browser.evaluate(`(()=>{const input=[...document.querySelectorAll('.composer-inspector label')].find(l=>l.textContent.startsWith('Probability of B')).querySelector('input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'');input.dispatchEvent(new Event('input',{bubbles:true}));})()`);
 await browser.waitFor(`!document.querySelector('.composer-validation').textContent.includes('config.random_weight_total_invalid')`,'default weight restored');
 await browser.evaluate(`document.querySelector('[data-node-id="loop_check"]').click()`);
 await browser.waitFor(`!![...document.querySelectorAll('.composer-inspector label')].find(l=>l.textContent.startsWith('Until rule value'))?.querySelector('input[type=number]')`,'typed loop number field');
 await browser.evaluate(`(()=>{const input=[...document.querySelectorAll('.composer-inspector label')].find(l=>l.textContent.startsWith('Until rule value')).querySelector('input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'0');input.dispatchEvent(new Event('input',{bubbles:true}));})()`);
 await browser.waitFor(`!document.querySelector('.composer-validation').textContent.includes('config.condition_expected_number')`,'loop zero clears error');
 const directory=process.env.PF_PACKAGE_ARTIFACTS||'artifacts/component-config-2026-10-15/package-beta17';await mkdir(directory,{recursive:true});await writeFile(directory+'/components.json',JSON.stringify({productionAssets:true,syntheticDraft:true,zeroConnectedWeightBlocked:true,blankRestoresDefaultWeight:true,loopTypedNumberInput:true,loopZeroCorrection:true},null,2));
 console.log('Production component configuration corrections passed');
}finally{await browser.close();}
