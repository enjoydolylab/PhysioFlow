import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {openTestBrowser} from './browser-harness.mjs';
const browser=await openTestBrowser();
try {
 await browser.evaluate(`(async()=>{localStorage.setItem('physioflow.ui-language','ja');const React=(await import('/node_modules/.vite/deps/react.js')).default;const {createRoot}=(await import('/node_modules/.vite/deps/react-dom_client.js')).default;const {LanguageProvider,LanguageToggle}=await import('/src/i18n.jsx');const {default:Builder}=await import('/src/ParticipantUiBuilder.jsx');const core=await import('/src/core/index.js');window.fieldsSchema=core.participantUiTemplate('instruction');const single=core.createUiElement('Input',{props:{name:'true',label:'One',inputType:'choice',required:true,options:[{value:'false',label:'False label'},{value:'0',label:'Zero'}]}});const multi=core.createUiElement('Input',{props:{name:'Response',label:'Many',inputType:'multi_choice',required:false,options:[{value:'true',label:'True label'}]}});window.singleFieldId=single.id;window.multiFieldId=multi.id;fieldsSchema.root.children.push(single,multi);document.getElementById('root').style.display='none';const host=document.createElement('div');host.id='fields-test';document.body.append(host);const root=createRoot(host);window.renderFields=()=>root.render(React.createElement(LanguageProvider,null,React.createElement(LanguageToggle),React.createElement(Builder,{schema:fieldsSchema,onChange:next=>{fieldsSchema=next;renderFields()}})));renderFields();})()`);
 await browser.waitFor(`document.querySelectorAll('.ui-response-field').length===2`,'field list');
 await browser.evaluate(`document.querySelector('.ui-response-fields').open=true;window.fieldsBefore=JSON.stringify(fieldsSchema)`);
 for(const language of ['中文','EN','日本語']) {
  await browser.evaluate(`[...document.querySelectorAll('#fields-test .language-toggle button')].find(b=>b.textContent===${JSON.stringify(language)}).click()`);
  await browser.waitFor(`document.documentElement.lang===${JSON.stringify(language==='中文'?'zh-CN':language==='EN'?'en':'ja')}`,'language switched');
  assert.deepEqual(await browser.evaluate(`[...document.querySelectorAll('.ui-response-field>div:first-child>code')].map(e=>e.textContent)`),['true','Response']);
  assert.deepEqual(await browser.evaluate(`[...document.querySelectorAll('.ui-response-values code')].map(e=>e.textContent)`),['false','0','true']);
 }
 assert.ok(await browser.evaluate(`document.querySelector('[data-response-field="'+multiFieldId+'"] small').textContent.includes('複数選択')&&document.querySelector('[data-response-field="'+multiFieldId+'"] small').textContent.includes('任意')`));
 assert.equal(await browser.evaluate('JSON.stringify(fieldsSchema)===fieldsBefore'),true);
 await browser.evaluate(`document.querySelector('.ui-preview-btn').click()`);await browser.waitFor(`!!document.querySelector('.ui-builder-preview')`,'preview');
 await browser.evaluate(`document.querySelector('[data-response-field="'+multiFieldId+'"] button').click()`);
 await browser.waitFor(`!document.querySelector('.ui-builder-preview')&&document.activeElement?.getAttribute('aria-label')==='Response name'`,'configure returns to field');
 assert.equal(await browser.evaluate('document.activeElement.value'),'Response');
 await browser.evaluate(`(()=>{const input=document.activeElement;Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'renamed_field');input.dispatchEvent(new Event('input',{bubbles:true}));})()`);
 await browser.waitFor(`document.querySelector('[data-response-field="'+multiFieldId+'"]>div>code').textContent==='renamed_field'`,'overview updated');
 await mkdir('artifacts/participant-name-stage',{recursive:true});
 for(const width of [1280,375]) {
  await browser.send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
  assert.ok(await browser.evaluate(`(()=>{const panel=document.querySelector('.ui-response-fields');return panel.scrollWidth<=panel.clientWidth+1})()`),'field panel fits');
  await browser.evaluate(`(async()=>{document.querySelector('.ui-response-fields').scrollIntoView({block:'center'});await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));})()`);
  const shot=await browser.send('Page.captureScreenshot',{format:'png'});await writeFile(`artifacts/participant-name-stage/fields-${width}.png`,Buffer.from(shot.data,'base64'));
 }
 await mkdir('artifacts/participant-name-stage',{recursive:true});await writeFile('artifacts/participant-name-stage/fields.json',JSON.stringify({actualBuilder:true,inputNamesTypesAndOptions:true,rawNamesAndRecordedValuesAcrossThreeLanguages:true,noSchemaMutationByViewing:true,configureFromPreview:true,liveNameUpdates:true,narrowNoOverflow:true},null,2));
 console.log('Response field overview preserves raw names/values and locates editable fields');
}finally{await browser.close();}
