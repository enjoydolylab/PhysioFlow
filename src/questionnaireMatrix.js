// A matrix is opt-in and supports only uniform Likert questions with no
// individual timers/conditional visibility. All other questionnaires retain
// the existing one-question-per-screen behaviour.
export function canUseMatrix(questionnaire, displayMode, questions = questionnaire?.questions || []) {
  if ((displayMode || questionnaire?.display_mode) !== 'matrix' || questions.length < 2) return false;
  const first = questions[0];
  const min = Number(first?.scale_min ?? 1);
  const max = Number(first?.scale_max ?? 5);
  return Number.isInteger(min) && Number.isInteger(max) && min < max && max - min <= 20
    && questions.every(question => question.type === 'likert'
      && Number(question.scale_min ?? 1) === min
      && Number(question.scale_max ?? 5) === max
      && !Number(question.time_limit_sec || 0)
      && !question.show_if?.question_id);
}

// SAM's three pictorial dimensions use their own one-screen layout. Restrict it
// to the exact three 1..9 scales: no partial/mixed questionnaires and no
// per-question timers or conditional questions may silently change behavior.
export const SAM_MATRIX_TYPES = ['sam_arousal', 'sam_valence', 'sam_dominance'];

export function canUseSamMatrix(questionnaire, displayMode, questions = questionnaire?.questions || []) {
  if ((displayMode || questionnaire?.display_mode) !== 'sam-matrix' || questions.length !== 3 || questionnaire?.shuffle_questions) return false;
  const types = new Set(questions.map(question => question.type));
  return SAM_MATRIX_TYPES.every(type => types.has(type))
    && questions.every(question => Number(question.scale_min ?? 1) === 1
      && Number(question.scale_max ?? 9) === 9
      && !Number(question.time_limit_sec || 0)
      && !question.show_if?.question_id);
}

export function orderSamMatrixQuestions(questions) {
  return SAM_MATRIX_TYPES.map(type => questions.find(question => question.type === type)).filter(Boolean);
}

// imgNoBio prompts are "instruction：emotion"; keep the instruction above the
// entire matrix and show only the emotion name on each row.
export function splitMatrixPrompt(prompt) {
  const text = String(prompt || '').trim();
  const split = text.lastIndexOf('：');
  return split < 0 ? { instruction: '', label: text } : {
    instruction: text.slice(0, split).trim(),
    label: text.slice(split + 1).trim(),
  };
}

export function missingMatrixQuestionIds(questions, answers) {
  return questions.filter(question => question.required
    && (answers[question.question_id] === undefined || answers[question.question_id] === ''
      || (Array.isArray(answers[question.question_id]) && !answers[question.question_id].length)))
    .map(question => question.question_id);
}
