import { validateParticipantUi } from '../core/participantUi.js';

export const SCREEN_TEMPLATE_MAX_BYTES = 5 * 1024 * 1024;

export function screenTemplateSnapshot(schema) {
  let validation;
  try { validation = validateParticipantUi(schema); }
  catch { throw new Error('The file does not contain a valid participant screen.'); }
  if (!validation.valid) {
    const error = new Error('Fix the screen configuration before using it as a template.');
    error.issues = validation.errors;
    throw error;
  }
  return structuredClone(schema);
}

export function parseScreenTemplate(source) {
  if (typeof source !== 'string') throw new Error('The file is not valid JSON.');
  if (new TextEncoder().encode(source).byteLength > SCREEN_TEMPLATE_MAX_BYTES) throw new Error('Screen template files must be no larger than 5 MB.');
  let schema;
  try { schema = JSON.parse(source); }
  catch { throw new Error('The file is not valid JSON.'); }
  return screenTemplateSnapshot(schema);
}
