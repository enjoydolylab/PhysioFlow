import assert from 'node:assert/strict';
import { verifyCanvasWorkflow } from './browser-canvas-workflow.mjs';

export async function verifyAuthoringScenarios(evaluate, waitFor, capture, send) {
  await evaluate(`(async () => {
    const React = (await import('/node_modules/.vite/deps/react.js')).default;
    const { createRoot } = (await import('/node_modules/.vite/deps/react-dom_client.js')).default;
    const { default: Options } = await import('/src/composer/ResponseOptionsEditor.jsx');
    const { default: Generator } = await import('/src/composer/TrialGenerator.jsx');
    const container = document.createElement('div'); container.id = 'authoring-regression'; document.body.append(container);
    window.authoringRoot = createRoot(container, { onUncaughtError: error => { container.textContent = error.stack || String(error); } });
    window.authoringState = { options: 'yes=Yes,key=f', config: { taskKind: 'stroop', seed: 7, trials: [] } };
    const render = () => window.authoringRoot.render(React.createElement('div', null,
      React.createElement(Options, { value: window.authoringState.options, onChange: options => { window.authoringState.options = options; render(); } }),
      React.createElement(Generator, { config: window.authoringState.config, onChange: config => { window.authoringState.config = config; render(); } })
    ));
    render();
    window.authoringInput = (label, value) => {
      const input = container.querySelector('input[aria-label="' + label + '"]');
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, value);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    };
  })()`);
  await waitFor(`!!document.querySelector('#authoring-regression input')`, 'customization editors mount');
  await evaluate(`authoringInput('Option 1 label', 'Yes, equal=positive')`);
  await waitFor(`window.authoringState.options[0]?.label === 'Yes, equal=positive'`, 'structured response label preserves punctuation');
  assert.equal(await evaluate(`window.authoringState.options[0].key`), 'f');
  await evaluate(`authoringInput('Number of trials', '24')`);
  await waitFor(`document.querySelector('#authoring-regression input[aria-label="Number of trials"]').value === '24'`, 'trial count input');
  await evaluate(`document.querySelector('#authoring-regression .cognitive-generate button').click()`);
  await waitFor(`window.authoringState.config.trials.length === 24`, 'requested trial count generated');
  assert.equal(await evaluate(`window.authoringState.config.trials.filter(trial => trial.congruent).length`), 12);
  await evaluate(`authoringInput('Number of trials', '25')`);
  await waitFor(`document.querySelector('#authoring-regression .cognitive-generate button').disabled`, 'invalid Stroop count blocked');
  assert.equal(await evaluate(`window.authoringState.config.trials.length`), 24, 'invalid input does not overwrite saved trials');
  await evaluate(`(async () => {
    const React = (await import('/node_modules/.vite/deps/react.js')).default;
    const { default: Repeat } = await import('/src/composer/RepeatSequenceEditor.jsx');
    const core = await import('/src/core/index.js');
    const registry = core.createCoreComponentRegistry();
    let protocol = core.createProtocolGraph();
    const ids = [];
    for (const label of ['Stimulus', 'Response', 'Rest']) {
      const edge = protocol.graph.edges.find(edge => protocol.graph.nodes.find(node => node.id === edge.target.nodeId)?.component.type === 'core.end');
      const result = core.insertNodeOnControlEdge(protocol, edge.id, 'display.screen', { label, config: registry.get('display.screen').defaultConfig });
      protocol = result.protocol; ids.push(result.node.id);
    }
    window.repeatIds = ids;
    window.authoringRoot.render(React.createElement(Repeat, { protocol, registry, selectedIds: [ids[0]], onApply: result => { window.repeatResult = result; } }));
  })()`);
  await waitFor(`!!document.querySelector('#authoring-regression select')`, 'repeat sequence editor');
  await evaluate(`(() => { const select = document.querySelector('#authoring-regression select'); select.value = window.repeatIds[1]; select.dispatchEvent(new Event('change', { bubbles: true })); })()`);
  await waitFor(`document.querySelector('#authoring-regression').textContent.includes('2 steps × 3 passes = 6 step visits')`, 'repeat count and order preview');
  await evaluate(`document.querySelector('#authoring-regression button').click()`);
  assert.equal(await evaluate(`window.repeatResult.node.config.maxIterations`), 3);
  assert.deepEqual(await evaluate(`window.repeatResult.ordered`), await evaluate(`window.repeatIds.slice(0, 2)`));
  for (const scenario of ['screen', 'zoomed', 'nested']) {
  await evaluate(`(async () => {
    const React = (await import('/node_modules/.vite/deps/react.js')).default;
    const { default: Builder } = await import('/src/ParticipantUiBuilder.jsx');
    const core = await import('/src/core/index.js');
    window.canvasSchema = core.participantUiTemplate('instruction');
    if ('${scenario}' === 'nested') {
      window.canvasSchema.root.children = [core.createUiElement('Layout', { props: { direction:'column', padding:12 }, children:window.canvasSchema.root.children }), core.createUiElement('Text', { props:{text:'Outside layout'} })];
    }
    window.canvasCommits = 0;
    const render = () => window.authoringRoot.render(React.createElement(Builder, {
      key:'${scenario}', schema: window.canvasSchema, onChange: next => { window.canvasSchema = next; window.canvasCommits++; render(); }
    }));
    render();
    window.canvasRects = () => [...document.querySelectorAll('#authoring-regression .ui-canvas-root [data-ui-id]')].map(el => {
      const r = el.getBoundingClientRect(); return { id: el.dataset.uiId, x:r.x, y:r.y, w:r.width, h:r.height };
    });
  })()`);
  await waitFor(`!!document.querySelector('#authoring-regression .ui-canvas-root [data-ui-id]')`, 'canvas mounts');
  // Zoom presets (Fit / Reset) now live behind the zoom dropdown.
  await evaluate(`(() => { const menu = document.querySelector('#authoring-regression .ui-zoom-controls .ui-menu'); if (menu) menu.open = true; const button = [...document.querySelectorAll('#authoring-regression .ui-menu-pop button')].find(item => item.textContent.includes('Reset to 100%')); button?.click(); })()`);
  await evaluate(`document.querySelector('#authoring-regression .ui-canvas-root h1').click()`);
  await evaluate(`[...document.querySelectorAll('#authoring-regression [aria-label="Canvas editing mode"] button')].find(button => button.textContent === 'Free edit').click()`);
  await waitFor(`window.canvasCommits === 1`, 'explicit free mode conversion');
  assert.equal(await evaluate(`canvasSchema.root.props.free`), true, 'toolbar changes mode while a leaf is selected');
  if (scenario === 'nested') assert.equal(await evaluate(`canvasSchema.root.children[0].props.free`), true, 'nested containers also become freely editable');
  await evaluate(`window.canvasCommits = 0`);
  if (scenario === 'zoomed') {
    await evaluate(`document.querySelector('#authoring-regression button[title="Zoom out (Ctrl+wheel)"]').click()`);
    await waitFor(`document.querySelector('#authoring-regression .ui-zoom-value').textContent === '90%'`, 'zoom applied');
  }
  const before = await evaluate(`canvasRects()`);
  const dragged = before[scenario === 'nested' ? 2 : 1];
  await evaluate(`(() => {
    const el = document.querySelector('#authoring-regression .ui-canvas-root [data-ui-id="${dragged.id}"]');
    el.dispatchEvent(new MouseEvent('mousedown', { bubbles:true, clientX:${dragged.x + 10}, clientY:${dragged.y + 10} }));
  })()`);
  await evaluate(`window.dispatchEvent(new MouseEvent('mousemove', {clientX:${dragged.x + 74}, clientY:${dragged.y + 58}}))`);
  await evaluate(`new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))`);
  const during = await evaluate(`canvasRects()`);
  await evaluate(`window.dispatchEvent(new MouseEvent('mouseup'))`);
  await waitFor(`window.canvasCommits === 1`, 'drag commits once');
  const after = await evaluate(`canvasRects()`);
  for (const original of before.filter(item => item.id !== dragged.id)) {
    for (const [phase, rects] of [['during', during], ['after', after]]) {
      const actual = rects.find(item => item.id === original.id);
      for (const key of ['x', 'y', 'w', 'h']) assert.ok(Math.abs(actual[key] - original[key]) < 1, phase + ' sibling ' + original.id + ' ' + key + ': ' + actual[key] + ' vs ' + original[key]);
    }
  }
  const result = after.find(item => item.id === dragged.id);
  const moving = during.find(item => item.id === dragged.id);
  assert.ok(Math.abs(result.x - dragged.x) > 10, 'free drag actually moves the element horizontally');
  assert.ok(Math.abs(result.x - moving.x) < 1, 'release preserves dragged x');
  assert.ok(Math.abs(result.y - moving.y) < 1, 'release preserves dragged y');
  await evaluate(`document.querySelector('#authoring-regression button[title="Undo (Ctrl+Z)"]').click()`);
  await waitFor(`window.canvasCommits === 2`, 'one undo restores flow');
  const restored = await evaluate(`canvasRects()`);
  for (const original of before) {
    const actual = restored.find(item => item.id === original.id);
    for (const key of ['x','y','w','h']) assert.ok(Math.abs(actual[key] - original[key]) < 1, scenario + ' undo ' + key);
  }
  }
  for (const [offset, expected] of [[100, 140], [120, 160]]) {
    await evaluate(`(async () => {
      const React = (await import('/node_modules/.vite/deps/react.js')).default;
      const { default: Canvas } = await import('/src/ParticipantUiCanvas.jsx');
      const core = await import('/src/core/index.js');
      const schema = core.createParticipantScreen({ props:{free:true}, children:[
        core.createUiElement('Rectangle', {id:'drag-shape', props:{x:40,y:40,width:40,height:40}}),
        core.createUiElement('Rectangle', {id:'snap-target', props:{x:120,y:160,width:80,height:40}})
      ]});
      window.snapCommit = null;
      window.authoringRoot.render(React.createElement(Canvas, {key:'snap-${offset}', schema, selectedIds:new Set(), onSelect:()=>{}, onMoveElement:(id,parent,x,y)=>{window.snapCommit={x,y};}}));
    })()`);
    await waitFor(`!!document.querySelector('[data-ui-id="drag-shape"]')`, 'snap canvas mounts');
    await evaluate(`(() => {
      const el = document.querySelector('[data-ui-id="drag-shape"]');
      const r = el.getBoundingClientRect();
      el.dispatchEvent(new MouseEvent('mousedown', {bubbles:true,clientX:r.x+10,clientY:r.y+10}));
      window.dispatchEvent(new MouseEvent('mousemove', {clientX:r.x+10+${offset},clientY:r.y+10}));
    })()`);
    await evaluate(`new Promise(resolve => requestAnimationFrame(resolve))`);
    assert.equal(await evaluate(`parseFloat(document.querySelector('[data-ui-id="drag-shape"]').style.left)`), expected, 'snap aligns the matching anchor');
    await evaluate(`window.dispatchEvent(new MouseEvent('mouseup'))`);
    assert.equal(await evaluate(`window.snapCommit.x`), expected, 'snap survives release');
  }
  await verifyCanvasWorkflow(evaluate, waitFor, capture, send);
  await evaluate(`window.authoringRoot.unmount(); document.getElementById('authoring-regression').remove()`);
}
