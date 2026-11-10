// Code blocks in the documentation: each <pre class="docs-code"> gets a bar naming its language (where docs.js puts
// the Copy button) and syntax colours, added when the site is built: no script, no library, nothing to download.
// The colours are classes (tk-*), so the pages keep their strict Content Security Policy. Every colour has at least
// 4.5:1 contrast on the code background (tests/unit/site.test.mjs checks). HTML snippets also get a JSX version
// (docs/jsx.mjs) for React; docs.js turns the two into an HTML / JSX switch that remembers the reader's choice.
import { convertible, toJsx } from './jsx.mjs';

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const unesc = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const tk = (cls, text) => (text ? `<span class="tk-${cls}">${esc(text)}</span>` : '');

/** Splits text with a list of [class, regex] rules; text no rule matches stays plain. */
function lex(text, rules) {
  const re = new RegExp(rules.map(([, r]) => `(${r.source})`).join('|'), 'gm');
  let out = '';
  let last = 0;
  for (const m of text.matchAll(re)) {
    if (m[0] === '') { re.lastIndex++; continue; }
    out += esc(text.slice(last, m.index));
    const i = m.slice(1).findIndex((g) => g !== undefined);
    const cls = rules[i][0];
    out += typeof cls === 'function' ? cls(m[0]) : tk(cls, m[0]);
    last = m.index + m[0].length;
  }
  return out + esc(text.slice(last));
}

const STRING = /"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`/;

/** One HTML tag: its name, attribute names, values and punctuation. */
function tag(text) {
  const m = text.match(/^(<\/?)([^\s/>]+)([\s\S]*?)(\/?>)$/);
  if (!m) return esc(text);
  const attrs = lex(m[3], [
    ['str', /"[^"]*"|'[^']*'/],
    ['tpl', /\{%[\s\S]*?%\}|\{\{[\s\S]*?\}\}/],
    ['attr', /[^\s="'{}]+(?==)|(?<=\s)[^\s="'/>{}]+/],
    ['punct', /=/],
  ]);
  return `${tk('punct', m[1])}${tk('tag', m[2])}${attrs}${tk('punct', m[4])}`;
}

const LANG = {
  html: (t) => lex(t, [
    ['comment', /<!--[\s\S]*?-->/],
    ['tpl', /\{%[\s\S]*?%\}|\{\{[\s\S]*?\}\}/],
    ['doctype', /<!doctype[^>]*>/i],
    [tag, /<\/?[a-zA-Z][^<>]*>/],
    ['comment', /(?<=^|\n)\s*…[^\n]*/],
  ]),
  css: (t) => lex(t, [
    ['comment', /\/\*[\s\S]*?\*\//],
    ['str', STRING],
    ['kw', /@[\w-]+/],
    ['attr', /--[\w-]+|(?<=[{;\s])[a-z-]+(?=\s*:)/],
    ['num', /#[0-9a-fA-F]{3,8}\b|-?\d*\.?\d+(?:px|rem|em|%|ch|vw|vh|s|ms)?/],
    ['tag', /[^{}\s;][^{};/]*(?=\s*\{)/],
  ]),
  js: (t) => lex(t, [
    ['comment', /\/\/[^\n]*|\/\*[\s\S]*?\*\//],
    ['str', STRING],
    ['kw', /\b(?:import|from|export|default|const|let|var|function|return|if|else|for|of|in|new|await|async|true|false|null|undefined|typeof|throw|try|catch)\b/],
    ['num', /\b\d+(?:\.\d+)?\b/],
    ['fn', /\b[A-Za-z_$][\w$]*(?=\()/],
  ]),
  jsx: (t) => lex(t, [
    ['comment', /\{\/\*[\s\S]*?\*\/\}/],
    ['tpl', /\{[^{}\n]*\}/],
    ['punct', /<>|<\/>/],
    [tag, /<\/?[a-zA-Z][^<>]*>/],
  ]),
  python: (t) => lex(t, [
    ['comment', /#[^\n]*/],
    ['str', STRING],
    ['kw', /\b(?:import|from|def|return|class|if|else|for|in|True|False|None|with|as)\b/],
    ['attr', /^[A-Z_][A-Z0-9_]*(?=\s*=)/],
    ['num', /\b\d+(?:\.\d+)?\b/],
  ]),
  shell: (t) => lex(t, [
    ['comment', /#[^\n]*/],
    ['str', STRING],
    ['fn', /^\s*[\w.-]+(?=\s|$)/],
    ['attr', /(?<=\s)--?[\w-]+/],
  ]),
  // Astro: the frontmatter between --- lines is JavaScript, the rest HTML.
  astro: (t) => {
    const m = t.match(/^(---\n)([\s\S]*?\n)(---\n?)([\s\S]*)$/);
    return m ? `${tk('punct', m[1])}${LANG.js(m[2])}${tk('punct', m[3])}${LANG.html(m[4])}` : LANG.html(t);
  },
};
const NAMES = { jsx: 'JSX (React)', tsx: 'TSX (React)', jsxfile: 'JSX (React)', ts: 'TypeScript', vue: 'Vue', svelte: 'Svelte', json: 'JSON', html: 'HTML', django: 'Django template', css: 'CSS', js: 'JavaScript', python: 'Python', shell: 'Terminal', astro: 'Astro', text: 'Text' };

/** Which language a block is in, from its text. */
export function detect(code) {
  const t = code.trim();
  if (/^---\n/.test(t)) return 'astro';
  if (/^(?:npm|npx|pnpm|pip|uv|cd|git|python|node)\b/m.test(t) && !/[<{]/.test(t.split('\n')[0])) return 'shell';
  if (/^(?:INSTALLED_APPS|FORM_RENDERER|[A-Z_]+\s*=|from\s+\w+(?:\.\w+)*\s+import|def\s)/m.test(t)) return 'python';
  if (/^\s*(?:<|\{%|\{\{)/.test(t)) return /\{%|\{\{/.test(t) ? 'django' : 'html';
  if (/^(?:import|export|const|let|function)\b|=>|\b(?:element|document|window)\./m.test(t)) return 'js';
  if (/^\s*(?:@import|@layer|@media|:root|[.#a-z*][^{\n]*\{)|\/\*/m.test(t) || /^[.#][\w-]/.test(t)) return 'css';
  return 'text';
}

/** Highlights one block's code; returns the HTML and the language's name. */
const SAME_AS = { django: 'html', vue: 'html', svelte: 'html', tsx: 'js', jsxfile: 'js', ts: 'js', json: 'js' };
export function highlight(code, lang = detect(code)) {
  const run = LANG[SAME_AS[lang] ?? lang];
  return { html: run ? run(code) : esc(code), name: NAMES[lang] };
}

/** Every docs-code block in a page: the language bar and the colours. */
export function highlightCode(page) {
  return page.replace(/<pre class="docs-code"([^>]*)><code>([\s\S]*?)<\/code><\/pre>/g, (_, attrs, inner) => {
    const code = unesc(inner);
    // A file name in the block's label says the language best: "app/layout.tsx", "src/routes/+layout.svelte".
    const ext = attrs.match(/aria-label="[^"]*?\.(tsx|jsx|ts|js|mjs|vue|svelte|json|css|py)\b/)?.[1];
    const lang = ext ? ({ tsx: 'tsx', jsx: 'jsxfile', ts: 'ts', js: 'js', mjs: 'js', vue: 'vue', svelte: 'svelte', json: 'json', css: 'css', py: 'python' })[ext] : detect(code);
    const { html, name } = highlight(code, lang);
    const pane = (l, n, h, a) => `<div class="docs-codeblock__bar" data-lang="${l}"><span class="docs-codeblock__lang">${n}</span></div><pre class="docs-code"${a}><code>${h}</code></pre>`;
    if (lang !== 'html' || !convertible(code)) return `<div class="docs-codeblock">${pane(lang, name, html, attrs)}</div>`;
    const jsxAttrs = attrs.replace(/aria-label="([^"]*)"/, (__, l) => `aria-label="${l}, as JSX"`);
    return `<div class="docs-codeblock docs-codeblock--switch">${pane('html', name, html, attrs)}${pane('jsx', NAMES.jsx, LANG.jsx(toJsx(code)), jsxAttrs)}</div>`;
  });
}

/** The colours, for the contrast test: class → colour, and the background. */
export const CODE_COLOURS = {
  background: '#0f1e2e',
  text: '#e6edf3',
  tag: '#7ee0a3',
  attr: '#ffd866',
  str: '#a5d6ff',
  kw: '#ff9d9d',
  fn: '#c6b6ff',
  num: '#f7b37a',
  comment: '#9fb0c2',
  punct: '#a8b9cb',
  tpl: '#ffb86b',
  doctype: '#9fb0c2',
  lang: '#c8d4e0',
};
