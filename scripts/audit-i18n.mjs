import { composerCopy } from '../src/composer/composerStrings.js';
import { catalogCopy } from '../src/composer/catalogLabels.js';
import { pfUIStrings } from '../src/pfUIStrings.js';
import { readFile, writeFile } from 'node:fs/promises';
import { glob } from 'node:fs';
import { promisify } from 'node:util';
import { parse } from '@babel/parser';

const globAsync = promisify(glob);
// Catalog files hold translations, not untranslated UI copy: scanning their
// values would report every Japanese string as a missing candidate.
const files = (await globAsync('src/**/*.{js,jsx}', { nodir: true })).filter(file => !['i18n.jsx', 'composerStrings.js', 'catalogLabels.js', 'pfUIStrings.js', 'i18nMessage.js'].some(name => file.endsWith(name)));
const source = await readFile('src/i18n.jsx', 'utf8');
const dictionaryKeys = new Set();
const dictionaryAst = parse(source, { sourceType: 'module', plugins: ['jsx'] });
function collectKeys(node) {
  if (!node || typeof node !== 'object') return;
  if (node.type === 'ObjectProperty' && node.key.type === 'StringLiteral') dictionaryKeys.add(node.key.value);
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach(collectKeys);
    else if (value && typeof value === 'object') collectKeys(value);
  }
}
collectKeys(dictionaryAst);
// Display catalogs are translation sources, not untranslated UI candidates.
for (const key of [...Object.keys(pfUIStrings.ja), ...composerCopy.map(row => row[0]), ...catalogCopy.map(row => row[0])]) dictionaryKeys.add(key);
const normalize = text => text.replace(/\s+/g, ' ').trim();
const allowlistEntries = JSON.parse(await readFile(new URL('./i18n-allowlist.json', import.meta.url), 'utf8'));
const allowlist = new Map();
for (const entry of allowlistEntries) {
  if (typeof entry.text !== 'string' || !['content', 'data', 'multilingual'].includes(entry.reason)) throw new Error('Invalid i18n allowlist entry');
  const text = normalize(entry.text);
  if (allowlist.has(text)) throw new Error('Duplicate i18n allowlist value: ' + text);
  allowlist.set(text, entry.reason);
}
for (const key of [...dictionaryKeys]) dictionaryKeys.add(normalize(key));
const candidates = new Map();
const ignored = /^(https?:|data:|application\/|text\/|#[0-9a-f]{3,8}$|[A-Z_./:-]+$|[a-z]+\.[a-z]+$|\d+(\.\d+)?(px|ms|vh|vw|%)?$)/i;
const codeWords = /^(src|id|type|name|value|label|props|children|className|style|true|false|null|undefined|column|row|primary|secondary|image|audio|video|text|number|checkbox|rating|submit|next|free|flow|manual|automatic|desktop|phone|tablet|en|zh|ja)$/;
// Not UI copy: SVG path data, CSS attribute selectors, font stacks, CSS filters
// and pure CSS functions. Kept separate from `ignored` because these patterns
// need to start-anchor on the whole value.
const nonCopy = [
  /^Bearer \{\d+\}$/,
  /^(?:session\.\{\d+\}|\\[nrt])$/,
  /^(?=[\w{}.,:=*/_-]*\{\d+\})[\w{}.,:=*/_-]+$/,
  /^\d+(?:\.\d+)*(?:-[\w.-]+)?$/,
  /^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/,
  /^(?:[\w.-]*-)?(?:mulberry32|lcg)[\w.-]*$/,
  /^xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx$/,
  /^t\*_$/,
  /^(?:\.\.?\/|\/|\^|\?asOf=|\$[\w.]+$)/,
  /^(?:[a-z][\w.-]*:|PURGE:|\{\d+\}[.:/])[\w{}:./?=-]+$/,
  /^(?:audio|video|image)\/\*$/,
  /^(?:content_i18n|opacity \.3s|hmac-sha256-chain|hmac-sha256\+aes-256-gcm|physioflow\.hosted-service\.v1|\[A-Za-z0-9\]\[A-Za-z0-9._-\]\{0,63\}|authorization, content-type, idempotency-key|GET, POST, PUT, OPTIONS)$/,
  /^(?:participant_bootstrap_|manual-)\{\d+\}$/, // module paths, API routes, binding identifiers
  /^(?:[\d.]+(?:px|rem|em|vh|vw|%)\s*)+(?:(?:solid|dashed)\s+.+)?$/,
  /^(?:clamp|min|max|calc|repeat|linear-gradient|rgba?|translate|scale)\(/i,
  /^['"]?[A-Z][\w ]+['"]?,\s*(?:serif|sans-serif|monospace)$/,
  /^M[\d.]/i,                                     // <path d="M4 12h16 …">
  /^[MmLlHhVvCcSsQqTtAaZz][\d.,\s-]+$/,           // bare path data
  /^\[[\w-]+.*\]$/,                               // [data-ui-id], [tree-drop-error]
  /^(?:\d+\s+)?(?:grayscale|blur|brightness|contrast|saturate|drop-shadow|sepia|opacity)\(/i,
  /^[a-z-]+\s*:\s*[^;]+;$/,                       // inline css declarations
  /^(?:Georgia|Helvetica|Arial|Times|Inter|Roboto|Menlo|Consolas|system-ui)[\w\s,'-]*$/i,
];
function add(text, file, line, kind) {
  const value = text.replace(/\s+/g, ' ').trim();
  if (!value || value.length < 2 || value.length > 180 || ignored.test(value) || codeWords.test(value) || nonCopy.some(pattern => pattern.test(value)) || !/[A-Za-z\u3040-\u30ff\u3400-\u9fff]/.test(value)) return;
  const item = candidates.get(value) || { value, files: new Set(), kinds: new Set(), lines: new Set() };
  item.files.add(file); item.kinds.add(kind); item.lines.add(`${file}:${line}`); candidates.set(value, item);
}
for (const file of files) {
  const code = await readFile(file, 'utf8');
  let ast;
  try { ast = parse(code, { sourceType: 'module', plugins: ['jsx', 'typescript'] }); } catch { continue; }
  const walk = (node, parent, structuralAttribute = false) => {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'JSXText') add(node.value, file, code.slice(0, node.start).split('\n').length, 'JSX text');
    const technical = structuralAttribute || parent && (
      ['ImportDeclaration', 'ExportNamedDeclaration', 'ExportAllDeclaration'].includes(parent.type)
      || parent.type === 'ObjectProperty' && parent.key === node && !parent.computed
      || parent.type === 'JSXAttribute' && !['title', 'placeholder', 'aria-label', 'alt', 'label'].includes(parent.name?.name)
      || parent.type === 'ObjectProperty' && /^(font|margin|padding|border|background|color|width|height|gap|display|position|align|justify|grid|flex|transition|animation|box|text|letter|line|overflow|opacity|transform)/.test(parent.key?.name || '') && !['text', 'label'].includes(parent.key?.name)
    );
    if (node.type === 'StringLiteral' && !technical) add(node.value, file, code.slice(0, node.start).split('\n').length, 'string/attribute');
    if (node.type === 'TemplateLiteral' && !technical) add(node.quasis.map((part, index) => part.value.cooked + (index < node.expressions.length ? '{' + index + '}' : '')).join(''), file, node.loc.start.line, 'template');
    for (const [key, value] of Object.entries(node)) {
      if (key === 'loc' || key === 'tokens' || key === 'comments') continue;
      if (Array.isArray(value)) value.forEach(child => walk(child, node, structuralAttribute || node.type === 'JSXAttribute' && !['title', 'placeholder', 'aria-label', 'alt', 'label'].includes(node.name?.name))); else if (value && typeof value === 'object') walk(value, node, structuralAttribute || node.type === 'JSXAttribute' && !['title', 'placeholder', 'aria-label', 'alt', 'label'].includes(node.name?.name));
    }
  };
  walk(ast);
}
const rows = [...candidates.values()].sort((a, b) => a.value.localeCompare(b.value)).map(item => ({ ...item, dictionary: allowlist.has(item.value) ? 'allowlisted' : dictionaryKeys.has(item.value) ? 'present' : 'missing', reason: allowlist.get(item.value), files: [...item.files].sort(), kinds: [...item.kinds].sort(), lines: [...item.lines].sort() }));
const missing = rows.filter(row => row.dictionary === 'missing');
const allowlisted = rows.filter(row => row.dictionary === 'allowlisted');
const present = rows.filter(row => row.dictionary === 'present');
const md = row => '- `' + row.value.replaceAll('`', '') + '` — ' + row.lines.join(', ');
const out = `# i18n audit

Generated: ${new Date().toISOString()}

- Source files scanned: ${files.length}
- Candidate strings: ${rows.length}
- Candidates already in dictionary: ${present.length}
- Candidates missing from dictionary: ${missing.length}
- Allowlisted candidates: ${allowlisted.length}

## Review rules

- **Missing** strings are candidates for system UI translation; review before adding because experiment-authored content and data values must remain unchanged.
- **Present** strings are covered by the current DOM translation layer, but attribute and interpolated usage should be migrated to useT() when possible.
- **Allowlisted** values are preserved authored content, export data documentation, or already multilingual rows; they are excluded from missing. The allowlist contains ${allowlistEntries.length} values (content: ${allowlistEntries.filter(entry => entry.reason === 'content').length}; data: ${allowlistEntries.filter(entry => entry.reason === 'data').length}; multilingual: ${allowlistEntries.filter(entry => entry.reason === 'multilingual').length}).
- Technical identifiers, CSS values and URLs are filtered heuristically. Dynamic message templates use numbered placeholders.

## Allowlisted candidates (authored content, export data, multilingual rows)

${allowlisted.map(row => `${md(row)} — ${row.reason}`).join('\n')}

## Missing candidates

${missing.length ? missing.map(md).join('\n') : '_None found._'}

## Present candidates needing explicit API review

${present.map(row => `${md(row)} — ${row.kinds.join(', ')}`).join('\n')}
`;
await writeFile('docs/refactor/I18N_AUDIT.md', out);
console.log(JSON.stringify({ files: files.length, candidates: rows.length, present: present.length, missing: missing.length, allowlisted: allowlisted.length, allowlistByReason: Object.fromEntries(['content', 'data', 'multilingual'].map(reason => [reason, allowlistEntries.filter(entry => entry.reason === reason).length])), appHosted: Object.fromEntries(['present', 'missing', 'allowlisted'].map(status => [status, rows.filter(row => row.dictionary === status && row.files.some(file => /src[\\/](app|hosted)[\\/]/.test(file))).length])), report: 'docs/refactor/I18N_AUDIT.md' }, null, 2));

if (process.argv.includes('--json')) await writeFile('i18n-audit-rows.json', JSON.stringify(rows, null, 2));
