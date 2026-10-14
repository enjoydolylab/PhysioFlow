import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {openTestBrowser} from './browser-harness.mjs';
const browser=await openTestBrowser();
try{
 await browser.evaluate(`(async()=>{localStorage.setItem('physioflow.ui-language','ja');const React=(await import('/node_modules/.vite/deps/react.js')).default;const {createRoot}=(await import('/node_modules/.vite/deps/react-dom_client.js')).default;const {LanguageProvider}=await import('/src/i18n.jsx');const {default:Template}=await import('/src/TemplateConfig.jsx');const host=document.createElement('div');host.id='panel-ui';document.body.append(host);window.templateRoot=createRoot(host);templateRoot.render(React.createElement(LanguageProvider,null,React.createElement(Template,{label:'Go/No-Go',templateKey:'gonogo',onCreate:()=>new Promise(resolve=>window.finishCreation=resolve)})));})()`);
 await browser.waitFor(`!!document.querySelector('#panel-ui .template-launch>button')`,'trigger');await browser.evaluate(`document.querySelector('#panel-ui .template-launch>button').focus();document.querySelector('#panel-ui .template-launch>button').click()`);
 await browser.waitFor(`document.activeElement===document.querySelector('#panel-ui input')`,'focus enters form');
 await mkdir('artifacts/editor-ui-2026-10-15',{recursive:true});
 for(const [name,width,height,dark] of [['desktop',1440,900,false],['short',375,568,false],['dark',375,667,true]]){
  await browser.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
  await browser.evaluate(`document.documentElement.classList.toggle('dark-mode',${dark});document.body.classList.toggle('dark-mode',${dark});document.documentElement.classList.toggle('light-mode',${!dark});document.body.classList.toggle('light-mode',${!dark})`);
  const rect=await browser.evaluate(`(()=>{const panel=document.querySelector('#panel-ui [role=dialog]'),r=panel.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,overflow:panel.scrollWidth>panel.clientWidth+1};})()`);assert.ok(rect.left>=0&&rect.right<=width);assert.equal(rect.overflow,false);assert.ok(rect.top>=0&&rect.bottom<=height);
  await browser.evaluate(`(async()=>{await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));await Promise.all(document.getAnimations().filter(a=>a.effect?.getTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})));})()`);
  const screenshot=await browser.send('Page.captureScreenshot',{format:'png'});await writeFile('artifacts/editor-ui-2026-10-15/template-'+name+'.png',Buffer.from(screenshot.data,'base64'));
 }
 await browser.evaluate(`(()=>{const buttons=[...document.querySelector('#panel-ui [role=dialog]').querySelectorAll('button')];buttons.at(-1).focus();document.dispatchEvent(new KeyboardEvent('keydown',{key:'Tab',bubbles:true,cancelable:true}));})()`);
 assert.equal(await browser.evaluate(`document.activeElement===document.querySelector('#panel-ui [role=dialog] button')`),true);
 await browser.evaluate(`document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}))`);
 await browser.waitFor(`!document.querySelector('#panel-ui [role=dialog]')&&document.activeElement===document.querySelector('#panel-ui .template-launch>button')`,'escape restores focus');
 await browser.evaluate(`document.querySelector('#panel-ui .template-launch>button').click()`);await browser.waitFor(`!!document.querySelector('#panel-ui [role=dialog]')`,'reopen');
 await browser.evaluate(`document.querySelector('#panel-ui [role=dialog] button.primary').click()`);await browser.waitFor(`!!window.finishCreation`,'creation pending');
 await browser.evaluate(`document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}))`);assert.equal(await browser.evaluate(`!!document.querySelector('#panel-ui [role=dialog]')`),true);
 assert.equal(await browser.evaluate(`[...document.querySelector('#panel-ui [role=dialog]').querySelectorAll('input')].every(i=>i.disabled)`),true);
 await browser.evaluate(`finishCreation()`);await browser.waitFor(`!document.querySelector('#panel-ui [role=dialog]')`,'created');
 console.log('Template dialog: Japanese desktop/mobile layout, focus loop, Escape restoration and pending creation guard passed');
}finally{await browser.close();}
