import test from 'node:test';
import assert from 'node:assert/strict';
import {validateEmotionTemplateConfig} from '../src/emotionTemplateConfig.js';
import {createEmotionGraphTemplate} from '../src/core/taskTemplates.js';
test('emotion configuration rejects absent, negative or noninteger durations and unsupported orders',()=>{
 const cfg={fixationMs:500,recoveryMs:3000,seed:1,orderRule:'fixed'};
 for(const patch of [{fixationMs:''},{recoveryMs:-1},{seed:1.5},{orderRule:'unknown'}])assert.equal(validateEmotionTemplateConfig({...cfg,...patch}).valid,false);
});
test('emotion parameters propagate to all five conditions without inventing video sources',()=>{
 const result=validateEmotionTemplateConfig({fixationMs:'700',recoveryMs:'4000',seed:'2',orderRule:'random'});assert(result.valid);
 const protocol=createEmotionGraphTemplate(result.options);
 assert.equal(protocol.metadata.experimentDesign.seed,2);
 assert.equal(protocol.graph.nodes.filter(n=>n.component.type==='stimulus.fixation'&&n.config.completion.durationMs===700).length,5);
 assert.equal(protocol.graph.nodes.filter(n=>n.component.type==='timing.wait'&&n.config.durationMs===4000).length,5);
 assert.equal(protocol.graph.nodes.filter(n=>n.component.type==='display.media'&&!n.config.sourceUrl&&!n.config.assetId).length,5);
});
