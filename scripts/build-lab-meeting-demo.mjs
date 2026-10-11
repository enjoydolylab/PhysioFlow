import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {createProtocolGraph,createCoreComponentRegistry,createParticipantScreen,createUiElement,validateProtocolGraphConfiguration} from '../src/core/index.js';
import {createNode,createEdge} from '../src/core/protocolGraph.js';
const out=resolve('examples/lab-meeting-2026-09-25');mkdirSync(out,{recursive:true});
const registry=createCoreComponentRegistry();let serial=0;
const idFactory=prefix=>`${prefix}_demo_${++serial}`;
const p=createProtocolGraph({name:'PhysioFlow｜映像・感情評価・復旧デモ',protocolId:'lab_meeting_demo_20260925',projectId:'lab_meeting_demo_20260925',now:'2026-09-25T00:00:00.000Z',idFactory});
p.metadata.description='研究室報告用の操作デモ。合成テスト動画のみ。実際の感情誘発効果・実機・PhysioDB の検証ではありません。';
p.metadata.tags=['DEMO ONLY','日本語','offline','lab-meeting'];
p.metadata.demo={estimatedPresentationMinutes:'5–8',testMediaOnly:true,requiresCurrentDevelopmentBuild:true};
const [start,end]=p.graph.nodes;p.graph.edges=[];
function card(eyebrow,title,body,button='次へ') {
 return createParticipantScreen({idFactory,props:{maxWidth:920,background:'#f7faf9',color:'#142e2b',padding:40},children:[
  createUiElement('Text',{idFactory,props:{text:eyebrow},style:{color:'#377c70',fontSize:14,fontWeight:700}}),
  createUiElement('Text',{idFactory,props:{text:title,variant:'heading'},style:{fontSize:34,fontWeight:700}}),
  createUiElement('Text',{idFactory,props:{text:body},style:{fontSize:20,lineHeight:1.8}}),
  createUiElement('Button',{idFactory,props:{label:button,variant:'primary'},actions:[{event:'click',action:'submit'}]})]});
}
function add(id,type,config={},metadata={}) {
 const node=createNode(type,{id,label:id,config:{...structuredClone(registry.get(type).defaultConfig),...config},layout:{x:120,y:p.graph.nodes.length*155},metadata});p.graph.nodes.push(node);return id;
}
function edge(from,to,port='next') {p.graph.edges.push(createEdge('control',{nodeId:from,portId:port},{nodeId:to,portId:'in'},{idFactory}));}
function screen(id,kicker,title,body,button){return add(id,'display.screen',{content:title,ui:card(kicker,title,body,button),completion:{mode:'manual'}});}
function q(id,type,prompt,min,max){return {question_id:id,type,required:true,prompt_i18n:{ja:prompt,en:prompt},...(min===undefined?{}:{scale_min:min,scale_max:max}),time_limit_sec:null,show_if:null,shuffle:false};}
function questionnaire(id,name,questions,mode){return add(id,'input.questionnaire',{questionnaire:{questionnaire_id:id+'_form',name,questions,shuffle_questions:false,show_progress:true,...(mode?{display_mode:mode}:{})}});}
const intro=screen('01_はじめに','PHYSIOFLOW / LAB DEMO','設計から記録まで、ひとつの流れで。','4 本のテスト動画を見て、SAM と短い質問票に回答します。\n続いて、ランダム化された 2 つの機能デモを行います。\n\nこれはソフトウェアの操作デモです。動画に感情誘発効果があることを示す実験ではありません。','デモを始める');edge(start.id,intro);let previous=intro;
const mediaNames=['QA_SLOW_01','QA_SLOW_02','QA_PULSE_01','QA_PULSE_02'];
p.assets=mediaNames.map(name=>{const bytes=readFileSync(join(out,'media',name+'.mp4'));return {id:name,name:name+'.mp4',fileName:name+'.mp4',mediaType:'video',category:name.includes('SLOW')?'slow':'pulse',condition:'QA-only',sourceMode:'url',sourceUrl:'data:video/mp4;base64,'+bytes.toString('base64'),checksum:createHash('sha256').update(bytes).digest('hex')};});
p.stimulusPools=[{id:'demo_balanced',name:'テスト動画｜前後半バランス',mediaType:'video',assetIds:mediaNames,randomizationMode:'balanced-halves'}];
for(let i=1;i<=4;i++){
 if(i===3){const half=screen('前後半の切り替え','PART 01 / SECOND HALF','後半へ進みます。','前半・後半に slow と pulse が各 1 本ずつ入るように割り当てています。\n同じ動画は、この 4 試行では重複しません。');edge(previous,half);previous=half;}
 const fix=add(`T${i}_注視`,'stimulus.fixation',{completion:{mode:'fixed',durationMs:700}});edge(previous,fix);
 const mediaUi=createParticipantScreen({idFactory,props:{background:'#0d1926',padding:0},children:[createUiElement('Media',{idFactory,props:{mediaType:'video',autoPlay:true,controls:false,fit:'contain',presentationMode:'fullscreen-contain',alt:'QA テスト動画'}})]});
 const media=add(`T${i}_映像`,'display.media',{mediaType:'video',stimulusPoolId:'demo_balanced',ui:mediaUi,completion:{mode:'media-ended'}},{half:i<=2?1:2,trialIndex:i,testMediaOnly:true});edge(fix,media);
 const sam=questionnaire(`T${i}_SAM`,'SAM 3 次元',[
 q(`t${i}_valence`,'sam_valence','今の気分の快・不快を選んでください。',1,9),
 q(`t${i}_arousal`,'sam_arousal','今の覚醒度を選んでください。',1,9),
 q(`t${i}_dominance`,'sam_dominance','今の支配感を選んでください。',1,9)],'sam-matrix');edge(media,sam);
 const likert=questionnaire(`T${i}_印象`,'映像の印象',[
 q(`t${i}_calm`,'likert','映像の印象を 1〜5 で評価してください：落ち着きを感じた',1,5),
 q(`t${i}_active`,'likert','映像の印象を 1〜5 で評価してください：動きを感じた',1,5),
 q(`t${i}_clear`,'likert','映像の印象を 1〜5 で評価してください：画面は見やすかった',1,5)],'matrix');edge(sam,likert);previous=likert;
}
const bridge=screen('02_機能デモへ','PART 02 / RECOVERY & FLOW','次は、実験の「動き」を見せます。','A：2×2 の入れ子ループとランダム分岐\nB：入力途中の質問票を刷新して復元\n\nA と B の順番はセッションごとに決まり、途中で再開しても維持されます。');edge(previous,bridge);
const aIntro=screen('A_ループ説明','GROUP A / NESTED LOOP','同じ流れを、確実に 4 回。','2 回の外側ループ × 2 回の内側ループです。\n各回で A / B の質問をランダムに選びます。\nどちらの質問でも、1〜5 の値をひとつ選んでください。');edge(bridge,aIntro);
const outer=add('A_外側2回','logic.loop',{maxIterations:2,untilRule:null});const inner=add('A_内側2回','logic.loop',{maxIterations:2,untilRule:null});const random=add('A_質問分岐','logic.random',{probabilityA:.5,probabilityB:.5});
const left=questionnaire('A_質問A','ランダム分岐 A',[q('branch_a','likert','【A】今、画面に集中できていますか？',1,5)]);
const right=questionnaire('A_質問B','ランダム分岐 B',[q('branch_b','likert','【B】操作の流れは分かりやすいですか？',1,5)]);
edge(aIntro,outer);edge(outer,inner,'body');edge(inner,random,'body');edge(random,left,'a');edge(random,right,'b');edge(left,inner);edge(right,inner);edge(inner,outer,'exit');
const bIntro=screen('B_復元説明','GROUP B / LOCAL RECOVERY','入力途中から、再開できる。','次の質問票で 1 問目に「デモ」と入力し、2 問目に進んでください。\n操作バーの「Checkpoint saved」を確認後、ページを再読み込みして「実験を再開」を選びます。\n\n回答と現在の質問が保持されることを確認します。');edge(outer,bIntro,'exit');
const confidence=q('demo_confidence','likert','この操作を、もう一度自分で実行できそうですか？',1,5);
const follow=q('demo_followup','short_text','どこに説明が必要だと感じましたか？');follow.required=false;follow.show_if={question_id:'demo_confidence',operator:'less_than',value:3};
const recovery=questionnaire('B_途中復元質問票','途中入力の復元',[q('demo_note','short_text','復元を確認するため「デモ」と入力してください。'),confidence,follow]);edge(bIntro,recovery);
const endScreen=screen('03_データ確認','PART 03 / TRACEABLE DATA','実行の結果を、確認できる形へ。','これで操作デモは終了です。\n完了画面からデータパッケージを出力し、セッション管理でイベント・回答・実行順を確認します。\n\n元の実験動画・実機・実際の PhysioDB の検証は、環境が整い次第実施します。','完了して保存');edge(recovery,endScreen);edge(endScreen,end.id);
p.graph.groups=[{id:'group_a',name:'A｜入れ子ループ・分岐',nodeIds:[aIntro,outer,inner,random,left,right]},{id:'group_b',name:'B｜質問票・復元',nodeIds:[bIntro,recovery]}].map(g=>({...g,kind:'container',parameters:[],metadata:{demoOnly:true}}));
p.groupRandomization={enabled:true,groupIds:['group_a','group_b']};
end.layout={x:120,y:p.graph.nodes.length*155};
const validation=validateProtocolGraphConfiguration(p,registry);if(!validation.valid)throw Error(JSON.stringify(validation.errors,null,2));
writeFileSync(join(out,'01_READY_TO_RUN.protocol.json'),JSON.stringify(p,null,2)+'\n');
const manifest=structuredClone(p);manifest.protocolId+='_bind';manifest.projectId+='_bind';manifest.metadata.name+='｜素材登録版';manifest.assets=manifest.assets.map(({sourceUrl,...a})=>({...a,sourceMode:'manifest'}));
writeFileSync(join(out,'02_MEDIA_BINDING.protocol.json'),JSON.stringify(manifest,null,2)+'\n');
writeFileSync(join(out,'BUILD_INFO.json'),JSON.stringify({testMediaOnly:true,nodes:p.graph.nodes.length,assets:p.assets.length,groupIds:p.groupRandomization.groupIds,videoDurationSeconds:6,randomizedGroups:'single entry/exit; bounded nested loops',requirements:'Current development build after beta.6; do not run this complex-group protocol in beta.6',validation},null,2)+'\n');
console.log('Demo built:',p.graph.nodes.length,'nodes;',p.assets.length,'embedded test clips; configuration valid');
