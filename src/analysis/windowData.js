export function computeWindows(events, protocol) {
  if (!events?.length) return [];

  const types = { component_entered: 'step_entered', component_completed: 'step_completed', component_skipped: 'step_skipped', component_retried: 'step_retried' };
  events = events.map(event => ({ ...event, event_id: event.eventId ?? event.event_id, step_id: event.nodeId ?? event.step_id, event_type: types[event.eventType] || event.eventType || event.event_type, elapsed_monotonic_ms: event.elapsedMonotonicMs ?? event.elapsed_monotonic_ms }));
  // Graph windows use component presentation time; legacy audio/video windows
  // retain their playback-event boundaries.
  const stepMap = new Map((protocol?.graph?.nodes || []).map(node => [node.id, {
    name: node.label, type: node.component.type, is_analysis_window: node.config?.isAnalysisWindow,
    analysis_label: node.config?.analysisLabel, planned_duration_ms: node.config?.completion?.mode === 'fixed' ? node.config.completion.durationMs : 0,
  }]));
  try {
    (protocol?.blocks || []).forEach(b =>
      (b.trials || []).forEach(t =>
        (t.steps || []).forEach(s => stepMap.set(s.step_id, s))
      ));
  } catch { /* ignore */ }

  const navigation = events.filter(event => event.event_type === 'test_navigation_back');
  const supersededBy = event => navigation.find(back => back.sessionId === event.sessionId && Number.isInteger(event.sequence) && event.sequence >= back.payload?.supersededFromSequence && event.sequence <= back.payload?.supersededThroughSequence);
  const ordered = [...events].sort((a, b) => a.elapsed_monotonic_ms - b.elapsed_monotonic_ms);
  const open = new Map();
  const pairs = new Map();

  ordered.forEach(ev => {
    if (ev.event_type === 'test_navigation_back') {
      for (const [id, queue] of open) {
        for (const start of queue.filter(start => supersededBy(start)?.event_id === ev.event_id)) pairs.set(start.event_id, ev);
        open.set(id, queue.filter(start => !pairs.has(start.event_id)));
      }
      return;
    }
    const step = stepMap.get(ev.step_id);
    const isMedia = ['video', 'audio'].includes(step?.type) && step?.source_mode !== 'youtube';
    const startType = isMedia ? 'media_play_started' : 'step_entered';
    const endTypes = isMedia ? ['media_ended', 'step_skipped', 'step_retried'] : ['step_completed', 'step_skipped', 'step_retried'];

    if (ev.event_type === startType) {
      const queue = open.get(ev.step_id) || [];
      queue.push(ev);
      open.set(ev.step_id, queue);
    }
    if (endTypes.includes(ev.event_type)) {
      const queue = open.get(ev.step_id) || [];
      const start = queue.shift();
      if (start) pairs.set(start.event_id, ev);
    }
  });

  const pauses = ordered.filter(e => e.event_type === 'session_paused');

  return ordered.filter(ev => {
    const step = stepMap.get(ev.step_id);
    const isMedia = ['video', 'audio'].includes(step?.type) && step?.source_mode !== 'youtube';
    return ev.event_type === (isMedia ? 'media_play_started' : 'step_entered') && step?.is_analysis_window;
  }).map(start => {
    const step = stepMap.get(start.step_id);
    const end = pairs.get(start.event_id);
    const pauseCount = pauses.filter(p =>
      p.elapsed_monotonic_ms >= start.elapsed_monotonic_ms &&
      p.elapsed_monotonic_ms <= (end?.elapsed_monotonic_ms ?? Infinity)
    ).length;

    const superseded = supersededBy(start);
    const validity = superseded ? 'invalid' : !end ? 'invalid' :
      end.event_type === 'step_skipped' ? 'invalid' :
      pauseCount ? 'attention' :
      end.event_type === 'step_retried' ? 'attention' :
      'valid';

    return {
      windowId: start.event_id,
      nodeId: start.step_id,
      startEventId: start.event_id,
      endEventId: end?.event_id || '',
      startEpochMs: start.timestampEpochMs ?? start.timestamp_epoch_ms ?? null,
      endEpochMs: end?.timestampEpochMs ?? end?.timestamp_epoch_ms ?? null,
      startMs: start.elapsed_monotonic_ms,
      endMs: end?.elapsed_monotonic_ms ?? null,
      label: step?.analysis_label || step?.role || step?.name || '',
      stepName: step?.name || '',
      condition: start.condition || '',
      expectedMs: step?.planned_duration_ms || 0,
      durationMs: end ? end.elapsed_monotonic_ms - start.elapsed_monotonic_ms : 0,
      pauseCount,
      validity,
      reason: superseded ? 'Superseded by test navigation' : !end ? 'Missing end event' :
        end.event_type === 'step_skipped' ? 'Step skipped' :
        pauseCount ? 'Contains pauses' :
        end.event_type === 'step_retried' ? 'Step retried' : '',
    };
  });
}
