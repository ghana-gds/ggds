// "Woven for everyone": the documentation homepage's story, told as people scroll.
//
// Kente (woven by Asante and Ewe weavers) and the northern fugu are made the same way: threads stretched to a narrow
// loom become long strips of cloth, and the strips are sewn edge to edge into one cloth, made to be worn. GGDS is made
// the same way: a few shared basics (the threads) become ready-made parts (the strip), parts become whole services
// (the cloth), and services are used by people.
//
//   The loom     the hero's threads, then the loom where the cloth begins   (heroLoom, wovenLead)
//   1 The thread    the basics every website shares        4 The colours   each institution's own (theme picker)
//   2 The strip     the ready-made parts                   5 The people    who it is made for
//   3 The cloth     whole services                         6 The mark      the proof, counted from the build
//
// Written for everyone, not only developers: plain words, and numbers only where they mean something to anyone.
//
// The threads are one piece from the hero to the loom: the hero's warp settles into parallel threads that leave its
// bottom edge, and the loom below picks up the same threads in the same places (WARP_LINES draws both), so there is
// no seam. The woven cloth flows down from the heddle as people scroll, as real cloth moves away from the weaver.
//
// Built from GGDS's scroll effects (packages/css/src/components/motion.css) and a few of the story's own, all of them
// transform and opacity only, so scrolling stays smooth. No script. Every scene is real text with its own heading; the
// drawings are decoration (aria-hidden). With less motion, in a browser without scroll-driven animations, on a short
// screen or at high zoom, every scene is still and finished.
//
// The weave is an original, simple pattern inspired by how strip cloth is made, not a copy of any named kente cloth,
// some of which carry royal or family meaning. It is a placeholder for a pattern drawn by Ghanaian weavers and
// designers. No national symbols: the flag colours appear only as thread, as in the GGDS footer.
import { esc } from './parts.mjs';

const PART = (step, kind = '') => `ggds-scene__part${kind ? ` ggds-scene__part--${kind}` : ''}${step > 1 ? ` ggds-scene__part--${step}` : ''}`;

/** A small woven block: a ground and a motif, in two of the cloth's colours. */
const block = (x, y, w, h, ground, motif) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" class="wv-fill-${ground}"/><rect x="${x + w * 0.25}" y="${y + h * 0.3}" width="${w * 0.5}" height="${h * 0.4}" class="wv-fill-${motif}"/><rect x="${x + w * 0.42}" y="${y + h * 0.18}" width="${w * 0.16}" height="${h * 0.64}" class="wv-fill-${ground === 'gold' ? 'ink' : 'gold'}"/>`;

/** The colours of the cloth, in turn. "inst" and "deep" are the institution's, so the cloth follows the theme. */
const CLOTH = [['inst', 'gold'], ['gold', 'green'], ['deep', 'red'], ['red', 'gold'], ['green', 'gold'], ['gold', 'inst']];

/** A vertical strip of woven blocks. */
const strip = (x, y, w, h, n, offset = 0) => Array.from({ length: n }, (_, i) => {
  const [g, m] = CLOTH[(i + offset) % CLOTH.length];
  return block(x, y + (h / n) * i, w, h / n, g, m);
}).join('');

// The loom ------------------------------------------------------------------------------------------------------

/** The warp: 12 threads in the flag's colours and white, in turn. The same list draws the hero's and the loom's. */
const WARP = ['gold', 'light', 'red', 'light', 'green', 'light', 'gold', 'light', 'red', 'light', 'green', 'light'];
/** Where the cloth runs, as a share of the drawing's width: the same in the hero and the loom, so they line up. */
const STRIP = { left: 40, width: 20 };
/** On a phone the loom draws its own fan, so its cloth can be twice as wide: a strip you can see, not a ribbon. */
const PHONE_STRIP = { left: 30, width: 40 };
const threadX = (i, strip = STRIP) => strip.left + (strip.width * (i + 0.5)) / WARP.length;

/** The warp fanning in from far away to the strip's width: an SVG stretched to its box (0 to 100 both ways). */
const fan = (strip = STRIP) => `<svg class="woven-fan" viewBox="0 0 100 100" preserveAspectRatio="none" focusable="false">${WARP.map((c, i) => `<path class="wv-stroke-${c}" d="M${(4 + (92 * i) / (WARP.length - 1)).toFixed(2)} 0L${threadX(i, strip).toFixed(2)} 100"/>`).join('')}</svg>`;

/** The hero's drawing: the warp fanning in, then running parallel off the hero's bottom edge, into the loom below. */
export function heroLoom() {
  return `<div class="woven-hero-loom">${fan()}<div class="woven-warp"></div></div>`;
}

/** The loom, right under the hero, in its colour: the threads arrive, pass the heddle, and the cloth grows. */
export function wovenLead() {
  return `
<section class="woven-loom" aria-labelledby="woven-0">
<div class="woven-loom__inner">
<div class="woven-loom__text">
<p class="woven-kicker">Woven for everyone</p>
<h2 id="woven-0">Made the way Ghana makes cloth</h2>
<p>Kente and fugu are woven in narrow strips, then sewn together into one cloth.</p>
<p>GGDS is made the same way. Small parts, each one tested, are sewn into services that every part of government shares and everyone can use.</p>
<p class="woven-cue"><a href="#woven-1">See how it is woven<span aria-hidden="true"> ↓</span></a></p>
</div>
<div class="woven-loom__art" aria-hidden="true">
<div class="woven-loom__side woven-loom__side--start"></div>
<div class="woven-loom__side woven-loom__side--end"></div>
<div class="woven-loom__fan">${fan(PHONE_STRIP)}</div>
<div class="woven-warp woven-warp--loom"></div>
<div class="woven-heddle"></div>
<div class="woven-cloth"><div class="woven-cloth__weave"></div></div>
<div class="woven-shuttle"></div>
<div class="woven-fringe"></div>
</div>
</div>
</section>`;
}

// The scenes ----------------------------------------------------------------------------------------------------

// 1. The thread: the basics every website shares, and the colour too pale to read that falls away.
function thread({ icons }) {
  const line = (y, colour, step) => `<path class="wv-thread wv-stroke-${colour} ${PART(step, 'draw')}" d="M24 ${y}C140 ${y - 14} 300 ${y + 14} 456 ${y}" pathLength="1"/>`;
  const label = (y, text) => `<g class="${PART(6, 'grow')}"><rect class="wv-label" x="180" y="${y - 36}" width="276" height="28" rx="14"/><text class="wv-label-text" x="318" y="${y - 17}">${text}</text></g>`;
  return `
<section class="woven-scene ggds-scene ggds-scene--pinned" aria-labelledby="woven-1">
<div class="ggds-scene__stage woven-stage">
<div class="woven-stage__text">
<p class="woven-kicker">1. The thread</p>
<h2 id="woven-1">It starts with a few good threads</h2>
<p>Every government website built with GGDS starts from the same few things: its colours, its lettering, the space between things, and small pictures called icons.</p>
<p>Each one is chosen with care. If a colour is too pale to read, GGDS will not let anyone use it.</p>
<p><a href="foundations.html">See the basics</a></p>
</div>
<svg class="woven-art" viewBox="0 0 480 320" aria-hidden="true" focusable="false">
  ${line(70, 'gold', 1)}
  <g class="woven-faint"><path class="wv-thread wv-stroke-faint ${PART(2, 'draw')}" d="M24 110C140 96 300 124 456 110" pathLength="1"/><text class="wv-faint-text ${PART(2, 'fade')}" x="456" y="96" text-anchor="end">Too pale to read</text></g>
  ${line(150, 'red', 3)}
  ${line(210, 'green', 4)}
  ${line(270, 'ink', 5)}
  ${label(70, 'Colours that are easy to read')}
  ${label(150, 'Clear lettering')}
  ${label(210, 'Even spacing')}
  ${label(270, `${icons} simple icons`)}
</svg>
</div>
</section>`;
}

// 2. The strip: the ready-made parts.
function parts({ components }) {
  const blocks = Array.from({ length: 8 }, (_, i) => {
    const [g, m] = CLOTH[i % CLOTH.length];
    return `<g class="${PART(2 + Math.floor(i / 3), 'fade')}">${block(24 + i * 54, 236, 54, 60, g, m)}</g>`;
  }).join('');
  const warp = Array.from({ length: 5 }, (_, i) => `<path class="wv-warp ${PART(1, 'draw')}" d="M24 ${242 + i * 12}H456" pathLength="1"/>`).join('');
  const tie = (x, step) => `<path class="wv-tie ${PART(step, 'draw')}" d="M${x} 228V150" pathLength="1"/>`;
  return `
<section class="woven-scene woven-scene--alt ggds-scene ggds-scene--pinned" aria-labelledby="woven-2">
<div class="ggds-scene__stage woven-stage">
<div class="woven-stage__text">
<p class="woven-kicker">2. The strip</p>
<h2 id="woven-2">Threads become parts</h2>
<p>From those threads, GGDS weaves ${components} ready-made parts: buttons, a box for your Ghana Card number, a label that says your application is approved, and many more.</p>
<p>Each part is tested on its own before anyone uses it: on a small, low-cost phone, on a slow connection, and for people who listen to their screen instead of reading it.</p>
<p><a href="components/index.html">See the parts</a></p>
</div>
<svg class="woven-art" viewBox="0 0 480 320" aria-hidden="true" focusable="false">
  <rect class="wv-loom" x="16" y="228" width="448" height="76" rx="6"/>
  ${warp}
  ${blocks}
  <path class="woven-strip-shuttle" d="M4 266c10-9 30-12 52-12s34 5 40 12c-6 7-18 12-40 12s-42-3-52-12z"/>
  ${tie(80, 3)}${tie(190, 4)}${tie(300, 5)}${tie(410, 6)}
  <g class="${PART(3, 'grow')}"><rect class="wv-button" x="30" y="100" width="100" height="44" rx="6"/><text class="wv-button-text" x="80" y="128">Continue</text></g>
  <g class="${PART(4, 'grow')}"><text class="wv-small" x="140" y="92">Ghana Card number</text><rect class="wv-input" x="140" y="100" width="100" height="44" rx="4"/><text class="wv-input-text" x="152" y="128">GHA-</text></g>
  <g class="${PART(5, 'grow')}"><rect class="wv-tag" x="250" y="108" width="100" height="30" rx="4"/><text class="wv-tag-text" x="300" y="128">Approved</text></g>
  <g class="${PART(6, 'grow')}"><circle class="wv-check-ring" cx="410" cy="122" r="22"/><path class="wv-check" d="M399 122l8 8 15-16"/></g>
</svg>
</div>
</section>`;
}

// 3. The cloth: strips sewn together become a whole service, on a phone.
function cloth() {
  return `
<section class="woven-scene ggds-scene ggds-scene--pinned" aria-labelledby="woven-3">
<div class="ggds-scene__stage woven-stage">
<div class="woven-stage__text">
<p class="woven-kicker">3. The cloth</p>
<h2 id="woven-3">Parts become services</h2>
<p>Sewn together, the parts become whole services that people can finish on their phone: apply for a licence, pay with mobile money, and get a receipt straight away.</p>
<p>GGDS also shows teams, step by step, how to build the things people do most, from asking for a Ghana Card number to taking a payment.</p>
<p><a href="showcase/index.html">See services built with GGDS</a></p>
</div>
<svg class="woven-art" viewBox="0 0 480 340" aria-hidden="true" focusable="false">
  <g class="${PART(1, 'from-start')}">${strip(150, 30, 60, 280, 5, 0)}</g>
  <g class="${PART(2, 'from-end')}">${strip(270, 30, 60, 280, 5, 2)}</g>
  <g class="${PART(3)}">${strip(210, 30, 60, 280, 5, 4)}</g>
  <path class="wv-stitch ${PART(4, 'draw')}" d="M210 30V310" pathLength="1"/>
  <path class="wv-stitch ${PART(4, 'draw')}" d="M270 30V310" pathLength="1"/>
  <rect class="wv-phone ${PART(5, 'draw')}" x="132" y="14" width="216" height="312" rx="30" pathLength="1"/>
  <g class="${PART(6, 'fade')}">
    <rect class="wv-screen" x="146" y="52" width="188" height="236" rx="6"/>
    <rect class="wv-fill-inst" x="146" y="52" width="188" height="10"/>
    <text class="wv-screen-title" x="160" y="90">Pay the licence fee</text>
    <text class="wv-screen-amount" x="160" y="122">GH₵ 150.00</text>
    <circle class="wv-radio" cx="168" cy="148" r="7"/><text class="wv-small" x="182" y="153">MTN MoMo</text>
    <circle class="wv-radio" cx="168" cy="174" r="7"/><text class="wv-small" x="182" y="179">Telecel Cash</text>
    <rect class="wv-button" x="160" y="198" width="120" height="36" rx="5"/><text class="wv-button-text" x="220" y="221">Pay</text>
    <circle class="wv-check-ring" cx="314" cy="262" r="12"/><path class="wv-check" d="M308 262l4 4 8-8"/>
  </g>
</svg>
</div>
</section>`;
}

// 4. The colours: one weave, many colours. The theme picker (docs/home.mjs), with a cloth swatch for each institution.
function colours(themeSection, themes) {
  const swatches = themes.map((t) => `<li class="woven-swatch home-theme__dot--${t.slug}"><span class="ggds-visually-hidden">${esc(t.shortName)}</span></li>`).join('');
  return themeSection
    .replace('<section class="docs-home-section home-theme"', '<section class="woven-scene docs-home-section home-theme"')
    .replace('<h2 id="home-theme-h">', '<p class="woven-kicker">4. The colours</p>\n<h2 id="home-theme-h">')
    .replace(/<\/section>\s*$/, `<ul class="woven-swatches ggds-stagger" aria-hidden="true">${swatches}</ul>\n</section>`);
}

// 5. The people: who it is made for.
function people(icon) {
  const card = (ic, title, text) => `<li class="woven-person woven-person--${ic}"><span class="woven-person__icon">${icon(ic)}</span><h3>${title}</h3><p>${text}</p></li>`;
  return `
<section class="woven-scene woven-scene--alt woven-worn" aria-labelledby="woven-5">
<div>
<p class="woven-kicker">5. The people</p>
<h2 id="woven-5">Made to be worn</h2>
<p class="ggds-measure">Cloth is made to be worn. GGDS is made for the people who use government websites: someone on a low-cost phone, on slow and costly data, outdoors in bright sun, far from Accra, who reads English as a second language, or who cannot see the screen well.</p>
</div>
<ul class="woven-people ggds-stagger ggds-scroll-row" tabindex="0" aria-label="Who GGDS is made for">
${card('mobile', 'Any phone', 'Pages fit even the smallest phone screens, and still work when extra features cannot load.')}
${card('wifi', 'Slow, costly data', 'The whole look of a page weighs less than a single photo, so it opens quickly and costs little.')}
${card('sun', 'Bright sun', 'Every colour is checked so that words stay clear to read, even outdoors.')}
${card('volume', 'Listening, not looking', 'Pages are built so that phones can read them aloud to people who are blind or cannot see well.')}
${card('eye', 'Bigger words', 'Make the words as large as you need: nothing gets cut off, and you never scroll sideways.')}
</ul>
</section>`;
}

// 6. The weaver's mark: the proof, counted as the page is made, in words anyone can follow.
function mark({ components, patterns, icons, cssKb, jsKb }) {
  const ends = ['gold', 'red', 'green', 'inst'].map((c, i) => `<path class="wv-stroke-${c}" d="M300 ${20 + i * 8}C380 ${20 + i * 8} 420 ${-10 + i * 30} 600 ${-20 + i * 42}" pathLength="1"/><path class="wv-stroke-${c}" d="M300 ${20 + i * 8}C220 ${20 + i * 8} 180 ${-10 + i * 30} 0 ${-20 + i * 42}" pathLength="1"/>`).join('');
  const stat = (n, label, note) => `<div><dt>${label}</dt><dd>${n}${note ? `<span class="woven-label__note">${note}</span>` : ''}</dd></div>`;
  return `
<section class="woven-scene woven-mark" aria-labelledby="woven-6">
<div>
<p class="woven-kicker">6. The weaver’s mark</p>
<h2 id="woven-6">Proof, not promises</h2>
<p class="ggds-measure">Every cloth carries its maker’s mark. Ours is proof: these checks run every time GGDS changes, and these numbers were counted when this page was made.</p>
</div>
<dl class="woven-label ggds-reveal ggds-reveal--scale">
${stat(components, 'Ready-made parts')}${stat(patterns, 'Step-by-step guides')}${stat(icons, 'Icons')}${stat(`${cssKb} KB`, 'The look of every page', 'Smaller than one photo')}${stat(`${jsKb} KB`, 'Optional extras', 'Pages work without them')}${stat('Every change', 'Checked for accessibility', 'Against the world standard, WCAG 2.2 AA')}
</dl>
<svg class="woven-mark__threads ggds-draw" viewBox="0 0 600 120" preserveAspectRatio="none" aria-hidden="true" focusable="false">${ends}</svg>
<h3 class="woven-mark__cta ggds-reveal">Weave with us</h3>
<div class="ggds-button-group woven-mark__actions ggds-reveal">
<a class="ggds-button" href="get-started.html">Get started</a>
<a class="ggds-button ggds-button--secondary" href="builder.html">Make your website</a>
<a href="contribute.html">Help improve GGDS</a>
</div>
</section>`;
}

/** The six scenes after the loom, in order. themeSection: the picker's HTML (docs/home.mjs). */
export function woven({ themes, themeSection, icon, counts }) {
  return [thread(counts), parts(counts), cloth(), colours(themeSection, themes), people(icon), mark(counts)].join('\n');
}

/** The warp as parallel threads, drawn with one gradient: each thread 2px wide, at the same places as the fan's ends. */
function warpGradient() {
  const colour = { gold: 'var(--ggds-color-flag-gold)', red: 'var(--ggds-color-flag-red)', green: 'var(--ggds-color-flag-green)', light: 'color-mix(in srgb, var(--ggds-color-text-inverse) 85%, transparent)' };
  const w = 100 / WARP.length;
  const stops = WARP.map((c, i) => {
    const mid = `${(i * w + w / 2).toFixed(3)}%`;
    return `transparent ${(i * w).toFixed(3)}%, transparent calc(${mid} - 1px), ${colour[c]} calc(${mid} - 1px), ${colour[c]} calc(${mid} + 1px), transparent calc(${mid} + 1px), transparent ${((i + 1) * w).toFixed(3)}%`;
  });
  return `linear-gradient(90deg, ${stops.join(', ')})`;
}

/** The story's stylesheet (assets/woven.css): GGDS tokens only, and the theme's colours for the cloth. */
export function wovenCss() {
  return `/* Generated by docs/woven.mjs: "Woven for everyone", the homepage's story. GGDS tokens only. */

/* The loom ---------------------------------------------------------------------------------------------------- */

/* The hero's drawing: the warp fans in from the top, then runs parallel off the hero's bottom edge. Beside the hero
   text from 64rem, where the loom below lines up with it; on smaller screens the loom draws its own fan. */
@media (max-width: 63.99rem) { .ggds-hero__art:has(.woven-hero-loom) { display: none; } }
@media (min-width: 64rem) {
  .ggds-hero--art:has(.woven-hero-loom) .ggds-hero__inner { align-items: stretch; }
  .ggds-hero__art:has(.woven-hero-loom) { position: relative; margin-block: -3.5rem; min-height: 24rem; }
}
.woven-hero-loom { position: absolute; inset: 0; }
.woven-hero-loom .woven-fan { position: absolute; inset: 0 0 auto; width: 100%; height: 62%; }
.woven-hero-loom .woven-warp { position: absolute; top: 62%; bottom: 0; }
.woven-fan path { fill: none; stroke-width: 2; vector-effect: non-scaling-stroke; }

/* The warp's parallel threads: one gradient, the same in the hero and the loom, so they meet without a seam. */
.woven-warp { left: ${STRIP.left}%; width: ${STRIP.width}%; background: ${warpGradient()}; }
/* The loom's own parts sit on the strip's place: the phone's wider strip below 64rem, the hero's from 64rem. */
.woven-loom__art { --wv-left: ${PHONE_STRIP.left}%; --wv-width: ${PHONE_STRIP.width}%; }
@media (min-width: 64rem) { .woven-loom__art { --wv-left: ${STRIP.left}%; --wv-width: ${STRIP.width}%; } }
.woven-loom__art .woven-warp, .woven-cloth, .woven-fringe { left: var(--wv-left); width: var(--wv-width); }

/* The loom: straight under the hero, in its colour, laid out on the hero's grid so the threads line up. */
.woven-loom { position: relative; background: var(--ggds-color-institution-deep); color: var(--ggds-color-text-inverse); view-timeline: --woven-loom block; }
main { timeline-scope: --woven-loom; }
.woven-loom__inner { max-width: var(--ggds-size-content-max); margin-inline: auto; padding: var(--ggds-space-8) var(--ggds-size-gutter) 0; }
.woven-loom__text { padding-bottom: var(--ggds-space-8); }
.woven-loom__text p { max-width: 36rem; font-size: var(--ggds-font-size-lg); }
.woven-loom h2 { margin-top: 0; color: var(--ggds-color-text-inverse); font-size: var(--ggds-font-size-3xl); }
.woven-loom .woven-kicker { color: var(--ggds-color-flag-gold); }
.woven-loom a, .woven-loom a:visited { color: var(--ggds-color-text-inverse); }
.woven-cue { margin-top: var(--ggds-space-6); font-weight: var(--ggds-font-weight-bold); }
.woven-loom__art { position: relative; height: min(34rem, 72svh); overflow: hidden; }
.woven-loom__fan { position: absolute; inset: 0 0 auto; height: 30%; }
.woven-loom__fan .woven-fan { width: 100%; height: 100%; }
.woven-warp--loom { position: absolute; top: 30%; height: 8%; }
.woven-heddle { position: absolute; top: 38%; left: calc(var(--wv-left) - 6%); width: calc(var(--wv-width) + 12%); height: 10px; border-radius: 5px; background: var(--ggds-color-flag-gold); box-shadow: 0 2px 0 color-mix(in srgb, var(--ggds-color-text) 40%, transparent); }
.woven-cloth { position: absolute; top: calc(38% + 18px); bottom: var(--ggds-space-6); overflow: hidden; box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--ggds-color-text) 30%, transparent); }
.woven-shuttle { position: absolute; top: calc(38% + 12px); left: var(--wv-left); width: calc(var(--wv-width) * 0.3); height: 12px; border-radius: 50%; background: var(--ggds-color-text-inverse); box-shadow: inset 0 -3px 0 color-mix(in srgb, var(--ggds-color-text) 25%, transparent); }

@media (min-width: 64rem) {
  .woven-loom__inner { display: grid; grid-template-columns: 1.15fr 1fr; gap: var(--ggds-space-12); padding-top: 0; }
  .woven-loom__text { align-self: center; padding-block: var(--ggds-space-16); }
  .woven-loom__art { height: auto; min-height: 30rem; }
  /* The hero brings the threads: here they arrive at the top, already parallel. */
  .woven-loom__fan { display: none; }
  .woven-warp--loom { top: 0; height: 22%; }
  .woven-heddle { top: 22%; }
  .woven-shuttle { top: calc(22% + 12px); }
  .woven-cloth { top: calc(22% + 18px); }
}

/* The cloth: an original woven pattern (a placeholder for one drawn by Ghanaian weavers), repeating every 168px:
   a gold block with the institution's colour woven in (so the cloth follows the theme), thin stripes, then a green
   block with gold. Light edges hold it together, as woven borders do. It sits two repeats higher than its box, so it
   can flow down. */
.woven-loom {
  --wv-cloth-size: auto, 12% 168px, 52% 168px, 10% 168px, 44% 168px, 100% 168px;
  --wv-cloth:
    repeating-linear-gradient(90deg, color-mix(in srgb, var(--ggds-color-text) 14%, transparent) 0 1px, transparent 1px 5px),
    linear-gradient(to bottom, transparent 22px, var(--ggds-color-flag-gold) 22px 46px, transparent 46px),
    linear-gradient(to bottom, transparent 12px, var(--ggds-color-institution) 12px 56px, transparent 56px),
    linear-gradient(to bottom, transparent 104px, var(--ggds-color-text) 104px 140px, transparent 140px),
    linear-gradient(to bottom, transparent 108px, var(--ggds-color-flag-gold) 108px 136px, transparent 136px),
    linear-gradient(to bottom, var(--ggds-color-flag-gold) 0 68px, var(--ggds-color-flag-red) 68px 72px, var(--ggds-color-text) 72px 76px, var(--ggds-color-flag-gold) 76px 82px, var(--ggds-color-flag-red) 82px 88px, var(--ggds-color-text) 88px 92px, var(--ggds-color-flag-green) 92px 168px);
}
.woven-cloth__weave, .woven-loom__side::before { background-image: var(--wv-cloth); background-size: var(--wv-cloth-size); background-position: 0 0, center 0, center 0, center 0, center 0, 0 0; background-repeat: repeat, repeat-y, repeat-y, repeat-y, repeat-y, repeat-y; }
.woven-cloth__weave { position: absolute; inset: -336px 0 0; }
.woven-cloth { box-shadow: inset 3px 0 0 color-mix(in srgb, var(--ggds-color-text-inverse) 80%, transparent), inset -3px 0 0 color-mix(in srgb, var(--ggds-color-text-inverse) 80%, transparent); }
.woven-cloth::after { content: ""; position: absolute; inset: auto 0 0; height: 3px; background: color-mix(in srgb, var(--ggds-color-text-inverse) 80%, transparent); }

/* The end of the cloth: a fringe of loose threads, below the loom. */
.woven-fringe { position: absolute; bottom: 0; height: var(--ggds-space-6); background: ${warpGradient()}; }

/* Strips already woven, hanging either side of the loom, as finished strips wait to be sewn to the new one. Faint
   and behind everything: depth, not something to read. */
.woven-loom__side { position: absolute; top: 30%; bottom: -20%; width: 18%; opacity: 0.16; }
.woven-loom__side::before { content: ""; position: absolute; inset: 0; }
.woven-loom__side--start { left: 4%; }
.woven-loom__side--end { right: 4%; }
.woven-loom__side--end::before { background-position-y: 84px; }
@media (min-width: 64rem) { .woven-loom__side { top: 0; width: 14%; } .woven-loom__side--start { left: 8%; } .woven-loom__side--end { right: 8%; } }

/* As people scroll the loom works, in layers that move at different speeds: the cloth flows down from the heddle
   (near, fastest), the shuttle crosses and the heddle beats each pass into place, the threads draw tight, and the
   finished strips either side drift up (far, slowest). Transform only, so it is smooth; it moves only while people
   scroll, and only while the loom is on screen. */
@media (prefers-reduced-motion: no-preference) {
  @supports (animation-timeline: view()) {
    .woven-cloth__weave { will-change: transform; animation: woven-flow linear both; animation-timeline: --woven-loom; animation-range: cover 0% cover 100%; }
    .woven-shuttle { will-change: transform; animation: woven-pass linear both; animation-timeline: --woven-loom; animation-range: cover 0% cover 100%; }
    .woven-heddle { animation: woven-beat linear both; animation-timeline: --woven-loom; animation-range: cover 0% cover 100%; }
    .woven-loom__fan .woven-fan { transform-origin: 50% 100%; animation: woven-tighten linear both; animation-timeline: --woven-loom; animation-range: entry 0% cover 50%; }
    .woven-loom__side { will-change: transform; animation: woven-drift linear both; animation-timeline: --woven-loom; animation-range: cover 0% cover 100%; }
    .woven-loom__side--end { animation-name: woven-drift-far; }
  }
}
@keyframes woven-flow { to { transform: translateY(336px); } }
@keyframes woven-pass {
  0%, 25%, 50%, 75%, 100% { transform: translateX(0); }
  12.5%, 37.5%, 62.5%, 87.5% { transform: translateX(233%); }
}
@keyframes woven-beat {
  0%, 10%, 15%, 35%, 40%, 60%, 65%, 85%, 90%, 100% { transform: translateY(0); }
  12.5%, 37.5%, 62.5%, 87.5% { transform: translateY(6px); }
}
@keyframes woven-tighten { from { transform: scaleY(0.82); } }
@keyframes woven-drift { from { transform: translateY(var(--ggds-space-12)); } to { transform: translateY(calc(-1 * var(--ggds-space-12))); } }
@keyframes woven-drift-far { from { transform: translateY(var(--ggds-space-6)); } to { transform: translateY(calc(-1 * var(--ggds-space-6))); } }

/* The scenes -------------------------------------------------------------------------------------------------- */

.woven-scene { position: relative; margin-top: var(--ggds-space-12); padding: var(--ggds-space-8) var(--ggds-space-4) var(--ggds-space-8) var(--ggds-space-6); border-radius: var(--ggds-radius-lg); background: var(--ggds-color-surface); }
@media (min-width: 48rem) { .woven-scene { padding-inline: var(--ggds-space-6); } }

/* The selvedge: a woven edge down the side of each scene, woven in as people read down it, so the page keeps
   weaving between the drawings. Beside the words, never under them. */
.woven-scene::before { content: ""; position: absolute; inset: var(--ggds-space-8) auto var(--ggds-space-8) 0; width: 4px; border-radius: 2px; background: repeating-linear-gradient(var(--ggds-color-flag-gold) 0 14px, var(--ggds-color-flag-green) 14px 20px, var(--ggds-color-flag-gold) 20px 34px, var(--ggds-color-flag-red) 34px 40px, var(--ggds-color-institution) 40px 46px); transform-origin: 50% 0; }
@media (prefers-reduced-motion: no-preference) {
  @supports (animation-timeline: view()) {
    .woven-scene::before { animation: woven-selvedge linear both; animation-timeline: view(); animation-range: entry 40% exit 10%; }
  }
}
@keyframes woven-selvedge { from { transform: scaleY(0); } }
.woven-scene--alt { background: var(--ggds-color-surface-sunken); }
.woven-scene h2 { margin-top: 0; font-size: var(--ggds-font-size-2xl); }
.woven-kicker { margin: 0 0 var(--ggds-space-2); color: var(--ggds-color-institution-deep); font-weight: var(--ggds-font-weight-bold); font-size: var(--ggds-font-size-sm); letter-spacing: 0.04em; text-transform: uppercase; }

/* A scene's stage: the words, then the drawing; side by side on wide screens. It starts at the top, so there is no
   empty pause as a pinned scene arrives. */
.woven-stage { display: grid; gap: var(--ggds-space-6); align-content: start; }
@media (min-width: 64rem) { .woven-stage { grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); align-items: center; } }
.woven-stage__text > :last-child { margin-bottom: 0; }
.woven-art { display: block; width: 100%; height: auto; max-height: 56svh; overflow: visible; }
/* A phone shows the drawing smaller, so its words are set larger to stay readable. */
@media (max-width: 63.99rem) { .woven-art .wv-label-text { font-size: 16px; } .woven-art .wv-small { font-size: 15px; } .woven-art .wv-faint-text { font-size: 17px; } }

/* The cloth's colours: flag colours as thread only, and the institution's, so the cloth follows the theme. */
.wv-fill-gold { fill: var(--ggds-color-flag-gold); }
.wv-fill-red { fill: var(--ggds-color-flag-red); }
.wv-fill-green { fill: var(--ggds-color-flag-green); }
.wv-fill-ink { fill: var(--ggds-color-text); }
.wv-fill-inst { fill: var(--ggds-color-institution); }
.wv-fill-deep { fill: var(--ggds-color-institution-deep); }
.wv-stroke-gold { stroke: var(--ggds-color-flag-gold); }
.wv-stroke-red { stroke: var(--ggds-color-flag-red); }
.wv-stroke-green { stroke: var(--ggds-color-flag-green); }
.wv-stroke-ink { stroke: var(--ggds-color-text); }
.wv-stroke-inst { stroke: var(--ggds-color-institution); }
.wv-stroke-light { stroke: color-mix(in srgb, var(--ggds-color-text-inverse) 85%, transparent); }
.wv-stroke-faint { stroke: color-mix(in srgb, var(--ggds-color-flag-gold) 35%, var(--ggds-color-surface)); }
.wv-thread { fill: none; stroke-width: 8; stroke-linecap: round; }
.wv-warp { fill: none; stroke: var(--ggds-color-border-subtle); stroke-width: 2; }
.wv-loom { fill: var(--ggds-color-surface); stroke: var(--ggds-color-border-strong); stroke-width: 2; }
.wv-tie { fill: none; stroke: var(--ggds-color-border-strong); stroke-width: 2; stroke-dasharray: 4 4; }
.wv-stitch { fill: none; stroke: var(--ggds-color-text-inverse); stroke-width: 2; }
.wv-label { fill: var(--ggds-color-surface); stroke: var(--ggds-color-border-strong); }
.wv-label-text, .wv-small, .wv-input-text, .wv-screen-title, .wv-screen-amount, .wv-faint-text { fill: var(--ggds-color-text); font-size: 13px; }
.wv-label-text, .wv-button-text, .wv-tag-text { text-anchor: middle; font-weight: 700; }
.wv-faint-text { fill: var(--ggds-color-status-danger-strong); font-weight: 700; }
.wv-button { fill: var(--ggds-color-brand-700); }
.wv-button-text { fill: var(--ggds-color-text-inverse); font-size: 15px; }
.wv-input { fill: var(--ggds-color-surface); stroke: var(--ggds-color-border-control); stroke-width: 2; }
.wv-input-text { font-family: var(--ggds-font-family-mono); font-size: 15px; }
.wv-tag { fill: var(--ggds-color-status-success-subtle); stroke: var(--ggds-color-status-success-strong); }
.wv-tag-text { fill: var(--ggds-color-status-success-strong); font-size: 14px; }
.wv-check-ring { fill: var(--ggds-color-status-success-subtle); stroke: var(--ggds-color-status-success-strong); stroke-width: 2; }
.wv-check { fill: none; stroke: var(--ggds-color-status-success-strong); stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
.woven-strip-shuttle { fill: var(--ggds-color-text); }
.wv-phone { fill: none; stroke: var(--ggds-color-text); stroke-width: 8; }
.wv-screen { fill: var(--ggds-color-surface); }
.wv-screen-title { font-weight: 700; font-size: 15px; }
.wv-screen-amount { font-weight: 700; font-size: 20px; }
.wv-radio { fill: var(--ggds-color-surface); stroke: var(--ggds-color-border-control); stroke-width: 2; }

/* The colours: a cloth swatch for each institution, under the theme picker. */
.woven-swatches { display: flex; flex-wrap: wrap; gap: var(--ggds-space-2); margin: var(--ggds-space-6) 0 0; padding: 0; list-style: none; }
.woven-swatch { width: var(--ggds-space-12); height: var(--ggds-space-16); border-radius: var(--ggds-radius-sm);
  background-image: linear-gradient(transparent 30%, var(--ggds-color-flag-gold) 30% 38%, transparent 38% 62%, var(--ggds-color-flag-gold) 62% 70%, transparent 70%); }

/* The people. */
.woven-people { --ggds-scroll-row-bleed: var(--ggds-space-4); display: grid; gap: var(--ggds-space-4); margin: var(--ggds-space-6) 0; padding: 0; list-style: none; }
@media (min-width: 48rem) { .woven-people { grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr)); } }
.woven-person { padding: var(--ggds-space-4); border-top: 4px solid var(--ggds-color-institution); border-radius: var(--ggds-radius-md); background: var(--ggds-color-surface); }
.woven-person h3 { margin: var(--ggds-space-2) 0 var(--ggds-space-1); font-size: var(--ggds-font-size-lg); }
.woven-person p { margin: 0; }
.woven-person__icon { display: inline-flex; padding: var(--ggds-space-2); border-radius: 50%; background: color-mix(in srgb, var(--ggds-color-institution) 12%, var(--ggds-color-surface)); color: var(--ggds-color-institution); }

/* Each person's card acts out its promise as it arrives: the phone shrinks to fit, the signal fills bar by bar, the
   sun turns, the sound goes out, and "Bigger words" grows. On a phone, where the cards are a row people swipe, each
   one plays as it is swiped in (the first as the row comes up the screen). Words never fade. */
@media (prefers-reduced-motion: no-preference) {
  @supports (animation-timeline: view()) {
    .woven-person__icon > svg, .woven-person--eye h3 { animation: linear both; animation-timeline: view(); animation-range: entry 30% cover 50%; }
    .woven-person--mobile .woven-person__icon > svg { animation-name: woven-fit; }
    .woven-person--wifi .woven-person__icon > svg { animation-name: woven-signal; }
    .woven-person--sun .woven-person__icon > svg { animation-name: woven-sun; }
    .woven-person--volume .woven-person__icon > svg { animation-name: woven-sound; }
    .woven-person--eye h3 { animation-name: woven-bigger; transform-origin: 0 50%; }
  }
}
@media (prefers-reduced-motion: no-preference) and (max-width: 47.99rem) {
  @supports (animation-timeline: view()) {
    .woven-person:not(:first-child) :is(.woven-person__icon > svg, h3) { animation-timeline: view(inline); animation-range: entry 25% entry 100%; }
  }
}
@keyframes woven-fit { from { transform: scale(1.8); } }
@keyframes woven-signal { from { clip-path: inset(100% 0 0 0); } }
@keyframes woven-sun { from { transform: rotate(-180deg) scale(0.6); } }
@keyframes woven-sound { from { clip-path: inset(0 100% 0 0); } }
@keyframes woven-bigger { from { transform: scale(0.7); } }

/* The weaver's mark: a woven label with the proof, and the threads loosening into an invitation. */
.woven-label { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(8rem, 100%), 1fr)); gap: var(--ggds-space-1); margin: var(--ggds-space-6) 0 0; padding: var(--ggds-space-2); border: 2px dashed var(--ggds-color-flag-gold); border-radius: var(--ggds-radius-md); background: var(--ggds-color-institution-deep); }
.woven-label div { padding: var(--ggds-space-3); }
.woven-label dt { color: var(--ggds-color-text-inverse); font-size: var(--ggds-font-size-sm); }
.woven-label dd { margin: 0; color: var(--ggds-color-flag-gold); font-size: var(--ggds-font-size-2xl); font-weight: var(--ggds-font-weight-bold); line-height: var(--ggds-line-height-tight); }
.woven-label__note { display: block; margin-top: var(--ggds-space-1); color: var(--ggds-color-text-inverse); font-size: var(--ggds-font-size-sm); font-weight: var(--ggds-font-weight-regular); }
.woven-mark__threads { display: block; width: 100%; height: var(--ggds-space-16); margin: var(--ggds-space-4) 0; }
.woven-mark__threads path { fill: none; stroke-width: 4; }
.woven-mark__cta { margin: 0 0 var(--ggds-space-3); font-size: var(--ggds-font-size-xl); }

/* Moments the general scroll effects do not cover: the shuttle crossing the strip in scene 2, and the pale thread
   falling away in scene 1. Only where scenes are pinned, as in motion.css. On a still page there is no pale thread:
   it exists only to fall. */
.woven-faint { display: none; }
@media (prefers-reduced-motion: no-preference) and (min-width: 64rem) and (min-height: 36rem) {
  @supports (animation-timeline: view()) {
    .ggds-scene--pinned .woven-strip-shuttle { animation: woven-strip-shuttle linear both; animation-timeline: --ggds-scene; animation-range: contain 6% contain 64%; }
    .ggds-scene--pinned .woven-faint { display: inline; animation: woven-fall linear both; animation-timeline: --ggds-scene; animation-range: contain 34% contain 52%; }
  }
}
/* On a phone (motion.css: the drawing builds as it rises up the screen) the same moments follow the drawing. */
@media (prefers-reduced-motion: no-preference) and (max-width: 63.99rem) {
  @supports (animation-timeline: view()) {
    .ggds-scene--pinned .woven-strip-shuttle { animation: woven-strip-shuttle linear both; animation-timeline: --ggds-scene-art; animation-range: cover 8% cover 50%; }
    .ggds-scene--pinned .woven-faint { display: inline; animation: woven-fall linear both; animation-timeline: --ggds-scene-art; animation-range: cover 22% cover 36%; }
  }
}
@keyframes woven-strip-shuttle {
  0% { transform: translateX(0); }
  33% { transform: translateX(370px); }
  66% { transform: translateX(0); }
  100% { transform: translateX(370px); opacity: 0; }
}
@keyframes woven-fall {
  to { opacity: 0; transform: translateY(var(--ggds-space-12)); }
}
`;
}

/**
 * The woven thread through the whole documentation site (assets/woven-site.css), on every documentation page and never
 * on an example, a showcase service or an example site: their pages stay still, as services must.
 *
 *   between pages   the header stays, the new page settles in (a cross-document view transition)
 *   reading thread  a woven thread under the header fills as people read down the page
 *   page titles     a short woven strip under each page's title, woven in as the page opens
 *   headings        a stitch under each section heading, drawn as it comes into view
 *   cards           arrive in turn; pointing at one draws a woven edge across its top
 *   footer, sidebar the footer's woven band unrolls as it comes into view; the current page is marked with a thread
 *
 * Only transform and opacity move. What plays by itself (the page change, the title strip) ends within a second; the
 * rest follows the scroll. Nothing moves for people who ask for less motion.
 */
export function wovenSiteCss() {
  const band = `repeating-linear-gradient(90deg, var(--ggds-color-flag-gold) 0 14px, var(--ggds-color-flag-green) 14px 20px, var(--ggds-color-flag-gold) 20px 34px, var(--ggds-color-flag-red) 34px 40px, var(--ggds-color-flag-black) 40px 44px)`;
  const stitch = `linear-gradient(90deg, var(--ggds-color-flag-red) 0 33%, var(--ggds-color-flag-gold) 33% 66%, var(--ggds-color-flag-green) 66%)`;
  return `/* Generated by docs/woven.mjs: the woven thread through the documentation site. GGDS tokens only. */

/* Page titles wear the cloth: a short woven strip under each one. */
.ggds-main h1:not([class])::after {
  content: "";
  display: block;
  width: var(--ggds-space-16);
  height: 6px;
  margin-top: var(--ggds-space-3);
  border-radius: 3px;
  background: ${band};
  transform-origin: 0 50%;
}

/* Section headings get a stitch. */
.ggds-main h2:not([class])::after {
  content: "";
  display: block;
  width: var(--ggds-space-8);
  height: 3px;
  margin-top: var(--ggds-space-2);
  border-radius: 2px;
  background: ${stitch};
  transform-origin: 0 50%;
}

/* The current page in a section's menu is marked with a woven thread. */
.docs-sidenav__link[aria-current="page"] {
  box-shadow: none;
  background: linear-gradient(var(--ggds-color-flag-gold) 0 33%, var(--ggds-color-flag-red) 33% 66%, var(--ggds-color-flag-green) 66%) left / 4px 100% no-repeat;
}

/* Cards: a woven edge, drawn across the top when people point at one, that bends round the card's corners at the
   same 4px all the way. It is a cap the card's own shape: laid over its border, as tall as its rounding, with the
   card's outer corners, and hollowed out 4px in from the top and sides (the mask), so its inner edge is the same
   curve 4px in. (A 4px-tall strip cannot: its corners are squashed to fit its height and stick out past the
   border.) It is drawn in by uncovering it left to right, so the shape never stretches. */
.ggds-main .ggds-card:not(.ggds-card--institution)::before {
  content: "";
  box-sizing: border-box;
  position: absolute;
  inset: -1px -1px auto;
  height: var(--ggds-radius-lg);
  padding: 4px 4px 0;
  border-radius: var(--ggds-radius-lg) var(--ggds-radius-lg) 0 0;
  background: ${band};
  mask: linear-gradient(var(--ggds-color-text) 0 0) content-box exclude, linear-gradient(var(--ggds-color-text) 0 0);
  pointer-events: none;
  clip-path: inset(0 100% 0 0);
}
.ggds-main .ggds-card:not(.ggds-card--institution):has(.ggds-card__link:is(:hover, :focus-visible))::before { clip-path: inset(0); }
/* Once someone has chosen an institution (docs/theme-pref.js: until they reload), the edge is in its colour. */
:root[data-docs-theme-chosen] .ggds-main .ggds-card:not(.ggds-card--institution)::before { background: var(--ggds-color-institution); }

/* The reading thread: hidden unless the browser can follow the scroll. */
.ggds-header::after { content: none; }

@media (prefers-reduced-motion: no-preference) {
  /* Between pages: the header stays where it is, and the new page settles in. */
  @view-transition { navigation: auto; }
  .ggds-header { view-transition-name: docs-header; }
  ::view-transition-old(root) { animation: woven-page-out var(--ggds-motion-duration-fast) ease-in both; }
  ::view-transition-new(root) { animation: woven-page-in var(--ggds-motion-duration-slow) cubic-bezier(0.16, 1, 0.3, 1) both; }

  /* As a page opens, its title's strip is woven in, left to right. */
  .ggds-main h1:not([class])::after { animation: woven-weave-in 600ms cubic-bezier(0.16, 1, 0.3, 1) 150ms both; }

  .ggds-main .ggds-card:not(.ggds-card--institution)::before { transition: clip-path var(--ggds-motion-duration-base) cubic-bezier(0.16, 1, 0.3, 1); }

  @supports (animation-timeline: view()) {
    /* The reading thread under the header, filling as people read. */
    .ggds-header::after {
      content: "";
      position: absolute;
      inset: auto 0 -3px;
      height: 3px;
      background: ${band};
      transform-origin: 0 50%;
      animation: woven-read linear both;
      animation-timeline: scroll(root);
    }

    /* A heading's stitch draws as the heading comes into view. */
    .ggds-main h2:not([class])::after { animation: woven-weave-in linear both; animation-timeline: view(); animation-range: entry 20% cover 30%; }

    /* Cards arrive in turn. */
    .ggds-main :is(.ggds-card-grid, .docs-themes) > * { animation: woven-rise linear both; animation-timeline: view(); animation-range: entry 0% entry 90%; }
    .ggds-main :is(.ggds-card-grid, .docs-themes) > :nth-child(3n + 2) { animation-range: entry 8% entry 98%; }
    .ggds-main :is(.ggds-card-grid, .docs-themes) > :nth-child(3n) { animation-range: entry 16% cover 30%; }

    /* The footer's woven band unrolls from the middle as it comes into view. */
    .ggds-footer::before { animation: woven-unroll linear both; animation-timeline: view(); animation-range: entry 0% entry 100%; }
  }
}

@keyframes woven-page-out { to { opacity: 0; } }
@keyframes woven-page-in { from { opacity: 0; transform: translateY(var(--ggds-space-2)); } }
@keyframes woven-weave-in { from { transform: scaleX(0); } }
@keyframes woven-read { from { transform: scaleX(0); } }
@keyframes woven-rise { from { transform: translateY(var(--ggds-space-6)); } } /* no fading: a card's words stay at full contrast */
@keyframes woven-unroll { from { transform: scaleX(0.15); } }
`;
}
