import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {openTestBrowser} from './browser-harness.mjs';
const browser=await openTestBrowser();
try{
 const result=await browser.evaluate(`(async()=>{
 const core=await import('/src/core/index.js'),storage=await import('/src/storage.js');
 let protocols=[core.createEmotionGraphTemplate(),core.createEmotionGraphTemplate(),core.createStroopGraphTemplate(),core.createGonogoGraphTemplate()];
 const ids=protocols.map(p=>p.protocolId);await storage.saveProtocols(protocols);protocols=await storage.loadProtocols();
 if(protocols.length!==4||new Set(protocols.map(p=>p.protocolId)).size!==4)throw Error('Projects were merged during save');
 const first=protocols.find(p=>p.protocolId===ids[0]),second=protocols.find(p=>p.protocolId===ids[1]);
 const firstNode=first.graph.nodes.find(n=>n.component.type==='stimulus.fixation');
 const updated=core.updateNode(first,firstNode.id,{config:{...firstNode.config,completion:{mode:'fixed',durationMs:7500}}});
 await storage.saveProtocols(protocols.map(p=>p.protocolId===ids[0]?updated:p));const restored=await storage.loadProtocols();
 const edited=restored.find(p=>p.protocolId===ids[0]).graph.nodes.find(n=>n.id===firstNode.id);
 const untouched=restored.find(p=>p.protocolId===ids[1]);
 if(JSON.stringify(untouched)!==JSON.stringify(second))throw Error('Another template changed');
 return {projects:restored.length,distinctIds:new Set(restored.map(p=>p.protocolId)).size,editedDuration:edited.config.completion.durationMs,otherProjectUnchanged:true};
 })()`);
 assert.equal(result.projects,4);assert.equal(result.distinctIds,4);assert.equal(result.editedDuration,7500);
 await mkdir('artifacts/editor-progression-2026-10-14',{recursive:true});await writeFile('artifacts/editor-progression-2026-10-14/template-isolation.json',JSON.stringify(result,null,2));
 console.log('Repeated templates: four independent projects survive saving and editing one preserves the other');
}finally{await browser.close();}
