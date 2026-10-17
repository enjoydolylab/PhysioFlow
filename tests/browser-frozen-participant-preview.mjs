import assert from 'node:assert/strict';
import { openTestBrowser } from './browser-harness.mjs';
const b = await openTestBrowser();
try {
  await b.evaluate(`(async()=>{
    localStorage.setItem('physioflow.ui-language','en');localStorage.setItem('physioflow.guide-seen.v1','1');
    const c=await import('/src/core/index.js');const {saveProtocols}=await import('/src/storage.js');
    let p=c.createProtocolGraph();const ui=c.participantUiTemplate('instruction');
    ui.root.props={...ui.root.props,screenWidth:1280,screenHeight:720};
    p=c.insertNodeOnControlEdge(p,p.graph.edges[0].id,'display.screen',{config:{ui,completion:{mode:'manual'}}}).protocol;
    p=await c.freezeProtocolGraph(p,c.createCoreComponentRegistry());
    sessionStorage.setItem('frozen-original',JSON.stringify(p));await saveProtocols([p]);location.reload();
  })()`);
  await b.waitFor(`!!document.querySelector('.card-main')`, 'project');
  await b.evaluate(`document.querySelector('.card-main').click()`);
  await b.waitFor(`!!document.querySelector('.composer-sequence li:nth-child(2) .sequence-select')`, 'sequence');
  await b.evaluate(`document.querySelector('.composer-sequence li:nth-child(2) .sequence-select').click()`);
  await b.waitFor(`!!document.querySelector('.view-participant-ui')`, 'frozen view entry');
  assert.equal(await b.evaluate(`document.querySelector('.view-participant-ui').disabled`), false);
  await b.evaluate(`document.querySelector('.view-participant-ui').click()`);
  const assertReadOnly = async () => {
    await b.waitFor(`!!document.querySelector('.node-editor-preview')`, 'read only preview');
    assert.equal(await b.evaluate(`!!document.querySelector('.participant-ui-builder, .node-editor-save')`), false);
    assert.equal(await b.evaluate(`document.querySelector('.node-editor-save-state').textContent`), 'Frozen version · view only');
  };
  await assertReadOnly();
  for (const width of [375, 1280]) {
    await b.send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
    assert.ok(await b.evaluate(`(()=>{const h=document.querySelector('.node-editor-header');return h.scrollWidth<=h.clientWidth+1})()`), 'header fits');
  }
  await b.evaluate(`document.querySelector('.node-editor-close').click();document.querySelector('.sequence-heading button').click()`);
  await b.waitFor(`!!document.querySelector('.composer-node')`, 'graph');
  await b.evaluate(`[...document.querySelectorAll('.composer-node')].find(n=>n.textContent.includes('display.screen')).dispatchEvent(new MouseEvent('dblclick',{bubbles:true}))`);
  await assertReadOnly();
  await b.evaluate(`document.querySelector('.node-editor-create-draft').click()`);
  await b.waitFor(`!!document.querySelector('.node-editor-save')`, 'editable version');
  await b.evaluate(`document.querySelector('.node-editor-header button').click()`);
  await b.waitFor(`!!document.querySelector('.participant-ui-builder')`, 'draft builder');
  await b.evaluate(`document.querySelector('.node-editor-close').click();(()=>{const f=document.querySelector('.composer-title');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(f,'Editable copy');f.dispatchEvent(new Event('input',{bubbles:true}))})()`);
  await b.waitFor(`!!document.querySelector('.unsaved-dot')`, 'draft changed');
  await b.evaluate(`[...document.querySelectorAll('.header-tools>button')].find(b=>b.textContent==='Save').click()`);
  await b.waitFor(`!document.querySelector('.unsaved-dot')`, 'draft saved');
  const stored = await b.evaluate(`JSON.parse(localStorage.getItem('physioflow.protocols.v1'))`);
  const original = await b.evaluate(`JSON.parse(sessionStorage.getItem('frozen-original'))`);
  assert.equal(stored.length, 2);
  assert.deepEqual(stored.find(p=>p.protocolId===original.protocolId), original);
  const draft=stored.find(p=>p.protocolId!==original.protocolId);
  assert.equal(draft.version.status,'draft');assert.equal(draft.version.number,original.version.number+1);
  assert.equal(draft.metadata.name,'Editable copy');
  console.log('Frozen participant screens: sequence and graph read-only, 375/1280 header, editable version and save preserve original passed');
} finally { await b.close(); }
