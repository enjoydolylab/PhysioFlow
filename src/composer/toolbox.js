import { composerStrings } from './composerStrings.js';
import { humanizeIssueCode } from './labels.js';
// Module-level geometry / validation helpers for the Composer V2 editor.
// Pure functions — no React, no component state.

export const UI_TEMPLATE_KIND = {
  'display.screen': 'instruction',
  'display.media': 'media',
  'input.rating': 'rating',
  'input.text': 'text',
  'timing.wait': 'instruction',
  'stimulus.fixation': 'fixation',
  'stimulus.attention-check': 'attention',
  'input.response': 'response',
  'setup.device-check': 'device',
  'operator.manual-event': 'manual',
  'stimulus.screen-calibration': 'calibration',
  'stimulus.custom-html': 'html',
  'utility.note': 'instruction',
  'utility.junction': 'instruction',
};

export const NODE_WIDTH = 188;
export const NODE_HEIGHT = 112;

export function downloadJson(name, value) {
  const anchor = document.createElement('a');
  anchor.href = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }));
  anchor.download = name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(anchor.href), 1000);
}

export function getPath(value, path) {
  return path.split('.').reduce((current, key) => current?.[key], value);
}

export function setPath(value, path, nextValue) {
  const next = structuredClone(value || {});
  const keys = path.split('.');
  let cursor = next;
  keys.slice(0, -1).forEach(key => { cursor[key] = { ...(cursor[key] || {}) }; cursor = cursor[key]; });
  cursor[keys.at(-1)] = nextValue;
  return next;
}

// English source messages keyed by the stable core validation codes.
const VALIDATION_SOURCES = {
  "protocol.invalid": "Protocol must be an object",
  "protocol.id_missing": "Protocol ID is required",
  "protocol.name_missing": "Protocol name is required",
  "graph.empty": "Protocol graph needs nodes",
  "graph.entry_missing": "Graph entry node is missing or invalid",
  "graph.entry_not_start": "Graph entry node must be a core.start component",
  "graph.start_count": "Exactly one Start node is required",
  "graph.end_missing": "Graph needs at least one End node",
  "graph.end_unreachable": "No End node is reachable from Start",
  "node.unreachable": "Node is unreachable from the flow",
  "node.id_missing": "Node ID is required",
  "node.id_duplicate": "Node IDs must be unique",
  "node.component_missing": "Node component type and version are required",
  "node.component_unknown": "Node component is not registered",
  "edge.source_missing": "Connection source node is missing",
  "edge.target_missing": "Connection target node is missing",
  "edge.source_port_missing": "Connection source port is missing",
  "edge.target_port_missing": "Connection target port is missing",
  "edge.source_direction": "Edge source must be an output port",
  "edge.target_direction": "Edge target must be an input port",
  "edge.kind_mismatch": "Edge kind must match both ports",
  "edge.target_multiple": "Input port cannot have multiple connections",
  "port.required_unbound": "Required port has no variable binding",
  "port.required_unconnected": "Required port is not connected",
  "binding.variable_missing": "Referenced variable is missing",
  "binding.variable_type_mismatch": "Variable and port types do not match",
  "variable.name_missing": "Variable name is required",
  "variable.name_duplicate": "Variable names must be unique",
  "variable.type_invalid": "Variable type is invalid",
  "variable.scope_invalid": "Variable scope is invalid",
  "group.name_missing": "Group name is required",
  "group.empty": "Group is empty",
  "group.node_missing": "Group contains a missing node",
  "group.node_multiple": "A node can belong to only one group",
  "subflow.parameter_mapping_missing": "Subflow parameter mapping is missing",
  "subflow.parameter_mapping_type_mismatch": "Subflow parameter mapping types do not match",
  "subflow.template_empty": "Subflow template is empty",
  "subflow.entry_invalid": "Subflow entry node is invalid",
  "subflow.exit_invalid": "Subflow exit node is invalid",
  "sdk.permission_unapproved": "SDK permissions have not been approved",
  "sdk.permission_variable_read": "SDK lacks permission to read variables",
  "sdk.permission_network_media": "SDK lacks permission to access network media",
  "sdk.permission_asset_read": "SDK lacks permission to read assets",
  "device.connector_missing": "Device connector is not installed",
  "device.connector_invalid": "Device connector is invalid",
  "device.permission_unapproved": "Device permissions have not been approved",
  "config.media_source_missing": "Set a media URL, asset or stimulus pool",
  "config.media_url_invalid": "Media URL is invalid",
  "config.media_mode_invalid": "Media completion mode is invalid",
  "config.stimulus_pool_id_invalid": "Stimulus pool ID is missing or duplicated",
  "config.stimulus_pool_name_missing": "Stimulus pool name is required",
  "config.stimulus_pool_type_invalid": "Stimulus pool media type is invalid",
  "config.stimulus_pool_missing": "Selected stimulus pool is missing",
  "config.stimulus_pool_empty": "Add stimuli to the stimulus pool",
  "config.stimulus_pool_asset_missing": "Stimulus pool media asset is missing",
  "config.stimulus_pool_type_mismatch": "Stimulus pool and Media node types do not match",
  "config.stimulus_pool_inconsistent": "Legacy embedded stimulus pool configuration is inconsistent",
  "config.stimulus_pool_too_small": "Not enough stimuli for allocation without replacement",
  "config.participant_ui_missing": "Participant screen is missing",
  "config.ui_variable_missing": "Screen binding references a missing variable",
  "config.input_missing": "Participant screen has no input controls",
  "config.completion_action_missing": "Manual completion requires a submit or continue button",
  "config.duration_invalid": "Display duration must be at least 0",
  "config.wait_duration_invalid": "Wait duration must be at least 0",
  "config.rating_range_invalid": "Rating maximum must be greater than minimum",
  "config.loop_limit_invalid": "Loop count must be an integer of at least 1",
  "config.condition_operator_invalid": "Condition operator is invalid",
  "config.loop_until_operator_invalid": "Loop termination operator is invalid",
  "config.random_probability_invalid": "Random branch probability is invalid",
  "config.fixation_shape_invalid": "Fixation shape is invalid",
  "config.cognitive_task_kind_invalid": "Cognitive task type is invalid",
  "config.cognitive_task_trials_empty": "Generate cognitive task trials first",
  "config.cognitive_task_trial_id_invalid": "Cognitive task trial ID is invalid",
  "config.cognitive_task_timing_invalid": "Cognitive task trial timing is invalid",
  "config.migration.review_required": "Review settings after migration"
};
const validationCopy = (key, language) => composerStrings[language]?.[key] || key;
export const VALIDATION_MESSAGES_ZH = Object.fromEntries(Object.entries(VALIDATION_SOURCES).map(([code, source]) => [code, validationCopy(source, 'zh')]));
export const VALIDATION_MESSAGES_JA = Object.fromEntries(Object.entries(VALIDATION_SOURCES).map(([code, source]) => [code, validationCopy(source, 'ja')]));

export function isValidMediaUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return false;
  const trimmed = value.trim();
  if (/[\s]/.test(trimmed)) return false;
  try {
    const parsed = new URL(trimmed);
    return ['http:', 'https:', 'data:', 'blob:'].includes(parsed.protocol);
  } catch {
    // Relative paths (local dev / packaged asset files) must look like a file path.
    return trimmed.includes('/') && !/^[a-z][a-z0-9+.-]*:/i.test(trimmed);
  }
}

export function validationIssueMessage(issue, language, protocol) {
  const messages = language === 'zh' ? VALIDATION_MESSAGES_ZH : language === 'ja' ? VALIDATION_MESSAGES_JA : null;
  if (!messages) return VALIDATION_SOURCES[issue.code] || humanizeIssueCode(issue.message || issue.code, {}, language);
  const template = messages[issue.code] || messages[issue.code?.replace('_', '.')];
  if (!template) return validationCopy(humanizeIssueCode(issue.message || issue.code, messages, language), language);
  const node = protocol?.graph?.nodes?.find(item => item.id === issue.nodeId);
  return node?.label ? `「${node.label}」${language === 'ja' ? ': ' : ''}${template}` : template;
}

export function bindingValue(binding) {
  if (!binding) return '';
  if (binding.kind === 'variable') return `variable:${binding.variable}`;
  if (binding.kind === 'output') return `output:${binding.nodeId}:${binding.portId}`;
  return '';
}

export function parseBindingValue(raw) {
  if (!raw) return null;
  if (raw.startsWith('variable:')) return { kind: 'variable', variable: raw.slice(9) };
  if (raw.startsWith('output:')) {
    const match = raw.slice(7).match(/^([^:]+):(.+)$/);
    return match ? { kind: 'output', nodeId: match[1], portId: match[2] } : null;
  }
  return null;
}

export function portPosition(node, port, definition) {
  const ports = definition.ports.filter(item => item.direction === port.direction);
  const index = ports.findIndex(item => item.id === port.id);
  const gap = NODE_HEIGHT / (ports.length + 1);
  return {
    x: node.layout.x + (port.direction === 'output' ? NODE_WIDTH : 0),
    y: node.layout.y + gap * (index + 1),
  };
}

export function edgePath(source, target) {
  const bend = Math.max(54, Math.abs(target.x - source.x) * 0.45);
  return `M ${source.x} ${source.y} C ${source.x + bend} ${source.y}, ${target.x - bend} ${target.y}, ${target.x} ${target.y}`;
}

export const GUIDE_TOLERANCE = 6;
export function computeGuides(ids, positions, nodes) {
  const xs = [], ys = [];
  for (const id of ids) {
    const p = positions[id];
    if (!p) continue;
    xs.push(p.x, p.x + NODE_WIDTH / 2, p.x + NODE_WIDTH);
    ys.push(p.y, p.y + NODE_HEIGHT / 2, p.y + NODE_HEIGHT);
  }
  if (!xs.length) return { guides: [], dx: 0, dy: 0 };
  const left = Math.min(...xs), right = Math.max(...xs);
  const top = Math.min(...ys), bottom = Math.max(...ys);
  const boxX = [left, (left + right) / 2, right];
  const boxY = [top, (top + bottom) / 2, bottom];
  const others = nodes.filter(node => !ids.includes(node.id));
  const find = axis => {
    let best = { value: Infinity, pos: null, a: null, b: null };
    for (const other of others) {
      const refs = axis === 'x'
        ? [[other.layout.x, other.layout.y, other.layout.y + NODE_HEIGHT], [other.layout.x + NODE_WIDTH / 2, other.layout.y, other.layout.y + NODE_HEIGHT], [other.layout.x + NODE_WIDTH, other.layout.y, other.layout.y + NODE_HEIGHT]]
        : [[other.layout.y, other.layout.x, other.layout.x + NODE_WIDTH], [other.layout.y + NODE_HEIGHT / 2, other.layout.x, other.layout.x + NODE_WIDTH], [other.layout.y + NODE_HEIGHT, other.layout.x, other.layout.x + NODE_WIDTH]];
      const targets = axis === 'x' ? boxX : boxY;
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          const diff = refs[i][0] - targets[j];
          if (Math.abs(diff) < GUIDE_TOLERANCE && Math.abs(diff) < Math.abs(best.value)) {
            best = { value: diff, pos: refs[i][0], a: refs[i][1], b: refs[i][2] };
          }
        }
      }
    }
    return best;
  };
  const bx = find('x'), by = find('y');
  const guides = [];
  let dx = 0, dy = 0;
  if (bx.pos !== null) { dx = bx.value; guides.push({ dir: 'v', pos: bx.pos, a: Math.min(top, bx.a), b: Math.max(bottom, bx.b) }); }
  if (by.pos !== null) { dy = by.value; guides.push({ dir: 'h', pos: by.pos, a: Math.min(left, by.a), b: Math.max(right, by.b) }); }
  return { guides, dx, dy };
}

export function groupBounds(group, nodes) {
  const members = nodes.filter(node => group.nodeIds.includes(node.id));
  if (!members.length) return null;
  const left = Math.min(...members.map(node => node.layout.x)) - 34;
  const top = Math.min(...members.map(node => node.layout.y)) - 42;
  const right = Math.max(...members.map(node => node.layout.x + NODE_WIDTH)) + 34;
  const bottom = Math.max(...members.map(node => node.layout.y + NODE_HEIGHT)) + 34;
  return { left, top, width: right - left, height: bottom - top };
}
