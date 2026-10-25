import { createServer } from 'vite';
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';
const server=await createServer({server:{port:15174,host:'127.0.0.1'},plugins:[{name:'step3-fixture',configureServer(s){s.middlewares.use('/__step3.html',async(req,res)=>{res.setHeader('Content-Type','text/html');res.end(await s.transformIndexHtml('/__step3.html','<html><body><div id="test"></div></body></html>'));});}}]});
await server.listen();
const child=spawn(process.env.CHROME_BIN || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',['--headless=new','--no-sandbox','--disable-gpu','--no-first-run','--remote-debugging-port=15175',`--user-data-dir=${mkdtempSync(join(tmpdir(),'pf-step3-'))}`,'http://127.0.0.1:15174/__step3.html'],{stdio:'ignore'});
let socket;
try {
 let targets; for(let i=0;i<100;i++){try{targets=await fetch('http://127.0.0.1:15175/json/list',{signal:AbortSignal.timeout(500)}).then(r=>r.json());if(targets.some(t=>t.type==='page'))break;}catch{}await new Promise(r=>setTimeout(r,100));}
 socket=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>socket.addEventListener('open',r,{once:true}));
 let id=0;const pending=new Map();socket.addEventListener('message',e=>{const m=JSON.parse(e.data);if(pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}});
 const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});socket.send(JSON.stringify({id:n,method,params}));});
 const ev=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;};
 const wait=async expr=>{for(let i=0;i<100;i++){if(await ev(expr))return;await new Promise(r=>setTimeout(r,100));}throw Error('Timeout '+expr);};
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
 await ev(`(async()=>{window.React=(await import('/node_modules/.vite/deps/react.js')).default;const client=await import('/node_modules/.vite/deps/react-dom_client.js');const createRoot=client.createRoot||client.default.createRoot;window.root=createRoot(document.getElementById('test'));window.Header=(await import('/src/composer/Header.jsx')).default;window.lang=await import('/src/i18n.jsx');await import('/src/composer/composer-v2.css');await import('/src/composer/questionnaire-v2.css');await import('/src/theme/base.css');await import('/src/pf-workflow.css');window.draw=(dirty)=>root.render(React.createElement('main',{className:'composer-v2'},React.createElement(Header,{s:{protocol:{metadata:{name:'Pilot'}},t:k=>lang.translate(k,'ja'),validation:{valid:true},actions:{},editorMode:'quick'},hasUnsaved:dirty})));draw(true);})()`);
 await wait(`!!document.querySelector('.composer-header')`);
 const header=await ev(`(()=>{const h=document.querySelector('.composer-header');const controls=[...h.querySelectorAll('button,input,summary')].filter(e=>!e.closest('details')||e.tagName==='SUMMARY');return {count:controls.length,primary:h.querySelectorAll('button.primary').length,top:controls.map(e=>Math.round(e.getBoundingClientRect().top)),height:h.getBoundingClientRect().height,text:h.innerText};})()`);
 assert.equal(header.count,11);assert.equal(header.primary,1);assert.ok(Math.max(...header.top)-Math.min(...header.top)<20,JSON.stringify(header));console.log('1440px header:',header);
 await ev(`draw(false)`);await wait(`document.querySelector('button.primary').textContent.includes('プレビュー実行')`);
 await ev(`(async()=>{const core=await import('/src/core/index.js');const Inspector=(await import('/src/composer/Inspector.jsx')).default;const protocol=core.createProtocolGraph({name:'Pilot'});const registry=core.createCoreComponentRegistry();const s={protocol,registry,selectedNode:protocol.graph.nodes[0],locked:true,editorMode:'quick',language:'ja',t:k=>lang.translate(k,'ja'),validation:{valid:false,errors:[{code:'config_media_mode_invalid',message:'config_media_mode_invalid'}],warnings:[]},actions:{},selectedSet:()=>new Set()};root.render(React.createElement(lang.LanguageProvider,null,React.createElement(Inspector,{s})));})()`);
 await wait(`!!document.querySelector('.composer-inspector')`);
 const inspector=await ev(`document.querySelector('.composer-inspector').innerText`);
 assert.doesNotMatch(inspector, /@[0-9]+\.[0-9]+\.[0-9]+|config_media_mode_invalid/);
 assert.match(inspector, /技術情報/);
 console.log('Inspector visible DOM: no version string or raw issue code; technical disclosures remain collapsed');
 await ev(`(async()=>{window.catalogCalls=0;window.fetch=async(url,opts)=>{if(String(url).includes('/metrics'))return new Response('{}');const op=JSON.parse(opts.body).operation;let result=[];if(op==='me')result={name:'Test researcher'};if(op==='researches')result=++catalogCalls===1?[{id:'1',name:'Existing research'}]:[{id:'1',name:'Existing research'},{id:'2',name:'New research'}];return new Response(JSON.stringify({result}));};sessionStorage.setItem('physioflow.operator-connection.v1',JSON.stringify({baseUrl:location.origin,accessToken:'fixture'}));localStorage.setItem('physioflow.ui-language','ja');window.Admin=(await import('/src/AdminMonitorPage.jsx')).default;root.render(React.createElement(lang.LanguageProvider,null,React.createElement(Admin,{page:'database'})));})()`);
 await wait(`document.querySelector('select')?.textContent.includes('Existing research') && !document.querySelector('fieldset').disabled`);
 assert.equal(await ev(`document.querySelector('select').textContent.includes('New research')`),false);
 await ev(`document.querySelector('fieldset button').click()`);
 await wait(`document.querySelector('select').textContent.includes('New research')`);
 assert.equal(await ev('catalogCalls'),2);console.log('Database DOM: second response appears only after refresh; catalog calls = 2');
}finally{socket?.close();child.kill();await server.close();}




