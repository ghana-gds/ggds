// Draws the README's pictures (.github/assets/*.svg) from GGDS itself: its own icons (@ggds/icons), the institution
// colours (@ggds/themes), the number of components, patterns and icons, and the real size of the built files. Run
// after pnpm run build, whenever those change:
//
//   pnpm run readme:art
//
// Every picture is a plain SVG with its own background, so it reads the same in GitHub's light and dark modes. The
// banner's badges float once and stop, and not at all for people who ask for less motion.
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { ICONS } from '../packages/icons/dist/all.js';
import { STACK_LOGOS } from '../docs/stack-logos.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const out = join(root, '.github', 'assets');
mkdirSync(out, { recursive: true });

const { version } = JSON.parse(readFileSync(join(root, 'packages', 'css', 'package.json'), 'utf8'));
const themes = JSON.parse(readFileSync(join(root, 'packages', 'themes', 'dist', 'themes.json'), 'utf8'));
const THEMES = Array.isArray(themes) ? themes : themes.themes ?? Object.values(themes);
const count = (dir) => readdirSync(join(root, 'packages', 'html', dir), { withFileTypes: true }).filter((d) => d.isDirectory()).length;
const components = count('components');
const patterns = count('patterns');
const icons = Object.keys(ICONS).length;
const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;
const cssGz = gzipSync(readFileSync(join(root, 'packages', 'css', 'dist', 'ggds.min.css'))).length;
const jsGz = gzipSync(Buffer.concat(readdirSync(join(root, 'packages', 'js', 'dist')).filter((f) => f.endsWith('.js')).map((f) => readFileSync(join(root, 'packages', 'js', 'dist', f))))).length;

const FONT = `font-family="Inter, 'Segoe UI', -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif"`;
const RED = '#ce1126';
const GOLD = '#fcd116';
const GREEN = '#006b3f';
const NAVY = '#062a44';
const BLUE = '#005f8f';
/** A GGDS icon at (x, y), size s, in colour c. */
const icon = (name, x, y, s, c, w = 2) => `<g transform="translate(${x} ${y}) scale(${s / 24})" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</g>`;
const flag = (w, h = 6, y = 0) => `<rect y="${y}" width="${w / 3}" height="${h}" fill="${RED}"/><rect x="${w / 3}" y="${y}" width="${w / 3}" height="${h}" fill="${GOLD}"/><rect x="${(2 * w) / 3}" y="${y}" width="${w / 3}" height="${h}" fill="${GREEN}"/>`;
const write = (name, svg) => { writeFileSync(join(out, name), `${svg.trim()}\n`); console.log(`  .github/assets/${name}`); };

// ---------------------------------------------------------------------------------------------------------------
// The banner: the name, and a government website on a computer and a phone, built from GGDS parts.
// Position on the outer group, animation on the inner one: a CSS transform would replace the SVG one.
const chip = (x, y, iconName, text, w, delay) => `<g transform="translate(${x} ${y})"><g class="float" style="animation-delay:${delay}s">
    <rect width="${w}" height="44" rx="22" fill="#ffffff" fill-opacity=".12" stroke="#ffffff" stroke-opacity=".35"/>
    ${icon(iconName, 14, 11, 22, GOLD)}
    <text x="46" y="28.5" fill="#ffffff" font-size="16" font-weight="700" ${FONT}>${text}</text>
  </g></g>`;
write('banner.svg', `
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="440" viewBox="0 0 1280 440" role="img" aria-labelledby="t d">
  <title id="t">GGDS: Ghana Government Design System</title>
  <desc id="d">Build government services people trust, on any phone, for everyone. A government website on a computer and a phone, built from GGDS parts.</desc>
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${NAVY}"/><stop offset="1" stop-color="${BLUE}"/></linearGradient>
    <pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.2" fill="#ffffff" fill-opacity=".08"/></pattern>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="14" stdDeviation="16" flood-color="#000" flood-opacity=".35"/></filter>
    <clipPath id="screen"><rect x="0" y="0" width="430" height="290" rx="12"/></clipPath>
    <clipPath id="phone"><rect x="0" y="0" width="128" height="250" rx="18"/></clipPath>
    <clipPath id="round"><rect width="1280" height="440" rx="20"/></clipPath>
  </defs>
  <style>
    @media (prefers-reduced-motion: no-preference) {
      .float { animation: float 3.2s ease-in-out 2; }
      .rise { animation: rise .9s cubic-bezier(.2,.8,.2,1) both; }
    }
    @keyframes float { 50% { transform: translateY(-8px); } }
    @keyframes rise { from { opacity: 0; transform: translateY(18px); } }
  </style>
  <g clip-path="url(#round)">
  <rect width="1280" height="440" rx="20" fill="url(#bg)"/>
  <rect width="1280" height="440" rx="20" fill="url(#dots)"/>
  ${flag(1280, 8)}

  <g ${FONT}>
    <g transform="translate(64 78)">
      <rect width="232" height="34" rx="17" fill="#ffffff" fill-opacity=".14"/>
      <circle cx="20" cy="17" r="5" fill="${GOLD}"/>
      <text x="34" y="22.5" fill="#ffffff" font-size="15" font-weight="700">Open source · Version ${version}</text>
    </g>
    <text x="60" y="226" fill="#ffffff" font-size="132" font-weight="800" letter-spacing="-4">GGDS</text>
    <text x="64" y="274" fill="#ffffff" font-size="32" font-weight="700">Ghana Government Design System</text>
    <text x="64" y="318" fill="#d6e6f2" font-size="21">Build government services people trust:</text>
    <text x="64" y="348" fill="#d6e6f2" font-size="21">on any phone, any connection, for everyone.</text>
    <g transform="translate(64 380)">
      <rect width="8" height="8" y="-7" fill="${RED}"/><rect x="10" width="8" height="8" y="-7" fill="${GOLD}"/><rect x="20" width="8" height="8" y="-7" fill="${GREEN}"/>
      <text x="40" y="1" fill="#a9c6dc" font-size="15" font-weight="600">For ministries, departments and agencies · Maintained by NITA</text>
    </g>
  </g>

  <g transform="translate(680 64)"><g class="rise" filter="url(#shadow)">
    <g clip-path="url(#screen)">
      <rect width="430" height="290" fill="#ffffff"/>
      <rect width="430" height="22" fill="#eef2f6"/>
      <circle cx="14" cy="11" r="4" fill="#f2675f"/><circle cx="28" cy="11" r="4" fill="#f7c04a"/><circle cx="42" cy="11" r="4" fill="#5ac05a"/>
      <rect x="64" y="6" width="220" height="10" rx="5" fill="#ffffff"/>
      ${flag(430, 4, 22)}
      <rect y="26" width="430" height="34" fill="#ffffff"/>
      <circle cx="22" cy="43" r="10" fill="${BLUE}"/>
      <rect x="38" y="36" width="88" height="7" rx="3.5" fill="${BLUE}"/><rect x="38" y="47" width="54" height="5" rx="2.5" fill="#c3ccd6"/>
      <rect x="250" y="40" width="34" height="6" rx="3" fill="#4b5563"/><rect x="292" y="40" width="34" height="6" rx="3" fill="#4b5563"/><rect x="334" y="40" width="34" height="6" rx="3" fill="#4b5563"/>
      ${icon('search', 396, 33, 18, BLUE)}
      <rect y="60" width="430" height="3" fill="${BLUE}"/>
      <rect y="63" width="430" height="104" fill="${BLUE}"/>
      <rect x="22" y="80" width="150" height="7" rx="3.5" fill="${GOLD}"/>
      <rect x="22" y="96" width="230" height="14" rx="5" fill="#ffffff"/>
      <rect x="22" y="122" width="210" height="24" rx="6" fill="#ffffff"/><rect x="232" y="122" width="44" height="24" rx="6" fill="${GOLD}"/>
      ${[0, 1, 2].map((i) => `<rect x="${22 + i * 136}" y="182" width="124" height="88" rx="8" fill="#ffffff" stroke="#dbe2ea" stroke-width="1.5"/>
      <circle cx="${44 + i * 136}" cy="204" r="12" fill="#e5f0f7"/>${icon(['certificate', 'cedi', 'calendar'][i], 35 + i * 136, 195, 18, BLUE)}
      <rect x="${34 + i * 136}" y="226" width="80" height="6" rx="3" fill="${BLUE}"/><rect x="${34 + i * 136}" y="240" width="96" height="4" rx="2" fill="#c3ccd6"/><rect x="${34 + i * 136}" y="250" width="70" height="4" rx="2" fill="#c3ccd6"/>`).join('')}
    </g>
  </g></g>

  <g transform="translate(1100 160)"><g class="rise" style="animation-delay:.25s" filter="url(#shadow)">
    <rect x="-8" y="-8" width="144" height="266" rx="24" fill="#0f172a"/>
    <g clip-path="url(#phone)">
      <rect width="128" height="250" fill="#ffffff"/>
      ${flag(128, 3)}
      <circle cx="16" cy="18" r="7" fill="${BLUE}"/><rect x="28" y="14" width="50" height="6" rx="3" fill="${BLUE}"/>
      ${icon('menu', 104, 10, 16, '#374151')}
      <rect y="32" width="128" height="2" fill="${BLUE}"/>
      <rect x="12" y="46" width="70" height="5" rx="2.5" fill="#6b7280"/>
      <rect x="12" y="56" width="104" height="5" rx="2.5" fill="#e5e7eb"/><rect x="12" y="56" width="52" height="5" rx="2.5" fill="${BLUE}"/>
      <rect x="12" y="72" width="96" height="10" rx="3" fill="#1f2937"/>
      <rect x="12" y="96" width="62" height="5" rx="2.5" fill="#1f2937"/>
      <rect x="12" y="106" width="104" height="20" rx="3" fill="#ffffff" stroke="#6b7280" stroke-width="1.5"/>
      <rect x="12" y="138" width="62" height="5" rx="2.5" fill="#1f2937"/>
      <rect x="12" y="148" width="104" height="20" rx="3" fill="#ffffff" stroke="#6b7280" stroke-width="1.5"/>
      <rect x="12" y="182" width="104" height="22" rx="4" fill="${BLUE}"/><rect x="40" y="190" width="48" height="5" rx="2.5" fill="#ffffff"/>
      <rect y="216" width="128" height="34" fill="#ffffff" stroke="#e5e7eb"/>
      ${icon('home', 12, 222, 14, BLUE)}${icon('services', 44, 222, 14, '#6b7280')}${icon('phone', 76, 222, 14, '#6b7280')}${icon('search', 106, 222, 14, '#6b7280')}
    </g>
  </g></g>

  ${chip(680, 378, 'shield-check', 'WCAG 2.2 AA', 176, 0)}
  ${chip(870, 378, 'star', `${icons} icons`, 140, .6)}
  ${chip(1112, 96, 'sliders', `${THEMES.length} themes`, 148, 1.2)}
  </g>
</svg>`);

// ---------------------------------------------------------------------------------------------------------------
// The numbers: what GGDS gives you, each with its GGDS icon.
const STATS = [
  ['grid', String(components), 'components'],
  ['clipboard', String(patterns), 'patterns'],
  ['star', String(icons), 'icons'],
  ['sliders', String(THEMES.length), 'institution themes'],
  ['shield-check', 'WCAG 2.2', 'AA, on every change'],
  ['energy', kb(cssGz), 'of CSS, gzipped'],
  ['code', kb(jsGz), 'of optional JavaScript'],
];
const cardW = 172;
const gap = 12;
write('stats.svg', `
<svg xmlns="http://www.w3.org/2000/svg" width="${STATS.length * (cardW + gap) - gap}" height="148" viewBox="0 0 ${STATS.length * (cardW + gap) - gap} 148" role="img" aria-labelledby="t">
  <title id="t">${STATS.map(([, v, l]) => `${v} ${l}`).join(', ')}</title>
  <g ${FONT}>
  ${STATS.map(([ic, value, label], i) => `<g transform="translate(${i * (cardW + gap)} 0)">
    <rect width="${cardW}" height="148" rx="16" fill="${NAVY}"/>
    <rect width="${cardW}" height="4" rx="2" fill="${[RED, GOLD, GREEN][i % 3]}"/>
    <circle cx="36" cy="40" r="20" fill="#ffffff" fill-opacity=".1"/>
    ${icon(ic, 24, 28, 24, GOLD)}
    <text x="20" y="98" fill="#ffffff" font-size="${value.length > 6 ? 26 : 32}" font-weight="800">${value}</text>
    <text x="20" y="124" fill="#a9c6dc" font-size="13.5" font-weight="600">${label}</text>
  </g>`).join('\n  ')}
  </g>
</svg>`);

// ---------------------------------------------------------------------------------------------------------------
// The themes: every institution's colour, the only thing that changes between government websites.
const sw = 98;
write('themes.svg', `
<svg xmlns="http://www.w3.org/2000/svg" width="${THEMES.length * (sw + 8) - 8 + 48}" height="150" viewBox="0 0 ${THEMES.length * (sw + 8) - 8 + 48} 150" role="img" aria-labelledby="t">
  <title id="t">${THEMES.length} institution themes: ${THEMES.map((t) => t.shortName).join(', ')}</title>
  <rect width="100%" height="150" rx="16" fill="#ffffff" stroke="#dbe2ea"/>
  <g ${FONT}>
  ${THEMES.map((t, i) => `<g transform="translate(${24 + i * (sw + 8)} 24)">
    <rect width="${sw}" height="72" rx="10" fill="${t.color}"/>
    <rect y="62" width="${sw}" height="10" fill="${t.deep ?? t.color}"/>
    <rect width="${sw}" height="4" rx="2" fill="${GOLD}"/>
    <text x="${sw / 2}" y="98" text-anchor="middle" fill="#1f2937" font-size="12.5" font-weight="700">${t.shortName}</text>
    <text x="${sw / 2}" y="114" text-anchor="middle" fill="#6b7280" font-size="11">${t.color}</text>
  </g>`).join('\n  ')}
  </g>
</svg>`);

// ---------------------------------------------------------------------------------------------------------------
// How it fits together: tokens → styles → components → patterns → your website.
const LAYERS = [
  ['sliders', 'Tokens', 'colours, type, spacing', '@ggds/tokens'],
  ['code', 'Styles', 'one stylesheet, any site', '@ggds/css'],
  ['grid', 'Components', `${components} tested parts`, 'header, forms, cards…'],
  ['clipboard', 'Patterns', `${patterns} whole tasks`, 'apply, complain, search…'],
  ['building', 'Your website', 'in your colour', 'any framework'],
];
const lw = 220;
const lg = 36;
write('layers.svg', `
<svg xmlns="http://www.w3.org/2000/svg" width="${LAYERS.length * (lw + lg) - lg}" height="170" viewBox="0 0 ${LAYERS.length * (lw + lg) - lg} 170" role="img" aria-labelledby="t">
  <title id="t">How GGDS fits together: ${LAYERS.map(([, n]) => n).join(', then ')}</title>
  <g ${FONT}>
  ${LAYERS.map(([ic, name, line, small], i) => {
    const last = i === LAYERS.length - 1;
    return `<g transform="translate(${i * (lw + lg)} 0)">
    <rect width="${lw}" height="170" rx="18" fill="${last ? BLUE : '#ffffff'}" stroke="${last ? BLUE : '#dbe2ea'}" stroke-width="1.5"/>
    <circle cx="44" cy="46" r="24" fill="${last ? '#ffffff' : '#e5f0f7'}" fill-opacity="${last ? .15 : 1}"/>
    ${icon(ic, 30, 32, 28, last ? GOLD : BLUE)}
    <text x="24" y="104" fill="${last ? '#ffffff' : '#0f172a'}" font-size="22" font-weight="800">${name}</text>
    <text x="24" y="128" fill="${last ? '#d6e6f2' : '#374151'}" font-size="14">${line}</text>
    <text x="24" y="150" fill="${last ? GOLD : '#6b7280'}" font-size="12.5" font-weight="700">${small}</text>
  </g>${last ? '' : `
  ${icon('arrow-right', i * (lw + lg) + lw + 6, 73, 24, '#94a3b8')}`}`;
  }).join('\n  ')}
  </g>
</svg>`);

// ---------------------------------------------------------------------------------------------------------------
// Works with your stack: each framework's logo in its colours (trademarks of their owners; from Simple Icons,
// credited in the README).
const STACK = [['html', 'HTML'], ['react', 'React'], ['nextjs', 'Next.js'], ['vue', 'Vue'], ['svelte', 'Svelte'], ['angular', 'Angular'], ['astro', 'Astro'], ['django', 'Django'], ['wordpress', 'WordPress'], ['laravel', 'Laravel']];
const tw = 104;
write('stack.svg', `
<svg xmlns="http://www.w3.org/2000/svg" width="${STACK.length * (tw + 8) - 8}" height="112" viewBox="0 0 ${STACK.length * (tw + 8) - 8} 112" role="img" aria-labelledby="t">
  <title id="t">Works with ${STACK.map(([, n]) => n).join(', ')}</title>
  <defs><linearGradient id="ng" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e40035"/><stop offset=".55" stop-color="#dc087d"/><stop offset="1" stop-color="#7b1ef0"/></linearGradient></defs>
  <g ${FONT}>
  ${STACK.map(([key, name], i) => {
    const l = STACK_LOGOS[key];
    const dark = key === 'react';
    return `<g transform="translate(${i * (tw + 8)} 0)">
    <rect width="${tw}" height="112" rx="14" fill="${dark ? '#20232a' : '#ffffff'}" stroke="#dbe2ea"/>
    <g transform="translate(${tw / 2 - 18} 18) scale(1.5)"><path fill="${key === 'angular' ? 'url(#ng)' : l.colour}" d="${l.path}"/></g>
    <text x="${tw / 2}" y="92" text-anchor="middle" fill="${dark ? '#ffffff' : '#1f2937'}" font-size="13.5" font-weight="700">${name}</text>
  </g>`;
  }).join('\n  ')}
  </g>
</svg>`);
console.log('readme art: done');
