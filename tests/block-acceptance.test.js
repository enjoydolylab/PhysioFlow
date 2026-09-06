import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveTrials } from '../src/engine.js';
import { block, protocol, trial, validateProtocol } from '../src/domain.js';
import { createRuntime } from '../src/runtimeMachine.js';

test('constrained block order never silently repeats when a valid order exists', () => {
  const trials = ['A', 'A', 'A', 'B', 'B', 'C'].map((condition, index) => ({ trial_id: String(index), condition }));
  for (let seed = 0; seed < 100; seed++) {
    const result = resolveTrials(trials, 'random', seed, [], { no_immediate_repeat: true });
    assert.equal(new Set(result.map(t => t.trial_id)).size, trials.length);
    assert.ok(result.every((t, i) => !i || t.condition !== result[i - 1].condition), `seed ${seed}`);
    assert.deepEqual(result, resolveTrials(trials, 'random', seed, [], { no_immediate_repeat: true }));
  }
});

test('impossible block constraints and fractional repeats are rejected before freezing', () => {
  const p = protocol({ blocks: [block({ order_rule: 'random', no_immediate_repeat: true, repeat_count: 1.5,
    trials: ['A', 'A', 'A', 'B'].map(condition => trial({ condition })) })] });
  const result = validateProtocol(p);
  assert.ok(result.errors.some(e => /impossible/i.test(e)));
  assert.ok(result.errors.some(e => /integer/i.test(e)));
  assert.throws(() => resolveTrials(p.blocks[0].trials, 'random', 0, [], { no_immediate_repeat: true }), /impossible/i);
});

test('condition constraints agree with an independent exhaustive feasibility oracle', () => {
  const feasible = (counts, limit, previous = -1, run = 0) => {
    if (counts.every(n => n === 0)) return true;
    return counts.some((n, label) => {
      if (!n || (label === previous && run === limit)) return false;
      const next = [...counts]; next[label]--;
      return feasible(next, limit, label, label === previous ? run + 1 : 1);
    });
  };
  for (let a=0;a<=3;a++) for (let b=0;b<=3;b++) for (let c=0;c<=3;c++) for (const limit of [1,2,3]) {
    const items = [a,b,c].flatMap((n,condition) => Array.from({length:n}, (_,i)=>({condition,trial_id:`${condition}-${i}`})));
    for (let seed=0;seed<5;seed++) {
      const order = () => resolveTrials(items,'random',seed,[],{max_consecutive_same:limit});
      if (!feasible([a,b,c],limit)) { assert.throws(order,/impossible/i); continue; }
      const result = order();
      assert.deepEqual(result.map(t=>t.trial_id).sort(),items.map(t=>t.trial_id).sort());
      assert.ok(result.every((t,i)=>i<limit || !result.slice(i-limit,i).every(x=>x.condition===t.condition)));
    }
  }
});

test('Block repeat and Trial repeat retain their documented execution nesting', () => {
  const p = protocol({blocks:[block({repeat_count:2,trials:[trial({condition:'A',repeat_count:2}),trial({condition:'B'})]}),block({trials:[trial({condition:'C'})]})]});
  const runtime = createRuntime(p,{order_row:0});
  assert.deepEqual(runtime.units.map(u=>u.trial.condition),['A','A','B','A','A','B','C']);
});
