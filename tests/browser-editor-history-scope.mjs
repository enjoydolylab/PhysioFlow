import assert from 'node:assert/strict';
import {openTestBrowser} from './browser-harness.mjs';
const browser=await openTestBrowser();
try{
 await browser.evaluate(`(async()=>{window.historyErrors=[];window.addEventListener('error',event=>historyErrors.push(event.message));const transformed=await fetch('/src/app/useUndoRedo.js').then(r=>r.text());const reactPath=transformed.match(/from "([^"]*react.js[^"]*)"/)[1];const React=(await import(reactPath)).default;const {createRoot}=(await import('/node_modules/.vite/deps/react-dom_client.js')).default;const {useUndoRedo}=await import('/src/app/useUndoRedo.js');const host=document.createElement('div');document.body.append(host);function Harness(){const [current,setCurrent]=React.useState({value:0,version:{status:'draft'}});const [,dirty]=React.useState(false);const history=useUndoRedo({current,setCurrent,setHasUnsaved:dirty});window.historyCheck={...history,current,edit:value=>{history.pushUndo(current);setCurrent({...current,value});}};return React.createElement('p',null,current.value);}createRoot(host).render(React.createElement(React.StrictMode,null,React.createElement(Harness)));})()`);
 await browser.waitFor(`!!window.historyCheck || window.historyErrors.length>0`,'history ready');assert.deepEqual(await browser.evaluate('window.historyErrors'),[]);
 const edit=async value=>{await browser.evaluate(`historyCheck.edit(${value})`);await browser.waitFor(`historyCheck.current.value===${value}`,'edit '+value);};
 for(let i=1;i<=5;i++)await edit(i);
 await browser.evaluate('historyCheck.beginScope()');
 for(let i=6;i<=70;i++)await edit(i);
 assert.equal(await browser.evaluate('historyCheck.undoStack.length'),60);
 for(let i=69;i>=10;i--){await browser.evaluate('historyCheck.undo()');await browser.waitFor(`historyCheck.current.value===${i}`,'undo '+i);}
 assert.equal(await browser.evaluate('historyCheck.undoStack.length'),0);
 await browser.evaluate('historyCheck.endScope();historyCheck.beginScope()');await edit(100);await browser.evaluate('historyCheck.undo()');await browser.waitFor('historyCheck.current.value===10','new scope undo');
 await browser.evaluate('historyCheck.endScope()');await browser.waitFor('historyCheck.redoStack.length===0','scope clears redo');
 console.log('StrictMode history: 60-frame cap keeps scope boundary correct; scope switch clears redo');
}finally{await browser.close();}
