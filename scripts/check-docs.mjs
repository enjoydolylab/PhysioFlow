import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { resolve, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const walk = dir => readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
  const path = resolve(dir, entry.name);
  return entry.isDirectory() ? walk(path) : entry.isFile() && path.endsWith('.md') ? [path] : [];
});
const files = [resolve(root, 'README.md'), resolve(root, 'CHANGELOG.md'), ...walk(resolve(root, 'docs'))];
const scripts = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')).scripts;
const errors = [], links = new Map();
let checkedLinks = 0, checkedPaths = 0, checkedCommands = 0;
for (const file of files) {
  const source = readFileSync(file, 'utf8');
  const prose = source.replace(/^```[^\n]*\n[\s\S]*?^```\s*$/gm, '');
  const label = relative(root, file).split(sep).join('/');
  const targets = [];
  // Inline Markdown links/images and link-reference definitions; anchors and external URLs are not fetched.
  const matches = [...prose.matchAll(/\]\(\s*(<[^>]+>|[^\s)]+)(?:\s+"[^"]*")?\s*\)/g),
    ...prose.matchAll(/^\s*\[[^\]]+\]:\s*(<[^>]+>|\S+)/gm)];
  for (const match of matches) {
    const href = match[1].replace(/^<|>$/g, '');
    if (/^(?:[a-z][a-z0-9+.-]*:|#|\/\/)/i.test(href)) continue;
    let path;
    try { path = decodeURIComponent(href.split(/[?#]/)[0]); }
    catch { errors.push(`${label}: invalid URL encoding ${href}`); continue; }
    const target = resolve(dirname(file), path);
    checkedLinks++;
    if (!existsSync(target)) errors.push(`${label}: missing linked path ${href}`);
    else targets.push(target);
  }
  links.set(file, targets);
  // Old architecture reports retain their original source-path and command examples.
  if (/历史材料：/.test(source)) continue;
  for (const match of prose.matchAll(/`((?:src|src-tauri|tests|scripts|server)\/[^`\s<>*]+)`/g)) {
    const path = match[1].replace(/:\d+$/, '');
    checkedPaths++;
    if (!existsSync(resolve(root, path))) errors.push(`${label}: missing code reference ${path}`);
  }
  for (const match of source.matchAll(/npm run ([a-zA-Z0-9:_-]+)/g)) {
    checkedCommands++;
    if (!(match[1] in scripts)) errors.push(`${label}: unknown npm script ${match[1]}`);
  }
}
const reached = new Set();
function visit(file) {
  if (reached.has(file)) return;
  reached.add(file);
  for (const target of links.get(file) || []) if (links.has(target)) visit(target);
}
visit(resolve(root, 'docs/README.md'));
for (const file of files.filter(file => file.startsWith(resolve(root, 'docs') + sep))) {
  if (!reached.has(file)) errors.push(`${relative(root, file)}: not reachable from docs/README.md`);
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Documentation check passed: ${files.length} Markdown files; ${checkedLinks} local links, ${checkedPaths} code references, ${checkedCommands} npm commands; all docs reachable from the index.`);
  console.log('External URLs, heading anchors, technical correctness and application acceptance are outside this check.');
}
