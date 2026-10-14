const numericOperators = new Set(['greater_than','greater_than_or_equal','less_than','less_than_or_equal']);
export function conditionExpectedError(config, inputType, { hasCompare = false } = {}) {
 if (['is_truthy','is_falsy'].includes(config?.operator)) return null;
 const value=config?.expected;
 const numeric=(typeof value==='number'||(typeof value==='string'&&value.trim()!==''))&&Number.isFinite(Number(value));
 if(numericOperators.has(config?.operator)) {
  if(inputType==='boolean')return 'config.condition_numeric_boolean';
  if(!hasCompare&&!numeric)return 'config.condition_expected_number';
 }
 if(hasCompare)return null;
 if(inputType==='number'&&['equals','not_equals'].includes(config?.operator)&&!numeric)return 'config.condition_expected_number';
 if(inputType==='boolean'&&['equals','not_equals'].includes(config?.operator)&&typeof value!=='boolean'&&!['true','false'].includes(value))return 'config.condition_expected_boolean';
 return null;
}
export function conditionInputType(protocol,node,registry,portId='value') {
 const binding=node.bindings?.[portId];
 if(binding?.kind==='variable')return protocol.variables?.find(v=>v.name===binding.variable)?.type;
 const edge=protocol.graph.edges?.find(e=>e.kind==='data'&&e.target.nodeId===node.id&&e.target.portId===portId);
 const endpoint=binding?.kind==='output'?{nodeId:binding.nodeId,portId:binding.portId}:edge?.source;
 const source=protocol.graph.nodes.find(n=>n.id===endpoint?.nodeId);
 return source&&registry?.get(source.component.type,source.component.version)?.ports.find(p=>p.id===endpoint.portId)?.dataType;
}
