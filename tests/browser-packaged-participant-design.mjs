import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createProtocolGraph,insertNodeOnControlEdge,participantUiTemplate} from '../src/core/index.js';
import {openTestBrowser} from './browser-harness.mjs';
const origin=process.env.PF_PACKAGE_ORIGIN;if(!origin)throw Error('PF_PACKAGE_ORIGIN required');
const ui=participantUiTemplate('rating');ui.root.children.find(e=>e.type==='Input').props={name:'numeric_answer',label:'Numeric answer',inputType:'number',required:true,min:0,max:2};
let protocol=createProtocolGraph({name:'Production participant design check'});const added=insertNodeOnControlEdge(protocol,protocol.graph.edges[0].id,'display.screen',{config:{ui,completion:{mode:'manual'}}});protocol=added.protocol;const nodeId=added.node.id;
const browser=await openTestBrowser();
try {
 await browser.send('Page.navigate',{url:origin});await browser.waitFor('!!document.querySelector("main")','production ready');
 await browser.evaluate(`localStorage.setItem('physioflow.protocols.v1',${JSON.stringify(JSON.stringify([protocol]))});localStorage.setItem('physioflow.ui-language','ja');location.reload()`);
 await browser.waitFor(`!!document.querySelector('.workspace-resume button')`,'draft');await browser.evaluate(`document.querySelector('.workspace-resume button').click()`);
 await browser.waitFor(`!!document.querySelector('[data-node-id="${nodeId}"]')`,'editor');await browser.evaluate(`document.querySelector('[data-node-id="${nodeId}"] .sequence-select').click()`);
 await browser.waitFor(`!!document.querySelector('.edit-participant-ui')`,'screen editing');await browser.evaluate(`document.querySelector('.edit-participant-ui').click()`);
 await browser.waitFor(`!!document.querySelector('.ui-preview-btn')`,'builder');await browser.evaluate(`document.querySelector('.ui-preview-btn').click()`);
 await browser.waitFor(`!!document.querySelector('.ui-preview-tools')`,'preview');
 assert.equal(await browser.evaluate(`document.querySelector('.ui-builder-preview .participant-ui-button').disabled`),true);
 await browser.evaluate(`[...document.querySelectorAll('.ui-preview-tools button')].find(b=>b.textContent==='回答を試す').click()`);
 const submit=()=>browser.evaluate(`document.querySelector('.ui-builder-preview .participant-ui-button').click()`);
 await submit();await browser.waitFor(`document.querySelector('.ui-builder-preview input').getAttribute('aria-invalid')==='true'`,'required error');
 const enter=async value=>browser.evaluate(`(()=>{const input=document.querySelector('.ui-builder-preview input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,${JSON.stringify(value)});input.dispatchEvent(new Event('input',{bubbles:true}));})()`);
 await enter('3');await submit();assert.equal(await browser.evaluate(`!!document.querySelector('.ui-preview-result')`),false);
 await enter('0');await submit();await browser.waitFor(`!!document.querySelector('.ui-preview-result pre')`,'result');assert.equal(await browser.evaluate(`JSON.parse(document.querySelector('.ui-preview-result pre').textContent).numeric_answer`),0);
 await browser.evaluate(`[...document.querySelectorAll('.ui-preview-tools button')].find(b=>b.textContent==='回答をリセット').click()`);
 await browser.waitFor(`document.querySelector('.ui-builder-preview input').value===''&&!document.querySelector('.ui-preview-result')`,'reset');
 const directory=process.env.PF_PACKAGE_ARTIFACTS||'artifacts/participant-design-stage/package-beta19';await mkdir(directory,{recursive:true});await writeFile(directory+'/participant-design.json',JSON.stringify({productionAssets:true,syntheticDraft:true,actualScreenDesigner:true,previewDefaultDisabled:true,requiredAndRangeBlocked:true,zeroSubmission:true,reset:true},null,2));
 console.log('Production participant designer interactive preview passed');
}finally{await browser.close();}
