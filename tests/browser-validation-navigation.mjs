import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {openTestBrowser} from './browser-harness.mjs';
const browser=await openTestBrowser();
try{
 await browser.evaluate(`(async()=>{
 const React=(await import('/node_modules/.vite/deps/react.js')).default;
 const {createRoot}=(await import('/node_modules/.vite/deps/react-dom_client.js')).default;
 const {default:Inspector}=await import('/src/composer/Inspector.jsx');const {translate}=await import('/src/i18n.jsx');
 const protocol={graph:{nodes:[{id:'n',label:'評価'}],edges:[{id:'e'}],groups:[]}};
 window.navigation={node:'old',edge:'old-edge',ids:['old','other']};
 const s={t:k=>translate(k,'ja'),language:'ja',locked:true,protocol,registry:{},selectedNode:null,selectedEdge:null,validation:{valid:false,errors:[{code:'NODE_ERROR',nodeId:'n',message:'Node configuration'},{code:'EDGE_ERROR',edgeId:'e',message:'Connection'},{code:'GLOBAL_ERROR',message:'Protocol settings'}],warnings:[]},showAllValidation:false,setShowAllValidation:()=>{},setSelectedNodeId:id=>window.navigation.node=id,setSelectedEdgeId:id=>window.navigation.edge=id,setSelectedIds:ids=>window.navigation.ids=[...ids],focusNode:id=>window.focusedIssue=id,actions:{}};
 document.getElementById('root').style.display='none';const host=document.createElement('div');host.id='validation-test';document.body.append(host);createRoot(host).render(React.createElement(Inspector,{s,resources:{}}));
 })()`);
 await browser.waitFor(`document.querySelectorAll('#validation-test .composer-validation button').length===3`,'validation loaded');
 assert.equal(await browser.evaluate(`document.querySelectorAll('#validation-test .composer-validation button')[2].disabled`),true);
 await browser.evaluate(`document.querySelectorAll('#validation-test .composer-validation button')[0].click()`);
 assert.deepEqual(await browser.evaluate('window.navigation'),{node:'n',edge:null,ids:['n']});
 assert.equal(await browser.evaluate('window.focusedIssue'),'n');
 await browser.evaluate(`document.querySelectorAll('#validation-test .composer-validation button')[1].click()`);
 assert.deepEqual(await browser.evaluate('window.navigation'),{node:null,edge:'e',ids:[]});
 await browser.evaluate(`document.querySelector('#validation-test input[type=checkbox]').click()`);
 await browser.waitFor(`document.querySelector('#validation-test [role=status]')?.textContent.includes('選択中の項目')`,'localized empty selection');
 await mkdir('artifacts/editor-progression-2026-10-14',{recursive:true});await writeFile('artifacts/editor-progression-2026-10-14/navigation.json',JSON.stringify({nodeClearsOldEdgeAndMultiSelection:true,edgeClearsOldNodeAndMultiSelection:true,globalIssueReadableWithoutFalseNavigation:true,selectionFilter:true,japanese:true},null,2));
 console.log('Editor validation navigation and Japanese selection filter passed');
}finally{await browser.close();}
