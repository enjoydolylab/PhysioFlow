import assert from 'node:assert/strict';
import {readFile,readdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createPhysioDBBridge} from '../release-web/PhysioFlow-Server-v0.6.0-beta.9/server/physioDBBridge.mjs';
import {createPhysioDBRuns} from '../release-web/PhysioFlow-Server-v0.6.0-beta.9/server/physioDBRuns.mjs';
import {buildPhysioDBRunExport} from '../release-web/PhysioFlow-Server-v0.6.0-beta.9/src/physioDBRunExport.js';
const credential=process.env.PF_VALIDATION_CREDENTIAL;if(!credential)throw Error('Isolated validation credential required');
const {token}=JSON.parse(await readFile(credential,'utf8'));
const actor={actorId:'full-structure',tenantId:'isolated'},directory='artifacts/db-progression-2026-10-14/package-beta9-full-db';
const filename=(await readdir(directory)).filter(n=>n.startsWith('result-')).sort().at(-1);
const evidence=JSON.parse(await readFile(`${directory}/${filename}`,'utf8'));assert.equal(evidence.status,'verified');
const stamp=filename.match(/\d+/)[0],sdk=createPhysioDBBridge({credentials:[{...actor,baseUrl:'http://127.0.0.1:18080',token}]});
const runs=await createPhysioDBRuns({filePath:`${directory}/runs-${stamp}.json`,bridge:sdk});
const run=await runs.snapshot(actor,evidence.sessionId);
const events=await sdk(actor,'events',{experimentId:run.destination.experimentId,participantId:run.destination.participantId});
const files=buildPhysioDBRunExport({run,events,retrievedAt:new Date().toISOString(),language:'ja'});
const manifest=JSON.parse(files['manifest.json']),source=JSON.parse(await readFile(evidence.source,'utf8'));
assert.deepEqual(manifest.counts,{events:1863,responses:1200});
assert.deepEqual(JSON.parse(files['responses.json']),source.responses);
assert.deepEqual(JSON.parse(files['protocol.json']),source.protocol);
for(const [name,entry] of Object.entries(manifest.files)){
 assert.equal(createHash('sha256').update(files[name]).digest('hex'),entry.sha256);
 assert.equal(Buffer.byteLength(files[name]),entry.bytes);
}
await writeFile(`${directory}/export-result-${Date.now()}.json`,JSON.stringify({packageVersion:'0.6.0-beta.9',counts:manifest.counts,exactResponseRecords:true,exactProtocolSnapshot:true,allFileHashesVerified:true,actualSdkAndTimescaleDB:true,source:evidence.source,testMedia:true,accelerated:true,humanUsability:false},null,2));
console.log('Full packaged export: 1863 events, 1200 exact responses, frozen design and all hashes verified');
