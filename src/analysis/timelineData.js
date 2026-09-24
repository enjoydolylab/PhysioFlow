export function buildTimeline(events, protocol) {
  if (!events?.length) return { items: [], startTime: 0, endTime: 0, totalMs: 1 };

  // Normalize into new objects: chart pairing must never mutate recorded events.
  const eventTypes = { component_entered: 'step_entered', component_completed: 'step_completed', component_skipped: 'step_skipped', component_retried: 'step_retried' };
  events = events.map(event => ({ ...event, event_type: eventTypes[event.eventType] || event.eventType || event.event_type, step_id: event.nodeId || event.step_id, elapsed_monotonic_ms: event.elapsedMonotonicMs ?? event.elapsed_monotonic_ms }));
  const navigation = events.filter(event => event.event_type === 'test_navigation_back');
  const superseded = event => event && navigation.some(back => back.sessionId === event.sessionId && Number.isInteger(event.sequence) && event.sequence >= back.payload?.supersededFromSequence && event.sequence <= back.payload?.supersededThroughSequence);
  const stepMap = new Map((protocol?.graph?.nodes || []).map(node => [node.id, { name: node.label, type: node.component.type }]));
  try {
    (protocol?.blocks || []).forEach(b =>
      (b.trials || []).forEach(t =>
        (t.steps || []).forEach(s => stepMap.set(s.step_id, s))
      ));
  } catch { /* ignore */ }

  const startTime = events[0]?.elapsed_monotonic_ms || 0;
  const endTime = events[events.length - 1]?.elapsed_monotonic_ms || startTime + 1;
  const totalMs = endTime - startTime || 1;

  // Group events by step occurrence (entered → completed/skipped)
  const entered = new Map();
  const items = [];

  events.forEach(ev => {
    if (ev.event_type === 'step_entered') {
      entered.set(ev.eventId || ev.event_id || `${ev.step_id}_${ev.elapsed_monotonic_ms}_${entered.size}`, ev);
    }
    if (ev.event_type === 'test_navigation_back') {
      for (const start of entered.values()) {
        if (start._paired || start.sessionId !== ev.sessionId || !Number.isInteger(start.sequence) || start.sequence < ev.payload?.supersededFromSequence || start.sequence > ev.payload?.supersededThroughSequence) continue;
        start._paired = true;
        const step = stepMap.get(start.step_id);
        items.push({ stepId: start.step_id, name: step?.name || start.step_id, type: step?.type || 'unknown', role: step?.role || 'custom', startMs: start.elapsed_monotonic_ms, endMs: ev.elapsed_monotonic_ms, status: 'superseded', isAnalysis: false, condition: '' });
      }
    }
    const isTerminal = ['step_completed', 'step_skipped', 'step_retried'].includes(ev.event_type);
    if (isTerminal) {
      // Find matching entered event
      let startEv = null;
      for (const val of entered.values()) {
        if (val.step_id === ev.step_id && !val._paired) {
          startEv = val;
          val._paired = true;
          break;
        }
      }
      const step = stepMap.get(ev.step_id);
      items.push({
        stepId: ev.step_id,
        name: step?.name || ev.step_id?.substring(0, 8) || '?',
        type: step?.type || 'unknown',
        role: step?.role || 'custom',
        startMs: startEv?.elapsed_monotonic_ms ?? ev.elapsed_monotonic_ms - (step?.planned_duration_ms || 5000),
        endMs: ev.elapsed_monotonic_ms,
        status: superseded(startEv) ? 'superseded' : ev.event_type === 'step_completed' ? 'completed' : ev.event_type === 'step_skipped' ? 'skipped' : 'retried',
        isAnalysis: step?.is_analysis_window || false,
        condition: ev.condition || '',
        blockOrder: ev.block_order,
        trialOrder: ev.trial_order,
        stepOrder: ev.step_order,
      });
    }
  });

  // Sort by start time
  items.sort((a, b) => a.startMs - b.startMs);

  return { items, startTime, endTime, totalMs };
}
