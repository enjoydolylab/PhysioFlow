import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createStroopGraphTemplate,createGonogoGraphTemplate,createCoreComponentRegistry,validateProtocolGraphConfiguration} from '../src/core/index.js';
const base=JSON.parse(readFileSync('examples/lab-meeting-2026-09-25/01_READY_TO_RUN.protocol.json'));
const out='examples/lab-meeting-2026-09-25/patterns';mkdirSync(out,{recursive:true});
function subset(prefix){
 const p=structuredClone(base);const start=p.graph.nodes.find(n=>n.component.type==='core.start');const end=p.graph.nodes.find(n=>n.component.type==='core.end');
 p.graph.nodes=p.graph.nodes.filter(n=>n.id.startsWith(prefix)||[start.id,end.id].includes(n.id));const ids=new Set(p.graph.nodes.map(n=>n.id));
 const incoming=base.graph.edges.find(e=>!e.source.nodeId.startsWith(prefix)&&e.target.nodeId.startsWith(prefix));
 const outgoing=base.graph.edges.find(e=>e.source.nodeId.startsWith(prefix)&&!e.target.nodeId.startsWith(prefix));
 p.graph.edges=p.graph.edges.filter(e=>ids.has(e.source.nodeId)&&ids.has(e.target.nodeId));
 p.graph.edges.push({...incoming,id:'demo_enter',source:{nodeId:start.id,portId:'next'}},{...outgoing,id:'demo_exit',target:{nodeId:end.id,portId:'in'}});
 p.graph.groups=[];p.groupRandomization={enabled:false,groupIds:[]};p.assets=[];p.stimulusPools=[];return p;
}
const patterns=[['02_NESTED','入れ子ループと分岐',subset('A_')],['03_RECOVERY','条件付き質問票と復元',subset('B_')],['04_STROOP','Stroop：文字の色への反応',createStroopGraphTemplate({trials:8,practice:false,seed:25,fixationMs:300,responseWindowMs:1800})],['05_GONOGO','Go/No-Go：反応と抑制',createGonogoGraphTemplate({trials:10,practice:false,seed:25,fixationMs:300,responseWindowMs:1000})]];
for(const [id,name,p] of patterns){
 p.protocolId=`lab_meeting_${id.toLowerCase()}_20260925`;p.projectId=p.protocolId;
 p.metadata.name=`QA｜${name}`;p.metadata.description='会議用プロトタイプ。合成・操作デモ用。研究結果ではありません。';
 p.metadata.tags=['QA ONLY','lab-meeting'];p.biodb={experimentId:p.protocolId,experimentLabel:name};
 const result=validateProtocolGraphConfiguration(p,createCoreComponentRegistry());if(!result.valid)throw Error(JSON.stringify(result.errors));
 writeFileSync(`${out}/${id}.protocol.json`,JSON.stringify(p,null,2)+'\n');
}
console.log('4 short patterns + main integrated experiment = 5 meeting prototypes');
