import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createProtocolGraph,insertNodeOnControlEdge,participantUiTemplate} from '../src/core/index.js';
import {openTestBrowser} from './browser-harness.mjs';
const origin=process.env.PF_PACKAGE_ORIGIN;if(!origin)throw Error('PF_PACKAGE_ORIGIN required');
let protocol=createProtocolGraph({name:'Production input library verification'});const added=insertNodeOnControlEdge(protocol,protocol.graph.edges[0].id,'display.screen',{config:{ui:participantUiTemplate('instruction'),completion:{mode:'manual'}}});protocol=added.protocol;const nodeId=added.node.id;
const browser=await openTestBrowser();
try {
 await browser.send('Page.navigate',{url:origin});await browser.waitFor('!!document.querySelector("main")','production ready');
 await browser.evaluate(`localStorage.setItem('physioflow.protocols.v1',${JSON.stringify(JSON.stringify([protocol]))});localStorage.setItem('physioflow.ui-language','en');location.reload()`);
 await browser.waitFor(`!!document.querySelector('.workspace-resume button')`,'draft');await browser.evaluate(`document.querySelector('.workspace-resume button').click()`);
 await browser.waitFor(`!!document.querySelector('[data-node-id="${nodeId}"] .sequence-select')`,'editor');await browser.evaluate(`document.querySelector('[data-node-id="${nodeId}"] .sequence-select').click()`);
 await browser.waitFor(`!!document.querySelector('.edit-participant-ui')`,'screen');await browser.evaluate(`document.querySelector('.edit-participant-ui').click()`);
 await browser.waitFor(`!!document.querySelector('[data-library-type=NumberInput]')`,'library');
 const names=[];
 for(const [kind,type] of [['NumberInput','number'],['SingleChoice','choice'],['MultipleChoice','multi_choice']]) {
  if(kind==='NumberInput') {
   await browser.evaluate(`document.querySelector('[data-library-type=NumberInput]').focus()`);
   await browser.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',text:'\r',windowsVirtualKeyCode:13});await browser.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
  } else await browser.evaluate(`document.querySelector('[data-library-type=${kind}]').click()`);
  await browser.waitFor(`[...document.querySelectorAll('.ui-inspector label')].find(l=>l.textContent.startsWith('Input type'))?.querySelector('select').value===${JSON.stringify(type)}`,'input preset '+type);
  names.push(await browser.evaluate(`[...document.querySelectorAll('.ui-inspector label')].find(l=>l.textContent.startsWith('Response name')).querySelector('input').value`));
 }
 assert.equal(new Set(names).size,3);
 await browser.evaluate(`document.querySelector('.ui-preview-btn').click()`);await browser.waitFor(`!!document.querySelector('.ui-preview-tools')`,'preview');
 await browser.evaluate(`[...document.querySelectorAll('.ui-preview-tools button')].find(b=>b.textContent==='Try answering').click()`);
 await browser.evaluate(`(()=>{const input=document.querySelector('.ui-builder-preview input[type=number]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'0');input.dispatchEvent(new Event('input',{bubbles:true}));})()`);
 await browser.evaluate(`(()=>{const select=document.querySelector('.ui-builder-preview select');select.value='1';select.dispatchEvent(new Event('change',{bubbles:true}));})()`);
 await browser.evaluate(`document.querySelector('.ui-builder-preview .participant-multi-choice input[value="2"]').click()`);
 await browser.evaluate(`document.querySelector('.ui-builder-preview .participant-ui-button').click()`);
 await browser.waitFor(`!!document.querySelector('.ui-preview-result pre')`,'result');
 assert.deepEqual(await browser.evaluate(`JSON.parse(document.querySelector('.ui-preview-result pre').textContent)`),{[names[0]]:0,[names[1]]:'1',[names[2]]:['2']});
 const directory=process.env.PF_PACKAGE_ARTIFACTS||'artifacts/participant-library-stage/package-beta22';await mkdir(directory,{recursive:true});await writeFile(directory+'/library.json',JSON.stringify({productionAssets:true,syntheticDraft:true,keyboardNumberInput:true,directChoiceAndMultiChoice:true,uniqueNames:true,previewPayloadTypes:true},null,2));
 console.log('Production input shortcuts, unique names and typed preview values passed');
}finally{await browser.close();}
