import assert from 'node:assert/strict';
import { openTestBrowser } from './browser-harness.mjs';
const browser = await openTestBrowser();
const { evaluate, waitFor } = browser;
try {
  await evaluate(`(async () => {
    const React = (await import('/node_modules/.vite/deps/react.js')).default;
    const { createRoot } = (await import('/node_modules/.vite/deps/react-dom_client.js')).default;
    const { default: Composer } = await import('/src/ComposerV2.jsx');
    const { default: Runner } = await import('/src/GraphRuntimeRunnerPage.jsx');
    const { LanguageProvider } = await import('/src/i18n.jsx');
    const core = await import('/src/core/index.js');
    document.getElementById('root').style.display = 'none';
    const host = document.createElement('div'); host.id = 'sdk-delivery'; document.body.append(host);
    window.sdkRoot = createRoot(host);
    window.sdkProtocol = core.createProtocolGraph({ name: 'SDK delivery' });
    window.sdkClick = text => { const button = [...host.querySelectorAll('button')].find(b => b.textContent.trim() === text); if (!button || button.disabled) throw Error('Unavailable: ' + text); button.click(); };
    const render = () => sdkRoot.render(React.createElement(LanguageProvider, null, React.createElement(Composer, {
      protocol: sdkProtocol, onChange: next => { window.sdkProtocol = next; render(); }, onSave: next => { window.sdkSaved = structuredClone(next); },
      onPreview: () => { window.sdkSessionId = crypto.randomUUID(); sdkRoot.render(React.createElement(LanguageProvider, null, React.createElement(Runner, { data: { protocol: sdkProtocol, session: { session_id: sdkSessionId, participant_id: 'SDK-DELIVERY', run_mode: 'preview' } }, onDone: () => {} }))); }
    })));
    render();
  })()`);
  await waitFor(`!!document.querySelector('#sdk-delivery .composer-header')`, 'composer ready');
  await evaluate(`sdkClick('Advanced')`);
  await waitFor(`!!document.querySelector('#sdk-delivery .component-package-catalog')`, 'package catalog');
  await evaluate(`document.querySelector('#sdk-delivery .component-package-catalog').closest('details').open = true;
    window.sdkImport = value => { const input = document.querySelector('#sdk-delivery .component-package-import input'); const transfer = new DataTransfer(); transfer.items.add(new File([JSON.stringify(value)], 'package.json', { type: 'application/json' })); input.files = transfer.files; input.dispatchEvent(new Event('change', { bubbles: true })); }; sdkImport({ permissions: {} });`);
  await waitFor(`!!document.querySelector('#sdk-delivery .package-error')`, 'invalid import reports errors');
  assert.equal(await evaluate(`!!document.querySelector('#sdk-delivery .package-approval')`), false, 'invalid package never reaches approval');
  await evaluate(`window.deviceImport = value => { const input = document.querySelector('#sdk-delivery .device-connector-import input'); const transfer = new DataTransfer(); transfer.items.add(new File([JSON.stringify(value)], 'connector.json', { type: 'application/json' })); input.files = transfer.files; input.dispatchEvent(new Event('change', { bubbles: true })); }; deviceImport({ permissions: {} });`);
  await waitFor(`!!document.querySelector('#sdk-delivery .device-connector-catalog [role="alert"]')`, 'invalid connector visible');
  assert.equal(await evaluate(`!!document.querySelector('#sdk-delivery .device-connector-catalog .package-approval')`), false);
  await evaluate(`(async () => deviceImport((await import('/src/devices/index.js')).exampleSimulatedConnector()))()`);
  await waitFor(`!!document.querySelector('#sdk-delivery .device-connector-catalog .package-approval')`, 'device permission approval');
  assert.equal(await evaluate(`document.querySelector('#sdk-delivery .device-connector-catalog .package-approval button').disabled`), true);
  await evaluate(`[...document.querySelectorAll('#sdk-delivery .device-connector-catalog .package-approval input')].forEach(input => input.click())`);
  await waitFor(`!document.querySelector('#sdk-delivery .device-connector-catalog .package-approval button').disabled`, 'all device permissions approved');
  await evaluate(`document.querySelector('#sdk-delivery .device-connector-catalog .package-approval button').click()`);
  await waitFor(`sdkProtocol.deviceConnectors?.length === 1`, 'connector file installed');
  await evaluate(`deviceImport(sdkProtocol.deviceConnectors[0])`);
  await waitFor(`!!document.querySelector('#sdk-delivery .device-connector-catalog .package-approval')`, 'duplicate connector loaded');
  await evaluate(`[...document.querySelectorAll('#sdk-delivery .device-connector-catalog .package-approval input')].forEach(input => input.click())`);
  await waitFor(`!document.querySelector('#sdk-delivery .device-connector-catalog .package-approval button').disabled`, 'duplicate permissions approved');
  await evaluate(`document.querySelector('#sdk-delivery .device-connector-catalog .package-approval button').click()`);
  await waitFor(`document.querySelector('#sdk-delivery .device-connector-catalog [role="alert"]')?.textContent.includes('Installation failed')`, 'duplicate connector rejected');
  assert.equal(await evaluate(`sdkProtocol.deviceConnectors.length`), 1);
  assert.equal(await evaluate(`[...document.querySelectorAll('#sdk-delivery .device-connector-catalog .package-approval input')].every(input => input.checked)`), true);
  await evaluate(`document.querySelector('#sdk-delivery .device-connector-catalog .package-approval button:last-child').click()`);
  await evaluate(`(async () => sdkImport((await import('/src/sdk/index.js')).exampleReactionButtonPackage()))()`);
  await waitFor(`!!document.querySelector('#sdk-delivery .component-package-catalog .package-approval')`, 'component file approval');
  assert.equal(await evaluate(`document.querySelector('#sdk-delivery .component-package-catalog .package-approval button').disabled`), true);
  await evaluate(`document.querySelector('#sdk-delivery .component-package-catalog .package-approval input').click()`);
  await waitFor(`!document.querySelector('#sdk-delivery .component-package-catalog .package-approval button').disabled`, 'component file permission approved');
  await evaluate(`document.querySelector('#sdk-delivery .component-package-catalog .package-approval button').click()`);


  await waitFor(`sdkProtocol.componentPackages?.length === 1`, 'package installed');
  await evaluate(`sdkImport(sdkProtocol.componentPackages[0])`);
  await waitFor(`!!document.querySelector('#sdk-delivery .package-approval')`, 'valid import requests approval');
  assert.equal(await evaluate(`[...document.querySelectorAll('#sdk-delivery button')].find(b => b.textContent === 'Approve and install').disabled`), true, 'permissions require explicit checkbox');
  await evaluate(`document.querySelector('#sdk-delivery .package-approval input[type="checkbox"]').click()`);
  await waitFor(`![...document.querySelectorAll('#sdk-delivery button')].find(b => b.textContent === 'Approve and install').disabled`, 'approval unlocks installation');
  await evaluate(`sdkClick('Approve and install')`);
  await waitFor(`document.querySelector('#sdk-delivery .package-error')?.textContent.includes('Installation failed')`, 'duplicate reports failure');
  assert.equal(await evaluate(`document.querySelector('#sdk-delivery .package-approval input').checked`), true, 'failure preserves permission selection');
  assert.equal(await evaluate(`sdkProtocol.componentPackages.length`), 1, 'failed import leaves project intact');
  await evaluate(`sdkClick('Cancel')`);

  await waitFor(`!![...document.querySelectorAll('#sdk-delivery .palette-node-group button')].find(b => b.textContent.includes('example.reaction-button'))`, 'component in palette');
  await evaluate(`[...document.querySelectorAll('#sdk-delivery .palette-node-group button')].find(b => b.textContent.includes('example.reaction-button')).click()`);
  await waitFor(`sdkProtocol.graph.nodes.some(n => n.component.type === 'example.reaction-button')`, 'component inserted');
  assert.equal(await evaluate(`sdkProtocol.graph.edges.length`), 2, 'sequence insertion wires component');
  await evaluate(`sdkClick('Uninstall')`);
  await waitFor(`document.querySelector('#sdk-delivery').textContent.includes('used by 1 node')`, 'used package cannot be removed');
  assert.equal(await evaluate(`sdkProtocol.componentPackages.length`), 1);
  await evaluate(`(() => { const label = [...document.querySelectorAll('#sdk-delivery label')].find(l => l.firstChild?.textContent === 'Label'); const input = label?.querySelector('input'); if (!input) throw Error('Missing node label editor'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, 'Custom reaction step'); input.dispatchEvent(new Event('input', { bubbles: true })); })()`);
  await waitFor(`sdkProtocol.graph.nodes.some(n => n.label === 'Custom reaction step')`, 'custom component label edited');
  await evaluate(`sdkClick('Save')`);
  assert.equal(await evaluate(`sdkSaved.graph.nodes.find(n => n.component.type === 'example.reaction-button').component.version`), '1.0.0');
  await evaluate(`sdkClick('Preview run')`);
  await waitFor(`document.querySelector('#sdk-delivery').textContent.includes('Begin experiment')`, 'preparation ready');
  await evaluate(`sdkClick('Begin experiment')`);
  await waitFor(`document.querySelector('#sdk-delivery').textContent.includes('Respond when you are ready')`, 'SDK participant screen');
  await evaluate(`sdkClick('Respond')`);
  await waitFor(`document.querySelector('#sdk-delivery').textContent.includes('Session data saved.')`, 'session saved');
  const evidence = await evaluate(`(async () => {
    const session = await (await import('/src/storage.js')).loadSession(sdkSessionId);
    const files = (await import('/src/exporter.js')).bundle(session, session.protocol_snapshot, session.events, session.responses);
    return { status: session.status, events: session.events, snapshot: JSON.parse(files['protocol_snapshot.json']), csv: files['events.csv'] };
  })()`);
  assert.equal(evidence.status, 'completed');
  assert.equal(evidence.snapshot.componentPackages.length, 1);
  assert.ok(evidence.events.some(e => e.componentType === 'example.reaction-button' && e.eventType === 'component_completed'));
  assert.ok(evidence.csv.includes('example.reaction-button'));
  assert.equal(evidence.events.find(e => e.componentType === 'example.reaction-button' && e.eventType === 'component_completed').payload.outputs.pressed, true);
  assert.equal(evidence.snapshot.graph.nodes.find(n => n.component.type === 'example.reaction-button').label, 'Custom reaction step');
  console.log('SDK delivery passed: actual Composer install, palette insertion, wiring, uninstall protection, save, participant run and complete export');
} finally { await browser.close(); }
