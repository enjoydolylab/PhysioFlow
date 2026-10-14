import assert from 'node:assert/strict';
import {openTestBrowser} from './browser-harness.mjs';
const browser=await openTestBrowser();
try{
 await browser.evaluate(`(async()=>{const React=(await import('/node_modules/.vite/deps/react.js')).default;const {createRoot}=(await import('/node_modules/.vite/deps/react-dom_client.js')).default;const {LanguageProvider}=await import('/src/i18n.jsx');const {default:Composer}=await import('/src/ComposerV2.jsx');const core=await import('/src/core/index.js');await import('/src/composer/composer-v2.css');let protocol=core.createProtocolGraph();const result=core.insertNodeOnControlEdge(protocol,protocol.graph.edges[0].id,'timing.wait',{config:{...core.createCoreComponentRegistry().get('timing.wait').defaultConfig,durationMs:''},layout:{x:6000,y:3000}});protocol=core.updateNode(result.protocol,result.node.id,{layout:{x:6000,y:3000}});window.farIssueId=result.node.id;document.getElementById('root').style.display='none';const host=document.createElement('div');host.id='focus-test';document.body.append(host);createRoot(host).render(React.createElement(LanguageProvider,null,React.createElement(Composer,{protocol,onChange:()=>{}})));})()`);
 await browser.waitFor(`!!document.querySelector('#focus-test .sequence-heading button')`,'sequence loaded');
 await browser.evaluate(`document.querySelector('#focus-test .sequence-heading button').click()`);
 await browser.waitFor(`!!document.querySelector('#focus-test .composer-canvas')`,'canvas loaded');
 await browser.evaluate(`[...document.querySelectorAll('#focus-test .composer-validation button')].find(b=>b.textContent.includes('config.wait_duration_invalid')).click()`);
 await browser.waitFor(`document.querySelector('#focus-test [data-node-id="'+farIssueId+'"]').classList.contains('selected')`,'issue selected');
 const visible=await browser.evaluate(`(()=>{const node=document.querySelector('#focus-test [data-node-id="'+farIssueId+'"]').getBoundingClientRect(),canvas=document.querySelector('#focus-test .composer-canvas').getBoundingClientRect();return node.left>=canvas.left&&node.right<=canvas.right&&node.top>=canvas.top&&node.bottom<=canvas.bottom;})()`);
 assert.equal(visible,true);console.log('Actual Composer: distant validation node moves fully into canvas view');
}finally{await browser.close();}
