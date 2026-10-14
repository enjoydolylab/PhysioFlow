import test from 'node:test';
import assert from 'node:assert/strict';
import {validateTemplateConfig} from '../src/templateConfigValidation.js';
import {createGonogoGraphTemplate,createStroopGraphTemplate} from '../src/core/taskTemplates.js';
test('template form rejects empty, rounded or unbounded trial counts before generation',()=>{
 for(const trials of ['',0,5,17,Infinity,100000])assert.equal(validateTemplateConfig('stroop',{trials,jitter:0}).valid,false);
 for(const trials of ['',9,11,101])assert.equal(validateTemplateConfig('gonogo',{trials,jitter:0,goRatio:70}).valid,false);
 assert.equal(validateTemplateConfig('gonogo',{trials:40,jitter:0,goRatio:100}).valid,false);
});
test('creation summary matches generated main, practice and rounded Go counts',()=>{
 for(const kind of ['stroop','gonogo']){
 const cfg={trials:kind==='stroop'?20:10,practice:true,jitter:0,goRatio:65};
 const summary=validateTemplateConfig(kind,cfg);assert.equal(summary.valid,true);
 const protocol=(kind==='stroop'?createStroopGraphTemplate:createGonogoGraphTemplate)(cfg);
 const nodes=protocol.graph.nodes.filter(n=>n.component.type==='experiment.cognitive-task');
 assert.equal(nodes.find(n=>!n.config.practice).config.trials.length,summary.mainTrials);
 assert.equal(nodes.find(n=>n.config.practice).config.trials.length,summary.practiceTrials);
 if(kind==='gonogo')assert.equal(nodes.find(n=>!n.config.practice).config.trials.filter(t=>t.trialType==='go').length,summary.goTrials);
 }
});
