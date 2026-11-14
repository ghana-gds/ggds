#!/usr/bin/env node
// ggds-themes: make or check a GGDS institution theme from the command line, without writing any code.
//
//   npx @ggds/themes '#006e35'                         the theme as CSS, for the whole site
//   npx @ggds/themes '#006e35' --out css/theme.css     ...written to a file
//   npx @ggds/themes '#006e35' --name "Ghana Digital Centres" --slug gdcl   scoped to data-ggds-theme="gdcl"
//   npx @ggds/themes '#006e35' --format tokens         design tokens (DTCG) for Figma or Tokens Studio
//   npx @ggds/themes check '#7fb3d5'                   does a colour pass? If not, the nearest shade that does
//   npx @ggds/themes nca                               a ready-made theme, by name
//   npx @ggds/themes list                              the ready-made themes
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { normaliseHex } from '@ggds/tokens/color.mjs';
import { checkInstitutionColour, institutionCss, institutionTokens } from '@ggds/tokens/institution.mjs';
import { DEFAULT_THEME, themes } from './index.mjs';

const HELP = `ggds-themes: make or check a GGDS institution theme.

Usage
  ggds-themes <colour | theme> [options]   print the theme (CSS by default)
  ggds-themes check <colour>               check a colour, and suggest a shade that passes
  ggds-themes list                         list the ready-made themes

<colour> is #rrggbb (quote it in the shell: '#006e35'). <theme> is a ready-made theme's name, such as nca.

Options
  --format css|tokens|json   css (default), tokens (W3C design tokens, for Figma), json (the colours and checks)
  --slug <name>              scope the CSS to elements marked data-ggds-theme="<name>" instead of the whole page
  --name <text>              the institution's name, for the comment in the file
  --out <file>               write to a file instead of printing
  -h, --help                 this help

A theme changes the institution colour only: the header line and name, the hero, the footer and its card in a
list. Load the CSS after ggds.css, as a stylesheet (never an inline style).`;

const fail = (message, code = 1) => {
  process.stderr.write(`${message}\n`);
  process.exit(code);
};

let parsed;
try {
  parsed = parseArgs({
    allowPositionals: true,
    options: {
      format: { type: 'string', default: 'css' },
      slug: { type: 'string' },
      name: { type: 'string' },
      out: { type: 'string' },
      help: { type: 'boolean', short: 'h' },
    },
  });
} catch (e) {
  fail(`${e.message}\n\n${HELP}`, 2);
}
const { values: opts, positionals } = parsed;
if (opts.help || positionals.length === 0) {
  process.stdout.write(`${HELP}\n`);
  process.exit(opts.help ? 0 : 2);
}
if (!['css', 'tokens', 'json'].includes(opts.format)) fail(`--format must be css, tokens or json, not "${opts.format}"`, 2);

const [command, ...rest] = positionals;

// For a colour that fails, the deep-shade checks describe the suggestion, so only the check it failed is shown.
function report(c) {
  const shown = c.ok ? c.checks : c.checks.filter((k) => !k.pass);
  return shown.map((k) => `  ${k.pass ? 'pass' : 'FAIL'}  ${k.ratio.toFixed(2)}:1 (needs ${k.min}:1)  ${k.label}`).join('\n');
}

if (command === 'list') {
  const width = Math.max(...themes.map((t) => t.slug.length));
  for (const t of themes) process.stdout.write(`${t.slug.padEnd(width)}  ${t.accent}  ${t.name}${t.slug === DEFAULT_THEME ? ' (default)' : ''}\n`);
  process.exit(0);
}

if (command === 'check') {
  const input = rest[0];
  const hex = normaliseHex(input);
  if (!hex) fail(`"${input ?? ''}" is not a colour: use #rrggbb, such as '#006e35'`, 2);
  const c = checkInstitutionColour(hex);
  if (c.ok) {
    process.stdout.write(`${hex} can be an institution colour. Deep shade for the hero and footer: ${c.deep}\n${report(c)}\n`);
    process.exit(0);
  }
  process.stdout.write(`${hex} is too light to be an institution colour.\n${report(c)}\n\nThe nearest shade that passes, with the same hue: ${c.suggestion}\n  npx @ggds/themes '${c.suggestion}'\n`);
  process.exit(1);
}

// A ready-made theme by name, or a colour.
const known = themes.find((t) => t.slug === command);
const hex = known ? known.color : normaliseHex(command);
if (!hex) fail(`"${command}" is neither a colour (#rrggbb) nor a ready-made theme. Run "ggds-themes list" for the themes.`, 2);
const c = checkInstitutionColour(hex);
if (!c.ok) fail(`${hex} is too light to be an institution colour.\n${report(c)}\n\nThe nearest shade that passes, with the same hue: ${c.suggestion}\n  npx @ggds/themes '${c.suggestion}'`);

const name = opts.name ?? (known ? `${known.name} (${known.shortName})` : undefined);
let output;
try {
  if (opts.format === 'css') output = `/* GGDS institution theme. Load after ggds.css. Made with @ggds/themes. */\n${institutionCss(hex, { slug: opts.slug, name })}`;
  else if (opts.format === 'tokens') output = `${JSON.stringify(institutionTokens(hex, { name }), null, 2)}\n`;
  else output = `${JSON.stringify({ name: name ?? null, slug: opts.slug ?? known?.slug ?? null, color: hex, accent: c.accent, deep: c.deep, checks: c.checks }, null, 2)}\n`;
} catch (e) {
  fail(e.message, 2);
}

if (opts.out) {
  writeFileSync(resolve(opts.out), output);
  process.stderr.write(`Wrote ${opts.out} (${hex}, deep shade ${c.deep})\n`);
} else {
  process.stdout.write(output);
}
