import test from 'node:test';
import assert from 'node:assert/strict';
import {parseScreenTemplate,screenTemplateSnapshot,SCREEN_TEMPLATE_MAX_BYTES} from '../src/participantUi/screenTemplateFile.js';
import {participantUiTemplate} from '../src/core/participantUi.js';
test('screen templates preserve theme, IDs, bindings, options and fixed resolution without mutating source',()=>{
 const schema=participantUiTemplate('rating');schema.root.props.screenWidth=1280;schema.root.props.screenHeight=720;schema.theme={ink:'#123456'};const input=schema.root.children.find(e=>e.type==='Input');input.props={...input.props,inputType:'choice',options:[{value:'0',label:'None, = zero'}]};input.bindings={label:'variables.caption'};
 const snapshot=screenTemplateSnapshot(schema);assert.deepEqual(parseScreenTemplate(JSON.stringify(snapshot)),schema);snapshot.root.props.padding=64;assert.notEqual(schema.root.props.padding,64);
});
test('screen template import rejects invalid JSON, schema, malformed nodes, duplicate names and oversized files',()=>{
 assert.throws(()=>parseScreenTemplate('{'),/valid JSON/);assert.throws(()=>parseScreenTemplate('{}'),/screen configuration/);
 const schema=participantUiTemplate('rating');schema.root.children.push(structuredClone(schema.root.children.find(e=>e.type==='Input')));assert.throws(()=>parseScreenTemplate(JSON.stringify(schema)),/screen configuration/);
 assert.throws(()=>parseScreenTemplate(JSON.stringify({schemaVersion:'1.0.0',root:{id:'root',type:'Screen',children:{}}})),/valid participant screen/);
 assert.throws(()=>parseScreenTemplate(' '.repeat(SCREEN_TEMPLATE_MAX_BYTES+1)),/5 MB/);
});
