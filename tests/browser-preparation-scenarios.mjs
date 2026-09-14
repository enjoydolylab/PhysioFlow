import assert from 'node:assert/strict';

export async function verifyPreparationScenarios(evaluate, waitFor) {
  await evaluate(`(async () => {
    const React = (await import('/node_modules/.vite/deps/react.js')).default;
    const { createRoot } = (await import('/node_modules/.vite/deps/react-dom_client.js')).default;
    const { LanguageProvider } = await import('/src/i18n.jsx');
    const { GraphSessionSetup } = await import('/src/app/sessionSetup.jsx');
    const core = await import('/src/core/index.js');
    const container = document.createElement('div'); container.id = 'preparation-regression'; document.body.append(container);
    window.preparationRoot = createRoot(container);
    window.prepareScenario = async (formal = false) => {
      let protocol = core.createProtocolGraph({ name: 'Preparation test' });
      protocol = core.insertNodeOnControlEdge(protocol, protocol.graph.edges[0].id, 'display.screen', { label: 'Instructions', config: { ui: core.participantUiTemplate('instruction'), completion: { mode: 'manual' } } }).protocol;
      if (formal) protocol = await core.freezeProtocolGraph(protocol, core.createCoreComponentRegistry());
      window.preparedSession = null;
      window.preparationRoot.render(React.createElement(LanguageProvider, null, React.createElement(GraphSessionSetup, {
        key: String(formal), protocol, storageInfo: { selected: false }, onBack: () => {}, onStart: session => { window.preparedSession = session; }
      })));
    };
    await window.prepareScenario();
  })()`);
  const submit = `document.querySelector('#preparation-regression button.primary.wide')`;
  await waitFor(`!!${submit} && document.querySelector('#preparation-regression').textContent.includes('All referenced media')`, 'preparation media validation');
  assert.equal(await evaluate(`${submit}.disabled`), true, 'missing participant blocks test run');
  const enterParticipant = `(() => { const input = document.querySelector('#preparation-regression #participant-id'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, 'PREP-001'); input.dispatchEvent(new Event('input', { bubbles: true })); })()`;
  await evaluate(enterParticipant);
  await waitFor(`!${submit}.disabled`, 'draft allows browser storage');
  await evaluate(`${submit}.click()`);
  assert.equal(await evaluate(`window.preparedSession.run_mode`), 'preview');
  await evaluate(`window.prepareScenario(true)`);
  await waitFor(`document.querySelector('#preparation-regression').textContent.includes('Formal collection')`, 'frozen preparation');
  await evaluate(enterParticipant);
  assert.equal(await evaluate(`${submit}.disabled`), true, 'local formal collection requires a selected folder');
  await evaluate(`window.preparationRoot.unmount(); document.getElementById('preparation-regression').remove()`);
}
