import { openTestBrowser } from './browser-harness.mjs';
import { verifyComponentAcceptance } from './browser-component-acceptance.mjs';
import { verifyRuntimeScenarios } from './browser-runtime-scenarios.mjs';
import { mkdir, writeFile } from 'node:fs/promises';
const browser=await openTestBrowser();
try {
 await browser.evaluate(`document.getElementById('root').style.display='none'`);
 await verifyComponentAcceptance(browser.evaluate,browser.waitFor);
 const click=async label=>{
  await browser.waitFor(`!![...document.querySelectorAll('#runtime-regression button')].find(b=>b.textContent.trim()===${JSON.stringify(label)}&&!b.disabled)`,'Runtime action '+label);
  await browser.evaluate(`[...document.querySelectorAll('#runtime-regression button')].find(b=>b.textContent.trim()===${JSON.stringify(label)}&&!b.disabled).click()`);
 };
 await verifyRuntimeScenarios(browser.evaluate,browser.waitFor,click);
 await mkdir('artifacts/db-progression-2026-10-14/workflow',{recursive:true});
 await writeFile('artifacts/db-progression-2026-10-14/workflow/component-runtime.json',JSON.stringify({componentControls:true,elementEditing:true,runtimeScenarios:true,operatorNotesAndReview:true,syntheticBrowser:true,humanUsability:false},null,2));
 console.log('Workflow acceptance: component editing, participant execution, operator actions and saved review passed');
} finally {await browser.close();}
