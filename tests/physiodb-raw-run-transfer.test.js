import test from 'node:test';
import assert from 'node:assert/strict';
import { uploadRawRunRecording } from '../src/physioDBRawRunTransfer.js';
const channels=[{row:1,name:'C3',unit:'uV'}];
function raw(count=1101){return new Blob([Array.from({length:count},(_,i)=>JSON.stringify({sequence:i+1,timestamp:1791910000+i*.004,rows:[i,i+1]})).join('\n')+'\n']);}
test('streaming raw uploader validates source and resumes confirmed batches without reupload',async()=>{
 const calls=[];let manifest;
 const client={beginRecording:async input=>{manifest=input;return {confirmedSamples:500};},appendRecording:async input=>{calls.push(input);return {confirmedSamples:input.offset+input.samples.length};},finishRecording:async()=>({status:'verified'})};
 assert.equal((await uploadRawRunRecording({file:raw(),channels,sessionId:'run',recordingId:'raw',client})).status,'verified');
 assert.equal(manifest.sampleCount,1101);assert.match(manifest.sourceSha256,/^[a-f0-9]{64}$/);assert.deepEqual(calls.map(c=>[c.offset,c.samples.length]),[[500,500],[1000,101]]);assert.equal(calls[0].samples[0].values[0],501);
});
test('invalid tail stops before stream creation; cancellation after a batch prevents further requests',async()=>{
 let began=0;const client={beginRecording:async()=>{began++;return{confirmedSamples:0};},appendRecording:async()=>{},finishRecording:async()=>{}};
 await assert.rejects(uploadRawRunRecording({file:new Blob([await raw().text(),'{}\n']),channels,sessionId:'run',recordingId:'raw',client}),/Invalid raw/);assert.equal(began,0);
 const abort=new AbortController();let writes=0;client.appendRecording=async()=>{writes++;abort.abort();return {confirmedSamples:500};};
 await assert.rejects(uploadRawRunRecording({file:raw(),channels,sessionId:'run',recordingId:'raw',client,signal:abort.signal}),/cancelled/);assert.equal(writes,1);
});
