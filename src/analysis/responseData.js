export function responseAnalysisData(responses = [], protocol, language = 'en') {
  const questions = {};
  const groups = {};
  const legacyQuestions = new Map();
  for (const block of protocol?.blocks || []) for (const trial of block.trials || []) for (const step of trial.steps || []) {
    for (const question of step.questionnaire?.questions || []) legacyQuestions.set(question.question_id, question);
  }
  for (const library of protocol?.questionnaires || []) for (const question of library.questions || []) legacyQuestions.set(question.question_id, question);
  const nodes = new Map((protocol?.graph?.nodes || []).map(node => [node.id, node]));
  for (const response of responses) {
    if (response.supersededByEventId) continue;
    const name = response.name ?? response.question_id;
    if (name == null) continue;
    const key = response.nodeId ? JSON.stringify([response.nodeId, name]) : String(name);
    const node = nodes.get(response.nodeId);
    const definition = node ? node.config?.questionnaire?.questions?.find(question => question.question_id === name) : legacyQuestions.get(name);
    questions[key] = definition ? {
      ...definition,
      options: definition.options_i18n?.[language] || definition.options || definition.options_i18n?.en || definition.options_i18n?.ja || definition.options_i18n?.zh,
      prompt: definition.prompt_i18n?.[language] || definition.prompt || definition.prompt_i18n?.en || definition.prompt_i18n?.ja || definition.prompt_i18n?.zh || name,
    } : { question_id: name, prompt: node ? `${node.label} · ${name}` : name, type: typeof response.value === 'number' ? 'number' : 'text' };
    (groups[key] ||= []).push(response);
  }
  return { questions, groups };
}

export function samPairs(questions, groups) {
  const submissions = new Map();
  for (const [key, answers] of Object.entries(groups)) {
    const type = questions[key]?.type;
    if (!['sam_valence', 'sam_arousal'].includes(type)) continue;
    for (const answer of answers) {
      const timestamp = answer.timestampIso ?? answer.submitted_epoch_ms;
      if (timestamp == null || answer.value == null || answer.value === '' || !Number.isFinite(Number(answer.value))) continue;
      const id = JSON.stringify([answer.sessionId ?? answer.session_id, answer.nodeId ?? answer.step_id, timestamp]);
      const entry = submissions.get(id) || { sam_valence: [], sam_arousal: [] };
      entry[type].push(Number(answer.value));
      submissions.set(id, entry);
    }
  }
  // Multiple answers for one axis are ambiguous; never infer a correspondence.
  return [...submissions.values()].filter(entry => entry.sam_valence.length === 1 && entry.sam_arousal.length === 1)
    .map(entry => ({ x: entry.sam_valence[0], y: entry.sam_arousal[0] }));
}

export function choiceDistribution(question, answers) {
  const options = question.options?.length ? question.options : question.options_i18n?.en || question.options_i18n?.ja || question.options_i18n?.zh || [];
  const valueOf = option => typeof option === 'object' ? option.value ?? option.label ?? '' : option;
  const labels = options.map(option => String(typeof option === 'object' ? option.label ?? option.value ?? '' : option));
  const counts = options.map(option => {
    const value = String(valueOf(option));
    return answers.filter(answer => {
      if (question.type !== 'multiple_choice') return answer.value != null && String(answer.value) === value;
      const selected = Array.isArray(answer.value) ? answer.value : typeof answer.value === 'string' ? answer.value.split('|') : [];
      return selected.some(item => String(item) === value);
    }).length;
  });
  return { labels, counts };
}
