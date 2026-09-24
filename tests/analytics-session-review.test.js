import test from 'node:test';
import assert from 'node:assert/strict';
import { isReviewableSession } from '../src/analysis/sessionReview.js';
test('all terminal sessions including runtime failures are reviewable',()=>{
 for(const status of ['completed','aborted','failed']) assert.equal(isReviewableSession({status}),true);
 for(const status of ['running','paused','ready',undefined]) assert.equal(isReviewableSession({status}),false);
});
