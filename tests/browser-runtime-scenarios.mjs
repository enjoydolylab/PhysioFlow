import assert from 'node:assert/strict';

export async function verifyRuntimeScenarios(evaluate, waitFor, clickText) {
  await evaluate(`(async () => {
    const { default: React } = await import('/node_modules/.vite/deps/react.js');
    const { default: ReactDOM } = await import('/node_modules/.vite/deps/react-dom_client.js');
    const { createRoot } = ReactDOM;
    const { default: Runner } = await import('/src/GraphRuntimeRunnerPage.jsx');
    const core = await import('/src/core/index.js');
    const { LanguageProvider } = await import('/src/i18n.jsx');
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
      window.scenarioRoot.render(React.createElement(LanguageProvider, null, React.createElement(Runner, { data, onDone: () => {} })));
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
  await waitFor(`!!document.querySelector('#runtime-regression .pf-preflight')`, 'restored device run requires preflight');
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
  // Exercise the actual operator UI and BroadcastChannel against the runner.
  await evaluate(`mountScenario([['display.screen','Operator first',{completion:{mode:'manual'}}],['display.screen','Operator second',{completion:{mode:'manual'}}]])`);
  await clickText('Begin experiment');
  await revealOperator();
  await waitFor(`!!document.querySelector('#runtime-regression a[href*="/operator"]')`, 'monitor URL ready');
  await evaluate(`(async () => {
    const React = (await import('/node_modules/.vite/deps/react.js')).default;
    const { createRoot } = (await import('/node_modules/.vite/deps/react-dom_client.js')).default;
    const { default: Monitor } = await import('/src/OperatorMonitorPage.jsx');
    const { LanguageProvider } = await import('/src/i18n.jsx');
    window.previousMonitorHash = location.hash;
    location.hash = new URL(document.querySelector('#runtime-regression a[href*="/operator"]').href).hash;
    const host = document.createElement('div'); host.id = 'operator-regression'; document.body.append(host);
    window.monitorRoot = createRoot(host);
    monitorRoot.render(React.createElement(LanguageProvider, null, React.createElement(Monitor)));
    window.monitorClick = label => { const b = [...host.querySelectorAll('button')].find(b => b.textContent.trim() === label); if (!b || b.disabled) throw Error('Unavailable monitor button: ' + label); b.click(); };
    window.monitorText = value => { const el = host.querySelector('textarea'); Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(el, value); el.dispatchEvent(new Event('input', { bubbles: true })); };
  })()`);
  const monitorText = `document.querySelector('#operator-regression')?.textContent || ''`;
  await waitFor(`(${monitorText}).includes('Operator first')`, 'monitor receives current step');
  await evaluate(`monitorText('Movement observed')`);
  await waitFor(`[...document.querySelectorAll('#operator-regression button')].some(b => b.textContent === 'Save observation' && !b.disabled)`, 'note enabled');
  await evaluate(`monitorClick('Save observation')`);
  await waitFor(`(${monitorText}).includes('Movement observed') && (${monitorText}).includes('Action recorded.')`, 'observation acknowledged');
  await evaluate(`monitorClick('Pause')`);
  await waitFor(`document.querySelector('#runtime-regression .pause-overlay') !== null`, 'remote pause');
  await waitFor(`[...document.querySelectorAll('#operator-regression button')].some(b => b.textContent === 'Resume' && !b.disabled)`, 'remote resume ready');
  await evaluate(`monitorClick('Resume')`);
  await waitFor(`!document.querySelector('#runtime-regression .pause-overlay')`, 'remote resume');
  await evaluate(`monitorText('Repeat instructions')`);
  await waitFor(`[...document.querySelectorAll('#operator-regression button')].some(b => b.textContent === 'Retry current step' && !b.disabled)`, 'retry ready');
  await evaluate(`monitorClick('Retry current step')`);
  await waitFor(`(${monitorText}).includes('Action recorded.') && document.querySelector('#operator-regression textarea').value === ''`, 'retry acknowledged');
  await evaluate(`monitorText('Participant requests skip')`);
  await waitFor(`[...document.querySelectorAll('#operator-regression button')].some(b => b.textContent === 'Skip current step' && !b.disabled)`, 'skip ready');
  await evaluate(`monitorClick('Skip current step')`);
  await waitFor(`(${text}).includes('Operator second')`, 'remote skip advances runner');
  await clickText('Continue');
  await waitFor(`(${text}).includes('Session data saved.')`, 'operator session saved');
  const monitoredSession = await evaluate(`(async () => (await import('/src/storage.js')).loadSession(window.scenarioSessionId))()`);
  assert.equal(monitoredSession.events.find(event => event.eventType === 'operator_note').payload.text, 'Movement observed');
  assert.equal(monitoredSession.events.find(event => event.eventType === 'component_retried').payload.reason, 'Repeat instructions');
  assert.equal(monitoredSession.events.find(event => event.eventType === 'component_skipped').payload.reason, 'Participant requests skip');
  assert.ok(monitoredSession.events.some(event => event.eventType === 'session_paused'));
  assert.ok(monitoredSession.events.some(event => event.eventType === 'session_resumed'));
  const reviewEvidence = await evaluate(`(async () => {
    const session = await (await import('/src/storage.js')).loadSession(window.scenarioSessionId);
    const files = (await import('/src/exporter.js')).bundle(session, session.protocol_snapshot, session.events, session.responses);
    const React = (await import('/node_modules/.vite/deps/react.js')).default;
    const { createRoot } = (await import('/node_modules/.vite/deps/react-dom_client.js')).default;
    const { default: Manager } = await import('/src/SessionManager.jsx');
    const { LanguageProvider } = await import('/src/i18n.jsx');
    const host = document.createElement('div'); host.id = 'review-regression'; document.body.append(host);
    window.reviewRoot = createRoot(host);
    reviewRoot.render(React.createElement(LanguageProvider, null, React.createElement(Manager, { embedded: true, initialSessionId: session.session_id })));
    return { jsonl: files['events.jsonl'], csv: files['events.csv'] };
  })()`);
  assert.ok(reviewEvidence.csv.includes('Movement observed'));
  assert.ok(reviewEvidence.csv.includes('Repeat instructions'));
  assert.ok(reviewEvidence.csv.includes('Participant requests skip'));
  assert.equal(reviewEvidence.jsonl.trim().split('\n').map(line => JSON.parse(line)).filter(event => event.eventType === 'operator_note').length, 1);
  await waitFor(`document.querySelector('#review-regression [aria-label="Operator observations"]')?.textContent.includes('Movement observed')`, 'observation visible in review');
  assert.ok(await evaluate(`document.querySelector('#review-regression [aria-label="Operator observations"]').textContent.includes('Participant requests skip')`));
  await evaluate(`reviewRoot.unmount(); document.getElementById('review-regression').remove()`);
  await evaluate(`monitorRoot.unmount(); document.getElementById('operator-regression').remove(); location.hash = previousMonitorHash`);
  await evaluate(`window.scenarioRoot.unmount(); document.getElementById('runtime-regression').remove()`);
}
