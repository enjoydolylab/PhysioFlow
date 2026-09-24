import { verifyOfflineExceptions } from './browser-offline-exceptions.mjs';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { join, resolve } from 'node:path';
import { openTestBrowser } from './browser-harness.mjs';
import { toPhysioDBSamples } from '../src/physioDBMapping.js';

const out = resolve('artifacts/offline-acceptance-2026-09-24');
mkdirSync(out, { recursive: true });
const media = '/tmp/physioflow-offline-test.webm';
const generated = spawnSync('ffmpeg', ['-y','-f','lavfi','-i','color=c=blue:s=320x180:r=10','-t','0.4','-an','-c:v','libvpx','-metadata','title=QA TEST MEDIA - NOT ORIGINAL STIMULUS',media], { encoding: 'utf8' });
if (generated.status !== 0) throw new Error(generated.stderr);
const report = { status: 'running', testMediaOnly: true, originalDurationAcceptance: false, checks: [] };
writeFileSync(join(out, 'REPORT.json'), JSON.stringify(report, null, 2) + '\n');
const browser = await openTestBrowser();
const { evaluate, waitFor, send, origin } = browser;
let agent, dbServer;
const delay = ms => new Promise(r => setTimeout(r, ms));
const check = label => { report.checks.push(label); console.log('PASS', label); };
const text = `document.querySelector('#offline')?.innerText || ''`;
const click = async label => {
  await waitFor(`!![...document.querySelectorAll('button')].find(b => b.textContent.includes(${JSON.stringify(label)}) && !b.disabled)`, `Button ${label}`);
  await evaluate(`[...document.querySelectorAll('button')].find(b => b.textContent.includes(${JSON.stringify(label)}) && !b.disabled).click()`);
};
try {
  await evaluate(`(async () => {
    window.R = (await import('/node_modules/.vite/deps/react.js')).default;
    window.createRoot = (await import('/node_modules/.vite/deps/react-dom_client.js')).default.createRoot;
    window.LanguageProvider = (await import('/src/i18n.jsx')).LanguageProvider;
    window.core = await import('/src/core/index.js');
    window.fs = await import('/src/fsStorage.js');
    window.storage = await import('/src/storage.js');
    window.workspace = await import('/src/localWorkspace.js');
    window.assetStore = await import('/src/assetStore.js');
    window.registry = core.createCoreComponentRegistry();
    document.getElementById('root').remove();
    const div = document.createElement('div'); div.id = 'offline'; document.body.append(div);
    window.mount = (Component, props = {}) => { window.offlineRoot?.unmount(); window.offlineRoot = createRoot(div); window.scrollTo(0,0);window.offlineRoot.render(R.createElement(LanguageProvider, null, R.createElement(Component, props))); };
    window.setField = (selector, value) => { const input = document.querySelector(selector); const proto = input.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : input.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto, 'value').set.call(input, value); input.dispatchEvent(new Event(input.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true })); };
    window.setFile = (selector, file) => { const input = document.querySelector(selector); const dt = new DataTransfer(); dt.items.add(file); input.files = dt.files; input.dispatchEvent(new Event('change', { bubbles: true })); };
    window.testClip = new File([Uint8Array.from(atob(${JSON.stringify(readFileSync(media).toString('base64'))}), c => c.charCodeAt(0))], 'QA-clip.webm', { type: 'video/webm' });
    // Real browser file handles and writes; only the native directory picker is substituted.
    window.qaDirectory = await (await navigator.storage.getDirectory()).getDirectoryHandle('offline-acceptance', { create: true });
    window.showDirectoryPicker = async () => qaDirectory;
    await workspace.selectWorkspaceDirectory();
    window.assetList = [{ id: 'qa_clip', name: 'QA clip', fileName: 'QA-clip.webm', mediaType: 'video', sourceMode: 'manifest' }];
    window.AssetLibrary = (await import('/src/composer/Catalogs.jsx')).AssetLibrary;
    window.renderLibrary = () => mount(AssetLibrary, { assets: assetList, onUpdate: next => { assetList = next; renderLibrary(); } });
    renderLibrary();
  })()`);
  await waitFor(`!!document.querySelector('#offline .asset-upload input')`, 'Media library');
  await evaluate(`document.querySelector('#offline details').open = true; setFile('#offline .asset-upload input', testClip)`);
  await waitFor(`assetList[0].sourceMode === 'upload'`, 'Placeholder upload');
  assert.equal(await evaluate('assetList.length'), 1);
  assert.equal(await evaluate('assetList[0].id'), 'qa_clip');
  assert.equal(await evaluate(`(async () => (await fs.loadAssetFile('qa_clip')).file.size === testClip.size)()`), true);
  const overwrite = await evaluate(`(async () => { try { await assetStore.saveAsset(new File(['wrong'], 'QA-clip.webm', {type:'video/webm'}), 'qa_clip'); return false; } catch { return true; } })()`);
  assert.equal(overwrite, true);
  check('Placeholder binding retains asset ID and workspace bytes; different-content overwrite rejected');

  const large = await evaluate(`(async () => {
    const file = new File(Array.from({length:64}, () => new Uint8Array(1024 * 1024)), 'QA-large.bin', {type:'application/octet-stream'});
    file.arrayBuffer = () => { throw new Error('Full file allocation'); };
    const start = performance.now(), saved = await assetStore.saveAsset(file);
    const stored = await fs.loadAssetFile(saved.asset_id);
    const valid = await assetStore.verifyAssetContent(stored, saved.checksum);
    return {bytes:stored.file.size, valid, elapsedMs:performance.now()-start};
  })()`);
  assert.equal(large.bytes, 64 * 1024 * 1024); assert.equal(large.valid, true); report.largeFile = large;
  check('64 MiB workspace save/read/content verification without full-file arrayBuffer');

  await evaluate(`(async () => {
    window.Runner = (await import('/src/GraphRuntimeRunnerPage.jsx')).default;
    window.Setup = (await import('/src/app/sessionSetup.jsx')).GraphSessionSetup;
    let p = core.createProtocolGraph({name:'QA formal media'});
    const config = structuredClone(registry.get('display.media').defaultConfig);
    config.mediaType='video';config.assetId='qa_clip';config.completion={mode:'media-ended'};
    const mediaElement=(await import('/src/runtime/nodeSchema.js')).findUiElement(config.ui.root,'Media');
    Object.assign(mediaElement.props,{mediaType:'video',autoPlay:true,controls:false,presentationMode:'fullscreen-contain'});
    p=core.insertNodeOnControlEdge(p,p.graph.edges[0].id,'display.media',{label:'QA clip',config}).protocol;
    const edge=p.graph.edges.find(e => p.graph.nodes.find(n=>n.id===e.target.nodeId)?.component.type==='core.end');
    p=core.insertNodeOnControlEdge(p,edge.id,'display.screen',{label:'After clip',config:{ui:core.participantUiTemplate('instruction'),completion:{mode:'manual'}}}).protocol;
    p.assets=assetList;
    window.formal=await core.freezeProtocolGraph(p,registry);
    window.runData=null;
    window.renderSetup = permission => mount(Setup,{protocol:formal,storageInfo:{selected:true,name:'QA OPFS directory',permission},onBack:()=>{},onStart:session=>{runData={protocol:formal,session};mount(Runner,{data:runData,onDone:()=>{}});}});
    renderSetup('denied');
  })()`);
  await waitFor(`!!document.querySelector('#participant-id')`, 'Formal setup');
  await evaluate(`setField('#participant-id','QA-OFFLINE-FORMAL')`);
  assert.equal(await evaluate(`document.querySelector('#offline button.primary.wide').disabled`), true);
  await evaluate(`renderSetup('granted')`);
  await waitFor(`!!document.querySelector('#participant-id')`, 'Writable setup');
  await evaluate(`setField('#participant-id','QA-OFFLINE-FORMAL')`);
  await waitFor(`!document.querySelector('#offline button.primary.wide').disabled`, 'Formal ready');
  await click('Continue to collection');
  await click('Begin experiment');
  await waitFor(`!!document.querySelector('#offline video')`, 'Video presentation');
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('#offline video')).objectFit`), 'contain');
  await send('Page.enable');
  writeFileSync(join(out,'formal-media.png'),Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'));
  await waitFor(`(${text}).includes('Welcome')`, 'Natural media end');
  await evaluate(`window.dispatchEvent(new KeyboardEvent('keydown',{key:'O',code:'KeyO',ctrlKey:true,shiftKey:true,bubbles:true}))`);
  await waitFor(`!!document.querySelector('#offline [role="toolbar"]')`, 'Operator toolbar');
  assert.equal(await evaluate(`(${text}).includes('Previous page (test)') || (${text}).includes('Exit test and return')`), false);
  await click('Continue');
  await waitFor(`(${text}).includes('Session data saved.')`, 'Formal saved');
  const formalResult = await evaluate(`(async()=>{const s=await fs.loadSession(runData.session.session_id);const files=(await import('/src/data/graphExport.js')).buildGraphSessionFiles(s,s.protocol_snapshot,s.events,s.responses);window.savedFormal=s;return {mode:s.run_mode,status:s.status,hashMatches:await core.hashProtocolGraph(s.protocol_snapshot)===formal.freeze.configHash,files:Object.keys(files),events:s.events.map(e=>e.eventType)};})()`);
  assert.equal(formalResult.mode,'formal');assert.equal(formalResult.status,'completed');assert.equal(formalResult.hashMatches,true);assert.ok(formalResult.events.includes('media_ended'));
  report.formal=formalResult;
  check('Formal setup permission gate, natural video completion, test-control isolation, folder persistence and export integrity');

  // Missing media must block start; a failed final save must remain retryable.
  await evaluate(`(async()=>{window.retryDirectory=qaDirectory;await qaDirectory.removeEntry('assets',{recursive:true});renderSetup('granted');})()`);
  await waitFor(`(${text}).includes('Missing local asset')`, 'Missing media gate');
  await evaluate(`setField('#participant-id','QA-MISSING')`);
  assert.equal(await evaluate(`document.querySelector('#offline button.primary.wide').disabled`),true);
  await evaluate(`(async()=>{await assetStore.saveAsset(testClip,'qa_clip',assetList[0].checksum);})()`);
  await click('Check media again');
  await waitFor(`!document.querySelector('#offline button.primary.wide').disabled`,'Media restored');
  check('Missing local media blocks formal run and rebind/check-again recovers');

  await verifyOfflineExceptions(browser,click,check);

  const source=JSON.parse(readFileSync('tests/fixtures/offline-original-structure.json','utf8'));
  await evaluate(`(async()=>{
    window.originalTest=${JSON.stringify(source)};
    originalTest.version.status='draft';delete originalTest.freeze;
    const saved=await assetStore.saveAsset(testClip);
    originalTest.assets=originalTest.assets.map(a=>({...a,sourceUrl:URL.createObjectURL(testClip),sourceMode:'url',checksum:saved.checksum}));
    for(const n of originalTest.graph.nodes){if(n.component.type==='timing.wait')n.config.durationMs=10;if(n.config?.completion?.mode==='fixed')n.config.completion.durationMs=10;}
    originalTest=await core.freezeProtocolGraph(originalTest,registry);
    window.originalSession={session_id:crypto.randomUUID(),participant_id:'QA-TEST-MEDIA-210-NODES',participant_language:'en',run_mode:'formal',protocol_hash:originalTest.freeze.configHash};
    mount(Runner,{data:{protocol:originalTest,session:originalSession},onDone:()=>{}});
  })()`);
  await click('Begin experiment');
  const runStart=Date.now();let steps=0;
  while(Date.now()-runStart<600000){
    const state=await evaluate(`(()=>{
      const root=document.querySelector('#offline');
      if(root.innerText.includes('Session data saved.'))return 'done';
      if(root.innerText.includes('RUNTIME FAILED'))return 'failed';
      for(const group of root.querySelectorAll('.qf-scale')) {const buttons=[...group.querySelectorAll('button:not(:disabled)')];if(buttons.length&&!buttons.some(b=>b.classList.contains('selected')))buttons[Math.floor(buttons.length/2)].click();}
      for(const row of root.querySelectorAll('.qf-sam-row,.qf-matrix-table tbody tr')){const choices=[...row.querySelectorAll('input[type="radio"]')];if(choices.length&&!choices.some(c=>c.checked))choices[Math.floor(choices.length/2)].click();}
      for(const input of root.querySelectorAll('input[type="text"],input[type="number"],textarea'))if(!input.value)setField('#offline '+(input.id?'#'+input.id:input.tagName.toLowerCase()),input.type==='number'?'3':'QA test answer');
      const button=root.querySelector('.graph-participant button.participant-ui-button.primary:not(:disabled)');
      if(button)button.click();
      return 'running';
    })()`);
    if(state==='done')break;if(state==='failed')throw new Error(await evaluate(text));
    await delay(35);steps++;if(steps%300===0)console.log('Full-structure progress:',(await evaluate(text)).slice(0,130));
  }
  await waitFor(`(${text}).includes('Session data saved.')`,'210-node completion');
  const full=await evaluate(`(async()=>{const s=await fs.loadSession(originalSession.session_id);window.originalSaved=s;return {status:s.status,completed:s.runtime_snapshot.completedNodeIds,events:s.events,responses:s.responses,protocol:s.protocol_snapshot};})()`);
  const expected=source.graph.nodes.filter(n=>!['core.start','core.end'].includes(n.component.type)).map(n=>n.id);
  assert.equal(full.status,'completed');assert.equal(full.completed.length,208);assert.deepEqual(new Set(full.completed),new Set(expected));
  const assigned=full.events.filter(e=>e.eventType==='stimulus_assigned');assert.equal(assigned.length,40);assert.equal(new Set(assigned.map(e=>e.payload.assetId)).size,40);
  const questionnaireEvents=full.events.filter(e=>e.eventType==='response_submitted'&&e.componentType==='input.questionnaire');assert.equal(questionnaireEvents.length,120);
  assert.ok(full.events.every((e,i)=>e.sequence===i+1));
  const expectedQuestions=source.graph.nodes.flatMap(n=>(n.config?.questionnaire?.questions||[]).map(q=>({nodeId:n.id,...q})));
  for(const q of expectedQuestions){const answers=full.responses.filter(r=>r.nodeId===q.nodeId&&r.name===q.question_id);assert.equal(answers.length,1);assert.equal(answers[0].value,q.type.startsWith('sam_')?5:4);}
  for(const half of [assigned.slice(0,20),assigned.slice(20)])for(const category of new Set(source.assets.map(a=>a.category))){const count=half.filter(e=>e.payload.category===category).length;assert.ok(count===2||count===3);}

  writeFileSync(join(out,'full-structure-session.json'),JSON.stringify(full));
  report.originalStructure={nodes:210,completedParticipantNodes:208,questionnaireSubmissions:120,verifiedQuestionAnswers:1080,uniqueStimuli:40,elapsedSeconds:(Date.now()-runStart)/1000,accelerated:true};
  check('Original 210-node structure: 40 unique assignments, 120 questionnaire submissions, all 208 participant nodes completed');

  // Optional hardware-independent integration uses the real BrainFlow native library.
  if(!process.env.BRAINFLOW_PYTHON) throw new Error('Set BRAINFLOW_PYTHON to the Python environment containing tools/brainflow/requirements.txt');
  const agentPort=Number(new URL(origin).port)+2;
  const agentRuns=[];
  const startSynthetic=async()=>{
    let output='',errors='',info;
    agent=spawn(process.env.BRAINFLOW_PYTHON,['tools/brainflow/agent.py','--port',String(agentPort),'--origin',origin,'--output',join(out,'synthetic-raw')],{stdio:['ignore','pipe','pipe']});
    agent.stdout.on('data',chunk=>{output+=chunk.toString();for(const line of output.split('\n'))try{const value=JSON.parse(line);if(value.token&&value.directory)info=value;}catch{}});
    agent.stderr.on('data',chunk=>{errors+=chunk.toString();});
    for(let i=0;i<200&&!info;i++)await delay(100);
    if(!info)throw new Error('BrainFlow did not start: '+errors);
    agentRuns.push(info);return info;
  };
  let agentInfo=await startSynthetic();
  const connector=JSON.parse(readFileSync(join(agentInfo.directory,'connector.json'),'utf8'));
  await evaluate(`(async()=>{
    let p=core.createProtocolGraph({name:'QA real BrainFlow Synthetic library'});
    p=(await import('/src/devices/index.js')).installDeviceConnector(p,${JSON.stringify(connector)},{approvedPermissions:${JSON.stringify(connector.permissions)}});
    p=core.insertNodeOnControlEdge(p,p.graph.edges[0].id,'display.screen',{label:'Synthetic recording',config:{ui:core.participantUiTemplate('instruction'),completion:{mode:'manual'},deviceConnectorId:${JSON.stringify(connector.connectorId)}}}).protocol;
    window.syntheticSession={session_id:crypto.randomUUID(),participant_id:'QA-SYNTHETIC',run_mode:'preview'};
    mount(Runner,{data:{protocol:p,session:syntheticSession},onDone:()=>{}});
  })()`);
  await waitFor(`!!document.querySelector('[aria-label="BrainFlow agent token"]')`,'Synthetic credentials');
  await evaluate(`setField('[aria-label="BrainFlow agent URL"]',${JSON.stringify(agentInfo.url)})`);
  await evaluate(`setField('[aria-label="BrainFlow agent token"]','wrong-token')`);
  await click('Begin experiment');
  await waitFor(`!!document.querySelector('#offline [role="alert"]')`,'Wrong token rejected');
  await evaluate(`setField('[aria-label="BrainFlow agent token"]',${JSON.stringify(agentInfo.token)})`);
  await click('Retry device and begin');
  await waitFor(`!!document.querySelector('#offline .graph-participant')`,'Synthetic connected');
  await delay(2000);
  await evaluate(`window.dispatchEvent(new KeyboardEvent('keydown',{key:'O',code:'KeyO',ctrlKey:true,shiftKey:true,bubbles:true}))`);
  await waitFor(`(${text}).includes('BrainFlow EEG preview')`,'Live sample preview');
  await click('Pause');await delay(600);await click('Resume');await delay(500);
  agent.kill('SIGINT');await new Promise(resolve=>agent.once('exit',resolve));agent=null;
  await waitFor(`(${text}).includes('Reconnect devices')`,'Disconnected required device pauses');
  assert.equal(await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent==='Resume')?.disabled`),true);
  agentInfo=await startSynthetic();
  await evaluate(`setField('[aria-label="BrainFlow agent token"]',${JSON.stringify(agentInfo.token)})`);
  await click('Reconnect devices');
  await waitFor(`[...document.querySelectorAll('button')].some(b=>b.textContent==='Resume'&&!b.disabled)`,'Reconnected required device');
  await click('Resume');await delay(2500);
  await click('Continue');await waitFor(`(${text}).includes('Session data saved.')`,'Synthetic saved');
  const synthetic=await evaluate(`fs.loadSession(syntheticSession.session_id)`);
  assert.equal(JSON.stringify(synthetic).includes(agentInfo.token),false);
  agent.kill('SIGINT');await new Promise(resolve=>agent.once('exit',resolve));agent=null;
  const raw=readFileSync(join(agentInfo.directory,'samples.jsonl'),'utf8').trim().split('\n').map(JSON.parse);
  const samples=synthetic.device_events.filter(e=>e.eventType==='device_sample_received');
  assert.ok(samples.length>100);
  const metadata=JSON.parse(readFileSync(join(agentInfo.directory,'metadata.json'),'utf8'));
  const allRaw=agentRuns.flatMap(info=>{const m=JSON.parse(readFileSync(join(info.directory,'metadata.json'),'utf8'));return readFileSync(join(info.directory,'samples.jsonl'),'utf8').trim().split('\n').map(JSON.parse).map(row=>({...row,runId:m.runId}));});
  const bySequence=new Map(allRaw.map(row=>[`${row.runId}:${row.sequence}`,row]));
  for(const sample of samples){const frame=bySequence.get(`${sample.payload.runId}:${sample.payload.sampleSequence}`);assert.ok(frame);const row=metadata.boardDescription.eeg_channels[Number(sample.payload.channelId.split('_')[1])-1];assert.equal(sample.payload.value,frame.rows[row]);assert.equal(sample.payload.deviceTimestamp,frame.timestamp);}
  const markers=new Set(allRaw.map(row=>row.rows[metadata.boardDescription.marker_channel]).filter(Boolean));
  // Disconnection events cannot be delivered to a stopped board. Verify every acknowledged marker against raw frames.
  const accepted=agentRuns.flatMap(info=>readFileSync(join(info.directory,'events.jsonl'),'utf8').trim().split('\n').map(JSON.parse)).filter(e=>e.eventType==='marker_accepted'||e.type==='marker_accepted');
  for(const event of accepted)assert.ok(markers.has(event.markerId??event.payload?.markerId),`Acknowledged raw marker missing`);
  assert.ok(markers.size>=4);
  report.synthetic={rawFrames:allRaw.length,runIds:agentRuns.length,previewSamples:samples.length,allPreviewValuesAndTimestampsMatch:true,rawMarkers:[...markers]};
  writeFileSync(join(out,'synthetic-session.json'),JSON.stringify(synthetic));
  check('BrainFlow Synthetic browser run: wrong-token rejection, preview, pause/resume, agent restart/new-token reconnect, raw value/marker verification and secret-free export');

  const stream={id:'11111111-1111-4111-8111-111111111111',experiment_id:'22222222-2222-4222-8222-222222222222',participant_id:'33333333-3333-4333-8333-333333333333',fields:[{name:'EEG1',type:'float',unit:'uV'}],deleted_at:null};
  let received=[],batches=[],mode='success',posts=0;
  dbServer=createServer(async(req,res)=>{
    res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Access-Control-Allow-Headers','Authorization,Content-Type');res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');
    if(req.method==='OPTIONS'){res.writeHead(204);res.end();return;}
    if(req.headers.authorization!=='Bearer offline-test-token'){res.writeHead(401);res.end();return;}
    if(req.method==='GET'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify(stream));return;}
    let body='';for await(const chunk of req)body+=chunk;
    const batch=JSON.parse(body);posts++;
    if(mode==='partial'&&posts===2){res.writeHead(503);res.end();return;}
    received.push(...batch);batches.push(batch.length);
    if(mode==='cancel')await delay(1500);
    if(mode==='timeout')await delay(31000);
    res.writeHead(204);res.end();
  });
  await new Promise(resolve=>dbServer.listen(0,'127.0.0.1',resolve));
  const dbUrl=`http://127.0.0.1:${dbServer.address().port}`;
  const recording=readFileSync(join(agentInfo.directory,'samples.jsonl'),'utf8');
  await evaluate(`(async()=>{mount((await import('/src/PhysioDBUpload.jsx')).default);window.recordingFile=new File([${JSON.stringify(recording)}],'samples.jsonl',{type:'application/json'});})()`);
  await waitFor(`!!document.querySelector('#offline textarea')`,'Upload panel');
  const fields=[dbUrl,'offline-test-token',stream.experiment_id,stream.participant_id,stream.id];
  for(let i=0;i<fields.length;i++)await evaluate(`setField('#offline fieldset label:nth-of-type(${i+1}) input',${JSON.stringify(fields[i])})`);
  await evaluate(`setField('#offline textarea','1, EEG1, uV');setFile('#offline input[type="file"]',recordingFile)`);
  await click('Check recording locally');await waitFor(`(${text}).includes('No data was sent.')`,'Raw validation');assert.equal(posts,0);
  await click('Upload recording to PhysioDB');await waitFor(`(${text}).includes('samples uploaded successfully.')`,'Contract upload');
  assert.deepEqual(received,toPhysioDBSamples(raw,[{row:1,name:'EEG1',unit:'uV'}]));report.physioDbContract={samples:received.length,batches};
  await evaluate(`setField('#offline textarea','1, EEG1, mV')`);const oldPosts=posts;
  await click('Upload recording to PhysioDB');await waitFor(`!!document.querySelector('#offline [role="alert"]')`,'Unit mismatch');assert.equal(posts,oldPosts);
  mode='partial';posts=0;received=[];batches=[];
  await evaluate(`setField('#offline textarea','1, EEG1, uV')`);await click('Upload recording to PhysioDB');
  await waitFor(`(${text}).includes('503')`,'Partial write');assert.equal(posts,2);assert.equal(received.length,500);
  mode='cancel';posts=0;received=[];batches=[];
  await click('Upload recording to PhysioDB');
  for(let i=0;i<100&&!posts;i++)await delay(20);
  assert.equal(posts,1);await click('Cancel transfer');
  await waitFor(`(${text}).includes('Stopped.')`,'Transfer cancellation');assert.equal(posts,1);
  mode='timeout';posts=0;received=[];batches=[];
  await click('Upload recording to PhysioDB');
  await waitFor(`(${text}).includes('timed out')`,'Stalled server timeout',35000);assert.equal(posts,1);
  report.physioDbContract.cancelStopsFurtherBatches=true;report.physioDbContract.timeoutReportsUncertainWrite=true;
  check('Actual Synthetic raw file → browser PhysioDB panel → local HTTP contract: exact values/timestamps, schema rejection, partial failure without retry');
  report.status='passed';writeFileSync(join(out,'REPORT.json'),JSON.stringify(report,null,2)+'\n');
} finally {
  agent?.kill('SIGINT');
  if(dbServer)await new Promise(resolve=>dbServer.close(resolve));
  await browser.close();
}
