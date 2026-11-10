// Builds @ggds/icons from src/<name>.svg (the drawings) and catalogue.json (each icon's category and keywords).
// It checks every drawing against the GGDS icon rules first and stops with the reason if one breaks them:
//
//   dist/svg/<name>.svg   each icon as a standalone, minified SVG file (for <img>, design tools and CMSs)
//   dist/sprite.svg       every icon as a <symbol id="<name>">, for <svg><use href="sprite.svg#<name>"/></svg>
//   dist/index.js         one named export per icon (arrowRight, ...) and svg(): bundlers keep only what is used
//   dist/all.js           ICONS (every icon by name) and icon(name, class), for templates that pick icons by name
//   dist/icons.json       { name: inner SVG }, for Python, PHP and anything else
//   dist/catalogue.json   categories and search keywords
//   dist/ggds-icons.svg   every icon on one labelled sheet, named layers, to import into Figma or another design tool
//
// No dependencies.
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, 'src');
const dist = join(here, 'dist');
const { version } = JSON.parse(readFileSync(join(here, 'package.json'), 'utf8'));

// The rules. Every source file starts with exactly this element, so it opens the same in a browser, an editor and
// a design tool, and the drawing inherits its colour from the text around it.
export const SVG_OPEN = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">';
const ATTRS = {
  path: ['d'],
  circle: ['cx', 'cy', 'r'],
  ellipse: ['cx', 'cy', 'rx', 'ry'],
  rect: ['x', 'y', 'width', 'height', 'rx'],
  line: ['x1', 'y1', 'x2', 'y2'],
  polyline: ['points'],
  polygon: ['points'],
};
const MIN = 1; // a 2px stroke centred on 1 just touches the edge of the 24px box; nothing may go further
const MAX = 23;
const NAME = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

const num = /-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?/gi;

/** Points that bound one path (end points, control points, and arcs sampled along their curve). */
function pathPoints(d) {
  const tokens = d.match(/[a-zA-Z]|-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?/g) ?? [];
  const pts = [];
  let i = 0;
  let cmd = '';
  let x = 0;
  let y = 0;
  let sx = 0;
  let sy = 0;
  const n = () => Number(tokens[i++]);
  const flag = () => {
    // Arc flags may be written without separators ("0 1 0" or "010"); split a run of digits into single flags.
    const t = tokens[i];
    if (t.length > 1 && /^[01]/.test(t)) { tokens[i] = t.slice(1); return Number(t[0]); }
    i++;
    return Number(t);
  };
  while (i < tokens.length) {
    if (/[a-zA-Z]/.test(tokens[i])) cmd = tokens[i++];
    const rel = cmd === cmd.toLowerCase();
    const ox = rel ? x : 0;
    const oy = rel ? y : 0;
    switch (cmd.toUpperCase()) {
      case 'M': x = ox + n(); y = oy + n(); [sx, sy] = [x, y]; pts.push([x, y]); cmd = rel ? 'l' : 'L'; break;
      case 'L': case 'T': x = ox + n(); y = oy + n(); pts.push([x, y]); break;
      case 'H': x = ox + n(); pts.push([x, y]); break;
      case 'V': y = oy + n(); pts.push([x, y]); break;
      case 'C': pts.push([ox + n(), oy + n()], [ox + n(), oy + n()]); x = ox + n(); y = oy + n(); pts.push([x, y]); break;
      case 'S': case 'Q': pts.push([ox + n(), oy + n()]); x = ox + n(); y = oy + n(); pts.push([x, y]); break;
      case 'A': {
        const rx = Math.abs(n()); const ry = Math.abs(n()); const rot = n() * Math.PI / 180; const large = flag(); const sweep = flag();
        const x2 = ox + n(); const y2 = oy + n();
        pts.push(...arcPoints(x, y, rx, ry, rot, large, sweep, x2, y2));
        [x, y] = [x2, y2];
        break;
      }
      case 'Z': [x, y] = [sx, sy]; break;
      default: throw new Error(`unknown path command "${cmd}"`);
    }
  }
  return pts;
}

/** Points along an SVG arc (endpoint parameterisation, SVG 1.1 appendix F.6). */
function arcPoints(x1, y1, rx, ry, phi, fa, fs, x2, y2) {
  if (!rx || !ry) return [[x2, y2]];
  const cos = Math.cos(phi); const sin = Math.sin(phi);
  const dx = (x1 - x2) / 2; const dy = (y1 - y2) / 2;
  const x1p = cos * dx + sin * dy; const y1p = -sin * dx + cos * dy;
  const lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
  if (lambda > 1) { rx *= Math.sqrt(lambda); ry *= Math.sqrt(lambda); }
  const num2 = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p;
  const coef = (fa === fs ? -1 : 1) * Math.sqrt(Math.max(0, num2 / (rx * rx * y1p * y1p + ry * ry * x1p * x1p)));
  const cxp = coef * (rx * y1p) / ry; const cyp = coef * -(ry * x1p) / rx;
  const cx = cos * cxp - sin * cyp + (x1 + x2) / 2; const cy = sin * cxp + cos * cyp + (y1 + y2) / 2;
  const ang = (ux, uy, vx, vy) => Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
  const t1 = ang(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
  let dt = ang((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry);
  if (!fs && dt > 0) dt -= 2 * Math.PI;
  if (fs && dt < 0) dt += 2 * Math.PI;
  const out = [];
  for (let k = 0; k <= 32; k++) {
    const t = t1 + (dt * k) / 32;
    out.push([cx + rx * Math.cos(t) * cos - ry * Math.sin(t) * sin, cy + rx * Math.cos(t) * sin + ry * Math.sin(t) * cos]);
  }
  return out;
}

/** The points that bound one element. */
function elementPoints(tag, a) {
  const v = (k) => Number(a[k]);
  switch (tag) {
    case 'path': return pathPoints(a.d);
    case 'circle': return [[v('cx') - v('r'), v('cy') - v('r')], [v('cx') + v('r'), v('cy') + v('r')]];
    case 'ellipse': return [[v('cx') - v('rx'), v('cy') - v('ry')], [v('cx') + v('rx'), v('cy') + v('ry')]];
    case 'rect': return [[v('x'), v('y')], [v('x') + v('width'), v('y') + v('height')]];
    case 'line': return [[v('x1'), v('y1')], [v('x2'), v('y2')]];
    default: { const p = a.points.match(num).map(Number); return p.flatMap((_, k) => (k % 2 ? [] : [[p[k], p[k + 1]]])); }
  }
}

/** Checks one source file against the rules; returns its minified inner SVG. */
export function compile(name, text) {
  const fail = (why) => { throw new Error(`packages/icons/src/${name}.svg: ${why}`); };
  if (!NAME.test(name)) fail('the file name must be lower-case words joined by hyphens, such as arrow-right');
  const t = text.trim();
  if (!t.startsWith(SVG_OPEN)) fail(`it must start with exactly:\n  ${SVG_OPEN}`);
  if (!t.endsWith('</svg>')) fail('it must end with </svg>');
  const inner = t.slice(SVG_OPEN.length, -'</svg>'.length).trim();
  if (/<!--/.test(inner)) fail('remove comments');
  const els = [];
  const rest = inner.replace(/<([a-z]+)((?:\s+[a-z0-9-]+="[^"]*")*)\s*\/>/g, (_, tag, attrs) => {
    if (!ATTRS[tag]) fail(`<${tag}> is not allowed: use path, circle, ellipse, rect, line, polyline or polygon`);
    const a = {};
    for (const [, k, val] of attrs.matchAll(/([a-z0-9-]+)="([^"]*)"/g)) {
      if (!ATTRS[tag].includes(k)) fail(`<${tag} ${k}> is not allowed: colour, stroke, fill, transform and style come from the <svg> element, so every icon looks the same`);
      for (const m of val.match(num) ?? []) if ((m.split('.')[1]?.replace(/e.*/i, '') ?? '').length > 2) fail(`${m}: use at most 2 decimal places`);
      a[k] = val;
    }
    for (const k of ATTRS[tag]) if (k !== 'rx' && a[k] === undefined) fail(`<${tag}> needs ${k}`);
    els.push({ tag, attrs: attrs.trim().replace(/\s+/g, ' '), a });
    return '';
  });
  if (rest.trim()) fail(`unexpected content: ${rest.trim().slice(0, 60)}`);
  if (!els.length) fail('it draws nothing');
  for (const e of els) {
    for (const [px, py] of elementPoints(e.tag, e.a)) {
      if (!(px >= MIN - 0.01 && px <= MAX + 0.01 && py >= MIN - 0.01 && py <= MAX + 0.01)) {
        fail(`<${e.tag}> reaches ${px.toFixed(2)},${py.toFixed(2)}: keep the drawing between ${MIN} and ${MAX} so the 2px stroke is not cut off (2 to 22 is best)`);
      }
    }
  }
  // Minify: one line, and no leading zeros in numbers ("0.5" → ".5").
  return els.map((e) => `<${e.tag} ${e.attrs.replace(/(^|[\s,a-zA-Z"-])0\.(\d)/g, '$1.$2')}/>`).join('');
}

const camel = (name) => name.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
const RESERVED = new Set(['delete', 'new', 'default', 'function', 'class', 'import', 'export', 'switch', 'case', 'in', 'do', 'if', 'for', 'var', 'let', 'const', 'return', 'this', 'void', 'with', 'yield', 'svg']);

export function build() {
  const catalogue = JSON.parse(readFileSync(join(here, 'catalogue.json'), 'utf8'));
  const files = readdirSync(src).filter((f) => f.endsWith('.svg')).map((f) => f.slice(0, -4)).sort();
  const listed = catalogue.categories.flatMap((c) => Object.keys(c.icons));
  const dupes = listed.filter((n, k) => listed.indexOf(n) !== k);
  if (dupes.length) throw new Error(`catalogue.json lists ${dupes.join(', ')} more than once`);
  const unlisted = files.filter((f) => !listed.includes(f));
  const missing = listed.filter((n) => !files.includes(n));
  if (unlisted.length) throw new Error(`add ${unlisted.join(', ')} to a category in packages/icons/catalogue.json, with search keywords`);
  if (missing.length) throw new Error(`catalogue.json lists ${missing.join(', ')}, but packages/icons/src has no such file`);
  for (const n of files) if (RESERVED.has(camel(n))) throw new Error(`${n}: the name is a JavaScript keyword; choose another`);

  const icons = Object.fromEntries(listed.sort().map((n) => [n, compile(n, readFileSync(join(src, `${n}.svg`), 'utf8'))]));
  const names = Object.keys(icons);
  const banner = `/*! @ggds/icons ${version} | Apache-2.0 | https://github.com/ghana-gds/ggds */\n`;
  const head = SVG_OPEN.replace(' width="24" height="24"', '');
  const attrs = head.slice('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"'.length, -1); // fill … linejoin

  rmSync(dist, { recursive: true, force: true });
  mkdirSync(join(dist, 'svg'), { recursive: true });
  for (const n of names) writeFileSync(join(dist, 'svg', `${n}.svg`), `${SVG_OPEN}${icons[n]}</svg>\n`);

  writeFileSync(join(dist, 'sprite.svg'), `<svg xmlns="http://www.w3.org/2000/svg">${names.map((n) => `<symbol id="${n}" viewBox="0 0 24 24"${attrs}>${icons[n]}</symbol>`).join('')}</svg>\n`);

  const helper = `const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

/**
 * An icon as SVG markup. body: one of this package's exports. options.class: its class (ggds-icon by default).
 * Without options.label the icon is hidden from screen readers, as it should be next to words that say the same.
 * With options.label (only for an icon with no words beside it) it is announced as an image with that name.
 */
export function svg(body, options = {}) {
  const cls = options.class ?? 'ggds-icon';
  const a11y = options.label ? \`role="img" aria-label="\${esc(options.label)}"\` : 'aria-hidden="true" focusable="false"';
  return \`<svg class="\${esc(cls)}" viewBox="0 0 24 24"${attrs} \${a11y}>\${body}</svg>\`;
}
`;
  writeFileSync(join(dist, 'index.js'), `${banner}// Generated by packages/icons/build.mjs. Edit the drawings in packages/icons/src instead.\n${names.map((n) => `export const ${camel(n)} = '${icons[n]}';`).join('\n')}\n\n${helper}`);
  writeFileSync(join(dist, 'index.d.ts'), `${banner}${names.map((n) => `/** The ${n} icon's inner SVG. */\nexport declare const ${camel(n)}: string;`).join('\n')}

export interface SvgOptions {
  /** The class on the <svg> element. Default: "ggds-icon". */
  class?: string;
  /** Only for an icon with no words beside it: what it means, read out by screen readers. */
  label?: string;
}
/** An icon as SVG markup, from one of this package's exports. */
export declare function svg(body: string, options?: SvgOptions): string;
`);

  writeFileSync(join(dist, 'all.js'), `${banner}// Every icon, by name. For templates that choose icons by name; elsewhere import single icons from "@ggds/icons".
import * as all from './index.js';

/** Every icon's inner SVG, by name. */
export const ICONS = {
${names.map((n) => `  '${n}': all.${camel(n)},`).join('\n')}
};

/** Every icon's name. */
export const NAMES = Object.keys(ICONS);

/** An icon by name, as SVG markup, hidden from screen readers. cls: its class. An unknown name throws. */
export function icon(name, cls = 'ggds-icon') {
  if (!(name in ICONS)) throw new Error(\`@ggds/icons: there is no icon called "\${name}"\`);
  return all.svg(ICONS[name], { class: cls });
}
`);
  writeFileSync(join(dist, 'all.d.ts'), `${banner}export type IconName =\n${names.map((n) => `  | '${n}'`).join('\n')};
/** Every icon's inner SVG, by name. */
export declare const ICONS: Record<IconName, string>;
/** Every icon's name. */
export declare const NAMES: IconName[];
/** An icon by name, as SVG markup, hidden from screen readers. */
export declare function icon(name: IconName, cls?: string): string;
`);

  writeFileSync(join(dist, 'icons.json'), `${JSON.stringify(icons, null, 1)}\n`);
  writeFileSync(join(dist, 'catalogue.json'), `${JSON.stringify({ version, ...catalogue }, null, 2)}\n`);

  // The design sheet: each icon in its own named group on a 24px frame, categories in rows, labelled.
  const cell = 48;
  const cols = 12;
  let y = 0;
  const parts = [];
  for (const c of catalogue.categories) {
    parts.push(`<text x="0" y="${y + 16}" font-family="sans-serif" font-size="14" font-weight="700" fill="#1b1b1b">${c.name}</text>`);
    y += 28;
    const list = Object.keys(c.icons);
    list.forEach((n, k) => {
      const gx = (k % cols) * cell * 2;
      const gy = y + Math.floor(k / cols) * cell * 1.5;
      parts.push(`<g id="${n}" transform="translate(${gx} ${gy})"${attrs.replace('currentColor', '#1b1b1b')}><rect width="24" height="24" fill="none" stroke="none"/>${icons[n]}</g>`
        + `<text x="${gx}" y="${gy + 40}" font-family="sans-serif" font-size="9" fill="#555">${n}</text>`);
    });
    y += Math.ceil(list.length / cols) * cell * 1.5 + 16;
  }
  writeFileSync(join(dist, 'ggds-icons.svg'), `<svg xmlns="http://www.w3.org/2000/svg" width="${cols * cell * 2}" height="${y}" viewBox="0 0 ${cols * cell * 2} ${y}"><rect width="100%" height="100%" fill="#fff"/>${parts.join('')}</svg>\n`);

  const avg = Math.round(names.reduce((s, n) => s + icons[n].length, 0) / names.length);
  const sprite = readFileSync(join(dist, 'sprite.svg'));
  console.log(`icons: ${names.length} icons in ${catalogue.categories.length} categories → ${dist} (${avg} bytes each on average; sprite ${(gzipSync(sprite).length / 1024).toFixed(1)} KB gzipped)`);
  return icons;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) build();
