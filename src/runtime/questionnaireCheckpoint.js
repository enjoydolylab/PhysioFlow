/** Local draft only: never interpreted as submitted responses or scored data. */
export function restoreQuestionnaireDraft(questionnaire, randomSeed, draft) {
  const signature = JSON.stringify([questionnaire, randomSeed]);
  const empty = { signature, answers: {}, current: 0, timedOut: [], timer: { id: null, ms: 0 } };
  if (draft?.version !== 1 || draft.signature !== signature) return empty;
  const questions = new Map((questionnaire?.questions || []).map(q => [q.question_id, q]));
  const answers = Object.fromEntries(Object.entries(draft.answers || {}).filter(([id, value]) => questions.has(id) && (typeof value === 'string' || typeof value === 'boolean' || (typeof value === 'number' && Number.isFinite(value)) || (Array.isArray(value) && value.every(item => typeof item === 'string')))));
  const timerQuestion = questions.get(draft.timer?.id);
  const limit = Number(timerQuestion?.time_limit_sec || 0) * 1000;
  return {
    signature, answers,
    current: Number.isInteger(draft.current) ? Math.max(0, Math.min(draft.current, Math.max(0, questions.size - 1))) : 0,
    timedOut: Array.isArray(draft.timedOut) ? [...new Set(draft.timedOut.filter(id => questions.has(id)))] : [],
    timer: limit > 0 && Number.isFinite(draft.timer?.ms) ? { id: draft.timer.id, ms: Math.max(0, Math.min(limit, draft.timer.ms)) } : empty.timer,
  };
}
