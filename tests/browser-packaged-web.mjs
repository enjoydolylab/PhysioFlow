import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const version=JSON.parse(await readFile(new URL('../package.json',import.meta.url))).version;
import {mkdir,writeFile} from 'node:fs/promises';
import {openTestBrowser} from './browser-harness.mjs';
const artifacts=process.env.PF_PACKAGE_ARTIFACTS || 'artifacts/db-progression-2026-10-14/package';
const origin=process.env.PF_PACKAGE_ORIGIN;if(!origin)throw Error('Set PF_PACKAGE_ORIGIN to the actual URL printed by the launcher');
const browser=await openTestBrowser();
try{
 await browser.send('Page.navigate',{url:origin});await browser.waitFor(`location.origin===${JSON.stringify(origin)}&&document.body.innerText.includes('PhysioFlow')`,'packaged app loaded');
 const info=await browser.evaluate(`fetch('/BUILD_INFO.json').then(r=>r.json())`);assert.equal(info.version,version);assert.equal(typeof info.trackedSourceDirty,'boolean');if(process.env.PF_PACKAGE_SOURCE_DIRTY!==undefined)assert.equal(info.trackedSourceDirty,process.env.PF_PACKAGE_SOURCE_DIRTY==='true');
 assert.ok(await browser.evaluate(`!!document.querySelector('script[type="module"][src*="index-"]')`));
 for(const route of ['/admin','/admin/','/operator','/participant'])assert.equal((await fetch(origin+route)).status,200);
 await browser.send('Page.navigate',{url:origin+'/admin/'});await browser.waitFor(`!!document.querySelector('.pf-login input[type=password]')`,'packaged admin entry loaded');
 const body=await browser.evaluate('document.body.innerText');assert.match(body,/PhysioFlow/);
 await mkdir(artifacts,{recursive:true});
 await writeFile(`${artifacts}/browser.json`,JSON.stringify({version:info.version,productionAssetsLoaded:true,staticLauncher:true,sourceDirty:info.trackedSourceDirty,spaRoutes:true,adminLoginRendered:true},null,2));console.log('Packaged production assets and launcher passed');
}finally{await browser.close();}
