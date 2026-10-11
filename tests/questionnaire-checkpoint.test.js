import test from 'node:test';
import assert from 'node:assert/strict';
import {restoreQuestionnaireDraft} from '../src/runtime/questionnaireCheckpoint.js';
const questionnaire={questions:[{question_id:'first',time_limit_sec:10},{question_id:'second'}]};
test('local questionnaire drafts retain false and zero, position, timeouts and remaining active time',()=>{
 const empty=restoreQuestionnaireDraft(questionnaire,'seed');
 const draft={version:1,signature:empty.signature,answers:{first:0,second:false,unknown:'discard'},current:1,timedOut:['first','unknown','first'],timer:{id:'first',ms:4200}};
 assert.deepEqual(restoreQuestionnaireDraft(questionnaire,'seed',JSON.parse(JSON.stringify(draft))),{signature:empty.signature,answers:{first:0,second:false},current:1,timedOut:['first'],timer:{id:'first',ms:4200}});
 assert.deepEqual(restoreQuestionnaireDraft(questionnaire,'other-seed',draft).answers,{});
 assert.deepEqual(restoreQuestionnaireDraft({...questionnaire,name:'changed'},'seed',draft).answers,{});
});
test('invalid local draft state cannot add questions, negative time or non-answer objects',()=>{
 const {signature}=restoreQuestionnaireDraft(questionnaire,'seed');
 const result=restoreQuestionnaireDraft(questionnaire,'seed',{version:1,signature,answers:{first:{unsafe:1},second:['choice']},current:999,timedOut:'wrong',timer:{id:'first',ms:-5}});
 assert.equal(result.current,1);assert.deepEqual(result.answers,{second:['choice']});assert.deepEqual(result.timedOut,[]);assert.equal(result.timer.ms,0);
 assert.equal(restoreQuestionnaireDraft(questionnaire,'seed',{version:9,signature}).current,0);
});
