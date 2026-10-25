import { pfUIStrings } from './pfUIStrings.js';

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

// E2 diagnostics are translated only when rendered.
messageTemplates.push(
  [new RegExp("^Hosted request failed with status (.*?)$", 's'), "Hosted request failed with status {0}"],
  [new RegExp("^Hosted asset upload failed with status (.*?)$", 's'), "Hosted asset upload failed with status {0}"],
  [new RegExp("^Hosted runtime event gap: expected (.*?), found (.*?)$", 's'), "Hosted runtime event gap: expected {0}, found {1}"],
  [new RegExp("^Runtime state sequence (.*?) is ahead of hosted events (.*?)$", 's'), "Runtime state sequence {0} is ahead of hosted events {1}"],
  [new RegExp("^Hosted tenant limit ID (.*?) is invalid$", 's'), "Hosted tenant limit ID {0} is invalid"],
  [new RegExp("^Hosted tenant limits for (.*?) must be an object$", 's'), "Hosted tenant limits for {0} must be an object"],
  [new RegExp("^Hosted tenant limits for (.*?) contain unsupported field (.*?)$", 's'), "Hosted tenant limits for {0} contain unsupported field {1}"],
  [new RegExp("^Hosted tenant limit (.*?)\\.(.*?) must be a non-negative safe integer or null$", 's'), "Hosted tenant limit {0}.{1} must be a non-negative safe integer or null"],
  [new RegExp("^Session (.*?) event count does not match stored events$", 's'), "Session {0} event count does not match stored events"],
  [new RegExp("^Session (.*?) event sequence is not contiguous at (.*?)$", 's'), "Session {0} event sequence is not contiguous at {1}"],
  [new RegExp("^Session (.*?) has a duplicate or missing event ID at (.*?)$", 's'), "Session {0} has a duplicate or missing event ID at {1}"],
  [new RegExp("^Session (.*?) snapshot sequence does not match stored events$", 's'), "Session {0} snapshot sequence does not match stored events"],
  [new RegExp("^(.*?) must be a valid timestamp$", 's'), "{0} must be a valid timestamp"],
  [new RegExp("^Unsupported hosted role (.*?)$", 's'), "Unsupported hosted role {0}"],
  [new RegExp("^Unsupported hosted state version (.*?)$", 's'), "Unsupported hosted state version {0}"],
  [new RegExp("^Hosted permission (.*?) is required$", 's'), "Hosted permission {0} is required"],
  [new RegExp("^Unknown hosted deployment (.*?)$", 's'), "Unknown hosted deployment {0}"],
  [new RegExp("^Unknown hosted session (.*?)$", 's'), "Unknown hosted session {0}"],
  [new RegExp("^Hosted tenant (.*?) (.*?) quota is exhausted$", 's'), "Hosted tenant {0} {1} quota is exhausted"],
  [new RegExp("^(.*?) requires an idempotency key$", 's'), "{0} requires an idempotency key"],
  [new RegExp("^(.*?) idempotency key was already used with different content$", 's'), "{0} idempotency key was already used with different content"],
  [new RegExp("^Hosted deployment (.*?) is (.*?)$", 's'), "Hosted deployment {0} is {1}"],
  [new RegExp("^Hosted deployment (.*?) session quota is exhausted$", 's'), "Hosted deployment {0} session quota is exhausted"],
  [new RegExp("^Invalid deployment bundle:\n(.*?)$", 's'), "Invalid deployment bundle:\n{0}"],
  [new RegExp("^Hosted deployment asset (.*?) is not a declared workspace asset$", 's'), "Hosted deployment asset {0} is not a declared workspace asset"],
  [new RegExp("^Hosted deployment asset (.*?) checksum does not match its manifest$", 's'), "Hosted deployment asset {0} checksum does not match its manifest"],
  [new RegExp("^Hosted deployment revision conflict: expected (.*?), current (.*?)$", 's'), "Hosted deployment revision conflict: expected {0}, current {1}"],
  [new RegExp("^Unknown hosted launch link (.*?)$", 's'), "Unknown hosted launch link {0}"],
  [new RegExp("^Hosted launch link revision conflict: expected (.*?), current (.*?)$", 's'), "Hosted launch link revision conflict: expected {0}, current {1}"],
  [new RegExp("^Hosted launch link (.*?) is (.*?)$", 's'), "Hosted launch link {0} is {1}"],
  [new RegExp("^Hosted launch link (.*?) is expired$", 's'), "Hosted launch link {0} is expired"],
  [new RegExp("^Hosted launch link (.*?) use quota is exhausted$", 's'), "Hosted launch link {0} use quota is exhausted"],
  [new RegExp("^Hosted session (.*?) is (.*?)$", 's'), "Hosted session {0} is {1}"],
  [new RegExp("^Event batch (.*?) was already used with different content$", 's'), "Event batch {0} was already used with different content"],
  [new RegExp("^Hosted session revision conflict: expected (.*?), current (.*?)$", 's'), "Hosted session revision conflict: expected {0}, current {1}"],
  [new RegExp("^Duplicate or missing event ID (.*?)$", 's'), "Duplicate or missing event ID {0}"],
  [new RegExp("^Event (.*?) does not match the hosted session identity$", 's'), "Event {0} does not match the hosted session identity"],
  [new RegExp("^Event sequence conflict: expected (.*?), received (.*?)$", 's'), "Event sequence conflict: expected {0}, received {1}"],
  [new RegExp("^Event (.*?) is incomplete$", 's'), "Event {0} is incomplete"],
  [new RegExp("^Event (.*?) moves backwards in monotonic time$", 's'), "Event {0} moves backwards in monotonic time"],
  [new RegExp("^Runtime state sync (.*?) was already used with different content$", 's'), "Runtime state sync {0} was already used with different content"],
  [new RegExp("^Runtime snapshot event sequence (.*?) does not match ingested sequence (.*?)$", 's'), "Runtime snapshot event sequence {0} does not match ingested sequence {1}"],
  [new RegExp("^Unsupported hosted session outcome (.*?)$", 's'), "Unsupported hosted session outcome {0}"],
  [new RegExp("^Session completion (.*?) was already used with a different outcome$", 's'), "Session completion {0} was already used with a different outcome"],
  [new RegExp("^Hosted deployment (.*?) has no data retention policy$", 's'), "Hosted deployment {0} has no data retention policy"],
  [new RegExp("^Hosted deployment (.*?) has no session data eligible for retention purge$", 's'), "Hosted deployment {0} has no session data eligible for retention purge"],
  [new RegExp("^Deployment (.*?) session count does not match stored sessions$", 's'), "Deployment {0} session count does not match stored sessions"],
  [new RegExp("^Hosted protected credential (.*?)\\.(.*?) is invalid$", 's'), "Hosted protected credential {0}.{1} is invalid"],
  [new RegExp("^Hosted state (.*?) must be an array$", 's'), "Hosted state {0} must be an array"],
  [new RegExp("^Hosted deployment (.*?) must declare a valid tenant$", 's'), "Hosted deployment {0} must declare a valid tenant"],
  [new RegExp("^Hosted deployment (.*?) must declare a valid asset namespace version$", 's'), "Hosted deployment {0} must declare a valid asset namespace version"],
  [new RegExp("^Hosted session (.*?) references an unknown deployment$", 's'), "Hosted session {0} references an unknown deployment"],
  [new RegExp("^Hosted session (.*?) must declare a valid tenant$", 's'), "Hosted session {0} must declare a valid tenant"],
  [new RegExp("^Hosted session (.*?) tenant does not match its deployment$", 's'), "Hosted session {0} tenant does not match its deployment"],
  [new RegExp("^Hosted session (.*?) idempotency state must be an array$", 's'), "Hosted session {0} idempotency state must be an array"],
  [new RegExp("^Purged hosted session (.*?) must not retain participant identity or access token$", 's'), "Purged hosted session {0} must not retain participant identity or access token"],
  [new RegExp("^Purged hosted session (.*?) must not retain events$", 's'), "Purged hosted session {0} must not retain events"],
  [new RegExp("^Purged hosted session (.*?) must not retain a runtime snapshot$", 's'), "Purged hosted session {0} must not retain a runtime snapshot"],
  [new RegExp("^Purged hosted session (.*?) must not retain session idempotency results$", 's'), "Purged hosted session {0} must not retain session idempotency results"],
  [new RegExp("^Purged hosted session (.*?) must record its removed event count$", 's'), "Purged hosted session {0} must record its removed event count"],
  [new RegExp("^Purged hosted session (.*?) must not retain a participant token$", 's'), "Purged hosted session {0} must not retain a participant token"],
  [new RegExp("^Hosted participant token for session (.*?) must declare a valid tenant$", 's'), "Hosted participant token for session {0} must declare a valid tenant"],
  [new RegExp("^Hosted participant token for session (.*?) tenant does not match its session$", 's'), "Hosted participant token for session {0} tenant does not match its session"],
  [new RegExp("^Hosted launch link (.*?) references an unknown deployment$", 's'), "Hosted launch link {0} references an unknown deployment"],
  [new RegExp("^Hosted launch link (.*?) must declare a valid tenant$", 's'), "Hosted launch link {0} must declare a valid tenant"],
  [new RegExp("^Hosted launch link (.*?) tenant does not match its deployment$", 's'), "Hosted launch link {0} tenant does not match its deployment"],
  [new RegExp("^Hosted audit entry (.*?) must declare a valid tenant$", 's'), "Hosted audit entry {0} must declare a valid tenant"],
  [new RegExp("^Hosted protected audit entry (.*?) chain metadata is invalid$", 's'), "Hosted protected audit entry {0} chain metadata is invalid"],
  [new RegExp("^Protected hosted session (.*?) retains a plaintext credential field$", 's'), "Protected hosted session {0} retains a plaintext credential field"],
  [new RegExp("^Protected hosted session (.*?) credential metadata is invalid$", 's'), "Protected hosted session {0} credential metadata is invalid"],
  [new RegExp("^session (.*?) idempotency$", 's'), "session {0} idempotency"],
  [new RegExp("^Invalid hosted state:\n(.*?)$", 's'), "Invalid hosted state:\n{0}"],
  [new RegExp("^Unsupported participant bootstrap version (.*?)$", 's'), "Unsupported participant bootstrap version {0}"],
  [new RegExp("^Invalid participant group execution plan: (.*?)$", 's'), "Invalid participant group execution plan: {0}"],
  [new RegExp("^Participant resource (.*?) has invalid status$", 's'), "Participant resource {0} has invalid status"],
  [new RegExp("^Participant resource (.*?) has an unsafe delivery URL$", 's'), "Participant resource {0} has an unsafe delivery URL"],
  [new RegExp("^Participant bootstrap failed validation: (.*?)$", 's'), "Participant bootstrap failed validation: {0}"],
  [new RegExp("^Deployment asset (.*?) is unavailable locally$", 's'), "Deployment asset {0} is unavailable locally"],
  [new RegExp("^Deployment asset (.*?) checksum does not match its frozen manifest$", 's'), "Deployment asset {0} checksum does not match its frozen manifest"],
  [new RegExp("^Workspace deployment asset (.*?) requires a SHA-256 checksum$", 's'), "Workspace deployment asset {0} requires a SHA-256 checksum"],
  [new RegExp("^Unsupported deployment bundle version (.*?)$", 's'), "Unsupported deployment bundle version {0}"],
  [new RegExp("^Unsupported execution provider contract (.*?)$", 's'), "Unsupported execution provider contract {0}"],
  [new RegExp("^Invalid execution provider:\n(.*?)$", 's'), "Invalid execution provider:\n{0}"],
  [new RegExp("^Execution provider (.*?) is already registered$", 's'), "Execution provider {0} is already registered"],
  [new RegExp("^Unknown execution job (.*?)$", 's'), "Unknown execution job {0}"],
  [new RegExp("^Unknown event type (.*?)$", 's'), "Unknown event type {0}"],
  [new RegExp("^Duplicate event ID (.*?)$", 's'), "Duplicate event ID {0}"],
  [new RegExp("^Event sequence gap before (.*?)$", 's'), "Event sequence gap before {0}"],
  [new RegExp("^Monotonic time moved backwards at event (.*?)$", 's'), "Monotonic time moved backwards at event {0}"],
  [new RegExp("^Event (.*?) references unknown node (.*?)$", 's'), "Event {0} references unknown node {1}"],
  [new RegExp("^Runtime failed: (.*?)$", 's'), "Runtime failed: {0}"],
  [new RegExp("^(.*?) component retry/retries$", 's'), "{0} component retry/retries"],
  [new RegExp("^(.*?) test navigation back action\\(s\\); superseded visits excluded from effective counts$", 's'), "{0} test navigation back action(s); superseded visits excluded from effective counts"],
  [new RegExp("^BioDB leg failed: (.*?)\\. The PF session package is complete on its own\\.$", 's'), "BioDB leg failed: {0}. The PF session package is complete on its own."],
  [new RegExp("^Runtime kind (.*?) is invalid$", 's'), "Runtime kind {0} is invalid"],
  [new RegExp("^Duplicate component port (.*?)$", 's'), "Duplicate component port {0}"],
  [new RegExp("^Port (.*?) has invalid kind (.*?)$", 's'), "Port {0} has invalid kind {1}"],
  [new RegExp("^Port (.*?) has invalid direction (.*?)$", 's'), "Port {0} has invalid direction {1}"],
  [new RegExp("^Invalid component definition:\n(.*?)$", 's'), "Invalid component definition:\n{0}"],
  [new RegExp("^Component (.*?) is already registered$", 's'), "Component {0} is already registered"],
  [new RegExp("^(.*?) has an invalid media type$", 's'), "{0} has an invalid media type"],
  [new RegExp("^(.*?) references unavailable asset (.*?)$", 's'), "{0} references unavailable asset {1}"],
  [new RegExp("^(.*?) does not match the (.*?) pool type$", 's'), "{0} does not match the {1} pool type"],
  [new RegExp("^(.*?) needs a supported cognitive-task paradigm$", 's'), "{0} needs a supported cognitive-task paradigm"],
  [new RegExp("^(.*?) needs at least one trial$", 's'), "{0} needs at least one trial"],
  [new RegExp("^(.*?) has a missing or duplicate trial ID$", 's'), "{0} has a missing or duplicate trial ID"],
  [new RegExp("^(.*?) trial (.*?) has invalid (.*?)$", 's'), "{0} trial {1} has invalid {2}"],
  [new RegExp("^(.*?) trial (.*?) needs a word, ink color, and valid response key$", 's'), "{0} trial {1} needs a word, ink color, and valid response key"],
  [new RegExp("^(.*?) trial (.*?) has invalid Go/No-Go semantics$", 's'), "{0} trial {1} has invalid Go/No-Go semantics"],
  [new RegExp("^(.*?) generated Go ratio differs from its configured ratio$", 's'), "{0} generated Go ratio differs from its configured ratio"],
  [new RegExp("^(.*?) needs a participant interface$", 's'), "{0} needs a participant interface"],
  [new RegExp("^(.*?) UI references undeclared variable (.*?)$", 's'), "{0} UI references undeclared variable {1}"],
  [new RegExp("^(.*?) needs at least one participant input$", 's'), "{0} needs at least one participant input"],
  [new RegExp("^(.*?) needs a submit or next button$", 's'), "{0} needs a submit or next button"],
  [new RegExp("^(.*?) references an unavailable stimulus pool$", 's'), "{0} references an unavailable stimulus pool"],
  [new RegExp("^(.*?) needs at least one stimulus in its random pool$", 's'), "{0} needs at least one stimulus in its random pool"],
  [new RegExp("^(.*?) references unavailable pool asset (.*?)$", 's'), "{0} references unavailable pool asset {1}"],
  [new RegExp("^(.*?) pool asset (.*?) is not (.*?)$", 's'), "{0} pool asset {1} is not {2}"],
  [new RegExp("^(.*?) needs a media URL or asset$", 's'), "{0} needs a media URL or asset"],
  [new RegExp("^(.*?) has an invalid media URL$", 's'), "{0} has an invalid media URL"],
  [new RegExp("^(.*?) needs audio or video for playback-ended completion$", 's'), "{0} needs audio or video for playback-ended completion"],
  [new RegExp("^(.*?) needs a supported completion mode$", 's'), "{0} needs a supported completion mode"],
  [new RegExp("^(.*?) has an unsupported fixation shape$", 's'), "{0} has an unsupported fixation shape"],
  [new RegExp("^(.*?) needs a non-negative fixed duration$", 's'), "{0} needs a non-negative fixed duration"],
  [new RegExp("^(.*?) needs a non-negative wait duration$", 's'), "{0} needs a non-negative wait duration"],
  [new RegExp("^(.*?) needs increasing integer bounds and at most 1000 choices$", 's'), "{0} needs increasing integer bounds and at most 1000 choices"],
  [new RegExp("^(.*?) needs a positive integer iteration limit$", 's'), "{0} needs a positive integer iteration limit"],
  [new RegExp("^(.*?) needs a supported condition operator$", 's'), "{0} needs a supported condition operator"],
  [new RegExp("^(.*?) (.*?) must be between 0 and 1$", 's'), "{0} {1} must be between 0 and 1"],
  [new RegExp("^(.*?) has an unsupported until-rule operator$", 's'), "{0} has an unsupported until-rule operator"],
  [new RegExp("^Stimulus pool group (.*?) must use the same supported randomization mode on every media node$", 's'), "Stimulus pool group {0} must use the same supported randomization mode on every media node"],
  [new RegExp("^Stimulus pool group (.*?): (.*?)$", 's'), "Stimulus pool group {0}: {1}"],
  [new RegExp("^Stimulus pool group (.*?) must use the same asset selection on every media node$", 's'), "Stimulus pool group {0} must use the same asset selection on every media node"],
  [new RegExp("^Stimulus pool group (.*?) needs at least (.*?) assets for no-replacement assignment$", 's'), "Stimulus pool group {0} needs at least {1} assets for no-replacement assignment"],
  [new RegExp("^Protocol Graph cannot be frozen:\n(.*?)$", 's'), "Protocol Graph cannot be frozen:\n{0}"],
  [new RegExp("^Node (.*?) already exists$", 's'), "Node {0} already exists"],
  [new RegExp("^Node (.*?) does not exist$", 's'), "Node {0} does not exist"],
  [new RegExp("^Source node (.*?) does not exist$", 's'), "Source node {0} does not exist"],
  [new RegExp("^Target node (.*?) does not exist$", 's'), "Target node {0} does not exist"],
  [new RegExp("^Output (.*?) already has a control connection\\. Disconnect it before choosing another target\\.$", 's'), "Output {0} already has a control connection. Disconnect it before choosing another target."],
  [new RegExp("^Edge (.*?) already exists$", 's'), "Edge {0} already exists"],
  [new RegExp("^Control edge (.*?) does not exist$", 's'), "Control edge {0} does not exist"],
  [new RegExp("^Inline duplication requires exactly one (.*?) connection$", 's'), "Inline duplication requires exactly one {0} connection"],
  [new RegExp("^Group (.*?) does not exist$", 's'), "Group {0} does not exist"],
  [new RegExp("^Unknown group: (.*?)$", 's'), "Unknown group: {0}"],
  [new RegExp("^Enter a value between (.*?) and (.*?)$", 's'), "Enter a value between {0} and {1}"],
  [new RegExp("^Multiple media entries match (.*?)\\. Use the upload button beside the intended entry\\.$", 's'), "Multiple media entries match {0}. Use the upload button beside the intended entry."],
  [new RegExp("^Expected (.*?), received (.*?)$", 's'), "Expected {0}, received {1}"],
  [new RegExp("^(.*?): bind the placeholder path to a media file before freezing or running\\.$", 's'), "{0}: bind the placeholder path to a media file before freezing or running."],
  [new RegExp("^(.*?): upload required$", 's'), "{0}: upload required"],
  [new RegExp("^Unknown participant UI element (.*?)$", 's'), "Unknown participant UI element {0}"],
  [new RegExp("^Theme token (.*?) must be a non-empty string$", 's'), "Theme token {0} must be a non-empty string"],
  [new RegExp("^Theme token name (.*?) is unsafe$", 's'), "Theme token name {0} is unsafe"],
  [new RegExp("^Unknown theme token (.*?)$", 's'), "Unknown theme token {0}"],
  [new RegExp("^Duplicate UI element ID (.*?)$", 's'), "Duplicate UI element ID {0}"],
  [new RegExp("^Unknown UI element (.*?)$", 's'), "Unknown UI element {0}"],
  [new RegExp("^(.*?) cannot contain children$", 's'), "{0} cannot contain children"],
  [new RegExp("^Unknown style key (.*?)$", 's'), "Unknown style key {0}"],
  [new RegExp("^Unknown style token (.*?)$", 's'), "Unknown style token {0}"],
  [new RegExp("^Style value for (.*?) must be a literal or a single \\$token reference$", 's'), "Style value for {0} must be a literal or a single $token reference"],
  [new RegExp("^Duplicate response name (.*?); each input needs a unique name$", 's'), "Duplicate response name {0}; each input needs a unique name"],
  [new RegExp("^Unknown UI action (.*?)$", 's'), "Unknown UI action {0}"],
  [new RegExp("^UI element (.*?) not found$", 's'), "UI element {0} not found"],
  [new RegExp("^Target parent (.*?) not found$", 's'), "Target parent {0} not found"],
  [new RegExp("^Parent (.*?) not found$", 's'), "Parent {0} not found"],
  [new RegExp("^(.*?): configuration changed$", 's'), "{0}: configuration changed"],
  [new RegExp("^Invalid or incompatible target node: (.*?)$", 's'), "Invalid or incompatible target node: {0}"],
  [new RegExp("^Balanced halves require an emotion category for asset (.*?)$", 's'), "Balanced halves require an emotion category for asset {0}"],
  [new RegExp("^Subflow parameter (.*?) needs a variable mapping$", 's'), "Subflow parameter {0} needs a variable mapping"],
  [new RegExp("^Subflow parameter (.*?) references unknown variable (.*?)$", 's'), "Subflow parameter {0} references unknown variable {1}"],
  [new RegExp("^Subflow parameter (.*?) \\((.*?)\\) cannot map to (.*?) \\((.*?)\\)$", 's'), "Subflow parameter {0} ({1}) cannot map to {2} ({3})"],
  [new RegExp("^Subflow parameter (.*?) needs a member endpoint before publishing$", 's'), "Subflow parameter {0} needs a member endpoint before publishing"],
  [new RegExp("^Subflow template (.*?) already exists$", 's'), "Subflow template {0} already exists"],
  [new RegExp("^Subflow template (.*?) does not exist$", 's'), "Subflow template {0} does not exist"],
  [new RegExp("^Generated duplicate node ID (.*?)$", 's'), "Generated duplicate node ID {0}"],
  [new RegExp("^Group (.*?) already exists$", 's'), "Group {0} already exists"],
  [new RegExp("^Generated duplicate edge ID (.*?)$", 's'), "Generated duplicate edge ID {0}"],
  [new RegExp("^Subflow template (.*?) has (.*?) instance\\(s\\)$", 's'), "Subflow template {0} has {1} instance(s)"],
  [new RegExp("^Unsupported schema version (.*?)$", 's'), "Unsupported schema version {0}"],
  [new RegExp("^Duplicate node ID (.*?)$", 's'), "Duplicate node ID {0}"],
  [new RegExp("^Unknown component (.*?)@(.*?)$", 's'), "Unknown component {0}@{1}"],
  [new RegExp("^Graph needs exactly one Start node; found (.*?)$", 's'), "Graph needs exactly one Start node; found {0}"],
  [new RegExp("^Package (.*?) lacks approval for (.*?)$", 's'), "Package {0} lacks approval for {1}"],
  [new RegExp("^(.*?) reads variables without package permission$", 's'), "{0} reads variables without package permission"],
  [new RegExp("^(.*?) uses network media without package permission$", 's'), "{0} uses network media without package permission"],
  [new RegExp("^(.*?) reads an asset without package permission$", 's'), "{0} reads an asset without package permission"],
  [new RegExp("^Duplicate device connector (.*?)$", 's'), "Duplicate device connector {0}"],
  [new RegExp("^Connector (.*?) lacks approval for (.*?)$", 's'), "Connector {0} lacks approval for {1}"],
  [new RegExp("^(.*?) references unavailable connector (.*?)$", 's'), "{0} references unavailable connector {1}"],
  [new RegExp("^Duplicate edge ID (.*?)$", 's'), "Duplicate edge ID {0}"],
  [new RegExp("^Invalid edge kind (.*?)$", 's'), "Invalid edge kind {0}"],
  [new RegExp("^Edge source node (.*?) does not exist$", 's'), "Edge source node {0} does not exist"],
  [new RegExp("^Edge target node (.*?) does not exist$", 's'), "Edge target node {0} does not exist"],
  [new RegExp("^Source port (.*?) does not exist$", 's'), "Source port {0} does not exist"],
  [new RegExp("^Target port (.*?) does not exist$", 's'), "Target port {0} does not exist"],
  [new RegExp("^Cannot connect (.*?) to (.*?)$", 's'), "Cannot connect {0} to {1}"],
  [new RegExp("^Port (.*?) accepts only one connection$", 's'), "Port {0} accepts only one connection"],
  [new RegExp("^Duplicate group ID (.*?)$", 's'), "Duplicate group ID {0}"],
  [new RegExp("^Group (.*?) is empty$", 's'), "Group {0} is empty"],
  [new RegExp("^Group references unknown node (.*?)$", 's'), "Group references unknown node {0}"],
  [new RegExp("^Node (.*?) belongs to multiple groups$", 's'), "Node {0} belongs to multiple groups"],
  [new RegExp("^Group (.*?) has an invalid kind$", 's'), "Group {0} has an invalid kind"],
  [new RegExp("^Subflow (.*?) needs one entry node from its members$", 's'), "Subflow {0} needs one entry node from its members"],
  [new RegExp("^Subflow (.*?) needs at least one member exit node$", 's'), "Subflow {0} needs at least one member exit node"],
  [new RegExp("^Duplicate subflow parameter (.*?)$", 's'), "Duplicate subflow parameter {0}"],
  [new RegExp("^Invalid subflow parameter type (.*?)$", 's'), "Invalid subflow parameter type {0}"],
  [new RegExp("^Invalid subflow parameter direction (.*?)$", 's'), "Invalid subflow parameter direction {0}"],
  [new RegExp("^Subflow parameter (.*?) needs a member (.*?) endpoint$", 's'), "Subflow parameter {0} needs a member {1} endpoint"],
  [new RegExp("^Subflow parameter (.*?) must use a (.*?) data port$", 's'), "Subflow parameter {0} must use a {1} data port"],
  [new RegExp("^Subflow parameter (.*?) \\((.*?)\\) does not match (.*?) \\((.*?)\\)$", 's'), "Subflow parameter {0} ({1}) does not match {2} ({3})"],
  [new RegExp("^Required port (.*?) is not connected or bound$", 's'), "Required port {0} is not connected or bound"],
  [new RegExp("^Required output (.*?) is not connected$", 's'), "Required output {0} is not connected"],
  [new RegExp("^Output (.*?) on (.*?) must have only one control connection; found (.*?)$", 's'), "Output {0} on {1} must have only one control connection; found {2}"],
  [new RegExp("^Duplicate variable (.*?)$", 's'), "Duplicate variable {0}"],
  [new RegExp("^Invalid variable type (.*?)$", 's'), "Invalid variable type {0}"],
  [new RegExp("^Invalid variable scope (.*?)$", 's'), "Invalid variable scope {0}"],
  [new RegExp("^Subflow parameter (.*?) needs a declared variable mapping$", 's'), "Subflow parameter {0} needs a declared variable mapping"],
  [new RegExp("^Subflow mapping (.*?) has no parameter$", 's'), "Subflow mapping {0} has no parameter"],
  [new RegExp("^Subflow template (.*?) has no nodes$", 's'), "Subflow template {0} has no nodes"],
  [new RegExp("^Subflow template (.*?) has an invalid entry$", 's'), "Subflow template {0} has an invalid entry"],
  [new RegExp("^Subflow template (.*?) has invalid exits$", 's'), "Subflow template {0} has invalid exits"],
  [new RegExp("^Subflow template (.*?) has an external edge$", 's'), "Subflow template {0} has an external edge"],
  [new RegExp("^Template parameter (.*?) has an invalid contract$", 's'), "Template parameter {0} has an invalid contract"],
  [new RegExp("^Template parameter (.*?) has an invalid (.*?)$", 's'), "Template parameter {0} has an invalid {1}"],
  [new RegExp("^Binding references undeclared variable (.*?)$", 's'), "Binding references undeclared variable {0}"],
  [new RegExp("^Variable (.*?) \\((.*?)\\) cannot bind to (.*?) \\((.*?)\\)$", 's'), "Variable {0} ({1}) cannot bind to {2} ({3})"],
  [new RegExp("^Node (.*?) is not reachable from Start$", 's'), "Node {0} is not reachable from Start"],
  [new RegExp("^(.*?) reads (.*?), but no node writes it$", 's'), "{0} reads {1}, but no node writes it"],
  [new RegExp("^(.*?) reads (.*?) without a write on every path$", 's'), "{0} reads {1} without a write on every path"],
  [new RegExp("^Unsupported variable type (.*?)$", 's'), "Unsupported variable type {0}"],
  [new RegExp("^Unsupported variable scope (.*?)$", 's'), "Unsupported variable scope {0}"],
  [new RegExp("^Variable (.*?) already exists$", 's'), "Variable {0} already exists"],
  [new RegExp("^Variable (.*?) does not exist$", 's'), "Variable {0} does not exist"],
  [new RegExp("^Variable (.*?) is still used by (.*?) binding\\(s\\)$", 's'), "Variable {0} is still used by {1} binding(s)"],
  [new RegExp("^Unsupported change-set schema (.*?)$", 's'), "Unsupported change-set schema {0}"],
  [new RegExp("^(.*?) needs an ID$", 's'), "{0} needs an ID"],
  [new RegExp("^(.*?) has a duplicate ID$", 's'), "{0} has a duplicate ID"],
  [new RegExp("^(.*?) has an unsupported target$", 's'), "{0} has an unsupported target"],
  [new RegExp("^(.*?) needs an entity key$", 's'), "{0} needs an entity key"],
  [new RegExp("^(.*?) has an unsafe path$", 's'), "{0} has an unsafe path"],
  [new RegExp("^(.*?) needs a protocol path$", 's'), "{0} needs a protocol path"],
  [new RegExp("^(.*?) targets protected protocol state$", 's'), "{0} targets protected protocol state"],
  [new RegExp("^(.*?) cannot change an entity identity field$", 's'), "{0} cannot change an entity identity field"],
  [new RegExp("^(.*?) needs before/after snapshots$", 's'), "{0} needs before/after snapshots"],
  [new RegExp("^(.*?) (.*?) entity identity does not match its key$", 's'), "{0} {1} entity identity does not match its key"],
  [new RegExp("^Cannot update missing (.*?) entity (.*?)$", 's'), "Cannot update missing {0} entity {1}"],
  [new RegExp("^Invalid change set:\n(.*?)$", 's'), "Invalid change set:\n{0}"],
  [new RegExp("^Change set targets version (.*?), not version (.*?)$", 's'), "Change set targets version {0}, not version {1}"],
  [new RegExp("^Delete step (.*?) \\(\"(.*?)\"\\)\\?$", 's'), "Delete step {0} (\"{1}\")?"],
  [new RegExp("^Delete trial (.*?) \\(\"(.*?)\"\\) and all its steps\\?$", 's'), "Delete trial {0} (\"{1}\") and all its steps?"],
  [new RegExp("^Delete block (.*?) \\(\"(.*?)\"\\) and all its contents\\?$", 's'), "Delete block {0} (\"{1}\") and all its contents?"],
  [new RegExp("^(.*?) nodes · (.*?) connections · configuration checked$", 's'), "{0} nodes · {1} connections · configuration checked"],
  [new RegExp("^Required: (.*?)\\. Device connection is checked when you begin the experiment; configuration does not confirm connectivity or timing accuracy\\.$", 's'), "Required: {0}. Device connection is checked when you begin the experiment; configuration does not confirm connectivity or timing accuracy."],
  [new RegExp("^Local data folder: (.*?)$", 's'), "Local data folder: {0}"]
);

messageTemplates.push([new RegExp("^(.*?)m$", 's'), "{0}m"]);

messageTemplates.push([new RegExp("^(.*?) sensor points across (.*?) channel\\(s\\), (.*?) event\\(s\\)\\.$", 's'), "{0} sensor points across {1} channel(s), {2} event(s)."]);

messageTemplates.push([new RegExp("^The PF session was archived, but the BioDB leg failed: (.*?)$", 's'), "The PF session was archived, but the BioDB leg failed: {0}"]);

messageTemplates.push([new RegExp("^(.*?) component\\(s\\) skipped$", 's'), "{0} component(s) skipped"]);

messageTemplates.push([new RegExp("^(.*?) pause\\(s\\)$", 's'), "{0} pause(s)"]);

messageTemplates.push([new RegExp("^Event (.*?): (.*?)$", 's'), "Event {0}: {1}"]);

messageTemplates.push([new RegExp("^Version (.*?)$", 's'), "Version {0}"]);
// Prefer specific diagnostics over broad templates such as "{0} needs an ID".
// Prefer specific diagnostics over broad templates such as "{0} needs an ID".
messageTemplates.sort((a, b) => b[1].replace(/\{\d+\}/g, '').length - a[1].replace(/\{\d+\}/g, '').length);

messageTemplates.push([new RegExp("^Protocol cannot be frozen:\n(.*?)$", 's'), "Protocol cannot be frozen:\n{0}"]);

messageTemplates.push([new RegExp("^(.*?): missing ID$", 's'), "{0}: missing ID"]);

messageTemplates.push([new RegExp("^(.*?): duplicate (.*?)$", 's'), "{0}: duplicate {1}"]);

messageTemplates.push([new RegExp("^(.*?): «Block name» is required — enter a name for this block$", 's'), "{0}: «Block name» is required — enter a name for this block"]);

messageTemplates.push([new RegExp("^(.*?): invalid order rule$", 's'), "{0}: invalid order rule"]);

messageTemplates.push([new RegExp("^(.*?): «Repeat» must be an integer of at least 1$", 's'), "{0}: «Repeat» must be an integer of at least 1"]);

messageTemplates.push([new RegExp("^(.*?): impossible consecutive-condition constraint — change condition counts or relax the limit$", 's'), "{0}: impossible consecutive-condition constraint — change condition counts or relax the limit"]);

messageTemplates.push([new RegExp("^(.*?): constrained ordering requires Trial Repeat = 1; duplicate Trials instead so each occurrence can be ordered$", 's'), "{0}: constrained ordering requires Trial Repeat = 1; duplicate Trials instead so each occurrence can be ordered"]);

messageTemplates.push([new RegExp("^(.*?): condition constraints apply within each Block pass, not across Block boundaries$", 's'), "{0}: condition constraints apply within each Block pass, not across Block boundaries"]);

messageTemplates.push([new RegExp("^(.*?) has no Trials — click \"\\+ Add trial\"$", 's'), "{0} has no Trials — click \"+ Add trial\""]);

messageTemplates.push([new RegExp("^(.*?): «Trial name» is required$", 's'), "{0}: «Trial name» is required"]);

messageTemplates.push([new RegExp("^(.*?): «ITI jitter» must be a non-negative number$", 's'), "{0}: «ITI jitter» must be a non-negative number"]);

messageTemplates.push([new RegExp("^(.*?): «Jitter distribution» must be uniform, normal, exponential, or fixed$", 's'), "{0}: «Jitter distribution» must be uniform, normal, exponential, or fixed"]);

messageTemplates.push([new RegExp("^(.*?) has no Steps — click a step type button \\(e\\.g\\. \"\\+ instruction\"\\)$", 's'), "{0} has no Steps — click a step type button (e.g. \"+ instruction\")"]);

messageTemplates.push([new RegExp("^(.*?): «Event type» is invalid$", 's'), "{0}: «Event type» is invalid"]);

messageTemplates.push([new RegExp("^(.*?): «Step name» is required$", 's'), "{0}: «Step name» is required"]);

messageTemplates.push([new RegExp("^(.*?): «Duration» field is required when end mode is set to \"Fixed time\"$", 's'), "{0}: «Duration» field is required when end mode is set to \"Fixed time\""]);

messageTemplates.push([new RegExp("^(.*?): invalid recovery behavior$", 's'), "{0}: invalid recovery behavior"]);

messageTemplates.push([new RegExp("^(.*?): «Analysis role» must be set when «Generate analysis window» is enabled$", 's'), "{0}: «Analysis role» must be set when «Generate analysis window» is enabled"]);

messageTemplates.push([new RegExp("^(.*?): «Source URL» or uploaded file is required — this (.*?) step has nothing to play$", 's'), "{0}: «Source URL» or uploaded file is required — this {1} step has nothing to play"]);

messageTemplates.push([new RegExp("^(.*?): YouTube end detection uses the YouTube IFrame API \\(postMessage\\)\\. This works in most browsers but the timing may differ from local media files by a few hundred milliseconds$", 's'), "{0}: YouTube end detection uses the YouTube IFrame API (postMessage). This works in most browsers but the timing may differ from local media files by a few hundred milliseconds"]);

messageTemplates.push([new RegExp("^(.*?): YouTube source does not report exact playback events; the analysis window will use page display time instead of actual play time$", 's'), "{0}: YouTube source does not report exact playback events; the analysis window will use page display time instead of actual play time"]);

messageTemplates.push([new RegExp("^(.*?): looping is ON but end mode is \"When media ends\"\\. A looping media file never ends — switch end mode to «Fixed time» or «Manual continue», or turn off looping$", 's'), "{0}: looping is ON but end mode is \"When media ends\". A looping media file never ends — switch end mode to «Fixed time» or «Manual continue», or turn off looping"]);

messageTemplates.push([new RegExp("^(.*?): «Start mode» must be \"Automatic\" or \"Participant click\"$", 's'), "{0}: «Start mode» must be \"Automatic\" or \"Participant click\""]);

messageTemplates.push([new RegExp("^(.*?): «End mode» is invalid$", 's'), "{0}: «End mode» is invalid"]);

messageTemplates.push([new RegExp("^(.*?): «Source» mode \"(.*?)\" is invalid$", 's'), "{0}: «Source» mode \"{1}\" is invalid"]);

messageTemplates.push([new RegExp("^(.*?): large «Repeat» value \\((.*?)\\) may cause long runtimes$", 's'), "{0}: large «Repeat» value ({1}) may cause long runtimes"]);

messageTemplates.push([new RegExp("^(.*?): start mode is \"Participant click\" but player controls are hidden\\. The participant needs visible controls to start playback — enable «Show player controls»$", 's'), "{0}: start mode is \"Participant click\" but player controls are hidden. The participant needs visible controls to start playback — enable «Show player controls»"]);

messageTemplates.push([new RegExp("^(.*?): external questionnaire URL is required$", 's'), "{0}: external questionnaire URL is required"]);

messageTemplates.push([new RegExp("^(.*?): external questionnaire URL must start with http:// or https://$", 's'), "{0}: external questionnaire URL must start with http:// or https://"]);

messageTemplates.push([new RegExp("^(.*?): external questionnaire steps must use «Manual continue» so the participant/operator can confirm completion$", 's'), "{0}: external questionnaire steps must use «Manual continue» so the participant/operator can confirm completion"]);

messageTemplates.push([new RegExp("^(.*?): external questionnaire context sync is enabled but no URL parameter names are set$", 's'), "{0}: external questionnaire context sync is enabled but no URL parameter names are set"]);

messageTemplates.push([new RegExp("^(.*?): this questionnaire step has no questions — add at least one question$", 's'), "{0}: this questionnaire step has no questions — add at least one question"]);

messageTemplates.push([new RegExp("^(.*?): end mode is \"Fixed time\" but some questions are required\\. A timer will skip unanswered required questions — switch end mode to «Manual continue» so participants can submit$", 's'), "{0}: end mode is \"Fixed time\" but some questions are required. A timer will skip unanswered required questions — switch end mode to «Manual continue» so participants can submit"]);

messageTemplates.push([new RegExp("^(.*?) / Question (.*?): ID is required$", 's'), "{0} / Question {1}: ID is required"]);

messageTemplates.push([new RegExp("^(.*?): duplicate question ID (.*?)$", 's'), "{0}: duplicate question ID {1}"]);

messageTemplates.push([new RegExp("^(.*?) / Question (.*?): «Type» is required$", 's'), "{0} / Question {1}: «Type» is required"]);

messageTemplates.push([new RegExp("^(.*?) / Question (.*?): «Prompt» is empty in all languages — the participant won't know what to answer$", 's'), "{0} / Question {1}: «Prompt» is empty in all languages — the participant won't know what to answer"]);

messageTemplates.push([new RegExp("^(.*?) / Question (.*?): «Options» are required for (.*?) choice — add at least one option$", 's'), "{0} / Question {1}: «Options» are required for {2} choice — add at least one option"]);

messageTemplates.push([new RegExp("^(.*?): «Response variable» is required — set the variable name used in exports and Condition nodes$", 's'), "{0}: «Response variable» is required — set the variable name used in exports and Condition nodes"]);

messageTemplates.push([new RegExp("^(.*?): response options are required — add at least one value/label/key row$", 's'), "{0}: response options are required — add at least one value/label/key row"]);

messageTemplates.push([new RegExp("^(.*?) / Response option (.*?): «Value» is required$", 's'), "{0} / Response option {1}: «Value» is required"]);

messageTemplates.push([new RegExp("^(.*?): duplicate response value \"(.*?)\"$", 's'), "{0}: duplicate response value \"{1}\""]);

messageTemplates.push([new RegExp("^(.*?) / Response option (.*?): «Label» is required in at least one language$", 's'), "{0} / Response option {1}: «Label» is required in at least one language"]);

messageTemplates.push([new RegExp("^(.*?): duplicate response key \"(.*?)\"$", 's'), "{0}: duplicate response key \"{1}\""]);

messageTemplates.sort((a, b) => b[1].replace(/\{\d+\}/g, '').length - a[1].replace(/\{\d+\}/g, '').length);

// E3 display-only diagnostics; model values remain English.
messageTemplates.push([new RegExp("^(.*?)\\s+analysis\\s+window\\(s\\)\\s+will\\s+be\\s+exported\\.$", "s"), "{0} analysis window(s) will be exported."]);
messageTemplates.push([new RegExp("^(.*?)\\s+blocked\\s+·\\s+fix\\s+before\\s+formal\\s+collection$", "s"), "{0} blocked · fix before formal collection"]);
messageTemplates.push([new RegExp("^(.*?)\\s+blocking\\s+issue\\(s\\)\\.$", "s"), "{0} blocking issue(s)."]);
messageTemplates.push([new RegExp("^(.*?)\\s+blocks,\\s+(.*?)\\s+trials,\\s+(.*?)\\s+steps\\.$", "s"), "{0} blocks, {1} trials, {2} steps."]);
messageTemplates.push([new RegExp("^(.*?)\\s+nodes,\\s+(.*?)\\s+connections\\.$", "s"), "{0} nodes, {1} connections."]);
messageTemplates.push([new RegExp("^(.*?)\\s+optional\\s+warning\\(s\\)\\.$", "s"), "{0} optional warning(s)."]);
messageTemplates.push([new RegExp("^(.*?)\\s+preview,\\s+(.*?)\\s+formal\\s+completed\\s+session\\(s\\)\\.$", "s"), "{0} preview, {1} formal completed session(s)."]);
messageTemplates.push([new RegExp("^(.*?)\\s+ready\\s+·\\s+(.*?)\\s+sessions\\s+recorded$", "s"), "{0} ready · {1} sessions recorded"]);
messageTemplates.push([new RegExp("^(.*?)\\s+step\\s+content\\s+error\\(s\\)\\.$", "s"), "{0} step content error(s)."]);
messageTemplates.push([new RegExp("^(.*?)\\s+steps\\s+inspected\\s+·\\s+(.*?)%\\s+mapped\\s+to\\s+native\\s+V2\\s+components\\s+·\\s+(.*?)\\s+review\\s+item\\(s\\)\\.\\s+The\\s+migrated\\s+version\\s+remains\\s+a\\s+safe\\s+editable\\s+draft\\s+until\\s+reviewed\\.$", "s"), "{0} steps inspected · {1}% mapped to native V2 components · {2} review item(s). The migrated version remains a safe editable draft until reviewed."]);
messageTemplates.push([new RegExp("^(.*?)/(.*?)\\s+media\\s+step\\(s\\)\\s+have\\s+sources\\.$", "s"), "{0}/{1} media step(s) have sources."]);
messageTemplates.push([new RegExp("^A\\s+project\\s+with\\s+this\\s+project_id\\s+already\\s+exists\\.\\s+Differences\\s+from\\s+latest\\s+version:\\s+(.*?)\\s+Choose\\s+how\\s+to\\s+import,\\s+or\\s+cancel\\s+without\\s+making\\s+changes\\.$", "s"), "A project with this project_id already exists. Differences from latest version: {0} Choose how to import, or cancel without making changes."]);
messageTemplates.push([new RegExp("^Archive\\s+project\\s+\"(.*?)\"\\s+and\\s+all\\s+of\\s+its\\s+versions\\?$", "s"), "Archive project \"{0}\" and all of its versions?"]);
messageTemplates.push([new RegExp("^Enter\\s+a\\s+new\\s+name\\s+for\\s+\"(.*?)\"$", "s"), "Enter a new name for \"{0}\""]);
messageTemplates.push([new RegExp("^Folder:\\s+(.*?)$", "s"), "Folder: {0}"]);
messageTemplates.push([new RegExp("^Frozen\\s+Protocol\\s+Graph\\s+hash\\s+mismatch\\.\\s+Expected\\s+(.*?)\\s+Actual\\s+(.*?)$", "s"), "Frozen Protocol Graph hash mismatch. Expected {0} Actual {1}"]);
messageTemplates.push([new RegExp("^Frozen\\s+protocol\\s+hash\\s+mismatch\\.\\s+Expected\\s+(.*?)\\s+Actual\\s+(.*?)$", "s"), "Frozen protocol hash mismatch. Expected {0} Actual {1}"]);
messageTemplates.push([new RegExp("^Hash\\s+(.*?)\\.\\.\\.$", "s"), "Hash {0}..."]);
messageTemplates.push([new RegExp("^Missing\\s+required\\s+asset\\s+(.*?)$", "s"), "Missing required asset {0}"]);
messageTemplates.push([new RegExp("^Move\\s+\"(.*?)\"\\s+v(.*?)\\s+to\\s+the\\s+recovery\\s+area\\?\\s+Other\\s+versions\\s+and\\s+session\\s+data\\s+will\\s+remain\\.\\s+You\\s+can\\s+restore\\s+it\\s+from\\s+Removed\\s+/\\s+archived\\s+versions\\.$", "s"), "Move \"{0}\" v{1} to the recovery area? Other versions and session data will remain. You can restore it from Removed / archived versions."]);
messageTemplates.push([new RegExp("^Some\\s+uploaded\\s+resources\\s+are\\s+unavailable\\s+or\\s+changed\\s+in\\s+this\\s+browser:\\s+(.*?)\\s+Import\\s+as\\s+an\\s+editable\\s+draft\\s+and\\s+reassign\\s+those\\s+files\\?$", "s"), "Some uploaded resources are unavailable or changed in this browser: {0} Import as an editable draft and reassign those files?"]);
messageTemplates.push([new RegExp("^Using\\s+local\\s+folder:\\s+(.*?)$", "s"), "Using local folder: {0}"]);

// Interpolate after translation; zero and empty values are intentional.
export function interpolateMessage(message, values) {
  return values && typeof message === "string" ? message.replace(/\{(\w+)\}/g, (token, name) => values[name] ?? token) : message;
}

// Catalog templates also cover diagnostics assembled before reaching the UI.
// Capture only numbered placeholders; named tokens are interpolated by useT.
for (const key of Object.keys(pfUIStrings.ja)) {
  const placeholders = [...key.matchAll(/\{(\d+)\}/g)];
  if (!placeholders.length || placeholders.some((match, index) => Number(match[1]) !== index)) continue;
  const escape = text => text.replace(/[.*+?^$\{\}()|[\]\\]/g, '\\$&');
  let offset = 0;
  let pattern = '^';
  for (const match of placeholders) {
    pattern += escape(key.slice(offset, match.index)) + '(.*?)';
    offset = match.index + match[0].length;
  }
  pattern += escape(key.slice(offset)) + '$';
  messageTemplates.push([new RegExp(pattern, 's'), key]);
}
messageTemplates.sort((a, b) => b[1].replace(/\{\d+\}/g, '').length - a[1].replace(/\{\d+\}/g, '').length);
