import test from 'node:test';
import assert from 'node:assert/strict';
import { responseAnalysisData } from '../src/analysis/responseData.js';
test('graph responses retain zero, resolve question metadata, and separate same names across nodes',()=>{
 const protocol={graph:{nodes:[{id:'a',label:'A',config:{questionnaire:{questions:[{question_id:'score',type:'likert',prompt_i18n:{en:'Score'},scale_min:0,scale_max:2}]}}},{id:'b',label:'B',config:{}}]}};
 const data=responseAnalysisData([{nodeId:'a',name:'score',value:0},{nodeId:'b',name:'score',value:2}],protocol);
 assert.equal(Object.keys(data.groups).length,2);
 assert.equal(data.questions['["a","score"]'].prompt,'Score');
 assert.equal(data.groups['["a","score"]'][0].value,0);
 assert.equal(data.questions['["b","score"]'].prompt,'B · score');
});
test('legacy questionnaire IDs still resolve',()=>{
 const data=responseAnalysisData([{question_id:'q',value:false}],{questionnaires:[{questions:[{question_id:'q',type:'single_choice',prompt:'Q'}]}]});
 assert.equal(data.questions.q.prompt,'Q');assert.equal(data.groups.q[0].value,false);
});

import { samPairs } from '../src/analysis/responseData.js';
test('SAM pairs only matching submissions and never fills missing dimensions with zero',()=>{
 const questions={v:{type:'sam_valence'},a:{type:'sam_arousal'}};
 const row=(nodeId,timestampIso,value)=>({sessionId:'s',nodeId,timestampIso,value});
 const groups={v:[row('n','t1',5),row('n','t2',6),row('other','t3',2)],a:[row('n','t1',7),row('n','t3',4)]};
 assert.deepEqual(samPairs(questions,groups),[{x:5,y:7}]);
 groups.v.push(row('n','t1',8));
 assert.deepEqual(samPairs(questions,groups),[]);
});

import { choiceDistribution } from '../src/analysis/responseData.js';
test('choice charts support array responses, legacy separators, string labels and zero options',()=>{
 assert.deepEqual(choiceDistribution({type:'multiple_choice',options:['A','B']},[{value:['A','B']},{value:'A|B'},{value:null}]),{labels:['A','B'],counts:[2,2]});
 assert.deepEqual(choiceDistribution({type:'single_choice',options:[{value:0,label:'Zero'},{value:1,label:'One'}]},[{value:0},{value:'0'},{value:null}]),{labels:['Zero','One'],counts:[2,0]});
});

test('choice labels and counts use the participant language',()=>{
 const protocol={graph:{nodes:[{id:'n',config:{questionnaire:{questions:[{question_id:'q',type:'multiple_choice',prompt_i18n:{en:'Choose',ja:'選択'},options_i18n:{en:['One','Two'],ja:['一','二'],zh:['甲','乙']}}]}}}]}};
 for(const [language,value] of [['ja','二'],['zh','乙']]){
  const {questions,groups}=responseAnalysisData([{nodeId:'n',name:'q',value:[value]}],protocol,language);
  const key=Object.keys(groups)[0];
  assert.deepEqual(choiceDistribution(questions[key],groups[key]).counts,[0,1]);
  assert.equal(choiceDistribution(questions[key],groups[key]).labels[1],value);
 }
});

test('superseded test answers remain excluded from response analysis', () => {
  const data = responseAnalysisData([{ name: 'answer', value: 1, supersededByEventId: 'back' }, { name: 'answer', value: 2 }]);
  assert.deepEqual(data.groups.answer.map(row => row.value), [2]);
});
