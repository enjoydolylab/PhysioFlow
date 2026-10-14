import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createProtocolGraph,addNode,connect} from '../src/core/index.js';
import {openTestBrowser} from './browser-harness.mjs';
const origin=process.env.PF_PACKAGE_ORIGIN;if(!origin)throw Error('PF_PACKAGE_ORIGIN required');
let protocol=createProtocolGraph({name:'Packaged dynamic comparison'});protocol.variables=[{name:'score',type:'number',scope:'session',defaultValue:null}];
const start=protocol.graph.nodes.find(n=>n.component.type==='core.start'),end=protocol.graph.nodes.find(n=>n.component.type==='core.end');protocol.graph.edges=[];
protocol=addNode(protocol,'logic.condition',{id:'dynamic_check',config:{operator:'less_than',expected:1}}).protocol;protocol.graph.nodes.find(n=>n.id==='dynamic_check').bindings={value:{kind:'variable',variable:'score'}};
protocol=addNode(protocol,'core.end',{id:'false_end'}).protocol;
for(const [source,port,target] of [[start.id,'next','dynamic_check'],['dynamic_check','true',end.id],['dynamic_check','false','false_end']])protocol=connect(protocol,'control',{nodeId:source,portId:port},{nodeId:target,portId:'in'}).protocol;
const browser=await openTestBrowser();
try{
 await browser.send('Page.navigate',{url:origin});await browser.waitFor('!!document.querySelector("main")','production ready');
 await browser.evaluate(`localStorage.setItem('physioflow.protocols.v1',${JSON.stringify(JSON.stringify([protocol]))});localStorage.setItem('physioflow.ui-language','en');location.reload()`);
 await browser.waitFor(`!!document.querySelector('.workspace-resume button')`,'stored draft');await browser.evaluate(`document.querySelector('.workspace-resume button').click()`);
 await browser.waitFor(`!!document.querySelector('.composer-header')`,'production editor');
 const click=label=>browser.evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===${JSON.stringify(label)}).click()`);
 await click('Preview run');await browser.waitFor(`!!document.querySelector('#participant-id')`,'preparation');
 await browser.evaluate(`(()=>{const input=document.querySelector('#participant-id');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'SYNTHETIC_DYNAMIC');input.dispatchEvent(new Event('input',{bubbles:true}));})()`);
 await click('Continue to test run');await browser.waitFor(`!![...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Begin experiment')`,'ready');await click('Begin experiment');
 await browser.waitFor(`document.body.innerText.includes('The actual comparison value must be a finite number')`,'invalid input stops production run');
 assert.ok(await browser.evaluate(`document.body.innerText.includes('Experiment stopped')`));
 const directory=process.env.PF_PACKAGE_ARTIFACTS||'artifacts/condition-execution-2026-10-15/package-beta18';await mkdir(directory,{recursive:true});await writeFile(directory+'/dynamic.json',JSON.stringify({productionAssets:true,syntheticDraft:true,invalidDynamicInputStopsRun:true,operatorGuidance:true},null,2));
 console.log('Production dynamic comparison failure and guidance passed');
}finally{await browser.close();}
