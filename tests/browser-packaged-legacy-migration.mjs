import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {protocol} from '../src/domain.js';
import {isGraphProtocol} from '../src/core/index.js';
import {openTestBrowser} from './browser-harness.mjs';
const origin=process.env.PF_PACKAGE_ORIGIN;if(!origin)throw Error('Package origin required');
const original=protocol({name:'Packaged legacy migration regression'});
const browser=await openTestBrowser();
try {
 await browser.send('Page.navigate',{url:origin});await browser.waitFor(`location.origin===${JSON.stringify(origin)}&&!!document.querySelector('main')`,'production app');
 await browser.evaluate(`localStorage.setItem('physioflow.protocols.v1',${JSON.stringify(JSON.stringify([original]))});localStorage.setItem('physioflow.ui-language','en');localStorage.setItem('physioflow.guide-seen.v1','1');location.reload()`);
 await browser.waitFor(`!!document.querySelector('.card-main')`,'production legacy project');
 await browser.evaluate(`document.querySelector('.card-main').click()`);await browser.waitFor(`!!document.querySelector('.legacy-migration-notice')`,'production migration notice');
 assert.equal(await browser.evaluate(`!!document.querySelector('.flow-overlay,.builder-grid')`),false);
 await browser.evaluate(`document.querySelector('.legacy-migration-notice .primary').click()`);await browser.waitFor(`!!document.querySelector('.composer-v2')`,'production current editor');
 const saved=await browser.evaluate(`JSON.parse(localStorage.getItem('physioflow.protocols.v1'))`);
 assert.equal(saved.length,2);assert.deepEqual(saved.find(p=>p.protocol_id===original.protocol_id),original);assert.ok(saved.some(isGraphProtocol));
 const directory=process.env.PF_PACKAGE_ARTIFACTS||'artifacts/legacy-editor-stage/package-beta25';await mkdir(directory,{recursive:true});await writeFile(`${directory}/migration.json`,JSON.stringify({productionAssets:true,legacyEditorAbsent:true,migrationOpensCurrentEditor:true,originalPreserved:true,graphDraftPersisted:true},null,2));
 console.log('Packaged legacy migration passed');
}finally{await browser.close();}
