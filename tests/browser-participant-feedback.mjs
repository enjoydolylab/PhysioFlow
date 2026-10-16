import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {openTestBrowser} from './browser-harness.mjs';
const browser=await openTestBrowser();
try {
 await browser.evaluate(`(async()=>{localStorage.setItem('physioflow.ui-language','ja');const React=(await import('/node_modules/.vite/deps/react.js')).default;const {createRoot}=(await import('/node_modules/.vite/deps/react-dom_client.js')).default;const {LanguageProvider}=await import('/src/i18n.jsx');const {default:Renderer}=await import('/src/ParticipantRenderer.jsx');const core=await import('/src/core/index.js');const schema=core.participantUiTemplate('rating');schema.root.children=[core.createUiElement('Input',{props:{name:'text',label:'Text',inputType:'text',required:true}}),core.createUiElement('Input',{props:{name:'number',label:'Number',inputType:'number',required:true,min:0,max:2}}),core.createUiElement('Input',{props:{name:'rating',label:'Scale',inputType:'rating',required:true,min:0,max:2}}),core.createUiElement('Input',{props:{name:'confirm',label:'Confirm',inputType:'checkbox',required:true}}),core.createUiElement('Button',{props:{label:'Submit'},actions:[{event:'click',action:'submit'}]})];document.getElementById('root').style.display='none';const host=document.createElement('div');host.id='feedback-test';document.body.append(host);createRoot(host).render(React.createElement(LanguageProvider,null,React.createElement(Renderer,{schema,onSubmit:value=>window.feedbackSubmission=value})));})()`);
 await browser.waitFor(`!!document.querySelector('#feedback-test .participant-ui-button')`,'renderer');
 const submit=()=>browser.evaluate(`document.querySelector('#feedback-test .participant-ui-button').click()`);
 await submit();await browser.waitFor(`document.activeElement===document.querySelector('#feedback-test input[type=text]')`,'first error focus');
 assert.ok(await browser.evaluate(`(()=>{const input=document.activeElement;return input.getAttribute('aria-invalid')==='true'&&!!document.getElementById(input.getAttribute('aria-describedby'));})()`));
 const enter=async(type,value)=>browser.evaluate(`(()=>{const input=document.querySelector('#feedback-test input[type=${type}]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,${JSON.stringify(value)});input.dispatchEvent(new Event('input',{bubbles:true}));})()`);
 await enter('text','answer');await enter('number','3');
 await browser.waitFor(`document.querySelector('#feedback-test').textContent.includes('0から2')`,'localized range error');
 await browser.evaluate(`document.querySelector('#feedback-test .participant-rating button').focus()`);
 await browser.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',text:'\r',unmodifiedText:'\r',windowsVirtualKeyCode:13});await browser.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
 await browser.waitFor(`document.querySelector('#feedback-test .participant-rating button').getAttribute('aria-pressed')==='true'`,'keyboard zero selected');
 await browser.evaluate(`document.querySelector('#feedback-test input[type=checkbox]').click()`);
 await submit();await browser.waitFor(`document.activeElement===document.querySelector('#feedback-test input[type=number]')`,'first remaining error focused');
 assert.equal(await browser.evaluate('Boolean(window.feedbackSubmission)'),false);
 await enter('number','0');await browser.waitFor(`!document.querySelector('#feedback-test [role=alert]')`,'corrected errors cleared before resubmit');
 await submit();await browser.waitFor('!!window.feedbackSubmission','successful submission');
 assert.deepEqual(await browser.evaluate('feedbackSubmission.values'),{text:'answer',number:0,rating:0,confirm:'yes'});
 await mkdir('artifacts/participant-design-stage',{recursive:true});await writeFile('artifacts/participant-design-stage/feedback.json',JSON.stringify({actualRenderer:true,firstErrorFocus:true,linkedErrors:true,japaneseRangeMessage:true,immediateCorrectionFeedback:true,ratingKeyboardAndPressedState:true,zeroAndCheckboxPayloadPreserved:true},null,2));
 console.log('Participant error focus, live correction, keyboard rating and submission passed');
}finally{await browser.close();}
