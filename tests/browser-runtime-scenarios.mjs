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
      window.scenarioSessionId = data.session.session_id;
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
  const revealOperator = async () => {
    await waitFor(`!!document.querySelector('#runtime-regression [aria-label="Participant view"]')`, 'participant view ready');
    assert.equal(await evaluate(`!!document.querySelector('#runtime-regression [role="toolbar"]')`), false, 'operator controls default to hidden');
    await evaluate(`window.dispatchEvent(new KeyboardEvent('keydown',{key:'O',code:'KeyO',ctrlKey:true,shiftKey:true,bubbles:true}))`);
    await waitFor(`!!document.querySelector('#runtime-regression [role="toolbar"]')`, 'operator shortcut reveals controls');
  };

  await evaluate(`mountScenario([['input.questionnaire','First',{questionnaire:{questionnaire_id:'q1',questions:[{question_id:'one',type:'short_text',text:'First question',required:false}]}}],['input.questionnaire','Second',{questionnaire:{questionnaire_id:'q2',questions:[{question_id:'two',type:'short_text',text:'Second question',required:false}]}}]])`);
  await clickText('Begin experiment');
  await revealOperator();
  await clickText('Submit');
  await waitFor(`(${text}).includes('Second') && !!document.querySelector('#runtime-regression textarea, #runtime-regression input')`, 'second questionnaire is editable');
  await clickText('Submit');
  await waitFor(`(${text}).includes('SESSION COMPLETE')`, 'consecutive questionnaires complete');

  await evaluate(`mountScenario([['display.screen','Timed',{completion:{mode:'fixed',durationMs:1200}}],['display.screen','After timer',{completion:{mode:'manual'}}]])`);
  await clickText('Begin experiment');
  await revealOperator();
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
  await revealOperator();
  await evaluate(`window.dispatchEvent(new KeyboardEvent('keydown',{key:'y',code:'KeyY'}))`);
  await clickText('Skip');
  await delay(1300);
  assert.ok(await evaluate(`(${text}).includes('Hold here') && !(${text}).includes('SESSION COMPLETE')`), 'old feedback must not complete the next node');

  await evaluate(`window.originalStorageSet = Storage.prototype.setItem; Storage.prototype.setItem = function(key, value) { if (key === 'physioflow.sessions.v2') throw new Error('Injected disk full'); return originalStorageSet.call(this,key,value); };`);
  await clickText('Continue');
  await waitFor(`(${text}).includes('Injected disk full')`, 'final save error displayed');
  await evaluate(`Storage.prototype.setItem = window.originalStorageSet`);
  await clickText('Retry local save');
  await waitFor(`(${text}).includes('Session data saved.')`, 'final local save can be retried');

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
  await waitFor(`(${text}).includes('RUNTIME FAILED') && (${text}).includes('Session data saved.')`, 'failed runtime is finalized locally');
  await evaluate(`mountScenario([['input.response','Deadline feedback',{options:[{value:'yes',label:'yes',key:'y'}],timeoutMs:500,feedbackMode:'always'}]])`);
  await clickText('Begin experiment');
  await evaluate(`window.dispatchEvent(new KeyboardEvent('keydown',{key:'y',code:'KeyY'}))`);
  await waitFor(`(${text}).includes('Session data saved.')`, 'feedback response saved');
  const feedbackSession = await evaluate(`(async () => (await import('/src/storage.js')).loadSession(window.scenarioSessionId))()`);
  assert.equal(feedbackSession.ended_at, feedbackSession.events.find(event => event.eventType === 'protocol_completed').timestampIso);
  const responseRt = feedbackSession.responses.find(row => row.name === 'reaction_time_ms').value;
  assert.ok(Number.isFinite(responseRt));
  assert.equal(feedbackSession.responses.find(row => row.name === 'timed_out').value, false);
  assert.equal(feedbackSession.responses[0].reactionTimeMs, responseRt);
  assert.ok(feedbackSession.responses[0].nodeDurationMs - responseRt >= 800, 'feedback belongs to dwell time, not RT');

  await evaluate(`mountScenario([['input.response','Lock first response',{options:[{value:'yes',label:'yes',key:'y'},{value:'no',label:'no',key:'n'}],timeoutMs:400,autoAdvance:false}]])`);
  await clickText('Begin experiment');
  await evaluate(`window.dispatchEvent(new KeyboardEvent('keydown',{key:'y',code:'KeyY'})); window.dispatchEvent(new KeyboardEvent('keydown',{key:'n',code:'KeyN'}))`);
  await delay(500);
  assert.ok(await evaluate(`(${text}).includes('— yes') && !(${text}).includes('SESSION COMPLETE')`), 'first response survives subsequent keys and confirmation deadline');
  await clickText('Continue');
  await waitFor(`(${text}).includes('Session data saved.')`, 'confirmed response saved');
  const lockedSession = await evaluate(`(async () => (await import('/src/storage.js')).loadSession(window.scenarioSessionId))()`);
  assert.equal(lockedSession.responses.find(row => row.name === 'value').value, 'yes');
  assert.equal(lockedSession.responses.find(row => row.name === 'timed_out').value, false);

  await evaluate(`mountScenario([['stimulus.attention-check','Attention pause',{expectedKey:'space',timeoutMs:2000}]])`);
  await clickText('Begin experiment');
  await revealOperator();
  await evaluate(`document.querySelector('#runtime-regression .attention-check button').click()`);
  await evaluate(`window.dispatchEvent(new KeyboardEvent('keydown',{key:' ',code:'Space'}))`);
  await clickText('Pause');
  await delay(1300);
  assert.ok(await evaluate(`(${text}).includes('Passed') && !(${text}).includes('SESSION COMPLETE')`));
  await clickText('Resume');
  await waitFor(`(${text}).includes('Session data saved.')`, 'attention feedback resumes and saves');
  await evaluate(`mountScenario([['experiment.cognitive-task','No-Go commission',{taskKind:'gonogo',trials:[{trialId:'nogo',trialType:'nogo',stimulus:'O',expectedKey:null,fixationMs:0,responseWindowMs:5000,itiMs:0}]}]])`);
  await clickText('Begin experiment');
  await clickText('Start task');
  await waitFor(`!!document.querySelector('#runtime-regression .gonogo-response')`, 'No-Go stimulus visible');
  await clickText('SPACE · Go');
  await waitFor(`(${text}).includes('Session data saved.')`, 'commission trial saved');
  const cognitiveSession = await evaluate(`(async () => (await import('/src/storage.js')).loadSession(window.scenarioSessionId))()`);
  assert.equal(cognitiveSession.responses.find(row => row.name === 'commissions').value, 1);
  assert.equal(cognitiveSession.responses.find(row => row.name === 'omissions').value, 0);
  assert.equal(cognitiveSession.responses[0].reactionTimeMs, null);
  await evaluate(`window.scenarioRoot.unmount(); document.getElementById('runtime-regression').remove()`);
}
