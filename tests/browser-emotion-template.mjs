import assert from 'node:assert/strict';
import {openTestBrowser} from './browser-harness.mjs';
const browser=await openTestBrowser();
try{
 await browser.evaluate(`(async()=>{localStorage.setItem('physioflow.ui-language','ja');const React=(await import('/node_modules/.vite/deps/react.js')).default;const {createRoot}=(await import('/node_modules/.vite/deps/react-dom_client.js')).default;const {LanguageProvider}=await import('/src/i18n.jsx');const {default:Config}=await import('/src/EmotionTemplateConfig.jsx');const {createEmotionGraphTemplate}=await import('/src/core/taskTemplates.js');document.getElementById('root').style.display='none';const host=document.createElement('div');host.id='emotion-config';document.body.append(host);createRoot(host).render(React.createElement(LanguageProvider,null,React.createElement(Config,{onCreate:cfg=>{window.createdEmotion=createEmotionGraphTemplate(cfg);}})));})()`);
 await browser.waitFor(`!!document.querySelector('#emotion-config button')`,'loaded');await browser.evaluate(`document.querySelector('#emotion-config button').click()`);
 await browser.waitFor(`!!document.querySelector('#emotion-config input')`,'opened');
 assert.match(await browser.evaluate(`document.querySelector('#emotion-config').innerText`),/各条件の動画/);
 await browser.evaluate(`(()=>{const input=document.querySelector('#emotion-config input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'-1');input.dispatchEvent(new Event('input',{bubbles:true}));})()`);
 await browser.waitFor(`document.querySelector('#emotion-config button.primary').disabled`,'negative duration blocked');
 await browser.evaluate(`(()=>{const input=document.querySelector('#emotion-config input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'700');input.dispatchEvent(new Event('input',{bubbles:true}));})()`);
 await browser.waitFor(`!document.querySelector('#emotion-config button.primary').disabled`,'valid duration');await browser.evaluate(`document.querySelector('#emotion-config button.primary').click()`);
 await browser.waitFor(`!!window.createdEmotion`,'created');
 assert.equal(await browser.evaluate(`createdEmotion.graph.nodes.filter(n=>n.component.type==='stimulus.fixation'&&n.config.completion.durationMs===700).length`),5);
 console.log('Japanese emotion config: media guidance, invalid duration guard, five generated fixation settings passed');
}finally{await browser.close();}
