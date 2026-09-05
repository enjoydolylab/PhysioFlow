import assert from 'node:assert/strict';

export async function verifyRuntimeScenarios(evaluate, waitFor, clickText) {
  await evaluate(`(async () => {
    const { default: React } = await import('/node_modules/.vite/deps/react.js');
    const { default: ReactDOM } = await import('/node_modules/.vite/deps/react-dom_client.js');
    const { createRoot } = ReactDOM;
    const { default: Runner } = await import('/src/GraphRuntimeRunnerPage.jsx');
    const core = await import('/src/core/index.js');
    const container = document.createElement('div'); container.id = 'runtime-regression'; document.body.append(container);
    window.mountScenario = async (steps, options = {}) => {
      window.scenarioRoot?.unmount();
      window.scenarioRoot = createRoot(container);
      let protocol = core.createProtocolGraph({ name: 'Regression' });
      for (const [type, label, config] of steps) {
        const edge = protocol.graph.edges.find(edge => protocol.graph.nodes.find(node => node.id === edge.target.nodeId)?.component.type === 'core.end');
        protocol = core.insertNodeOnControlEdge(protocol, edge.id, type, { label, config }).protocol;
      }
      const data = { protocol, session: { session_id: crypto.randomUUID(), participant_id: 'REGRESSION' } };
      if (options.restore) {
        const runtime = await import('/src/runtime/index.js');
        const services = { idFactory: prefix => prefix + crypto.randomUUID(), clock: { now: () => ({ epochMs: Date.now(), monotonicMs: performance.now(), iso: new Date().toISOString() }) }, controlHandlers: runtime.createCoreControlHandlerRegistry() };
        const state = runtime.createRuntimeState(protocol, { sessionId: data.session.session_id, startedAtEpochMs: Date.now(), startedAtMonotonicMs: performance.now() });
        const result = runtime.startRuntime(state, protocol, core.createCoreComponentRegistry(), services);
        data.restore = { runtime: result.state, events: result.events, stimulus_assignment_policy: 'global-completion-v1' };
      }
      if (options.missingDevice) protocol.graph.nodes[1].config.deviceConnectorId = 'missing-device';
      if (options.missingMedia) protocol.graph.nodes.find(node => node.component.type === 'display.media').config.assetId = 'missing-file';
      if (options.failAfter) protocol.graph.edges.find(edge => protocol.graph.nodes.find(node => node.id === edge.source.nodeId)?.component.type === 'display.screen').target.nodeId = 'missing-target';
      window.scenarioRoot.render(React.createElement(Runner, { data, onDone: () => {} }));
    };
  })()`);
  const text = `document.querySelector('#runtime-regression')?.textContent || ''`;
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
  await evaluate(`mountScenario([['input.questionnaire','First',{questionnaire:{questionnaire_id:'q1',questions:[{question_id:'one',type:'short_text',text:'First question',required:false}]}}],['input.questionnaire','Second',{questionnaire:{questionnaire_id:'q2',questions:[{question_id:'two',type:'short_text',text:'Second question',required:false}]}}]])`);
  await clickText('Begin experiment');
  await clickText('Submit');
  await waitFor(`(${text}).includes('Second') && !!document.querySelector('#runtime-regression textarea, #runtime-regression input')`, 'second questionnaire is editable');
  await clickText('Submit');
  await waitFor(`(${text}).includes('SESSION COMPLETE')`, 'consecutive questionnaires complete');

  await evaluate(`mountScenario([['display.screen','Timed',{completion:{mode:'fixed',durationMs:1200}}],['display.screen','After timer',{completion:{mode:'manual'}}]])`);
  await clickText('Begin experiment');
  await delay(700);
  await clickText('Retry');
  await delay(700);
  assert.ok(await evaluate(`(${text}).includes('Timed')`), 'Retry must restart the full timer');
  await clickText('Pause');
  await delay(600);
  assert.ok(await evaluate(`(${text}).includes('Timed')`), 'Pause must freeze timer');
  await clickText('Resume');
  await waitFor(`(${text}).includes('After timer')`, 'remaining timer completes', 1000);

  await evaluate(`mountScenario([['input.response','Response A',{options:[{value:'yes',label:'yes',key:'y'}],feedbackMode:'always'}],['display.screen','Hold here',{completion:{mode:'manual'}}]])`);
  await clickText('Begin experiment');
  await evaluate(`window.dispatchEvent(new KeyboardEvent('keydown',{key:'y',code:'KeyY'}))`);
  await clickText('Skip');
  await delay(1300);
  assert.ok(await evaluate(`(${text}).includes('Hold here') && !(${text}).includes('SESSION COMPLETE')`), 'old feedback must not complete the next node');

  await evaluate(`window.originalStorageSet = Storage.prototype.setItem; Storage.prototype.setItem = function(key, value) { if (key === 'physioflow.sessions.v2') throw new Error('Injected disk full'); return originalStorageSet.call(this,key,value); };`);
  await clickText('Continue');
  await waitFor(`(${text}).includes('Injected disk full')`, 'final save error displayed');
  await evaluate(`Storage.prototype.setItem = window.originalStorageSet`);
  await clickText('Retry local save');
  await waitFor(`(${text}).includes('Saved locally.')`, 'final local save can be retried');

  await evaluate(`mountScenario([['display.screen','Restored device',{completion:{mode:'fixed',durationMs:100}}]],{restore:true,missingDevice:true})`);
  await waitFor(`(${text}).includes('RUNTIME V2 READY')`, 'restored device run requires preflight');
  await delay(300);
  assert.ok(await evaluate(`!(${text}).includes('SESSION COMPLETE')`));
  await clickText('Begin experiment');
  await waitFor(`(${text}).includes('Required device is not ready')`, 'missing required device blocks restored run');

  await evaluate(`mountScenario([['display.media','Restored media',{completion:{mode:'fixed',durationMs:100}}]],{restore:true,missingMedia:true})`);
  await waitFor(`(${text}).includes('Media needs attention')`, 'missing restored media blocks execution');
  await delay(300);
  assert.ok(await evaluate(`!(${text}).includes('SESSION COMPLETE')`));

  await evaluate(`mountScenario([['display.screen','Broken exit',{completion:{mode:'manual'}}]],{failAfter:true})`);
  await clickText('Begin experiment');
  await clickText('Continue');
  await waitFor(`(${text}).includes('RUNTIME FAILED') && (${text}).includes('Saved locally.')`, 'failed runtime is finalized locally');
  await evaluate(`window.scenarioRoot.unmount(); document.getElementById('runtime-regression').remove()`);
}
