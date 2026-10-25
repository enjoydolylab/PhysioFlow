import test from 'node:test';
import assert from 'node:assert/strict';
import { createCoreComponentRegistry, validateProtocolGraph } from '../src/core/index.js';

// Minimal hand-built protocols: these tests are about control flow, so the
// fixtures stay smaller than the ones built through the graph commands.
// Each branch gets its own End because a control input accepts one connection.
const node = (id, type, extra = {}) => ({ id, component: { type, version: '1.0.0' }, label: id, config: {}, bindings: {}, ...extra });
const control = (id, from, fromPort, to, toPort) => ({ id, kind: 'control', source: { nodeId: from, portId: fromPort }, target: { nodeId: to, portId: toPort } });
const bind = variable => ({ value: { kind: 'variable', variable } });

const build = ({ nodes, edges, variables = [] }) => ({
  schemaVersion: '2.0.0-alpha.1',
  protocolId: 'protocol_assignment',
  projectId: 'project_assignment',
  metadata: { name: 'Assignment test', description: '', tags: [] },
  biodb: { experimentId: '', experimentLabel: '' },
  variables,
  graph: { nodes, edges, entryNodeId: 'start', groups: [] },
});

const validate = protocol => validateProtocolGraph(protocol, createCoreComponentRegistry());
const codes = result => [...result.errors, ...result.warnings].map(item => item.code);
const assignmentCodes = result => codes(result).filter(code => code.startsWith('variable.'));

const score = { name: 'score', type: 'string', scope: 'session' };
const flag = { name: 'flag', type: 'number', scope: 'session' };

test('a write before the read on a straight path is clean', () => {
  const result = validate(build({
    nodes: [
      node('start', 'core.start'),
      node('resp', 'input.response', { bindings: bind('score') }),
      node('cond', 'logic.condition', { bindings: bind('score') }),
      node('endTrue', 'core.end'),
      node('endFalse', 'core.end'),
    ],
    edges: [
      control('e1', 'start', 'next', 'resp', 'in'),
      control('e2', 'resp', 'next', 'cond', 'in'),
      control('e3', 'cond', 'true', 'endTrue', 'in'),
      control('e4', 'cond', 'false', 'endFalse', 'in'),
    ],
    variables: [score],
  }));
  assert.deepEqual(assignmentCodes(result), []);
  assert.equal(result.valid, true);
});

test('reading a variable that nothing writes is an error', () => {
  const result = validate(build({
    nodes: [
      node('start', 'core.start'),
      node('cond', 'logic.condition', { bindings: bind('score') }),
      node('endTrue', 'core.end'),
      node('endFalse', 'core.end'),
    ],
    edges: [
      control('e1', 'start', 'next', 'cond', 'in'),
      control('e2', 'cond', 'true', 'endTrue', 'in'),
      control('e3', 'cond', 'false', 'endFalse', 'in'),
    ],
    variables: [score],
  }));
  const issue = result.errors.find(item => item.code === 'variable.never_written');
  assert.ok(issue, `expected variable.never_written, got ${codes(result)}`);
  assert.equal(issue.variable, 'score');
  assert.equal(issue.nodeId, 'cond');
  assert.equal(result.valid, false);
});

test('a write on only one branch leaves the other branch reading undefined', () => {
  const result = validate(build({
    nodes: [
      node('start', 'core.start'),
      node('resp0', 'input.response', { bindings: bind('flag') }),
      node('cond1', 'logic.condition', { bindings: bind('flag') }),
      node('resp1', 'input.response', { bindings: bind('score') }),
      node('cond2', 'logic.condition', { bindings: bind('score') }),
      node('endA', 'core.end'),
      node('endB', 'core.end'),
      node('endC', 'core.end'),
    ],
    edges: [
      control('e1', 'start', 'next', 'resp0', 'in'),
      control('e2', 'resp0', 'next', 'cond1', 'in'),
      control('e3', 'cond1', 'true', 'resp1', 'in'),
      control('e4', 'cond1', 'false', 'cond2', 'in'),
      control('e5', 'resp1', 'next', 'endA', 'in'),
      control('e6', 'cond2', 'true', 'endB', 'in'),
      control('e7', 'cond2', 'false', 'endC', 'in'),
    ],
    variables: [flag, score],
  }));
  const warning = result.warnings.find(item => item.code === 'variable.maybe_unwritten');
  assert.ok(warning, `expected variable.maybe_unwritten, got ${codes(result)}`);
  assert.equal(warning.variable, 'score');
  assert.equal(warning.nodeId, 'cond2');
  // A path-dependent read is a warning: a loop may legitimately read a value its
  // previous pass wrote, so it must not block saving the protocol.
  assert.equal(result.errors.some(item => item.code === 'variable.maybe_unwritten'), false);
});

test('branches cannot merge: a control input accepts one connection', () => {
  const result = validate(build({
    nodes: [
      node('start', 'core.start'),
      node('resp0', 'input.response', { bindings: bind('flag') }),
      node('cond1', 'logic.condition', { bindings: bind('flag') }),
      node('resp1', 'input.response', { bindings: bind('score') }),
      node('resp2', 'input.response', { bindings: bind('score') }),
      node('join', 'logic.condition', { bindings: bind('score') }),
      node('endTrue', 'core.end'),
      node('endFalse', 'core.end'),
    ],
    edges: [
      control('e1', 'start', 'next', 'resp0', 'in'),
      control('e2', 'resp0', 'next', 'cond1', 'in'),
      control('e3', 'cond1', 'true', 'resp1', 'in'),
      control('e4', 'cond1', 'false', 'resp2', 'in'),
      control('e5', 'resp1', 'next', 'join', 'in'),
      control('e6', 'resp2', 'next', 'join', 'in'),
      control('e7', 'join', 'true', 'endTrue', 'in'),
      control('e8', 'join', 'false', 'endFalse', 'in'),
    ],
    variables: [flag, score],
  }));
  // Two edges into one control input is rejected. This matters for the assignment
  // analysis: in practice a node never has more than one predecessor, so a read
  // cannot be satisfied by one branch and starved by another at a merge point.
  assert.ok(result.errors.some(item => item.code === 'edge.target_multiple'));
});

test('an unreachable node is not reported for assignment', () => {
  const result = validate(build({
    nodes: [
      node('start', 'core.start'),
      node('end', 'core.end'),
      node('orphan', 'logic.condition', { bindings: bind('score') }),
    ],
    edges: [control('e1', 'start', 'next', 'end', 'in')],
    variables: [score],
  }));
  // The orphan already produces node.unreachable; a second complaint about its
  // bindings would just be noise.
  assert.equal(result.errors.some(item => item.code === 'variable.never_written'), false);
  assert.ok(result.warnings.some(item => item.code === 'node.unreachable'));
});

test('an unreachable writer does not satisfy a reachable read', () => {
  const result = validate(build({
    nodes: [
      node('start', 'core.start'),
      node('cond', 'logic.condition', { bindings: bind('score') }),
      node('endTrue', 'core.end'),
      node('endFalse', 'core.end'),
      node('orphanWriter', 'input.response', { bindings: bind('score') }),
      node('orphanEnd', 'core.end'),
    ],
    edges: [
      control('e1', 'start', 'next', 'cond', 'in'),
      control('e2', 'cond', 'true', 'endTrue', 'in'),
      control('e3', 'cond', 'false', 'endFalse', 'in'),
      // The only writer is unreachable, so the read still has no value.
      control('e4', 'orphanWriter', 'next', 'orphanEnd', 'in'),
    ],
    variables: [score],
  }));
  assert.ok(
    result.errors.some(item => item.code === 'variable.never_written'),
    `expected variable.never_written, got ${codes(result)}`,
  );
});
