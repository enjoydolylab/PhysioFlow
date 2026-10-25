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
const files = (await globAsync('src/**/*.{js,jsx}', { nodir: true })).filter(file => !['i18n.jsx', 'composerStrings.js', 'catalogLabels.js', 'pfUIStrings.js'].some(name => file.endsWith(name)));
const source = await readFile('src/i18n.jsx', 'utf8');
const dictionaryKeys = new Set([...source.matchAll(/(?:"([^"\n]{2,})"|'([^'\n]{2,})')\s*:/g)].map(match => match[1] ?? match[2]));
// Display catalogs are translation sources, not untranslated UI candidates.
for (const key of [...Object.keys(pfUIStrings.ja), ...composerCopy.map(row => row[0]), ...catalogCopy.map(row => row[0])]) dictionaryKeys.add(key);
const candidates = new Map();
const ignored = /^(https?:|data:|application\/|text\/|#[0-9a-f]{3,8}$|[A-Z_./:-]+$|[a-z]+\.[a-z]+$|\d+(\.\d+)?(px|ms|vh|vw|%)?$)/i;
const codeWords = /^(src|id|type|name|value|label|props|children|className|style|true|false|null|undefined|column|row|primary|secondary|image|audio|video|text|number|checkbox|rating|submit|next|free|flow|manual|automatic|desktop|phone|tablet|en|zh|ja)$/;
// Not UI copy: SVG path data, CSS attribute selectors, font stacks, CSS filters
// and pure CSS functions. Kept separate from `ignored` because these patterns
// need to start-anchor on the whole value.
const nonCopy = [
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
  const walk = node => {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'JSXText') add(node.value, file, code.slice(0, node.start).split('\n').length, 'JSX text');
    if (node.type === 'StringLiteral') add(node.value, file, code.slice(0, node.start).split('\n').length, 'string/attribute');
    for (const [key, value] of Object.entries(node)) {
      if (key === 'loc' || key === 'tokens' || key === 'comments') continue;
      if (Array.isArray(value)) value.forEach(walk); else if (value && typeof value === 'object') walk(value);
    }
  };
  walk(ast);
}
const rows = [...candidates.values()].sort((a, b) => a.value.localeCompare(b.value)).map(item => ({ ...item, dictionary: dictionaryKeys.has(item.value) ? 'present' : 'missing', files: [...item.files].sort(), kinds: [...item.kinds].sort(), lines: [...item.lines].sort() }));
const missing = rows.filter(row => row.dictionary === 'missing');
const present = rows.filter(row => row.dictionary === 'present');
const md = row => '- `' + row.value.replaceAll('`', '') + '` — ' + row.lines.join(', ');
const out = `# i18n audit

Generated: ${new Date().toISOString()}

- Source files scanned: ${files.length}
- Candidate strings: ${rows.length}
- Candidates already in dictionary: ${present.length}
- Candidates missing from dictionary: ${missing.length}

## Review rules

- **Missing** strings are candidates for system UI translation; review before adding because experiment-authored content and data values must remain unchanged.
- **Present** strings are covered by the current DOM translation layer, but attribute and interpolated usage should be migrated to useT() when possible.
- Technical identifiers, CSS values and URLs are filtered heuristically.

## Missing candidates

${missing.length ? missing.map(md).join('\n') : '_None found._'}

## Present candidates needing explicit API review

${present.map(row => `${md(row)} — ${row.kinds.join(', ')}`).join('\n')}
`;
await writeFile('docs/refactor/I18N_AUDIT.md', out);
console.log(JSON.stringify({ files: files.length, candidates: rows.length, present: present.length, missing: missing.length, report: 'docs/refactor/I18N_AUDIT.md' }, null, 2));
