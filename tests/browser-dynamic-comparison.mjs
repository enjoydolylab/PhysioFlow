import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createProtocolGraph,addNode,connect} from '../src/core/index.js';
import {openTestBrowser} from './browser-harness.mjs';
let protocol=createProtocolGraph({name:'Dynamic comparison test'});protocol.variables=[{name:'score',type:'number',scope:'session',defaultValue:null}];
const start=protocol.graph.nodes.find(n=>n.component.type==='core.start'),end=protocol.graph.nodes.find(n=>n.component.type==='core.end');protocol.graph.edges=[];
protocol=addNode(protocol,'logic.condition',{id:'dynamic-condition',config:{operator:'less_than',expected:1}}).protocol;protocol.graph.nodes.find(n=>n.id==='dynamic-condition').bindings={value:{kind:'variable',variable:'score'}};
protocol=addNode(protocol,'core.end',{id:'false_end'}).protocol;
for(const [source,port,target] of [[start.id,'next','dynamic-condition'],['dynamic-condition','true',end.id],['dynamic-condition','false','false_end']])protocol=connect(protocol,'control',{nodeId:source,portId:port},{nodeId:target,portId:'in'}).protocol;
const browser=await openTestBrowser();
try {
 await browser.evaluate(`(async()=>{localStorage.setItem('physioflow.ui-language','ja');const React=(await import('/node_modules/.vite/deps/react.js')).default;const {createRoot}=(await import('/node_modules/.vite/deps/react-dom_client.js')).default;const {LanguageProvider}=await import('/src/i18n.jsx');const {default:Runner}=await import('/src/GraphRuntimeRunnerPage.jsx');document.getElementById('root').style.display='none';const host=document.createElement('div');host.id='dynamic-check';document.body.append(host);createRoot(host).render(React.createElement(LanguageProvider,null,React.createElement(Runner,{data:${JSON.stringify({protocol,session:{session_id:'dynamic-check',participant_id:'synthetic',run_mode:'preview'}})},onDone:()=>{}})));})()`);
 await browser.waitFor(`!![...document.querySelectorAll('#dynamic-check button')].find(b=>b.textContent==='実験を開始')`,'ready');
 await browser.evaluate(`[...document.querySelectorAll('#dynamic-check button')].find(b=>b.textContent==='実験を開始').click()`);
 await browser.waitFor(`document.querySelector('#dynamic-check').textContent.includes('入力変数または前のステップの回答')`,'localized dynamic failure');
 assert.ok(await browser.evaluate(`document.querySelector('#dynamic-check').textContent.includes('実験は停止しました')`));
 await mkdir('artifacts/condition-execution-2026-10-15',{recursive:true});await writeFile('artifacts/condition-execution-2026-10-15/dynamic.json',JSON.stringify({syntheticRun:true,invalidNumericInputStopsRun:true,japaneseRecoveryMessage:true},null,2));
 console.log('Actual runner stops on invalid numeric comparison and shows Japanese guidance');
}finally{await browser.close();}
