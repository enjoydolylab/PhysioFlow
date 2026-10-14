import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {openTestBrowser} from './browser-harness.mjs';
const browser=await openTestBrowser();
try{
 await browser.evaluate(`(async()=>{
 const React=(await import('/node_modules/.vite/deps/react.js')).default;const {createRoot}=(await import('/node_modules/.vite/deps/react-dom_client.js')).default;const {LanguageProvider}=await import('/src/i18n.jsx');const {NodeInspector}=await import('/src/composer/NodeInspector.jsx');window.configCore=await import('/src/core/index.js');window.configStorage=await import('/src/storage.js');window.configRegistry=configCore.createCoreComponentRegistry();let protocol=configCore.createProtocolGraph();const inserted=configCore.insertNodeOnControlEdge(protocol,protocol.graph.edges[0].id,'timing.wait',{config:configRegistry.get('timing.wait').defaultConfig});window.configProtocol=inserted.protocol;window.configNodeId=inserted.node.id;
 document.getElementById('root').style.display='none';const host=document.createElement('div');host.id='config-save';document.body.append(host);window.configRoot=createRoot(host);window.renderConfig=()=>configRoot.render(React.createElement(LanguageProvider,null,React.createElement(NodeInspector,{node:configProtocol.graph.nodes.find(n=>n.id===configNodeId),definition:configRegistry.get('timing.wait'),variables:[],groups:[],mode:'advanced',assets:[],resources:{},questionnaireLibrary:[],dataOutputOptions:[],onUpdate:changes=>{configProtocol=configCore.updateNode(configProtocol,configNodeId,changes);renderConfig();}})));renderConfig();
 })()`);
 await browser.waitFor(`!![...document.querySelectorAll('#config-save label')].find(label=>label.textContent.includes('Duration (ms)'))?.querySelector('input[type=number]')`,'duration field loaded');
 const input=async value=>browser.evaluate(`(()=>{const input=[...document.querySelectorAll('#config-save label')].find(label=>label.textContent.includes('Duration (ms)'))?.querySelector('input[type=number]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,${JSON.stringify(value)});input.dispatchEvent(new Event('input',{bubbles:true}));})()`);
 await input('');await browser.waitFor(`[...document.querySelectorAll('#config-save label')].find(label=>label.textContent.includes('Duration (ms)'))?.querySelector('input[type=number]').value===''`,'blank remains blank');
 assert.equal(await browser.evaluate(`configProtocol.graph.nodes.find(n=>n.id===configNodeId).config.durationMs`),'');
 assert.equal(await browser.evaluate(`configCore.validateProtocolGraphForFreeze(configProtocol,configRegistry).valid`),false);
 await browser.evaluate(`(async()=>{await configStorage.saveProtocols([configProtocol]);configProtocol=(await configStorage.loadProtocols())[0];renderConfig();})()`);
 assert.equal(await browser.evaluate(`configProtocol.graph.nodes.find(n=>n.id===configNodeId).config.durationMs`),'');
 await input('750');await browser.waitFor(`configProtocol.graph.nodes.find(n=>n.id===configNodeId).config.durationMs===750`,'numeric correction');
 await browser.evaluate(`(async()=>{await configStorage.saveProtocols([configProtocol]);configProtocol=(await configStorage.loadProtocols())[0];renderConfig();})()`);
 assert.equal(await browser.evaluate(`configCore.validateProtocolGraphForFreeze(configProtocol,configRegistry).valid`),true);
 assert.equal(await browser.evaluate(`configProtocol.graph.nodes.find(n=>n.id===configNodeId).config.durationMs`),750);
 await mkdir('artifacts/editor-progression-2026-10-14',{recursive:true});await writeFile('artifacts/editor-progression-2026-10-14/component-config-save.json',JSON.stringify({blankNotConvertedToZero:true,blankRejectedByValidation:true,blankPreservedAfterStorageReload:true,numericCorrectionPreservedAfterStorageReload:true,correctedGraphValid:true},null,2));
 console.log('Actual component editor: blank duration stays blank, invalid config flagged, correction survives storage reload');
}finally{await browser.close();}
