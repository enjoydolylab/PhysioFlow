import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {openTestBrowser} from './browser-harness.mjs';
const browser=await openTestBrowser();
try {
 await browser.evaluate(`(async()=>{localStorage.setItem('physioflow.ui-language','en');const React=(await import('/node_modules/.vite/deps/react.js')).default;const {createRoot}=(await import('/node_modules/.vite/deps/react-dom_client.js')).default;const {LanguageProvider}=await import('/src/i18n.jsx');const {default:Builder}=await import('/src/ParticipantUiBuilder.jsx');window.Renderer=(await import('/src/ParticipantRenderer.jsx')).default;const core=await import('/src/core/index.js');window.numberSchema=core.participantUiTemplate('rating');const input=numberSchema.root.children.find(e=>e.type==='Input');window.inputId=input.id;input.props={...input.props,inputType:'number',min:3,max:2};document.getElementById('root').style.display='none';const host=document.createElement('div');host.id='number-design';document.body.append(host);window.numberRoot=createRoot(host);window.renderNumber=()=>numberRoot.render(React.createElement(LanguageProvider,null,React.createElement(Builder,{schema:numberSchema,onChange:next=>{numberSchema=next;renderNumber()}})));renderNumber();window.mountNumberRun=()=>{numberRoot.unmount();window.runRoot=createRoot(host);runRoot.render(React.createElement(LanguageProvider,null,React.createElement(Renderer,{schema:JSON.parse(JSON.stringify(numberSchema)),onSubmit:value=>window.numberSubmission=value})));};})()`);
 await browser.waitFor(`!!document.querySelector('.ui-screen-checks .ui-check-row button')`,'range issue');
 await browser.evaluate(`document.querySelector('.ui-screen-checks').open=true;document.querySelector('.ui-screen-checks .ui-check-row button').click()`);
 await browser.waitFor(`document.activeElement?.getAttribute('aria-label')==='Input minimum'`,'locate focuses minimum');
 const set=async(label,value)=>browser.evaluate(`(()=>{const input=document.querySelector('[aria-label="${label}"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,${JSON.stringify(value)});input.dispatchEvent(new Event('input',{bubbles:true}));})()`);
 await set('Input minimum','');
 await browser.waitFor(`numberSchema.root.children.find(e=>e.id===inputId).props.min===null`,'optional cleared');
 await set('Input minimum','-2.5');await set('Input maximum','2.5');
 await browser.waitFor(`!document.querySelector('.ui-screen-checks').textContent.includes('Input range needs attention')`,'corrected range');
 await browser.evaluate('mountNumberRun()');
 await browser.waitFor(`!!document.querySelector('#number-design input[type=number]')`,'runtime');
 assert.equal(await browser.evaluate(`document.querySelector('#number-design input').step`),'any');
 const enter=async value=>browser.evaluate(`(()=>{const input=document.querySelector('#number-design input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,${JSON.stringify(value)});input.dispatchEvent(new Event('input',{bubbles:true}));})()`);
 const submit=()=>browser.evaluate(`document.querySelector('#number-design .participant-ui-button').click()`);
 await enter('3');await submit();assert.equal(await browser.evaluate('Boolean(window.numberSubmission)'),false);
 await enter('0');await submit();await browser.waitFor(`!!window.numberSubmission`,'zero accepted');
 assert.equal(await browser.evaluate('Object.values(numberSubmission.values)[0]'),0);
 await enter('-1.5');await submit();await browser.waitFor(`Object.values(numberSubmission.values)[0]===-1.5`,'decimal accepted');
 await mkdir('artifacts/participant-design-stage',{recursive:true});await writeFile('artifacts/participant-design-stage/number-bounds.json',JSON.stringify({actualBuilder:true,rangeErrorLocateAndFocus:true,clearOptionalBound:true,serializedSchemaRuntime:true,outOfRangeBlocked:true,zeroAndDecimalAccepted:true},null,2));
 console.log('Number input design, error location, optional bounds and actual submission passed');
} finally {await browser.close();}
