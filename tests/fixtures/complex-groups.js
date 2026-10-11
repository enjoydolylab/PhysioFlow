import { createProtocolGraph, createCoreComponentRegistry } from '../../src/core/index.js';
import { createNode, createEdge } from '../../src/core/protocolGraph.js';

export function complexGroupFixture() {
  const registry = createCoreComponentRegistry();
  const p = createProtocolGraph({ name: 'QA bounded loops and random branches' });
  const [start, end] = p.graph.nodes;
  const add = (id, type, config = {}) => p.graph.nodes.push(createNode(type, { id, label: id, config: { ...structuredClone(registry.get(type).defaultConfig), ...config } }));
  add('outer', 'logic.loop', { maxIterations: 2 });
  add('inner', 'logic.loop', { maxIterations: 3 });
  add('choice', 'logic.random');
  add('left', 'display.screen'); add('right', 'display.screen');
  add('otherLoop', 'logic.loop', { maxIterations: 2 }); add('other', 'display.screen');
  add('last', 'display.screen');
  const links = [[start.id,'next','outer'],['outer','body','inner'],['inner','body','choice'],['choice','a','left'],['choice','b','right'],['left','next','inner'],['right','next','inner'],['inner','exit','outer'],['outer','exit','otherLoop'],['otherLoop','body','other'],['other','next','otherLoop'],['otherLoop','exit','last'],['last','next',end.id]];
  p.graph.edges = links.map(([source, port, target], i) => createEdge('control', { nodeId: source, portId: port }, { nodeId: target, portId: 'in' }, { id: `complex_e${i}` }));
  p.graph.groups = [['nested', ['outer','inner','choice','left','right']], ['repeated',['otherLoop','other']], ['single',['last']]].map(([id,nodeIds]) => ({id,name:id,nodeIds,kind:'container',parameters:[],metadata:{}}));
  p.groupRandomization = { enabled:true,groupIds:p.graph.groups.map(g=>g.id) };
  return p;
}
