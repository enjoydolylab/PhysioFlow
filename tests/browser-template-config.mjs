import assert from 'node:assert/strict';
import {openTestBrowser} from './browser-harness.mjs';
const browser=await openTestBrowser();
try{
 await browser.evaluate(`(async()=>{
 localStorage.setItem('physioflow.ui-language','ja');const React=(await import('/node_modules/.vite/deps/react.js')).default;const {createRoot}=(await import('/node_modules/.vite/deps/react-dom_client.js')).default;
 const {LanguageProvider}=await import('/src/i18n.jsx');const {default:Template}=await import('/src/TemplateConfig.jsx');
 document.getElementById('root').style.display='none';const host=document.createElement('div');host.id='template-test';document.body.append(host);window.created=[];createRoot(host).render(React.createElement(LanguageProvider,null,React.createElement(Template,{label:'Stroop',templateKey:'stroop',onCreate:cfg=>window.created.push(cfg)})));
 })()`);
 await browser.waitFor(`!!document.querySelector('#template-test button')`,'template loaded');
 await browser.evaluate(`document.querySelector('#template-test button').click()`);
 await browser.waitFor(`!!document.querySelector('#template-test input[type=number]')`,'config opened');
 await browser.evaluate(`(()=>{const input=document.querySelector('#template-test input[type=number]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'5');input.dispatchEvent(new Event('input',{bubbles:true}));})()`);
 await browser.waitFor(`document.querySelector('#template-test button.primary').disabled`,'invalid count blocked');
 assert.equal(await browser.evaluate('created.length'),0);assert.match(await browser.evaluate(`document.querySelector('#template-test [role=alert]').textContent`),/4の倍数/);
 await browser.evaluate(`(()=>{const input=document.querySelector('#template-test input[type=number]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'20');input.dispatchEvent(new Event('input',{bubbles:true}));})()`);
 await browser.waitFor(`!document.querySelector('#template-test button.primary').disabled`,'valid count ready');
 assert.match(await browser.evaluate(`document.querySelector('#template-test [role=status]').textContent`),/本試行: 20.*練習試行: 8/);
 await browser.evaluate(`document.querySelector('#template-test button.primary').click()`);
 await browser.waitFor(`created.length===1&&!document.querySelector('#template-test input[type=number]')`,'created once');
 assert.equal((await browser.evaluate('created[0]')).trials,20);
 console.log('Japanese template configuration: invalid count rejected, summary shown, valid count created once');
}finally{await browser.close();}
