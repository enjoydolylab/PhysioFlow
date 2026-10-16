import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {openTestBrowser} from './browser-harness.mjs';
const browser=await openTestBrowser();
try {
 await browser.evaluate(`(async()=>{localStorage.setItem('physioflow.ui-language','en');const React=(await import('/node_modules/.vite/deps/react.js')).default;const {createRoot}=(await import('/node_modules/.vite/deps/react-dom_client.js')).default;const {LanguageProvider}=await import('/src/i18n.jsx');const {default:Runner}=await import('/src/GraphRuntimeRunnerPage.jsx');const core=await import('/src/core/index.js');const ui=core.participantUiTemplate('rating');const input=ui.root.children.find(e=>e.type==='Input');input.props={name:'choice_answer',label:'Choose one',inputType:'choice',required:true,options:[{value:'0',label:'None, = zero'},{value:'yes',label:'Yes'}]};let protocol=core.createProtocolGraph({name:'Choice runtime verification'});protocol=core.insertNodeOnControlEdge(protocol,protocol.graph.edges[0].id,'display.screen',{config:{ui,completion:{mode:'manual'}}}).protocol;window.choiceRunId=crypto.randomUUID();document.getElementById('root').style.display='none';const host=document.createElement('div');host.id='choice-runtime';document.body.append(host);createRoot(host).render(React.createElement(LanguageProvider,null,React.createElement(Runner,{data:{protocol,session:{session_id:choiceRunId,participant_id:'SYNTHETIC_CHOICE',run_mode:'preview'}},onDone:()=>{}})));})()`);
 await browser.waitFor(`!![...document.querySelectorAll('#choice-runtime button')].find(b=>b.textContent==='Begin experiment')`,'ready');
 await browser.evaluate(`[...document.querySelectorAll('#choice-runtime button')].find(b=>b.textContent==='Begin experiment').click()`);
 await browser.waitFor(`!!document.querySelector('#choice-runtime select')`,'actual choice');
 await browser.evaluate(`document.querySelector('#choice-runtime .participant-ui-button').click()`);
 await browser.waitFor(`document.querySelector('#choice-runtime select').getAttribute('aria-invalid')==='true'`,'required choice blocks');
 await browser.evaluate(`(()=>{const select=document.querySelector('#choice-runtime select');select.value='0';select.dispatchEvent(new Event('change',{bubbles:true}));})()`);
 await browser.evaluate(`document.querySelector('#choice-runtime .participant-ui-button').click()`);
 await browser.waitFor(`document.querySelector('#choice-runtime').textContent.includes('Session data saved.')`,'saved completion');
 const result=await browser.evaluate(`(async()=>{const session=await(await import('/src/storage.js')).loadSession(choiceRunId);const files=(await import('/src/exporter.js')).bundle(session,session.protocol_snapshot,session.events,session.responses);return {session,responseJsonl:files['responses.jsonl'],responseCsv:files['responses.csv']}})()`);
 const response=result.session.responses.find(r=>r.name==='choice_answer');assert.equal(response.value,'0');
 assert.equal(result.session.events.find(e=>e.eventType==='response_submitted').payload.values.choice_answer,'0');
 const exported=result.responseJsonl.trim().split('\n').map(line=>JSON.parse(line));assert.equal(exported.find(r=>r.name==='choice_answer').value,'0');
 const lines=result.responseCsv.trim().split('\n').map(line=>line.split(','));const columns=lines[0];const row=lines.slice(1).find(row=>row[columns.indexOf('response_name')]==='choice_answer');assert.equal(row[columns.indexOf('value_json')],'0');assert.ok(result.session.protocol_snapshot.graph.nodes.some(n=>n.config?.ui?.root?.children?.some(e=>e.props?.options?.some(o=>o.label==='None, = zero'))));
 await mkdir('artifacts/participant-choice-stage',{recursive:true});await writeFile('artifacts/participant-choice-stage/runtime.json',JSON.stringify({actualRunner:true,syntheticPreviewRun:true,requiredBlocks:true,savedAndReloaded:true,responseAndEventStringZero:true,jsonlStringZero:true,csvRecordedZero:true,optionLabelInProtocolSnapshot:true},null,2));
 console.log('Actual single-choice run saved and reloaded string zero in response, event and export');
}finally{await browser.close();}
