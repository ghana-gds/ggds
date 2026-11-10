// The documentation homepage's hero drawing: what GGDS is, in one picture. A web page assembles from GGDS parts
// (banner, header with the flag line, hero, cards, footer), then cycles through institution themes. Only the
// identity parts change colour; links, cards and the button stay the same, as the theme rule says. Parts float
// beside it. Decorative (the hero text says the same), CSS animation only, still under prefers-reduced-motion.
// In the style of the MoCDTI platform's hero scenes (apps/web/src/components/DefaultHeroArt.astro).

/** themes: [{ shortName, accent, deep }]. Returns the SVG markup and the CSS it needs. */
export function heroArt(themes) {
  // Every movement ends within 5 seconds, then the drawing stays still (WCAG 2.2.2): the page assembles, then three
  // themes show for a second each, ending on the first.
  const cycle = themes.slice(0, 3);
  const n = cycle.length;
  const step = 100 / n;
  const pct = (x) => `${Math.round(x * 100) / 100}%`;
  // Hold each theme, then change quickly to the next.
  const frames = (prop, key) => cycle.map((t, i) => `${pct(i * step)}, ${pct((i + 1) * step - 1.5)} { ${prop}: ${t[key]}; }`).join(' ') + ` 100% { ${prop}: ${cycle[0][key]}; }`;
  const slot = 0.95;
  const seconds = Math.round(n * slot * 100) / 100;
  const start = 2.05;
  const t = (x) => Math.round(x * 100) / 100;
  const labels = cycle.map((t, i) => `<text class="ga-theme-name ga-theme-name--${i}" x="280" y="471" text-anchor="middle">Theme: ${t.shortName}</text>`).join('');
  // Each label shows during its theme's second. The first shows before and after, and hides while the others show.
  const labelCss = [`.ga-theme-name--0 { animation: ga-hide ${t((n - 1) * slot)}s linear ${t(start + slot)}s 1; }`,
    ...cycle.slice(1).map((_, j) => `.ga-theme-name--${j + 1} { animation: ga-label ${slot}s linear ${t(start + (j + 1) * slot)}s 1; }`)].join('\n');

  const svg = `<svg class="ga" viewBox="0 0 560 490" focusable="false" role="presentation">
  <defs>
    <filter id="ga-blur"><feGaussianBlur stdDeviation="12"/></filter>
    <clipPath id="ga-page"><rect x="130" y="34" width="300" height="392" rx="14"/></clipPath>
  </defs>
  <ellipse cx="280" cy="440" rx="170" ry="20" class="ga-shadow" filter="url(#ga-blur)"/>
  <path class="ga-orbit" d="M70 300C80 150 210 50 360 70s170 140 110 250"/>

  <g class="ga-float">
    <g clip-path="url(#ga-page)">
      <rect class="ga-page" x="130" y="34" width="300" height="392" rx="14"/>
      <g class="ga-part ga-part--1">
        <rect class="ga-sunken" x="130" y="34" width="300" height="14"/>
        <rect class="ga-flag-red" x="142" y="38" width="10" height="2.4"/><rect class="ga-flag-gold" x="142" y="40.4" width="10" height="2.4"/><rect class="ga-flag-green" x="142" y="42.8" width="10" height="2.4"/>
        <rect class="ga-ink-faint" x="158" y="39" width="70" height="5" rx="2.5"/>
      </g>
      <g class="ga-part ga-part--2">
        <rect class="ga-flag-red" x="130" y="48" width="100" height="3"/><rect class="ga-flag-gold" x="230" y="48" width="100" height="3"/><rect class="ga-flag-green" x="330" y="48" width="100" height="3"/>
        <rect class="ga-white" x="130" y="51" width="300" height="34"/>
        <circle class="ga-accent" cx="150" cy="68" r="10"/>
        <rect class="ga-accent" x="166" y="61" width="64" height="6" rx="3"/>
        <rect class="ga-ink-faint" x="166" y="71" width="40" height="4" rx="2"/>
        <rect class="ga-ink" x="268" y="65" width="26" height="5" rx="2.5"/><rect class="ga-ink" x="300" y="65" width="26" height="5" rx="2.5"/><rect class="ga-ink" x="332" y="65" width="26" height="5" rx="2.5"/>
        <circle class="ga-link-stroke" cx="410" cy="67" r="5"/>
        <rect class="ga-accent" x="130" y="85" width="300" height="3"/>
      </g>
      <g class="ga-part ga-part--3">
        <rect class="ga-deep" x="130" y="88" width="300" height="118"/>
        <rect class="ga-flag-gold" x="150" y="104" width="150" height="6" rx="3"/>
        <rect class="ga-white" x="150" y="118" width="190" height="12" rx="4"/>
        <rect class="ga-white" x="150" y="135" width="130" height="12" rx="4"/>
        <rect class="ga-white" x="150" y="160" width="200" height="22" rx="6"/>
        <rect class="ga-flag-gold" x="318" y="160" width="32" height="22" rx="6"/>
        <rect class="ga-chip" x="150" y="189" width="54" height="10" rx="5"/><rect class="ga-chip" x="210" y="189" width="62" height="10" rx="5"/><rect class="ga-chip" x="278" y="189" width="48" height="10" rx="5"/>
      </g>
      <g class="ga-part ga-part--4">
        <rect class="ga-card" x="146" y="222" width="84" height="74" rx="8"/><rect class="ga-card" x="238" y="222" width="84" height="74" rx="8"/><rect class="ga-card" x="330" y="222" width="84" height="74" rx="8"/>
        <rect class="ga-link" x="156" y="234" width="52" height="6" rx="3"/><rect class="ga-link" x="248" y="234" width="58" height="6" rx="3"/><rect class="ga-link" x="340" y="234" width="46" height="6" rx="3"/>
        <rect class="ga-ink-faint" x="156" y="248" width="62" height="4" rx="2"/><rect class="ga-ink-faint" x="248" y="248" width="60" height="4" rx="2"/><rect class="ga-ink-faint" x="340" y="248" width="62" height="4" rx="2"/>
        <rect class="ga-ink-faint" x="156" y="257" width="48" height="4" rx="2"/><rect class="ga-ink-faint" x="248" y="257" width="40" height="4" rx="2"/><rect class="ga-ink-faint" x="340" y="257" width="50" height="4" rx="2"/>
        <rect class="ga-button" x="156" y="272" width="44" height="14" rx="4"/>
      </g>
      <g class="ga-part ga-part--5">
        <rect class="ga-ink-faint" x="146" y="312" width="150" height="6" rx="3"/>
        <rect class="ga-ink-faint" x="146" y="324" width="230" height="4" rx="2"/>
        <rect class="ga-ink-faint" x="146" y="333" width="200" height="4" rx="2"/>
      </g>
      <g class="ga-part ga-part--6">
        <rect class="ga-kente" x="130" y="352" width="300" height="5"/>
        <rect class="ga-deep" x="130" y="357" width="300" height="69"/>
        <rect class="ga-white-soft" x="146" y="372" width="70" height="6" rx="3"/>
        <rect class="ga-white-soft" x="146" y="384" width="90" height="4" rx="2"/>
        <rect class="ga-white-soft" x="270" y="372" width="40" height="4" rx="2"/><rect class="ga-white-soft" x="270" y="382" width="50" height="4" rx="2"/><rect class="ga-white-soft" x="270" y="392" width="34" height="4" rx="2"/>
        <rect class="ga-white-soft" x="350" y="372" width="44" height="4" rx="2"/><rect class="ga-white-soft" x="350" y="382" width="36" height="4" rx="2"/>
      </g>
    </g>
    <rect class="ga-page-edge" x="130" y="34" width="300" height="392" rx="14"/>
  </g>

  <g class="ga-bit ga-bit--button"><rect class="ga-button" x="20" y="120" width="92" height="30" rx="7"/><rect class="ga-white" x="38" y="132" width="56" height="6" rx="3"/></g>
  <g class="ga-bit ga-bit--field"><rect class="ga-white-soft" x="28" y="214" width="56" height="5" rx="2.5"/><rect class="ga-field" x="20" y="226" width="96" height="28" rx="5"/></g>
  <g class="ga-bit ga-bit--tag"><rect class="ga-tag" x="456" y="150" width="78" height="24" rx="12"/><circle class="ga-gold-dot" cx="472" cy="162" r="4"/><rect class="ga-white" x="482" y="159" width="40" height="6" rx="3"/></g>
  <g class="ga-bit ga-bit--check"><circle class="ga-check-ring" cx="492" cy="282" r="26"/><path class="ga-check" d="m479 282 9 9 17-18"/></g>

  <g class="ga-labels">${labels}</g>
</svg>`;

  const css = `
/* Homepage hero drawing (docs/hero-art.mjs) */
.ga { display: block; width: 100%; max-width: 560px; height: auto; margin-inline: auto; overflow: visible; font-family: var(--ggds-font-family-sans); }
.ga-shadow { fill: var(--ggds-color-text); opacity: .35; }
.ga-orbit { fill: none; stroke: var(--ggds-color-text-inverse); stroke-opacity: .2; stroke-width: 2; stroke-dasharray: 5 12; transform-origin: 280px 250px; }
.ga-page { fill: var(--ggds-color-surface); }
.ga-page-edge { fill: none; stroke: var(--ggds-color-text-inverse); stroke-opacity: .5; stroke-width: 2; }
.ga-sunken { fill: var(--ggds-color-surface-sunken); }
.ga-white { fill: var(--ggds-color-surface); }
.ga-white-soft { fill: var(--ggds-color-text-inverse); opacity: .55; }
.ga-ink { fill: var(--ggds-color-text); opacity: .75; }
.ga-ink-faint { fill: var(--ggds-color-text-muted); opacity: .35; }
.ga-link { fill: var(--ggds-color-link); }
.ga-link-stroke { fill: none; stroke: var(--ggds-color-link); stroke-width: 2.5; }
.ga-button { fill: var(--ggds-color-brand-700); }
.ga-card { fill: var(--ggds-color-surface); stroke: var(--ggds-color-border-subtle); stroke-width: 1.5; }
.ga-chip { fill: var(--ggds-color-text-inverse); opacity: .22; }
.ga-flag-red { fill: var(--ggds-color-flag-red); }
.ga-flag-gold, .ga-gold-dot { fill: var(--ggds-color-flag-gold); }
.ga-flag-green { fill: var(--ggds-color-flag-green); }
.ga-kente { fill: var(--ggds-color-flag-gold); }
.ga-field { fill: var(--ggds-color-surface); stroke: var(--ggds-color-border-control); stroke-width: 2; }
.ga-tag { fill: var(--ggds-color-text-inverse); fill-opacity: .16; stroke: var(--ggds-color-text-inverse); stroke-opacity: .5; }
.ga-check-ring { fill: var(--ggds-color-text-inverse); fill-opacity: .12; stroke: var(--ggds-color-flag-gold); stroke-width: 2.5; }
.ga-check { fill: none; stroke: var(--ggds-color-flag-gold); stroke-width: 4; stroke-linecap: round; stroke-linejoin: round; }
.ga-accent { fill: ${cycle[0].accent}; }
.ga-deep { fill: ${cycle[0].deep}; }
.ga-theme-name { fill: var(--ggds-color-text-inverse); font-size: 15px; font-weight: 700; opacity: 0; }
.ga-theme-name--0 { opacity: 1; }
@media (prefers-reduced-motion: no-preference) {
  .ga-orbit { animation: ga-drift 18s linear 0.27 forwards; }
  .ga-float { animation: ga-float 7s ease-in-out 0.7 forwards; }
  .ga-part { opacity: 0; animation: ga-in .6s cubic-bezier(.2,.8,.2,1) forwards; }
  .ga-part--1 { animation-delay: .2s; } .ga-part--2 { animation-delay: .55s; } .ga-part--3 { animation-delay: .9s; }
  .ga-part--4 { animation-delay: 1.25s; } .ga-part--5 { animation-delay: 1.6s; } .ga-part--6 { animation-delay: 1.95s; }
  .ga-accent { animation: ga-accent ${seconds}s linear ${start}s 1; }
  .ga-deep { animation: ga-deep ${seconds}s linear ${start}s 1; }
  ${labelCss}
  .ga-bit { animation: ga-bob 4.8s ease-in-out 1; }
  .ga-bit--field { animation-delay: -1.5s; } .ga-bit--tag { animation-delay: -3s; } .ga-bit--check { animation-delay: -4.5s; }
  .ga-check { stroke-dasharray: 48; stroke-dashoffset: 48; animation: ga-draw 1s ease-out 2.6s forwards; }
}
@keyframes ga-in { from { opacity: 0; transform: translateY(-14px); } to { opacity: 1; transform: none; } }
@keyframes ga-float { 50% { transform: translateY(-8px); } }
@keyframes ga-bob { 50% { transform: translateY(10px); } }
@keyframes ga-drift { to { transform: rotate(360deg); } }
@keyframes ga-draw { to { stroke-dashoffset: 0; } }
@keyframes ga-accent { ${frames('fill', 'accent')} }
@keyframes ga-deep { ${frames('fill', 'deep')} }
@keyframes ga-label { 0%, 92% { opacity: 1; } 100% { opacity: 0; } }
@keyframes ga-hide { from, to { opacity: 0; } }
`;
  return { svg, css };
}
