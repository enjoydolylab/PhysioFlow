import test from 'node:test';
import assert from 'node:assert/strict';
import { readBrainFlowRecording } from '../src/brainFlowRecording.js';
const row={sequence:1,timestamp:1.000001,rows:[0,1,-2]};
const collect=async source=>{const result=[];for await(const value of source)result.push(value);return result;};
test('recording reader handles split chunks, CRLF and a final row without newline',async()=>{
 const text=JSON.stringify(row)+'\r\n'+JSON.stringify({...row,sequence:2});
 const bytes=new TextEncoder().encode(text);let cancelled=false;
 const file={stream:()=>new ReadableStream({start(c){for(const byte of bytes)c.enqueue(Uint8Array.of(byte));c.close();},cancel(){cancelled=true;}})};
 assert.deepEqual(await collect(readBrainFlowRecording(file)),[row,{...row,sequence:2}]);
 assert.equal(cancelled,false); // already closed
});
test('malformed, blank, oversized and preview rows fail with a line number',async()=>{
 for(const tail of ['broken','',JSON.stringify({sequence:2,timestamp:2,values:{eeg:0}})]) await assert.rejects(collect(readBrainFlowRecording(new Blob([JSON.stringify(row)+'\n'+tail+'\n']))),/line 2/);
 await assert.rejects(collect(readBrainFlowRecording(new Blob([JSON.stringify(row)]),{maxLineBytes:10})),/limit.*line 1/);
});
test('early termination cancels the file reader and abort prevents reading',async()=>{
 let cancelled=false;const file={stream:()=>new ReadableStream({start(c){c.enqueue(new TextEncoder().encode(JSON.stringify(row)+'\n'));},cancel(){cancelled=true;}})};
 for await(const value of readBrainFlowRecording(file)){assert.equal(value.sequence,1);break;}
 assert.equal(cancelled,true);
 const controller=new AbortController();controller.abort();
 await assert.rejects(collect(readBrainFlowRecording(new Blob([]),{signal:controller.signal})),/cancelled/);
});

test('recording reader feeds bounded transfer without losing sample order',async()=>{
 const {transferBrainFlowSamples}=await import('../src/physioDBTransfer.js');
 const records=Array.from({length:1201},(_,i)=>({sequence:i+1,timestamp:1+i/250,rows:[i,0]}));
 const file=new Blob([records.map(r=>JSON.stringify(r)).join('\n')]);
 const batches=[];
 const result=await transferBrainFlowSamples({records:readBrainFlowRecording(file),channels:[{name:'signal',row:0}],streamId:'local-test',client:{appendSamples:async(_id,samples)=>batches.push(samples)}});
 assert.deepEqual(batches.map(b=>b.length),[500,500,201]);
 assert.equal(result.confirmedSamples,1201);
 assert.deepEqual(batches.flatMap(b=>b.map(s=>s.values[0])),records.map(r=>r.rows[0]));
});
