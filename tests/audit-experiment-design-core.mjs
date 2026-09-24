// Historical pre-fix reproduction script; preserved audit evidence lives in artifacts/experiment-design-audit-2026-09-17.
// Run tests/experiment-design-regressions.test.js and the participant-public E2E suite for fixed behavior.
import { buildGraphBidsBundle } from '../src/data/index.js';
import { createProtocolGraph, addNode, connect, createCoreComponentRegistry, validateProtocolGraphConfiguration, freezeProtocolGraph } from '../src/core/index.js';
import { createRuntimeState, startRuntime, completeCurrentNode } from '../src/runtime/index.js';
const registry = createCoreComponentRegistry();
const services = { idFactory: prefix => prefix + crypto.randomUUID(), clock: { now: () => ({ epochMs: 1000, monotonicMs: 1000, iso: new Date(1000).toISOString() }) } };
function base() { const p = createProtocolGraph({ name: 'Audit' }); p.graph.edges = []; return p; }
function edge(p, from, port, to) { return connect(p, 'control', { nodeId: from, portId: port }, { nodeId: to, portId: 'in' }).protocol; }
function run(p) { return startRuntime(createRuntimeState(p, { sessionId: 'audit', startedAtEpochMs: 1000, startedAtMonotonicMs: 1000 }), p, registry, services); }
let p = base();
const start = p.graph.nodes.find(n => n.component.type === 'core.start').id;
const end = p.graph.nodes.find(n => n.component.type === 'core.end').id;
for (const [id, type, config] of [['outer', 'logic.loop', { maxIterations: 2 }], ['inner', 'logic.loop', { maxIterations: 3 }], ['body', 'timing.wait', { durationMs: 1 }]]) p = addNode(p, type, { id, config: { ...registry.get(type, '1.0.0').defaultConfig, ...config } }).protocol;
for (const args of [[start,'next','outer'],['outer','body','inner'],['inner','body','body'],['body','next','inner'],['inner','exit','outer'],['outer','exit',end]]) p = edge(p,...args);
const check = validateProtocolGraphConfiguration(p,registry);
const frozen = await freezeProtocolGraph(p, registry);
let result = run(frozen), visits = 0;
while (result.state.status === 'waiting' && visits < 20) { visits++; result = completeCurrentNode(result.state,frozen,registry,services); }
const nested = { validation: check.valid, frozen: frozen.version.status, expectedVisits: 6, actualVisits: visits, finalStatus: result.state.status, loopCounts: result.state.loopCounts };
p = base();
const s = p.graph.nodes.find(n => n.component.type === 'core.start').id;
const e = p.graph.nodes.find(n => n.component.type === 'core.end').id;
p = addNode(p,'timing.wait',{id:'wait',config:{...registry.get('timing.wait','1.0.0').defaultConfig,durationMs:1}}).protocol;
p = addNode(p,'core.end',{id:'end2'}).protocol;
p = edge(p,s,'next',e); p = edge(p,s,'next','wait'); p = edge(p,'wait','next','end2');
const branchedFrozen = await freezeProtocolGraph(p,registry);
const branch = { validation: validateProtocolGraphConfiguration(p,registry).valid, frozen: branchedFrozen.version.status, runtimeStatus: run(branchedFrozen).state.status, error: run(branchedFrozen).state.error };
const bids = buildGraphBidsBundle({session_id:'audit',participant_id:'P001'},p,[]);
const eventsFile = Object.keys(bids).find(name => name.endsWith('_events.tsv'));
const header = bids[eventsFile].split('\n')[0];
const exportFormat = { eventsFile, header, expectedTabColumns: 9, actualTabColumns: header.split('\t').length, commaColumns: header.split(',').length };
console.log(JSON.stringify({ nestedLoop: nested, controlFanout: branch, exportFormat },null,2));
