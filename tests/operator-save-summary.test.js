import test from 'node:test';
import assert from 'node:assert/strict';
import {operatorSaveSummary} from '../src/operator/saveSummary.js';
test('saved checkpoint cannot mask final save failure, saving in progress or server failure',()=>{
 const input={runtimeStatus:'completed',saved:'Disk full',recoverySave:{status:'saved',error:''},hostedStatus:{error:'Offline',completed:false}};
 let summary=operatorSaveSummary(input);assert.equal(summary.saveStatus,'error');assert.equal(summary.saveError,'Disk full');assert.equal(summary.hostedSaveStatus,'error');
 input.saved=false;summary=operatorSaveSummary(input);assert.equal(summary.saveStatus,'saving');assert.equal(summary.saveError,'');
 input.saved=true;summary=operatorSaveSummary(input);assert.equal(summary.saveStatus,'saved');assert.equal(summary.hostedSaveStatus,'error');
 input.hostedStatus={completed:true};assert.equal(operatorSaveSummary(input).hostedSaveStatus,'saved');
 input.runtimeStatus='waiting';input.recoverySave={status:'error',error:'Permission denied'};summary=operatorSaveSummary(input);assert.equal(summary.saveStatus,'error');assert.equal(summary.saveError,'Permission denied');
});
