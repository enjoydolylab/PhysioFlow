import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {openTestBrowser} from './browser-harness.mjs';
const browser=await openTestBrowser();
try {
 await browser.evaluate(`(async()=>{localStorage.setItem('physioflow.ui-language','ja');const React=(await import('/node_modules/.vite/deps/react.js')).default;const {createRoot}=(await import('/node_modules/.vite/deps/react-dom_client.js')).default;const {LanguageProvider}=await import('/src/i18n.jsx');const {default:Builder}=await import('/src/ParticipantUiBuilder.jsx');window.core=await import('/src/core/index.js');window.nameSchema=core.participantUiTemplate('rating');const first=nameSchema.root.children.find(e=>e.type==='Input');first.props.name='answer';window.firstInputId=first.id;const second=core.createUiElement('Input',{props:{name:'answer',label:'Second number',inputType:'number',min:2,max:1}});window.secondInputId=second.id;nameSchema.root.children.splice(-1,0,second);document.getElementById('root').style.display='none';const host=document.createElement('div');host.id='name-test';document.body.append(host);const root=createRoot(host);window.renderName=()=>root.render(React.createElement(LanguageProvider,null,React.createElement(Builder,{schema:nameSchema,onChange:next=>{nameSchema=next;renderName()}})));renderName();})()`);
 await browser.waitFor(`document.querySelectorAll('.ui-check-row[data-issue-code]').length===2`,'two issues on one input');
 assert.ok(await browser.evaluate(`document.querySelector('[data-issue-code="ui.input_name_duplicate"]').textContent.includes('異なる回答名')`));
 await browser.evaluate(`document.querySelector('.ui-preview-btn').click()`);await browser.waitFor(`!!document.querySelector('.ui-builder-preview')`,'invalid preview');
 await browser.evaluate(`document.querySelector('.ui-screen-checks').open=true;document.querySelector('[data-issue-code="ui.input_name_duplicate"] button').click()`);
 await browser.waitFor(`!document.querySelector('.ui-builder-preview')&&document.activeElement?.getAttribute('aria-label')==='Response name'`,'locate returns to correct field');
 assert.ok(await browser.evaluate(`document.querySelector('[aria-label="Response name"]').closest('label').textContent.startsWith('回答名')`));
 const enter=async(label,value)=>browser.evaluate(`(()=>{const input=document.querySelector('[aria-label="${label}"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,${JSON.stringify(value)});input.dispatchEvent(new Event('input',{bubbles:true}));})()`);
 await enter('Response name','');await browser.waitFor(`!!document.querySelector('[data-issue-code="ui.input_name_missing"]')`,'missing name surfaced');
 await enter('Response name','second_answer');await browser.waitFor(`!document.querySelector('[data-issue-code="ui.input_name_missing"]')&&!document.querySelector('[data-issue-code="ui.input_name_duplicate"]')`,'name corrected');
 assert.ok(await browser.evaluate(`!!document.querySelector('[data-issue-code="ui.number_range_invalid"]')`));
 await enter('Input minimum','0');await browser.waitFor(`core.validateParticipantUi(nameSchema).valid`,'all issues fixed');
 assert.equal(await browser.evaluate(`nameSchema.root.children.find(e=>e.id===firstInputId).props.name`),'answer');
 assert.equal(await browser.evaluate(`nameSchema.root.children.find(e=>e.id===secondInputId).props.name`),'second_answer');
 await browser.evaluate(`document.querySelector('[title="Undo (Ctrl+Z)"]').click()`);await browser.waitFor(`!!document.querySelector('[data-issue-code="ui.number_range_invalid"]')`,'undo restores range issue');
 await browser.evaluate(`document.querySelector('[title="Redo (Ctrl+Shift+Z)"]').click()`);await browser.waitFor('core.validateParticipantUi(nameSchema).valid','redo restores valid state');
 await mkdir('artifacts/participant-name-stage',{recursive:true});await writeFile('artifacts/participant-name-stage/browser.json',JSON.stringify({actualBuilder:true,sameElementMultipleIssues:true,japaneseGuidance:true,locateFromPreview:true,missingAndDuplicateCorrection:true,otherFieldIssueRetained:true,originalInputUnchanged:true,undoRedo:true},null,2));
 console.log('Participant response-name error location, independent issues and undo/redo passed');
}finally{await browser.close();}
