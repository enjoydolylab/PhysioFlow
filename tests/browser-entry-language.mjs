import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {openTestBrowser} from './browser-harness.mjs';
const browser=await openTestBrowser();
try {
 await browser.evaluate(`(async()=>{const React=(await import('/node_modules/.vite/deps/react.js')).default;const {createRoot}=(await import('/node_modules/.vite/deps/react-dom_client.js')).default;const {LanguageProvider,LanguageToggle}=await import('/src/i18n.jsx');const host=document.createElement('div');host.id='entry-language';document.body.append(host);createRoot(host).render(React.createElement(LanguageProvider,null,React.createElement(LanguageToggle),React.createElement('p',null,'New protocol')));})()`);
 await browser.waitFor(`!!document.querySelector('#entry-language .language-toggle')`,'language controls');
 const errors=[];
 await browser.send('Runtime.enable');
 await browser.evaluate(`window.entryErrors=[];window.addEventListener('error',e=>entryErrors.push(e.message))`);
 for(const [label,lang] of [['EN','en'],['中文','zh-CN'],['日本語','ja'],['EN','en']]) {
  await browser.evaluate(`(()=>{const button=[...document.querySelectorAll('#entry-language .language-toggle button')].find(b=>b.textContent===${JSON.stringify(label)});if(!button)throw Error('Language control missing');button.click()})()`);
  await browser.waitFor(`document.documentElement.lang===${JSON.stringify(lang)}`,'document language '+lang);
  if(lang==='en')await browser.waitFor(`document.querySelector('#entry-language p').textContent==='New protocol'`,'English translation restored');
 }
 errors.push(...await browser.evaluate('entryErrors'));assert.deepEqual(errors,[]);
 const icons=await browser.evaluate(`(async()=>{const manifest=await fetch('/manifest.json').then(r=>r.json());return Promise.all(manifest.icons.map(async icon=>{const response=await fetch('/'+icon.src);const bitmap=await createImageBitmap(await response.blob());return {status:response.status,width:bitmap.width,height:bitmap.height,sizes:icon.sizes};}))})()`);
 for(const icon of icons){assert.equal(icon.status,200);assert.equal(`${icon.width}x${icon.height}`,icon.sizes);}
 await browser.evaluate(`localStorage.setItem('physioflow.ui-language','obsolete');location.reload()`);
 await browser.waitFor(`document.documentElement.lang==='ja'&&!!document.querySelector('main')`,'invalid saved language fallback');
 await mkdir('artifacts/entry-ui-2026-10-15',{recursive:true});
 await writeFile('artifacts/entry-ui-2026-10-15/result.json',JSON.stringify({languageRoundTrip:true,englishNoRuntimeError:true,documentLanguage:true,invalidSavedLanguageFallback:true,icons},null,2));
 console.log('Language round trip, invalid saved-language fallback and manifest icons passed');
} finally {await browser.close();}
