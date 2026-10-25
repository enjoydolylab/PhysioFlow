// Display-only matching. Never pass the result back into a model or export.
export function translateMessage(message, dictionary, templates) {
  if (typeof message !== 'string') return message;
  if (dictionary[message]) return dictionary[message];
  for (const [pattern, key] of templates) {
    const match = message.match(pattern);
    if (match && dictionary[key]) return dictionary[key].replace(/\{(\d+)\}/g, (_, index) => match[Number(index) + 1]);
  }
  // Legacy validation prefixes describe a location, not part of the message.
  const location = message.match(/^(Block \d+(?: \/ Trial \d+)?(?: \/ Step \d+)?: )(.*)$/s);
  if (location) return location[1] + translateMessage(location[2], dictionary, templates);
  return message;
}

export const messageTemplates = [];

messageTemplates.push(
  [new RegExp("^Question (.+?) needs an ID$"), "Question {0} needs an ID"],
  [new RegExp("^Question (.+?) has unsupported type (.+?)$"), "Question {0} has unsupported type {1}"],
  [new RegExp("^Question (.+?) needs a prompt$"), "Question {0} needs a prompt"],
  [new RegExp("^Question (.+?) needs at least two options$"), "Question {0} needs at least two options"],
  [new RegExp("^Question (.+?) has duplicate options$"), "Question {0} has duplicate options"],
  [new RegExp("^Question (.+?) maximum must be greater than minimum$"), "Question {0} maximum must be greater than minimum"],
  [new RegExp("^Question (.+?) needs an integer scale of at most 21 values$"), "Question {0} needs an integer scale of at most 21 values"],
  [new RegExp("^Question (.+?) time limit must be positive$"), "Question {0} time limit must be positive"],
  [new RegExp("^Question (.+?) condition references a missing question$"), "Question {0} condition references a missing question"],
  [new RegExp("^Question (.+?) condition must reference an earlier question$"), "Question {0} condition must reference an earlier question"],
  [new RegExp("^Question (.+?) has an unsupported condition operator$"), "Question {0} has an unsupported condition operator"],
  [new RegExp("^Question (.+?) option shuffle only applies to choice questions$"), "Question {0} option shuffle only applies to choice questions"],
  [new RegExp("^Duplicate question ID (.+?)$"), "Duplicate question ID {0}"],
  [new RegExp("^CSV row (.+?) has unsupported type (.+?)$"), "CSV row {0} has unsupported type {1}"],
  [new RegExp("^Option (.+?): value is empty$"), "Option {0}: value is empty"],
  [new RegExp("^Option (.+?): label is empty$"), "Option {0}: label is empty"],
  [new RegExp("^Q(.+?): «Prompt» is empty — add a question title in at least one language$"), "Q{0}: «Prompt» is empty — add a question title in at least one language"],
  [new RegExp("^Q(.+?): «Options» are empty — add at least one choice option$"), "Q{0}: «Options» are empty — add at least one choice option"]
);
