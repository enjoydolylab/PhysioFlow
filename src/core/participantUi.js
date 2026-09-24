import { discreteScaleValues } from './inputValidation.js';
import { createId } from './ids.js';

export const PARTICIPANT_UI_SCHEMA_VERSION = '1.0.0';
export const PARTICIPANT_UI_TYPES = Object.freeze(['Screen', 'Layout', 'Text', 'Media', 'Input', 'Button', 'Progress', 'Html', 'Divider', 'Rectangle', 'Ellipse']);

export const UI_STYLE_KEYS = Object.freeze([
  'color', 'background', 'fontSize', 'textAlign', 'fontFamily', 'fontWeight', 'lineHeight',
  'maxWidth', 'padding', 'gap', 'justifyContent', 'alignItems', 'borderRadius',
]);

export const PARTICIPANT_UI_THEME_DEFAULTS = Object.freeze({
  ink: '#17231d', green: '#197453', greenStrong: '#0f5c40', lime: '#b7dd55',
  mint: '#e8f5ee', blue: '#356fae', amber: '#b66f15',
  paper: '#ffffff', paperSoft: '#f8faf8', surface: '#eef4f0',
  line: '#d9e2dc', lineStrong: '#c4d1c9', danger: '#b7352d', warning: '#a96612',
  muted: '#627168', mutedStrong: '#46564d',
  fontFamily: 'system-ui, sans-serif', headingFamily: 'Georgia, serif',
  fontSizeBase: '16px', spacingUnit: '8px', radius: '12px', maxWidth: '800px',
});

export function createParticipantUiTheme(overrides = {}) {
  return { ...PARTICIPANT_UI_THEME_DEFAULTS, ...structuredClone(overrides) };
}

export function isUiTokenRef(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
    && Object.keys(value).length === 1 && typeof value.$token === 'string' && Boolean(value.$token.trim());
}

// A size is either a positive design-pixel number or a CSS length string. Letting
// elements carry a length (e.g. "100%") is what allows a preset such as "fill the
// screen" to be expressed with the ordinary x/y/width/height properties instead of
// a media-only flag, so every renderer only has to know one sizing model.
export function isUiSize(value) {
  if (Number.isFinite(value) && value > 0) return true;
  return typeof value === 'string' && /^\d+(\.\d+)?(px|%|vw|vh|em|rem)$/.test(value.trim());
}

const CONTAINERS = new Set(['Screen', 'Layout']);
const FORBIDDEN_TOKEN_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

export function createUiElement(type, options = {}) {
  if (!PARTICIPANT_UI_TYPES.includes(type)) throw new Error(`Unknown participant UI element ${type}`);
  const idFactory = options.idFactory || createId;
  return {
    id: options.id || idFactory('ui'),
    type,
    props: structuredClone(options.props || {}),
    ...(options.style ? { style: structuredClone(options.style) } : {}),
    bindings: structuredClone(options.bindings || {}),
    actions: structuredClone(options.actions || []),
    children: CONTAINERS.has(type) ? structuredClone(options.children || []) : [],
  };
}

export function createParticipantScreen(options = {}) {
  const screenSize = options.screenSize
    ? { screenWidth: options.screenSize.width, screenHeight: options.screenSize.height }
    : {};
  return {
    schemaVersion: PARTICIPANT_UI_SCHEMA_VERSION,
    root: createUiElement('Screen', {
      ...options,
      props: { maxWidth: 800, align: 'center', background: '#ffffff', color: '#17211b', padding: 32, ...screenSize, ...(options.props || {}) },
      children: options.children || [],
    }),
  };
}

// Default design resolution for freshly created participant screens. Keeping a fixed
// resolution is what makes the editor canvas, the preview and the live experiment
// agree; without it the runtime falls back to a responsive layout that no longer
// matches the canvas the screen was designed on. Explicit props still win, so
// callers that want a responsive screen can pass their own.
export const TEMPLATE_SCREEN_SIZE = Object.freeze({ width: 1280, height: 720 });

export function participantUiTemplate(kind = 'instruction', options = {}) {
  const idFactory = options.idFactory || createId;
  if (kind === 'media') return createParticipantScreen({ idFactory, screenSize: TEMPLATE_SCREEN_SIZE, children: [
    createUiElement('Text', { idFactory, props: { text: 'Stimulus', variant: 'heading' } }),
    createUiElement('Media', { idFactory, props: { mediaType: 'image', sourceUrl: '', alt: 'Experiment stimulus', fit: 'contain' } }),
    createUiElement('Button', { idFactory, props: { label: 'Continue', variant: 'primary' }, actions: [{ event: 'click', action: 'submit' }] }),
  ] });
  if (kind === 'form') return createParticipantScreen({ idFactory, screenSize: TEMPLATE_SCREEN_SIZE, children: [
    createUiElement('Text', { idFactory, props: { text: 'How do you feel?', variant: 'heading' } }),
    createUiElement('Input', { idFactory, props: { name: 'response', inputType: 'rating', label: 'Rating', min: 1, max: 7, required: true } }),
    createUiElement('Button', { idFactory, props: { label: 'Submit response', variant: 'primary' }, actions: [{ event: 'click', action: 'submit' }] }),
  ] });
  if (kind === 'text') return createParticipantScreen({ idFactory, screenSize: TEMPLATE_SCREEN_SIZE, children: [
    createUiElement('Text', { idFactory, props: { text: 'Text input', variant: 'heading' } }),
    createUiElement('Input', { idFactory, props: { name: 'value', inputType: 'text', label: 'Response', required: false } }),
    createUiElement('Button', { idFactory, props: { label: 'Continue', variant: 'primary' }, actions: [{ event: 'click', action: 'submit' }] }),
  ] });
  if (kind === 'rating') return createParticipantScreen({ idFactory, screenSize: TEMPLATE_SCREEN_SIZE, children: [
    createUiElement('Text', { idFactory, props: { text: 'Please rate', variant: 'heading' } }),
    createUiElement('Input', { idFactory, props: { name: 'rating', inputType: 'rating', label: 'Rating', min: 1, max: 7, required: true } }),
    createUiElement('Button', { idFactory, props: { label: 'Submit', variant: 'primary' }, actions: [{ event: 'click', action: 'submit' }] }),
  ] });
  if (kind === 'fixation') return createParticipantScreen({ idFactory, screenSize: TEMPLATE_SCREEN_SIZE, children: [
    createUiElement('Text', { idFactory, style: { fontSize: '80px', textAlign: 'center' }, props: { text: '+', variant: 'heading' } }),
  ] });
  if (kind === 'html') return createParticipantScreen({ idFactory, screenSize: TEMPLATE_SCREEN_SIZE, children: [
    createUiElement('Html', { idFactory, props: { html: '<div style="text-align:center"><h1>Custom HTML</h1></div>' } }),
    createUiElement('Button', { idFactory, props: { label: 'Continue', variant: 'primary' }, actions: [{ event: 'click', action: 'submit' }] }),
  ] });
  if (kind === 'calibration') return createParticipantScreen({ idFactory, screenSize: TEMPLATE_SCREEN_SIZE, children: [
    createUiElement('Text', { idFactory, props: { text: 'Screen calibration', variant: 'heading' } }),
    createUiElement('Text', { idFactory, props: { text: 'Verify viewing distance and screen dimensions before continuing.', variant: 'body' } }),
    createUiElement('Button', { idFactory, props: { label: 'Ready', variant: 'primary' }, actions: [{ event: 'click', action: 'submit' }] }),
  ] });
  if (kind === 'attention') return createParticipantScreen({ idFactory, screenSize: TEMPLATE_SCREEN_SIZE, children: [
    createUiElement('Text', { idFactory, props: { text: 'Press the key when you see the target', variant: 'heading' } }),
    createUiElement('Input', { idFactory, props: { name: 'attention', inputType: 'text', label: 'Response', required: true } }),
    createUiElement('Button', { idFactory, props: { label: 'Submit', variant: 'primary' }, actions: [{ event: 'click', action: 'submit' }] }),
  ] });
  if (kind === 'response') return createParticipantScreen({ idFactory, screenSize: TEMPLATE_SCREEN_SIZE, children: [
    createUiElement('Text', { idFactory, props: { text: 'Respond when you see the target', variant: 'heading' } }),
    createUiElement('Text', { idFactory, props: { text: 'Press one of the response keys to answer.', variant: 'body' } }),
    createUiElement('Input', { idFactory, props: { name: 'response', inputType: 'text', label: 'Response', required: true } }),
    createUiElement('Button', { idFactory, props: { label: 'Submit', variant: 'primary' }, actions: [{ event: 'click', action: 'submit' }] }),
  ] });
  if (kind === 'device') return createParticipantScreen({ idFactory, screenSize: TEMPLATE_SCREEN_SIZE, children: [
    createUiElement('Text', { idFactory, props: { text: 'Equipment check', variant: 'heading' } }),
    createUiElement('Text', { idFactory, props: { text: 'Verify the setup, then continue.', variant: 'body' } }),
    createUiElement('Button', { idFactory, props: { label: 'Ready', variant: 'primary' }, actions: [{ event: 'click', action: 'submit' }] }),
  ] });
  if (kind === 'manual') return createParticipantScreen({ idFactory, screenSize: TEMPLATE_SCREEN_SIZE, children: [
    createUiElement('Text', { idFactory, props: { text: 'Awaiting operator', variant: 'heading' } }),
    createUiElement('Button', { idFactory, props: { label: 'Confirm', variant: 'primary' }, actions: [{ event: 'click', action: 'submit' }] }),
  ] });
  return createParticipantScreen({ idFactory, screenSize: TEMPLATE_SCREEN_SIZE, children: [
    createUiElement('Text', { idFactory, props: { text: 'Welcome', variant: 'heading' } }),
    createUiElement('Text', { idFactory, props: { text: 'Please read the instructions carefully.', variant: 'body' } }),
    createUiElement('Progress', { idFactory, props: { value: 0, max: 100, label: '' }, bindings: { value: 'progress.percent' } }),
    createUiElement('Button', { idFactory, props: { label: 'Continue', variant: 'primary' }, actions: [{ event: 'click', action: 'submit' }] }),
  ] });
}

export function normalizeParticipantUi(value) {
  if (value?.schemaVersion === PARTICIPANT_UI_SCHEMA_VERSION && value.root) return structuredClone(value);
  return participantUiTemplate('instruction');
}

export function validateParticipantUi(schema) {
  const errors = [];
  const warnings = [];
  if (schema?.schemaVersion !== PARTICIPANT_UI_SCHEMA_VERSION) errors.push({ code: 'ui.schema_invalid', message: 'Unsupported Participant UI schema version', path: 'schemaVersion' });
  if (schema?.theme !== undefined && (schema.theme === null || typeof schema.theme !== 'object' || Array.isArray(schema.theme))) {
    errors.push({ code: 'ui.theme_invalid', message: 'Theme must be an object', path: 'theme' });
  } else if (schema?.theme) {
    for (const [key, value] of Object.entries(schema.theme)) {
      if (typeof value !== 'string' || !value.trim()) errors.push({ code: 'ui.theme_invalid', message: `Theme token ${key} must be a non-empty string`, path: `theme.${key}` });
      if (/^\d+$/.test(key) || FORBIDDEN_TOKEN_KEYS.has(key)) errors.push({ code: 'ui.theme_key_unsafe', message: `Theme token name ${key} is unsafe`, path: `theme.${key}` });
      else if (!(key in PARTICIPANT_UI_THEME_DEFAULTS)) warnings.push({ code: 'ui.theme_key_unknown', message: `Unknown theme token ${key}`, path: `theme.${key}` });
    }
  }
  const ids = new Set();
  const responseNames = new Set();
  const visit = (element, path) => {
    if (!element?.id) errors.push({ code: 'ui.id_missing', message: 'UI element ID is required', path: `${path}.id` });
    else if (ids.has(element.id)) errors.push({ code: 'ui.id_duplicate', message: `Duplicate UI element ID ${element.id}`, path: `${path}.id` });
    else ids.add(element.id);
    if (!PARTICIPANT_UI_TYPES.includes(element?.type)) errors.push({ code: 'ui.type_unknown', message: `Unknown UI element ${element?.type}`, path: `${path}.type` });
    if (!CONTAINERS.has(element?.type) && element?.children?.length) errors.push({ code: 'ui.children_invalid', message: `${element.type} cannot contain children`, path: `${path}.children` });
    if (element?.style !== undefined && (element.style === null || typeof element.style !== 'object' || Array.isArray(element.style))) {
      errors.push({ code: 'ui.style_invalid', message: 'Style must be an object', path: `${path}.style`, elementId: element.id });
    } else if (element?.style) {
      for (const [key, value] of Object.entries(element.style)) {
        if (!UI_STYLE_KEYS.includes(key)) warnings.push({ code: 'ui.style_key_unknown', message: `Unknown style key ${key}`, path: `${path}.style.${key}`, elementId: element.id });
        if (isUiTokenRef(value)) {
          if (!(value.$token in (schema?.theme || {})) && !(value.$token in PARTICIPANT_UI_THEME_DEFAULTS)) warnings.push({ code: 'ui.style_token_unknown', message: `Unknown style token ${value.$token}`, path: `${path}.style.${key}`, elementId: element.id });
        } else if (value !== null && typeof value === 'object') {
          errors.push({ code: 'ui.style_value_invalid', message: `Style value for ${key} must be a literal or a single $token reference`, path: `${path}.style.${key}`, elementId: element.id });
        } else if (!['string', 'number'].includes(typeof value)) {
          errors.push({ code: 'ui.style_value_invalid', message: `Style value for ${key} must be a literal or a single $token reference`, path: `${path}.style.${key}`, elementId: element.id });
        }
      }
    }
    if (element?.type === 'Input') {
      const name = element.props?.name;
      if (typeof name !== 'string' || !name.trim()) errors.push({ code: 'ui.input_name_missing', message: 'Input needs a response name', path: `${path}.props.name`, elementId: element.id });
      else if (responseNames.has(name)) errors.push({ code: 'ui.input_name_duplicate', message: `Duplicate response name ${name}; each input needs a unique name`, path: `${path}.props.name`, elementId: element.id });
      else responseNames.add(name);
      if (element.props?.inputType === 'rating' && !discreteScaleValues(element.props.min ?? 1, element.props.max ?? 7)) errors.push({ code: 'ui.rating_range_invalid', message: 'Rating needs increasing integer bounds and at most 1000 choices', path: `${path}.props`, elementId: element.id });
    }
    if (element?.type === 'Media' && !element.props?.sourceUrl && !element.props?.assetId) warnings.push({ code: 'ui.media_source_missing', message: 'Media has no source yet', path: `${path}.props`, elementId: element.id });
    if (element?.type === 'Html' && !element.props?.html?.trim()) warnings.push({ code: 'ui.html_missing', message: 'HTML fragment has no content yet', path: `${path}.props`, elementId: element.id });
    for (const [index, action] of (element?.actions || []).entries()) {
      if (!['submit', 'setVariable', 'next'].includes(action.action)) errors.push({ code: 'ui.action_unknown', message: `Unknown UI action ${action.action}`, path: `${path}.actions.${index}`, elementId: element.id });
      if (action.action === 'setVariable' && !action.name?.trim()) errors.push({ code: 'ui.action_variable_missing', message: 'setVariable action needs a variable name', path: `${path}.actions.${index}.name`, elementId: element.id });
    }
    (element?.children || []).forEach((child, index) => visit(child, `${path}.children.${index}`));
  };
  if (!schema?.root) errors.push({ code: 'ui.root_missing', message: 'Participant UI needs a root Screen', path: 'root' });
  else {
    if (schema.root.type !== 'Screen') errors.push({ code: 'ui.root_not_screen', message: 'Participant UI root must be a Screen', path: 'root.type' });
    visit(schema.root, 'root');
  }
  return { valid: errors.length === 0, errors, warnings };
}

export function mapUiElement(schema, elementId, updater) {
  const next = structuredClone(schema);
  const visit = element => {
    if (element.id === elementId) return updater(structuredClone(element));
    return { ...element, children: (element.children || []).map(visit) };
  };
  next.root = visit(next.root);
  return next;
}

export function removeUiElement(schema, elementId) {
  if (schema.root?.id === elementId) throw new Error('Root Screen cannot be removed');
  const next = structuredClone(schema);
  const visit = element => ({ ...element, children: (element.children || []).filter(child => child.id !== elementId).map(visit) });
  next.root = visit(next.root);
  return next;
}

export function appendUiElement(schema, parentId, element) {
  return mapUiElement(schema, parentId, parent => {
    if (!CONTAINERS.has(parent.type)) throw new Error(`${parent.type} cannot contain children`);
    return { ...parent, children: [...(parent.children || []), structuredClone(element)] };
  });
}

const findUiElement = (node, id) => {
  if (node.id === id) return node;
  for (const child of node.children || []) {
    const found = findUiElement(child, id);
    if (found) return found;
  }
  return null;
};

const findUiParent = (node, id) => {
  for (const child of node.children || []) {
    if (child.id === id) return node;
    const found = findUiParent(child, id);
    if (found) return found;
  }
  return null;
};

export function moveUiElement(schema, elementId, targetParentId, index = 0) {
  if (!schema?.root) throw new Error('Participant UI needs a root Screen');
  if (schema.root.id === elementId) throw new Error('Root Screen cannot be moved');
  if (elementId === targetParentId) throw new Error('Cannot move an element into itself');

  const moving = findUiElement(schema.root, elementId);
  if (!moving) throw new Error(`UI element ${elementId} not found`);
  const targetParent = findUiElement(schema.root, targetParentId);
  if (!targetParent) throw new Error(`Target parent ${targetParentId} not found`);
  if (!CONTAINERS.has(targetParent.type)) throw new Error(`${targetParent.type} cannot contain children`);
  if (findUiElement(moving, targetParentId)) throw new Error('Cannot move an element into its own descendant');

  const currentParent = findUiParent(schema.root, elementId);

  const detached = structuredClone(schema);
  const remove = node => (node.id === currentParent?.id
    ? { ...node, children: (node.children || []).filter(child => child.id !== elementId) }
    : { ...node, children: (node.children || []).map(remove) });
  detached.root = remove(detached.root);

  // `index` is the insertion slot in the target parent AFTER the moved element is removed
  // (splice semantics); it equals the element's final index for same-parent moves.
  const insert = node => {
    if (node.id === targetParentId) {
      const children = [...(node.children || [])];
      const insertIndex = Math.max(0, Math.min(index, children.length));
      children.splice(insertIndex, 0, structuredClone(moving));
      return { ...node, children };
    }
    return { ...node, children: (node.children || []).map(insert) };
  };
  detached.root = insert(detached.root);
  return detached;
}

export function insertUiElement(schema, parentId, index, element) {
  if (!schema?.root) throw new Error('Participant UI needs a root Screen');
  const parent = findUiElement(schema.root, parentId);
  if (!parent) throw new Error(`Parent ${parentId} not found`);
  if (!CONTAINERS.has(parent.type)) throw new Error(`${parent.type} cannot contain children`);
  const next = structuredClone(schema);
  const insert = node => {
    if (node.id === parentId) {
      const children = [...(node.children || [])];
      const at = Math.max(0, Math.min(index, children.length));
      children.splice(at, 0, structuredClone(element));
      return { ...node, children };
    }
    return { ...node, children: (node.children || []).map(insert) };
  };
  next.root = insert(next.root);
  return next;
}

export function resolveUiBinding(binding, context = {}) {
  if (typeof binding !== 'string') return binding;
  return binding.split('.').reduce((value, key) => value?.[key], context);
}
