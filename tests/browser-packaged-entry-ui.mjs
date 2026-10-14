import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {openTestBrowser} from './browser-harness.mjs';
const origin=process.env.PF_PACKAGE_ORIGIN;
if(!origin)throw Error('PF_PACKAGE_ORIGIN required');
const browser=await openTestBrowser();
try {
 await browser.send('Page.navigate',{url:origin});
 await browser.waitFor('!!document.querySelector("main")','production ready');
 const icons=await browser.evaluate(`(async()=>{const manifest=await fetch('/manifest.json').then(r=>r.json());return Promise.all(manifest.icons.map(async icon=>{const response=await fetch('/'+icon.src);const bitmap=await createImageBitmap(await response.blob());return {status:response.status,width:bitmap.width,height:bitmap.height,sizes:icon.sizes}}))})()`);
 for(const icon of icons){assert.equal(icon.status,200);assert.equal(`${icon.width}x${icon.height}`,icon.sizes);}
 for(const lang of ['ja','en','zh','obsolete']) {
  await browser.evaluate(`localStorage.setItem('physioflow.ui-language',${JSON.stringify(lang)})`);
  await browser.send('Page.navigate',{url:origin+'/participant'});
  await browser.waitFor(`!!document.querySelector('.participant-launch [role=alert] button')`,'production participant recovery');
  assert.equal(await browser.evaluate('document.documentElement.lang'),lang==='zh'?'zh-CN':lang==='obsolete'?'ja':lang);
  const text=await browser.evaluate('document.body.innerText');
  assert.ok(text.includes(lang==='en'?'experimenter':lang==='zh'?'实验员':'実験担当者'));
 }
 const directory=process.env.PF_PACKAGE_ARTIFACTS||'artifacts/entry-ui-2026-10-15/package-beta16';
 await mkdir(directory,{recursive:true});await writeFile(directory+'/entry.json',JSON.stringify({productionAssets:true,participantLanguages:['ja','en','zh'],invalidLanguageFallback:true,icons},null,2));
 console.log('Production entry languages, fallback and installation icons passed');
}finally{await browser.close();}
