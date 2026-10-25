import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { transformWithOxc } from 'vite';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { isIdentifier, humanizeIssueCode } from '../src/composer/labels.js';
import { validationIssueMessage } from '../src/composer/toolbox.js';
import { fetchResearchCatalog } from '../src/databaseRefresh.js';

async function loadJsx(path) {
  const url = new URL(path, import.meta.url);
  const { code } = await transformWithOxc(await readFile(url, 'utf8'), url.pathname, { jsx: { runtime: 'automatic' } });
  const resolved = code.replace(/from "([^"]+)"/g, (_, spec) => `from "${spec.startsWith('.') ? new URL(spec, url).href : import.meta.resolve(spec)}"`);
  return (await import(`data:text/javascript;base64,${Buffer.from(resolved).toString('base64')}`)).default;
}

test('identifiers are distinguished from researcher messages', () => {
  for (const code of ['core.start', 'config_media_mode_invalid', 'config.media_mode_invalid', 'start']) assert.equal(isIdentifier(code), true);
  for (const text of ['Check media settings.', 'Start task', 'Start', '', null, 'core.start@1.0.0']) assert.equal(isIdentifier(text), false);
});
test('issue identifiers use a label map or a human fallback', () => {
  assert.equal(humanizeIssueCode('bad_code', { bad_code: 'Check duration.' }), 'Check duration.');
  assert.equal(isIdentifier(humanizeIssueCode('unknown_code')), false);
  assert.equal(humanizeIssueCode('Check duration.'), 'Check duration.');
  assert.equal(validationIssueMessage({code:'config_media_mode_invalid'}, 'ja'), validationIssueMessage({code:'config.media_mode_invalid'}, 'ja'));
  assert.doesNotMatch(validationIssueMessage({code:'unknown_code',message:'unknown_code'}, 'ja'), /unknown_code/);
});
test('composer header renders exactly one primary for clean, dirty and locked states', async () => {
  const Header = await loadJsx('../src/composer/Header.jsx');
  for (const hasUnsaved of [false,true]) for (const locked of [false,true]) {
    const html = renderToStaticMarkup(createElement(Header,{s:{ protocol:{metadata:{name:'Pilot'}},locked,t:x=>x,validation:{valid:true},actions:{},editorMode:'quick'},hasUnsaved}));
    assert.equal((html.match(/class="primary"/g)||[]).length,1);
    assert.match(html, hasUnsaved ? /class="primary"[^>]*>Save/ : /class="primary"[^>]*>(Prepare collection|Run preview)/);
    assert.equal((html.split('<details')[0].match(/<button/g)||[]).length,9);
    assert.doesNotMatch(html,/Mark migration reviewed/);
    assert.match(html,/aria-label="Undo" title="Undo" disabled/);
  }
});
test('sequence component types only render in advanced mode and when different', async () => {
  const Sequence=await loadJsx('../src/composer/Sequence.jsx');
  const ordered=[{id:'a',label:'Manual event',component:{type:'timing.wait'}}];
  const render=editorMode=>renderToStaticMarkup(createElement(Sequence,{s:{t:x=>x,editorMode},ordered}));
  assert.doesNotMatch(render('quick'), /timing.wait/);
  assert.match(render('advanced'), /timing.wait/);
  ordered[0].label='timing.wait';
  assert.doesNotMatch(render('advanced'), /<small>/);
});
test('research added in second response is listed after catalog refresh', async () => {
  let calls=0,meCalls=0;
  const client={me:async()=>{meCalls++;return {name:'Researcher'};},researches:async()=>++calls===1?[{id:'1',name:'Existing'}]:[{id:'1',name:'Existing'},{id:'2',name:'New research'}]};
  let state={researchId:'1',streamId:'selected-stream',...(await fetchResearchCatalog(client))};
  assert.equal(state.researches.some(r=>r.name==='New research'),false);
  state={...state,...await fetchResearchCatalog(client)};
  assert.equal(state.researches.some(r=>r.name==='New research'),true);
  assert.equal(state.streamId,'selected-stream');assert.equal(state.researchId,'1');assert.equal(meCalls,2);
});

