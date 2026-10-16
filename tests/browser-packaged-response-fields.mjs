import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createProtocolGraph,insertNodeOnControlEdge,participantUiTemplate,createUiElement} from '../src/core/index.js';
import {openTestBrowser} from './browser-harness.mjs';
const origin=process.env.PF_PACKAGE_ORIGIN;if(!origin)throw Error('PF_PACKAGE_ORIGIN required');
const ui=participantUiTemplate('instruction');const first=createUiElement('Input',{props:{name:'true',label:'First',inputType:'choice',options:[{value:'false',label:'False label'},{value:'0',label:'Zero'}]}});const second=createUiElement('Input',{props:{name:'true',label:'Second',inputType:'number',min:2,max:1}});ui.root.children.push(first,second);
let protocol=createProtocolGraph({name:'Production response-field verification'});const added=insertNodeOnControlEdge(protocol,protocol.graph.edges[0].id,'display.screen',{config:{ui,completion:{mode:'manual'}}});protocol=added.protocol;const nodeId=added.node.id;
const browser=await openTestBrowser();
try {
 await browser.send('Page.navigate',{url:origin});await browser.waitFor('!!document.querySelector("main")','production ready');
 await browser.evaluate(`localStorage.setItem('physioflow.protocols.v1',${JSON.stringify(JSON.stringify([protocol]))});localStorage.setItem('physioflow.ui-language','ja');location.reload()`);
 await browser.waitFor(`!!document.querySelector('.workspace-resume button')`,'draft');await browser.evaluate(`document.querySelector('.workspace-resume button').click()`);
 await browser.waitFor(`!!document.querySelector('[data-node-id="${nodeId}"] .sequence-select')`,'editor');await browser.evaluate(`document.querySelector('[data-node-id="${nodeId}"] .sequence-select').click()`);
 await browser.waitFor(`!!document.querySelector('.edit-participant-ui')`,'screen');await browser.evaluate(`document.querySelector('.edit-participant-ui').click()`);
 await browser.waitFor(`document.querySelectorAll('.ui-check-row[data-issue-code]').length===2`,'independent issues');
 await browser.evaluate(`document.querySelector('.ui-screen-checks').open=true;document.querySelector('[data-issue-code="ui.input_name_duplicate"] button').click()`);
 await browser.waitFor(`document.activeElement?.getAttribute('aria-label')==='Response name'`,'response-name focus');
 const enter=async(label,value)=>browser.evaluate(`(()=>{const input=document.querySelector('[aria-label="${label}"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,${JSON.stringify(value)});input.dispatchEvent(new Event('input',{bubbles:true}));})()`);
 await enter('Response name','second_value');await enter('Input minimum','0');
 await browser.waitFor(`!document.querySelector('.ui-check-row[data-issue-code]')`,'fixed');
 await browser.evaluate(`document.querySelector('.ui-response-fields').open=true`);
 assert.deepEqual(await browser.evaluate(`[...document.querySelectorAll('.ui-response-field>div:first-child>code')].map(e=>e.textContent)`),['true','second_value']);
 assert.deepEqual(await browser.evaluate(`[...document.querySelectorAll('.ui-response-values code')].map(e=>e.textContent)`),['false','0']);
 await browser.evaluate(`document.querySelector('.ui-preview-btn').click()`);await browser.waitFor(`!!document.querySelector('.ui-builder-preview')`,'preview');
 await browser.evaluate(`document.querySelector('[data-response-field="${first.id}"] button').click()`);
 await browser.waitFor(`!document.querySelector('.ui-builder-preview')&&document.activeElement?.getAttribute('aria-label')==='Response name'`,'configure from preview');assert.equal(await browser.evaluate('document.activeElement.value'),'true');
 const directory=process.env.PF_PACKAGE_ARTIFACTS||'artifacts/participant-name-stage/package-beta23';await mkdir(directory,{recursive:true});await writeFile(directory+'/fields.json',JSON.stringify({productionAssets:true,syntheticDraft:true,multipleIssuesOnOneElement:true,duplicateNameAndRangeCorrection:true,rawNamesAndValuesInJapanese:true,configureFromPreview:true},null,2));
 console.log('Production response field overview, raw values and targeted repairs passed');
}finally{await browser.close();}
