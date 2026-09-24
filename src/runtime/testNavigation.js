import { createRuntimeEvent } from './eventEnvelope.js';

const requirePreview = mode => {
  if (mode !== 'preview') throw new Error('Previous page is available only in Test Run.');
};

/** Capture executable visits, including separate visits to the same loop node. */
export function recordTestVisit(history, state, mode) {
  requirePreview(mode);
  if (state.status !== 'waiting' || !state.currentNodeId) return history;
  const last = history.at(-1);
  if (last?.currentNodeId === state.currentNodeId && last.eventSequence === state.eventSequence) return history;
  return [...history, structuredClone(state)];
}

/** Restore logical state; keep wall time and the append-only event sequence. */
export function previousTestVisit({ history, state, protocol, services, mode }) {
  requirePreview(mode);
  if (!['waiting', 'paused'].includes(state.status)) throw new Error('Cannot go back from a finished or inactive run.');
  if (!Array.isArray(history)) throw new Error('Invalid test navigation history.');
  if (history.length < 2) throw new Error('There is no previous page.');
  let previousSequence = 0;
  for (const visit of history) {
    if (!visit || visit.sessionId !== state.sessionId || visit.protocolId !== state.protocolId) throw new Error('Navigation history belongs to another run.');
    if (visit.status !== 'waiting' || !Number.isInteger(visit.eventSequence) || visit.eventSequence <= previousSequence || visit.eventSequence > state.eventSequence) throw new Error('Invalid test navigation history.');
    previousSequence = visit.eventSequence;
  }
  const latest = history.at(-1);
  if (latest.currentNodeId !== state.currentNodeId || latest.attempts?.[state.currentNodeId] !== state.attempts?.[state.currentNodeId]) throw new Error('Navigation history does not match the current visit.');
  const target = history.at(-2);
  const node = protocol.graph.nodes.find(item => item.id === target.currentNodeId);
  if (!node) throw new Error('The previous page no longer exists.');
  let restored = {
    ...structuredClone(target),
    status: 'waiting', statusBeforePause: null,
    eventSequence: state.eventSequence,
    startedAtEpochMs: state.startedAtEpochMs,
    startedAtMonotonicMs: state.startedAtMonotonicMs,
    attempts: { ...state.attempts, [node.id]: (state.attempts[node.id] || 0) + 1 },
  };
  const navigation = createRuntimeEvent(restored, protocol, 'test_navigation_back', services, { node, payload: {
    fromNodeId: state.currentNodeId,
    supersededFromSequence: target.eventSequence,
    supersededThroughSequence: state.eventSequence,
    reason: 'operator test navigation',
  } });
  restored.eventSequence = navigation.sequence;
  const entered = createRuntimeEvent(restored, protocol, 'component_entered', services, { node, payload: { attempt: restored.attempts[node.id], testNavigation: true } });
  restored = { ...restored, eventSequence: entered.sequence };
  return { state: restored, history: [...history.slice(0, -2), structuredClone(restored)], events: [navigation, entered] };
}

/** Retain raw rows, marking only responses linked to the superseded event range. */
export function supersedeTestResponses(responses, navigationEvent) {
  if (navigationEvent?.eventType !== 'test_navigation_back') return responses;
  const { supersededFromSequence: from, supersededThroughSequence: through } = navigationEvent.payload || {};
  if (!Number.isInteger(from) || !Number.isInteger(through) || from > through) throw new Error('Invalid navigation event range.');
  return responses.map(row => row.sessionId === navigationEvent.sessionId && Number.isInteger(row.eventSequence) && row.eventSequence >= from && row.eventSequence <= through && !row.supersededByEventId
    ? { ...row, supersededByEventId: navigationEvent.eventId }
    : row);
}
