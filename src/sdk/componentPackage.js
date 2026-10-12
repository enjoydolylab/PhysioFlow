import { createCoreComponentRegistry, validateComponentDefinition } from '../core/componentRegistry.js';
import { validateParticipantUi } from '../core/participantUi.js';

export const COMPONENT_SDK_VERSION = '1.0.0';
export const COMPONENT_PERMISSIONS = Object.freeze([
  'session.variables.read',
  'session.variables.write',
  'events.emit',
  'assets.read',
  'network.media',
]);

const PERMISSIONS = new Set(COMPONENT_PERMISSIONS);
const PACKAGE_ID = /^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/;

export function validateComponentPackage(componentPackage) {
  const errors = [];
  if (!componentPackage || typeof componentPackage !== 'object' || Array.isArray(componentPackage)) return { valid: false, errors: ['Component package must be an object'] };
  if (componentPackage.sdkVersion !== COMPONENT_SDK_VERSION) errors.push(`Unsupported component SDK version ${componentPackage.sdkVersion || '(missing)'}`);
  if (!PACKAGE_ID.test(componentPackage.packageId || '')) errors.push('Package ID must use lowercase dot/dash notation');
  if (typeof componentPackage.version !== 'string' || !componentPackage.version.match(/^\d+\.\d+\.\d+(?:-[A-Za-z0-9.-]+)?$/)) errors.push('Package version must use semantic versioning');
  if (typeof componentPackage.name !== 'string' || !componentPackage.name.trim()) errors.push('Package name is required');
  if (componentPackage.permissions != null && !Array.isArray(componentPackage.permissions)) errors.push('Package permissions must be an array');
  const permissions = Array.isArray(componentPackage.permissions) ? componentPackage.permissions : [];
  if (new Set(permissions).size !== permissions.length) errors.push('Package permissions must be unique');
  permissions.filter(permission => !PERMISSIONS.has(permission)).forEach(permission => errors.push(`Unsupported package permission ${permission}`));
  if (!Array.isArray(componentPackage.components) || !componentPackage.components.length) errors.push('Package needs at least one component');
  const componentKeys = new Set();
  for (const definition of Array.isArray(componentPackage.components) ? componentPackage.components : []) {
    if (!definition || typeof definition !== 'object' || Array.isArray(definition)) { errors.push('Component definition must be an object'); continue; }
    let check;
    try { check = validateComponentDefinition(definition); }
    catch { errors.push('Component definition contains invalid field types'); continue; }
    check.errors.forEach(error => errors.push(`${definition?.type || 'component'}: ${error}`));
    for (const field of ['events', 'dataFields']) {
      if (definition[field] != null && (!Array.isArray(definition[field]) || definition[field].some(value => typeof value !== 'string' || !value.trim()))) errors.push(`${definition.type}: ${field} must be an array of non-empty strings`);
    }
    if (definition.editorFields != null && !Array.isArray(definition.editorFields)) errors.push(`${definition.type}: editorFields must be an array`);
    for (const field of Array.isArray(definition.editorFields) ? definition.editorFields : []) {
      if (!field || typeof field !== 'object' || typeof field.path !== 'string' || !field.path.trim() || typeof field.label !== 'string' || (field.type != null && typeof field.type !== 'string')) { errors.push(`${definition.type}: Invalid editor field`); continue; }
      if (field.type === 'select' && (!Array.isArray(field.options) || field.options.some(value => !['string', 'number'].includes(typeof value)))) errors.push(`${definition.type}: Select editor fields need string or number options`);
      if (field.showWhen != null && (!field.showWhen || typeof field.showWhen.path !== 'string')) errors.push(`${definition.type}: Invalid editor field condition`);
    }
    const key = `${definition?.type}@${definition?.version}`;
    if (componentKeys.has(key)) errors.push(`Duplicate packaged component ${key}`);
    else componentKeys.add(key);
    if ((definition.runtime?.kind || 'participant') !== 'participant') errors.push(`${definition.type}: SDK packages may only declare sandboxed participant components`);
    if (definition.runtime?.uiAdapter && definition.runtime.uiAdapter !== 'schema') errors.push(`${definition.type}: SDK packages must use the schema UI adapter`);
    if (!definition.defaultConfig?.ui) errors.push(`${definition.type}: SDK components need a participant UI schema`);
    else {
      try { validateParticipantUi(definition.defaultConfig.ui).errors.forEach(error => errors.push(`${definition.type}: ${error.message}`)); }
      catch { errors.push(`${definition.type}: Invalid participant UI structure`); }
    }
  }
  return { valid: errors.length === 0, errors };
}

export function installComponentPackage(protocol, componentPackage, options = {}) {
  const check = validateComponentPackage(componentPackage);
  if (!check.valid) throw new Error(`Invalid component package:\n${check.errors.join('\n')}`);
  const approved = new Set(options.approvedPermissions || []);
  const missing = (componentPackage.permissions || []).filter(permission => !approved.has(permission));
  if (missing.length) throw new Error(`Component package permissions require approval: ${missing.join(', ')}`);
  const next = structuredClone(protocol);
  const packages = next.componentPackages || [];
  if (packages.some(item => item.packageId === componentPackage.packageId && item.version === componentPackage.version)) throw new Error(`Component package ${componentPackage.packageId}@${componentPackage.version} is already installed`);
  const registry = createProjectComponentRegistry(next);
  for (const definition of componentPackage.components) {
    if (registry.has(definition.type, definition.version)) throw new Error(`Component ${definition.type}@${definition.version} already exists in this project`);
  }
  next.componentPackages = [...packages, { ...structuredClone(componentPackage), approvedPermissions: [...approved], installedAt: options.now || new Date().toISOString() }];
  next.audit = { ...(next.audit || {}), updatedAt: options.now || new Date().toISOString() };
  return next;
}

export function uninstallComponentPackage(protocol, packageId, version, options = {}) {
  const target = (protocol.componentPackages || []).find(item => item.packageId === packageId && item.version === version);
  if (!target) return protocol;
  const types = new Set(target.components.map(component => `${component.type}@${component.version}`));
  const used = (protocol.graph?.nodes || []).filter(node => types.has(`${node.component?.type}@${node.component?.version}`));
  if (used.length && !options.force) throw new Error(`Component package is used by ${used.length} node(s)`);
  const next = structuredClone(protocol);
  next.componentPackages = next.componentPackages.filter(item => item.packageId !== packageId || item.version !== version);
  next.audit = { ...(next.audit || {}), updatedAt: options.now || new Date().toISOString() };
  return next;
}

export function createProjectComponentRegistry(protocol) {
  const registry = createCoreComponentRegistry();
  for (const componentPackage of protocol?.componentPackages || []) {
    const check = validateComponentPackage(componentPackage);
    if (!check.valid) continue;
    componentPackage.components.forEach(definition => registry.register(definition));
  }
  return registry;
}
