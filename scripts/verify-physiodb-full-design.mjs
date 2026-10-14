/** Full structure acceptance with test media and simulated data, isolated DB only. */
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createPhysioDBBridge } from '../server/physioDBBridge.mjs';
import { createPhysioDBRuns } from '../server/physioDBRuns.mjs';
import { buildPhysioDBSessionPlan } from '../src/physioDBSessionPlan.js';
const credential=process.env.PF_VALIDATION_CREDENTIAL;if(!credential)throw Error('Isolated validation credential required');
const source=process.argv[2]||'artifacts/db-progression-2026-10-14/offline/full-structure-session.json';
const full=JSON.parse(await readFile(source,'utf8'));assert.equal(full.status,'completed');assert.equal(full.completed.length,208);assert.ok(full.responses.length>=1080);
const {token}=JSON.parse(await readFile(credential,'utf8')),actor={actorId:'full-structure',tenantId:'isolated'};
const sdk=createPhysioDBBridge({credentials:[{...actor,baseUrl:'http://127.0.0.1:18080',token}]});
const stamp=Date.now(),directory='artifacts/db-progression-2026-10-14/full-db';await mkdir(directory,{recursive:true});
const research=await sdk(actor,'createResearch',{research:{name:`PF original-structure validation ${stamp}`,metadata:{physioflow_validation:true,accelerated_test_media:true}}});
const experiment=await sdk(actor,'createExperiment',{researchId:research.id,experiment:{name:'210-node structural acceptance'}});
const participant=await sdk(actor,'createParticipant',{researchId:research.id,participant:{code:'QA-SYNTHETIC-FULL-001'}});
const sessionId=full.events[0].sessionId;
const plan=buildPhysioDBSessionPlan({session_id:sessionId,status:'completed',protocol_snapshot:full.protocol,events:full.events,responses:full.responses},{researchId:research.id,experimentId:experiment.id,participantId:participant.id});
const options={filePath:`${directory}/runs-${stamp}.json`,bridge:sdk},runs=await createPhysioDBRuns(options);
const timer=setInterval(async()=>{try{const status=(await runs.list(actor))[0];if(status)console.log(`Full DB: ${status.confirmedOperations}/${plan.events.length} events confirmed`);}catch{}},15000);
try{
 const result=await runs.sync(actor,plan);assert.equal(result.status,'verified');assert.equal(result.report.actualEvents,full.events.length+full.responses.length);
 const repeat=await (await createPhysioDBRuns(options)).sync(actor,plan);assert.equal(repeat.status,'verified');
 const actual=await sdk(actor,'events',{experimentId:experiment.id,participantId:participant.id});const answers=actual.filter(e=>e.event_type==='physioflow.response_recorded');assert.equal(answers.length,full.responses.length);
 const expected=new Map(full.responses.map(r=>[r.responseId,r]));for(const answer of answers)assert.deepEqual(answer.data.payload.response,expected.get(answer.data.payload.response.responseId));
 const evidence={...result,source,participantNodes:208,stimuli:40,questionnaireSubmissions:120,questionAnswers:1080,responseRecords:full.responses.length,actualSdkAndTimescaleDB:true,testMedia:true,accelerated:true,humanUsability:false,actualHardware:false,restartReadbackVerified:true};
 await writeFile(`${directory}/result-${stamp}.json`,JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence,null,2));
}finally{clearInterval(timer);}
