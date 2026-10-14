export function physioDBRunId(record) {
  const value = record?.metadata?.physioflow?.run_id ?? record?.data?.physioflow?.run_id ?? record?.data?.sessionId ?? record?.data?.runId ?? record?.metadata?.runId;
  return typeof value === 'string' && value ? value : null;
}
export function buildPhysioDBReview(events, { runId = '', protocol, language = 'en', query = '', answersOnly = false } = {}) {
  const nodes = new Map((protocol?.graph?.nodes || []).map(n => [n.id, n]));
  const search = query.trim().toLocaleLowerCase();
  return events.filter(e => !runId || physioDBRunId(e) === runId).map(e => {
    const provenance = e.data?.physioflow || {}, payload = e.data?.payload || {};
    const response = payload.response;
    const node = nodes.get(provenance.node_id ?? e.data?.nodeId ?? response?.nodeId);
    const question = node?.config?.questionnaire?.questions?.find(q => q.question_id === response?.name);
    return { id: e.id, time: e.started_at, sequence: provenance.sequence ?? e.data?.sequence ?? null, type: e.event_type, nodeLabel: node?.label || provenance.node_id || e.data?.nodeId || '', questionId: response?.name || '', questionLabel: question?.prompt_i18n?.[language] || question?.prompt_i18n?.en || question?.text || question?.label || (response?.name === 'questionnaire_timed_out_question_ids' ? 'Timed-out questions' : response?.name) || '', responseValue: response ? response.value : undefined, superseded: Boolean(response?.supersededByEventId), description: e.description || payload.note || payload.reason || '', runId: physioDBRunId(e) };
  }).filter(row => (!answersOnly || row.responseValue !== undefined) && (!search || [row.nodeLabel, row.questionLabel, row.questionId, row.description, row.type, JSON.stringify(row.responseValue)].join(' ').toLocaleLowerCase().includes(search))).sort((a, b) => runId && a.sequence !== null && b.sequence !== null ? a.sequence - b.sequence : Date.parse(a.time) - Date.parse(b.time));
}
