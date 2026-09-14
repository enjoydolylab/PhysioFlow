import assert from 'node:assert/strict';

export async function verifyCanvasWorkflow(evaluate, waitFor, capture, send) {
  await evaluate(`(async () => {
    const React = (await import('/node_modules/.vite/deps/react.js')).default;
    const {default: Builder} = await import('/src/ParticipantUiBuilder.jsx');
    const core = await import('/src/core/index.js');
    window.workflowSchema = core.createParticipantScreen({children:['A','B','C'].map(id => core.createUiElement('Text', {id, props:{text:id}}))});
    window.workflowCommits = 0;
    const render = () => window.authoringRoot.render(React.createElement(Builder, {key:'workflow', schema:window.workflowSchema, onChange:next=>{window.workflowSchema=next;window.workflowCommits++;render();}}));
    render();
    window.workflowSelect = (label, value) => {
      const el = document.querySelector('#authoring-regression select[aria-label="'+label+'"]');
      el.value=value;el.dispatchEvent(new Event('change',{bubbles:true}));
    };
    window.workflowDrag = (id, dx, dy) => {
      const el=document.querySelector('#authoring-regression .ui-canvas-root [data-ui-id="'+id+'"]');
      const r=el.getBoundingClientRect();
      el.dispatchEvent(new MouseEvent('mousedown',{bubbles:true,clientX:r.x+10,clientY:r.y+10}));
      window.dispatchEvent(new MouseEvent('mousemove',{clientX:r.x+10+dx,clientY:r.y+10+dy}));
      window.dispatchEvent(new MouseEvent('mouseup'));
    };
  })()`);
  await waitFor(`!!document.querySelector('.ui-canvas-root [data-ui-id="A"]')`, 'workflow mounted');
  await evaluate(`workflowDrag('A',0,300)`);
  await waitFor(`window.workflowSchema.root.children[2].id === 'A'`, 'flow drag reorders');
  assert.equal(await evaluate(`Boolean(workflowSchema.root.props.free)`), false, 'drag never changes layout mode');
  assert.equal(await evaluate(`workflowSchema.root.children.some(child=>child.props.x != null)`), false);
  await evaluate(`document.querySelector('#authoring-regression button[title="Undo (Ctrl+Z)"]').click()`);
  await waitFor(`workflowSchema.root.children[0].id === 'A'`, 'undo restores order');
  await evaluate(`workflowSelect('Screen size','1024x768')`);
  await waitFor(`workflowSchema.root.props.screenWidth === 1024`, 'screen size saved');
  assert.deepEqual(await evaluate(`(()=>{const el=document.querySelector('#authoring-regression .ui-canvas-device');return [el.offsetWidth,el.offsetHeight];})()`), [1024,768]);
  await evaluate(`document.querySelector('#authoring-regression .ui-canvas-root .participant-ui-screen').click()`);
  await waitFor(`!!document.querySelector('#authoring-regression select[aria-label="Layout mode"]')`, 'container selected');
  await evaluate(`workflowSelect('Layout mode','free')`);
  await waitFor(`workflowSchema.root.props.free === true`, 'explicit free mode');
  await evaluate(`document.querySelector('#authoring-regression .ui-canvas-root [data-ui-id="A"]').click()`);
  await waitFor(`document.querySelector('#authoring-regression .ui-canvas-root [data-ui-id="A"]').classList.contains('selected')`, 'A selected before additive selection');
  await evaluate(`document.querySelector('#authoring-regression .ui-canvas-root [data-ui-id="B"]').dispatchEvent(new MouseEvent('click',{bubbles:true,shiftKey:true}))`);
  await waitFor(`document.querySelector('#authoring-regression .ui-selection-inspector')?.textContent.includes('2 elements selected')`, 'multi selection has its own inspector');
  const groupBefore = await evaluate(`workflowSchema.root.children.map(child=>({...child.props}))`);
  if (send) {
    await evaluate(`document.querySelector('#authoring-regression .ui-canvas-wrap').scrollIntoView({block:'center'})`);
    const point = await evaluate(`(() => {const r=document.querySelector('#authoring-regression .ui-canvas-root [data-ui-id="A"]').getBoundingClientRect();return {x:r.left+12,y:r.top+r.height/2};})()`);
    await send('Input.dispatchMouseEvent',{type:'mouseMoved',...point});
    await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...point});
    await send('Input.dispatchMouseEvent',{type:'mouseMoved',buttons:1,x:point.x+40,y:point.y+24});
    await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,x:point.x+40,y:point.y+24});
  } else {
    await evaluate(`workflowDrag('A',40,24)`);
    await evaluate(`document.querySelector('#authoring-regression .ui-canvas-root [data-ui-id="A"]').dispatchEvent(new MouseEvent('click',{bubbles:true,detail:1}))`);
  }
  assert.ok(await evaluate(`!!document.querySelector('#authoring-regression .ui-selection-inspector')`), 'post-drag click preserves multi selection');
  const groupAfter = await evaluate(`workflowSchema.root.children.map(child=>({...child.props}))`);
  assert.ok(groupAfter[0].x > groupBefore[0].x, 'group actually moves');
  assert.equal(groupAfter[0].x-groupBefore[0].x, groupAfter[1].x-groupBefore[1].x, 'selected siblings move equally');
  assert.deepEqual(groupAfter[2], groupBefore[2], 'unselected sibling remains unchanged');
  await evaluate(`document.querySelector('#authoring-regression button[title="Undo (Ctrl+Z)"]').click()`);
  await waitFor(`workflowSchema.root.children[0].props.x === ${groupBefore[0].x}`, 'group drag is one undo');
  await evaluate(`document.querySelector('#authoring-regression .ui-canvas-root [data-ui-id="B"]').dispatchEvent(new MouseEvent('click',{bubbles:true,shiftKey:true}))`);
  await waitFor(`!document.querySelector('#authoring-regression .ui-selection-inspector') && document.querySelector('#authoring-regression .ui-canvas-root [data-ui-id="A"]').classList.contains('selected')`, 'Shift deselection keeps the remaining selection');
  const cancelBefore = await evaluate(`JSON.stringify(workflowSchema)`);
  await evaluate(`(() => {
    const el=document.querySelector('#authoring-regression .ui-canvas-root [data-ui-id="A"]'); const r=el.getBoundingClientRect();
    el.dispatchEvent(new MouseEvent('mousedown',{bubbles:true,clientX:r.x+10,clientY:r.y+10}));
    window.dispatchEvent(new MouseEvent('mousemove',{clientX:r.x+60,clientY:r.y+40}));
    window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));
    window.dispatchEvent(new MouseEvent('mouseup'));
  })()`);
  assert.equal(await evaluate(`JSON.stringify(workflowSchema)`), cancelBefore, 'Escape cancels the drag without committing');
  await evaluate(`document.querySelector('#authoring-regression .ui-tree [data-ui-id="A"] button[aria-label="Lock Text"]').click()`);
  await waitFor(`workflowSchema.root.children[0].props.locked === true`, 'lock saved');
  const locked = await evaluate(`JSON.stringify(workflowSchema)`);
  await evaluate(`workflowDrag('A',100,100)`);
  assert.equal(await evaluate(`JSON.stringify(workflowSchema)`), locked, 'locked drag does not mutate screen');
  await evaluate(`document.querySelector('#authoring-regression .ui-tree [data-ui-id="A"] .ui-tree-node').click()`);
  await evaluate(`document.querySelector('#authoring-regression .ui-tree [data-ui-id="A"] .ui-tree-node').dispatchEvent(new KeyboardEvent('keydown',{bubbles:true,key:'ArrowRight'}))`);
  assert.equal(await evaluate(`JSON.stringify(workflowSchema)`), locked, 'locked keyboard nudge does not mutate screen');
  await evaluate(`document.querySelector('#authoring-regression .ui-tree [data-ui-id="A"] button[aria-label="Unlock Text"]').click()`);
  await waitFor(`workflowSchema.root.children[0].props.locked === false`, 'unlock saved');
  const widthBefore = await evaluate(`workflowSchema.root.children[0].props.width`);
  await evaluate(`(() => {const input=document.querySelector('#authoring-regression input[aria-label="Element Width"]');input.focus();Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'-20');input.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  await evaluate(`document.activeElement.blur()`);
  assert.equal(await evaluate(`workflowSchema.root.children[0].props.width`), widthBefore, 'invalid negative size is rejected');
  await evaluate(`workflowDrag('A',2000,0)`);
  await waitFor(`document.querySelector('#authoring-regression .ui-screen-checks').textContent.includes('Outside screen: A')`, 'overflow is reported');
  await evaluate(`document.querySelector('#authoring-regression button[aria-label="定位越界元素 A"]').click()`);
  await waitFor(`document.activeElement?.getAttribute('aria-label') === 'Element X'`, 'overflow check focuses position');
  await evaluate(`(() => {const input=document.activeElement;Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'0');input.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  assert.notEqual(await evaluate(`workflowSchema.root.children[0].props.x`), 0, 'typing does not commit intermediate positions');
  await evaluate(`document.activeElement.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}))`);
  await waitFor(`workflowSchema.root.children[0].props.x === 0`, 'Enter commits the position');
  await waitFor(`!document.querySelector('#authoring-regression .ui-screen-checks').textContent.includes('Outside screen: A')`, 'correcting position clears the issue');
  await evaluate(`(() => { const old=window.confirm;window.confirm=()=>true;[...document.querySelectorAll('#authoring-regression .ui-preset-menu button')].find(button=>button.textContent==='Left / right stimuli').click();window.confirm=old; })()`);
  await waitFor(`workflowSchema.root.children.filter(child=>child.type==='Media').length===2`, 'comparison preset');
  assert.equal(await evaluate(`workflowSchema.root.props.screenWidth`), 1280);
  assert.ok(await evaluate(`document.querySelector('#authoring-regression .ui-screen-checks summary').textContent.includes('2 missing media')`));
  const editorBounds = await evaluate(`(() => {
    const screen=document.querySelector('#authoring-regression .ui-canvas-root .participant-ui-screen');
    const r=screen.getBoundingClientRect(), scale=r.width/1280;
    return [...screen.children].filter(child=>child.dataset.uiId).map(child=>{const b=child.getBoundingClientRect();return [(b.x-r.x)/scale,(b.y-r.y)/scale,b.width/scale,b.height/scale];});
  })()`);
  assert.ok(Math.abs(editorBounds[0][3]-360)<1, 'media wrapper preserves preset height');
  const editorMediaHeight = await evaluate(`(() => {const screen=document.querySelector('#authoring-regression .ui-canvas-root .participant-ui-screen');return screen.querySelector('.participant-ui-media').getBoundingClientRect().height/(screen.getBoundingClientRect().width/1280);})()`);
  assert.ok(Math.abs(editorMediaHeight-360)<1, 'media content fills the edited area');
  await evaluate(`[...document.querySelectorAll('#authoring-regression .ui-builder-toolbar button')].find(button=>button.textContent==='Preview').click()`);
  await waitFor(`!!document.querySelector('#authoring-regression .ui-screen-surface')`, 'shared runtime preview');
  assert.deepEqual(await evaluate(`(()=>{const el=document.querySelector('#authoring-regression .ui-screen-surface');return [el.offsetWidth,el.offsetHeight];})()`), [1280,720]);
  const ratio = await evaluate(`(()=>{const r=document.querySelector('#authoring-regression .ui-screen-surface').getBoundingClientRect();return r.width/r.height;})()`);
  assert.ok(Math.abs(ratio-16/9)<0.001, 'preview scales uniformly');
  const previewBounds = await evaluate(`(() => {
    const screen=document.querySelector('#authoring-regression .ui-screen-surface .participant-ui-screen');
    const r=screen.getBoundingClientRect(), scale=r.width/1280;
    return [...screen.children].map(child=>{const b=child.getBoundingClientRect();return [(b.x-r.x)/scale,(b.y-r.y)/scale,b.width/scale,b.height/scale];});
  })()`);
  for (let i=0;i<editorBounds.length;i++) for(let j=0;j<4;j++) assert.ok(Math.abs(editorBounds[i][j]-previewBounds[i][j])<1, 'editor and runtime preview geometry agree');
  await evaluate(`document.querySelector('#authoring-regression .ui-screen-checks button[aria-label^="配置媒体"]').click()`);
  await waitFor(`document.activeElement?.getAttribute('aria-label') === 'Media source URL'`, 'media check returns from preview and focuses source');
  assert.ok(await evaluate(`!!document.querySelector('#authoring-regression .ui-canvas-device')`), 'locating an issue restores editing');
  await evaluate(`(() => {const input=document.activeElement;Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360"><rect width="480" height="360" fill="green"/></svg>'));input.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  await waitFor(`document.querySelector('#authoring-regression .ui-screen-checks summary').textContent.includes('1 missing media')`, 'configuring source clears only the corresponding media issue');
  if (capture) {
    await waitFor(`!!document.querySelector('#authoring-regression .ui-canvas-device')`, 'return to editor');
    await capture();
  }
}
