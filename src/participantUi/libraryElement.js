import { createUiElement, PARTICIPANT_UI_TYPES } from '../core/participantUi.js';
import { defaults, INPUT_LIBRARY_ITEMS } from './constants.js';

export function createLibraryElement(kind, placement = {}) {
  const preset = Object.hasOwn(INPUT_LIBRARY_ITEMS, kind) ? INPUT_LIBRARY_ITEMS[kind] : null;
  const type = preset ? 'Input' : kind;
  if (!PARTICIPANT_UI_TYPES.includes(type)) throw new Error(`Unknown participant UI element ${type}`);
  return createUiElement(type, {
    props: { ...structuredClone(defaults[type] || {}), ...structuredClone(preset?.props || {}), ...(placement || {}) },
    actions: type === 'Button' ? [{ event: 'click', action: 'submit' }] : [],
  });
}
