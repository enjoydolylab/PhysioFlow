import { assessProtocolReadiness } from './readiness.js';
import { protocolStatusOf } from './core/index.js';

export function projectStage(protocol, { sessions = [], storageInfo = {} } = {}) {
  const readiness = assessProtocolReadiness(protocol, { sessions, storageInfo });
  const recorded = readiness.facts.formal_sessions;
  const ready = protocolStatusOf(protocol) === 'frozen' && readiness.status === 'ready';
  const first = readiness.items.find(item => !item.passed && item.severity === 'error')
    || readiness.items.find(item => !item.passed);
  return {
    stage: recorded ? 'recorded' : ready ? 'ready' : 'preparing',
    reason: recorded || ready ? null : first ? { label: first.label, detail: first.detail } : { label: 'Protocol validation', detail: 'Review validation warnings.' },
    sessions: readiness.facts.completed_sessions,
    updatedAt: protocol.audit?.updatedAt || protocol.updated_at || null,
  };
}

