import assert from 'node:assert/strict';

export async function verifyOfflineExceptions({evaluate, waitFor}, click, check) {
  const text = `document.querySelector('#offline')?.innerText || ''`;
  await evaluate(`(async()=>{
    window.testProtocol=core.createProtocolGraph({name:'QA unsaved editor draft'});
    for(const label of ['First','Second']){const edge=testProtocol.graph.edges.find(e=>testProtocol.graph.nodes.find(n=>n.id===e.target.nodeId)?.component.type==='core.end');testProtocol=core.insertNodeOnControlEdge(testProtocol,edge.id,'display.screen',{label,config:{ui:core.participantUiTemplate('instruction'),completion:{mode:'manual'}}}).protocol;}
    window.beforeExit=JSON.stringify(testProtocol);window.exitCalled=false;
    window.testData={protocol:testProtocol,session:{session_id:crypto.randomUUID(),participant_id:'QA-EXIT',run_mode:'preview'}};
    mount(Runner,{data:testData,onDone:()=>{},onExitTest:async()=>{exitCalled=true;offlineRoot.unmount();}});
  })()`);
  await click('Begin experiment');
  await waitFor(`!!document.querySelector('#offline .graph-participant')`,'Preview begins');
  await evaluate(`window.dispatchEvent(new KeyboardEvent('keydown',{key:'O',code:'KeyO',ctrlKey:true,shiftKey:true,bubbles:true}))`);
  await click('Continue');
  await waitFor(`!document.querySelector('#offline button[disabled]') || [...document.querySelectorAll('#offline button')].some(b=>b.textContent==='Previous page (test)'&&!b.disabled)`,'Preview second page');
  await click('Previous page (test)');
  await waitFor(`[...document.querySelectorAll('#offline button')].some(b=>b.textContent==='Previous page (test)'&&b.disabled)`,'Preview previous page');
  await click('Exit test and return');await click('Cancel');
  assert.equal(await evaluate('exitCalled'),false);
  await waitFor(`(${text}).includes('Checkpoint saved')`,'Preview checkpoint');
  // Exercise actual browser filesystem errors; do not report them as real disk failure.
  await evaluate(`window.originalRemove=FileSystemDirectoryHandle.prototype.removeEntry;FileSystemDirectoryHandle.prototype.removeEntry=async function(name,...args){if(name==='current_run.json')throw new DOMException('QA delete blocked','NotAllowedError');return originalRemove.call(this,name,...args);}`);
  await click('Exit test and return');await click('Discard test and return');
  await waitFor(`(${text}).includes('Could not exit test')`,'Exit deletion error');
  assert.equal(await evaluate('exitCalled'),false);
  await evaluate(`FileSystemDirectoryHandle.prototype.removeEntry=originalRemove`);
  await click('Exit test and return');await click('Discard test and return');
  await waitFor('exitCalled','Exit succeeds');
  assert.equal(await evaluate('JSON.stringify(testProtocol)===beforeExit'),true);
  assert.equal(await evaluate('fs.loadCurrentRun()'),null);
  check('Preview back, cancel exit, failed checkpoint deletion stays on page, retry exits with unchanged protocol');

  await evaluate(`(async()=>{
    window.failureData={protocol:await core.freezeProtocolGraph(testProtocol,registry),session:{session_id:crypto.randomUUID(),participant_id:'QA-SAVE-FAILURE',run_mode:'formal'}};
    window.originalCreate=FileSystemFileHandle.prototype.createWritable;
    FileSystemFileHandle.prototype.createWritable=async function(...args){if(this.name==='session_detail.json')throw new DOMException('QA disk full','QuotaExceededError');return originalCreate.apply(this,args);};
    mount(Runner,{data:failureData,onDone:()=>{}});
  })()`);
  await click('Begin experiment');await click('Continue');
  await waitFor(`!!document.querySelector('#offline .graph-participant')`,'Second formal screen');
  await new Promise(r=>setTimeout(r,100));await click('Continue');
  await waitFor(`(${text}).includes('Session data not saved')`,'Final save error');
  assert.equal(await evaluate(`[...document.querySelectorAll('#offline button')].find(b=>b.textContent.includes('Return to projects')).disabled`),true);
  await evaluate(`FileSystemFileHandle.prototype.createWritable=originalCreate`);
  await click('Retry local save');await waitFor(`(${text}).includes('Session data saved.')`,'Retry final save');
  assert.equal(await evaluate(`fs.loadSession(failureData.session.session_id).then(s=>s.status)`),'completed');
  check('Final write failure is visible, blocks exit, and retries complete data successfully');
}
