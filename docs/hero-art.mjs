// The documentation homepage's hero drawing: what GGDS is, in one picture, read from the bottom up.
//   Foundations  the colours (the flag's and the institution's), type, icons, spacing, and the accessibility bar
//   Components   real parts with real words: a button, a Ghana Card number field, a status tag, a confirmation
//   Services     one government service built from them, on a computer and on a phone
// Interactive: every part links to its documentation, and pointing at or tabbing to it shows what it is and where it
// is used. No script: CSS only. The parts assemble once from the bottom up, the arrows ("build") draw themselves
// between the layers, and a light carries the message up from the foundations through the components to the service,
// lighting each layer as it arrives. Then the drawing stays still, all within 5 seconds (WCAG 2.2.2), and none of it
// moves under prefers-reduced-motion.
import { ICONS } from '../packages/icons/dist/all.js';

/**
 * themes: [{ shortName, accent, deep }]; the first (the default theme) colours the drawing. The service links to the
 * showcase. Returns the SVG and its CSS.
 */
export function heroArt(themes, { iconCount = Object.keys(ICONS).length } = {}) {
  const { accent, deep } = themes[0];
  // The three thirds of the flag line across a width w starting at x.
  const flagLine = (x, y, w, h) => {
    const third = Math.round((w / 3) * 100) / 100;
    return `<rect class="ga-flag-red" x="${x}" y="${y}" width="${third}" height="${h}"/><rect class="ga-flag-gold" x="${x + third}" y="${y}" width="${third}" height="${h}"/><rect class="ga-flag-green" x="${x + 2 * third}" y="${y}" width="${Math.round((w - 2 * third) * 100) / 100}" height="${h}"/>`;
  };
  const flagMini = (x, y) => `<rect class="ga-flag-red" x="${x}" y="${y}" width="8" height="2"/><rect class="ga-flag-gold" x="${x}" y="${y + 2}" width="8" height="2"/><rect class="ga-flag-green" x="${x}" y="${y + 4}" width="8" height="2"/>`;

  // Every part is a link to its documentation. Pointing at or tabbing to one rings it, fades the other parts, shows
  // where it is used in the service above, and changes the caption: CSS only (:hover, :focus-visible and :has()).
  // The service at the top leads to what you can build: the showcase (docs/showcase.mjs).
  const services = 'showcase/index.html';
  const PARTS = [
    // [key, href, link name, caption, ring as SVG, drawing]
    ['colour', 'foundations.html#colour', 'Colours', 'Colours: the flag’s, and one for each institution, all checked for contrast.',
      '<rect class="ga-ring" x="104" y="426" width="120" height="36" rx="18"/>',
      '<circle class="ga-flag-red" cx="122" cy="444" r="12"/><circle class="ga-flag-gold" cx="150" cy="444" r="12"/><circle class="ga-flag-green" cx="178" cy="444" r="12"/><circle class="ga-swatch" cx="206" cy="444" r="12"/>'],
    ['type', 'foundations.html#text', 'Aa: type', 'Type: one typeface, in sizes that stay easy to read on a phone.',
      '<rect class="ga-ring" x="226" y="426" width="52" height="36" rx="8"/>',
      '<text class="ga-type" x="232" y="455">Aa</text>'],
    ['icons', 'icons.html', 'Icons', `Icons: ${iconCount} line icons drawn for government services.`,
      '<rect class="ga-ring" x="280" y="426" width="38" height="36" rx="8"/>',
      `<g class="ga-icon" transform="translate(284 429) scale(1.25)">${ICONS['id-card']}</g>`],
    ['spacing', 'foundations.html#spacing', 'Spacing', 'Spacing: one scale, so every page lines up.',
      '<rect class="ga-ring" x="326" y="426" width="78" height="36" rx="8"/>',
      '<path class="ga-space" d="M332 456v-6h6v6zM344 456v-10h10v10zM360 456v-14h14v14zM380 456v-18h18v18z"/>'],
    ['access', 'accessibility.html', 'WCAG 2.2 AA: accessibility', 'Accessibility: every part is tested against WCAG 2.2 AA.',
      '<rect class="ga-ring" x="410" y="426" width="128" height="36" rx="18"/>',
      '<rect class="ga-badge" x="414" y="430" width="120" height="28" rx="14"/><text class="ga-badge-text" x="474" y="449" text-anchor="middle">WCAG 2.2 AA</text>'],
    ['button', 'components/button.html', 'Continue: button', 'Button: the same button on every page and every screen.',
      '<rect class="ga-ring" x="105" y="343" width="110" height="46" rx="8"/>',
      '<rect class="ga-button" x="110" y="348" width="100" height="36" rx="5"/><text class="ga-button-text" x="160" y="371" text-anchor="middle">Continue</text>'],
    ['field', 'components/field.html', 'Ghana Card number: text input', 'Text input: a question with its label and hint, in every form.',
      '<rect class="ga-ring" x="222" y="328" width="162" height="62" rx="8"/>',
      '<text class="ga-small" x="228" y="342">Ghana Card number</text><rect class="ga-field" x="228" y="350" width="150" height="34" rx="4"/>'],
    ['tag', 'components/tag.html', 'Approved: tag', 'Tag: a status, such as “Approved”, said in words and not only colour.',
      '<rect class="ga-ring" x="391" y="347" width="96" height="36" rx="8"/>',
      '<rect class="ga-tag-bg" x="396" y="352" width="86" height="26" rx="4"/><text class="ga-tag-text" x="439" y="370" text-anchor="middle">Approved</text>'],
    ['panel', 'components/panel.html', 'Confirmation panel', 'Confirmation panel: tells people the service worked.',
      '<circle class="ga-ring" cx="516" cy="365" r="23"/>',
      '<circle class="ga-check-ring" cx="516" cy="365" r="17"/><path class="ga-check" d="m508 365 6 6 10-11"/>'],
  ];
  // Where each part is used in the service: rings drawn over the computer and the phone.
  const USES = {
    colour: [[108, 50, 304, 34], [396, 102, 108, 30], [108, 230, 282, 36], [396, 266, 108, 32]],
    type: [[121, 103, 160, 34], [401, 133, 90, 27]],
    icons: [[382, 60, 16, 16], [480, 108, 20, 18]],
    spacing: [[118, 90, 168, 140], [400, 132, 98, 120]],
    button: [[122, 202, 68, 26], [402, 228, 60, 24]],
    field: [[121, 161, 140, 39], [401, 161, 98, 33]],
    tag: [[306, 160, 52, 20]],
  };
  const link = ([key, href, name, , ring, drawing]) => `<a class="ga-hit ga-hit--${key}" href="${href}" aria-label="${name}">${ring}${drawing}</a>`;
  const caption = (key, text) => `<text class="ga-tip ga-tip--${key}" x="-18" y="500">${text}</text>`;
  const PARTS_FOUNDATIONS = PARTS.slice(0, 5);
  const PARTS_COMPONENTS = PARTS.slice(5);

  const svg = `<svg class="ga" viewBox="-28 0 588 512" role="group" aria-label="What GGDS is made of">
  <defs>
    <filter id="ga-blur"><feGaussianBlur stdDeviation="10"/></filter>
    <filter id="ga-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="4"/></filter>
    <clipPath id="ga-desktop"><rect x="110" y="24" width="300" height="240" rx="10"/></clipPath>
    <clipPath id="ga-phone"><rect x="398" y="96" width="104" height="200" rx="4"/></clipPath>
  </defs>

  <g class="ga-labels" aria-hidden="true">
    <text class="ga-label ga-label--foundations" x="-18" y="452">Foundations</text>
    <text class="ga-label ga-label--components" x="-18" y="374">Components</text>
    <text class="ga-label ga-label--services" x="-18" y="144">Services</text>
    <!-- Foundations build components; components build services: each arrow draws itself as its layer arrives. -->
    <g class="ga-arrow ga-arrow--1">
      <path class="ga-arrow-line" d="M24 432V400" pathLength="1"/>
      <path class="ga-arrow-head" d="M17 401l7-9 7 9z"/>
      <text class="ga-arrow-word" x="36" y="420">build</text>
    </g>
    <g class="ga-arrow ga-arrow--2">
      <path class="ga-arrow-line" d="M24 352V176" pathLength="1"/>
      <path class="ga-arrow-head" d="M17 177l7-9 7 9z"/>
      <text class="ga-arrow-word" x="36" y="268">build</text>
    </g>
    <!-- The message: a light that travels up from the foundations, through the components, to the service. -->
    <circle class="ga-message-glow" cx="24" cy="432" r="10"/>
    <circle class="ga-message" cx="24" cy="432" r="5"/>
  </g>

  <g class="ga-layer ga-layer--foundations">
    ${PARTS_FOUNDATIONS.map(link).join('\n    ')}
  </g>

  <g class="ga-layer ga-layer--components">
    ${PARTS_COMPONENTS.map(link).join('\n    ')}
    <text class="ga-field-text" x="238" y="372" aria-hidden="true">GHA-</text>
  </g>

  <g class="ga-layer ga-layer--services">
    <ellipse class="ga-shadow" cx="310" cy="300" rx="190" ry="12" filter="url(#ga-blur)"/>
    <a class="ga-hit ga-hit--services" href="${services}" aria-label="What you can build">
    <rect class="ga-ring" x="100" y="14" width="418" height="304" rx="16"/>
    <g clip-path="url(#ga-desktop)">
      <rect class="ga-page" x="110" y="24" width="300" height="240"/>
      <rect class="ga-chrome" x="110" y="24" width="300" height="18"/>
      <circle class="ga-ink-faint" cx="122" cy="33" r="3"/><circle class="ga-ink-faint" cx="132" cy="33" r="3"/><circle class="ga-ink-faint" cx="142" cy="33" r="3"/>
      <rect class="ga-white" x="160" y="29" width="150" height="8" rx="4"/>
      <rect class="ga-sunken" x="110" y="42" width="300" height="10"/>${flagMini(118, 44)}<rect class="ga-ink-faint" x="130" y="45" width="70" height="4" rx="2"/>
      ${flagLine(110, 52, 300, 3)}
      <rect class="ga-accent" x="110" y="83" width="300" height="2"/>
      <circle class="ga-accent" cx="128" cy="69" r="8"/>
      <rect class="ga-accent" x="142" y="63" width="60" height="6" rx="3"/><rect class="ga-ink-faint" x="142" y="72" width="36" height="4" rx="2"/>
      <rect class="ga-ink" x="282" y="66" width="24" height="5" rx="2.5"/><rect class="ga-ink" x="312" y="66" width="24" height="5" rx="2.5"/><rect class="ga-ink" x="342" y="66" width="24" height="5" rx="2.5"/>
      <circle class="ga-link-stroke" cx="390" cy="68" r="4.5"/>
      <rect class="ga-ink-faint" x="126" y="96" width="60" height="4" rx="2"/>
      <rect class="ga-ink" x="126" y="108" width="150" height="10" rx="3"/><rect class="ga-ink" x="126" y="122" width="100" height="10" rx="3"/>
      <rect class="ga-ink-faint" x="126" y="142" width="160" height="4" rx="2"/><rect class="ga-ink-faint" x="126" y="150" width="140" height="4" rx="2"/>
      <rect class="ga-ink" x="126" y="166" width="70" height="5" rx="2.5"/>
      <rect class="ga-field" x="126" y="176" width="130" height="20" rx="3"/>
      <rect class="ga-button" x="126" y="206" width="60" height="18" rx="3"/><rect class="ga-white" x="136" y="213" width="40" height="4" rx="2"/>
      <rect class="ga-card" x="300" y="108" width="94" height="80" rx="6"/>
      <rect class="ga-link" x="310" y="120" width="60" height="5" rx="2.5"/>
      <rect class="ga-ink-faint" x="310" y="132" width="70" height="4" rx="2"/><rect class="ga-ink-faint" x="310" y="140" width="56" height="4" rx="2"/><rect class="ga-ink-faint" x="310" y="148" width="64" height="4" rx="2"/>
      <rect class="ga-tag-bg" x="310" y="164" width="44" height="12" rx="3"/><rect class="ga-tag-ink" x="316" y="168" width="32" height="4" rx="2"/>
      <rect class="ga-flag-gold" x="110" y="232" width="300" height="3"/>
      <rect class="ga-deep" x="110" y="235" width="300" height="29"/>
      <rect class="ga-white-soft" x="126" y="244" width="60" height="5" rx="2.5"/><rect class="ga-white-soft" x="126" y="254" width="90" height="3" rx="1.5"/>
      <rect class="ga-white-soft" x="290" y="245" width="40" height="3" rx="1.5"/><rect class="ga-white-soft" x="340" y="245" width="50" height="3" rx="1.5"/>
    </g>
    <rect class="ga-edge" x="110" y="24" width="300" height="240" rx="10"/>

    <g class="ga-phone">
      <rect class="ga-phone-body" x="392" y="84" width="116" height="224" rx="16"/>
      <rect class="ga-phone-notch" x="436" y="89" width="28" height="4" rx="2"/>
      <g clip-path="url(#ga-phone)">
        <rect class="ga-page" x="398" y="96" width="104" height="200"/>
        <rect class="ga-sunken" x="398" y="96" width="104" height="8"/>${flagMini(402, 97)}<rect class="ga-ink-faint" x="413" y="99" width="40" height="3" rx="1.5"/>
        ${flagLine(398, 104, 104, 2)}
        <circle class="ga-accent" cx="410" cy="117" r="6"/><rect class="ga-accent" x="420" y="113" width="40" height="5" rx="2.5"/>
        <path class="ga-menu" d="M484 112h12M484 117h12M484 122h12"/>
        <rect class="ga-accent" x="398" y="128" width="104" height="2"/>
        <rect class="ga-ink" x="406" y="138" width="80" height="7" rx="2"/><rect class="ga-ink" x="406" y="148" width="56" height="7" rx="2"/>
        <rect class="ga-ink" x="406" y="166" width="50" height="4" rx="2"/>
        <rect class="ga-field" x="406" y="174" width="88" height="16" rx="3"/>
        <circle class="ga-radio" cx="411" cy="203" r="4"/><rect class="ga-ink-faint" x="419" y="201" width="44" height="4" rx="2"/>
        <circle class="ga-radio" cx="411" cy="215" r="4"/><circle class="ga-ink" cx="411" cy="215" r="1.8"/><rect class="ga-ink-faint" x="419" y="213" width="36" height="4" rx="2"/>
        <rect class="ga-button" x="406" y="232" width="52" height="16" rx="3"/><rect class="ga-white" x="414" y="238" width="36" height="4" rx="2"/>
        <rect class="ga-flag-gold" x="398" y="268" width="104" height="2"/>
        <rect class="ga-deep" x="398" y="270" width="104" height="26"/>
        <rect class="ga-white-soft" x="406" y="278" width="44" height="4" rx="2"/><rect class="ga-white-soft" x="406" y="286" width="64" height="3" rx="1.5"/>
      </g>
    </g>
    </a>
    <g class="ga-uses" aria-hidden="true">
      ${Object.entries(USES).map(([key, rects]) => rects.map(([x, y, w, h]) => `<rect class="ga-use ga-use--${key}" x="${x}" y="${y}" width="${w}" height="${h}" rx="4"/>`).join('')).join('\n      ')}
    </g>
  </g>

  <g class="ga-tips" aria-hidden="true">
    ${caption('default', 'Point to or tab to any part to see what it is and where it is used.')}
    ${PARTS.map(([key, , , text]) => caption(key, text)).join('\n    ')}
    ${caption('services', 'What you can build: services, accounts, data and more, on a computer and a phone.')}
  </g>
</svg>`;

  const css = `
/* Homepage hero drawing (docs/hero-art.mjs) */
.ga { display: block; width: 100%; max-width: 588px; height: auto; margin-inline: auto; overflow: visible; font-family: var(--ggds-font-family-sans); }
.ga-label { fill: var(--ggds-color-flag-gold); font-size: 14px; font-weight: 700; }
.ga-arrow-line { fill: none; stroke: var(--ggds-color-flag-gold); stroke-width: 3; stroke-linecap: round; }
.ga-arrow-head { fill: var(--ggds-color-flag-gold); stroke: var(--ggds-color-flag-gold); stroke-width: 2; stroke-linejoin: round; }
.ga-arrow-word { fill: var(--ggds-color-text-inverse); opacity: .85; font-size: 12px; font-style: italic; }
.ga-message, .ga-message-glow { fill: var(--ggds-color-flag-gold); opacity: 0; pointer-events: none; }
.ga-message-glow { filter: url(#ga-glow); }
.ga-shadow { fill: var(--ggds-color-text); opacity: .35; }
.ga-page, .ga-white { fill: var(--ggds-color-surface); }
.ga-chrome, .ga-sunken { fill: var(--ggds-color-surface-sunken); }
.ga-edge { fill: none; stroke: var(--ggds-color-text-inverse); stroke-opacity: .5; stroke-width: 2; }
.ga-phone-body { fill: var(--ggds-color-text); stroke: var(--ggds-color-text-inverse); stroke-opacity: .5; stroke-width: 2; }
.ga-phone-notch { fill: var(--ggds-color-text-inverse); opacity: .35; }
.ga-white-soft { fill: var(--ggds-color-text-inverse); opacity: .6; }
.ga-ink { fill: var(--ggds-color-text); opacity: .8; }
.ga-ink-faint { fill: var(--ggds-color-text-muted); opacity: .35; }
.ga-link { fill: var(--ggds-color-link); }
.ga-link-stroke, .ga-radio { fill: none; stroke: var(--ggds-color-link); stroke-width: 2; }
.ga-radio { stroke: var(--ggds-color-text); stroke-width: 1.5; }
.ga-menu { fill: none; stroke: var(--ggds-color-text); stroke-width: 2; stroke-linecap: round; }
.ga-button { fill: var(--ggds-color-brand-700); }
.ga-layer--components .ga-button { fill: var(--ggds-color-surface); }
.ga-button-text { fill: var(--ggds-color-brand-700); font-size: 15px; font-weight: 700; }
.ga-card { fill: var(--ggds-color-surface); stroke: var(--ggds-color-border-subtle); stroke-width: 1.5; }
.ga-field { fill: var(--ggds-color-surface); stroke: var(--ggds-color-border-control); stroke-width: 1.5; }
.ga-layer--components .ga-field { stroke-width: 2; }
.ga-small { fill: var(--ggds-color-text-inverse); font-size: 12px; font-weight: 700; }
.ga-field-text { fill: var(--ggds-color-text-muted); font-size: 14px; }
.ga-tag-bg { fill: var(--ggds-color-status-success-subtle); }
.ga-tag-ink { fill: var(--ggds-color-status-success-strong); }
.ga-tag-text { fill: var(--ggds-color-status-success-strong); font-size: 13px; font-weight: 700; }
.ga-check-ring { fill: var(--ggds-color-text-inverse); fill-opacity: .12; stroke: var(--ggds-color-flag-gold); stroke-width: 2.5; }
.ga-check { fill: none; stroke: var(--ggds-color-flag-gold); stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
.ga-flag-red { fill: var(--ggds-color-flag-red); }
.ga-flag-gold { fill: var(--ggds-color-flag-gold); }
.ga-flag-green { fill: var(--ggds-color-flag-green); }
.ga-flag-red, .ga-flag-gold, .ga-flag-green { stroke: none; }
.ga-layer--foundations circle { stroke: var(--ggds-color-text-inverse); stroke-width: 2; }
.ga-swatch { fill: ${accent}; }
.ga-type { fill: var(--ggds-color-text-inverse); font-size: 28px; font-weight: 700; }
.ga-icon { fill: none; stroke: var(--ggds-color-text-inverse); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.ga-space { fill: none; stroke: var(--ggds-color-flag-gold); stroke-width: 2; stroke-linejoin: round; }
.ga-badge { fill: none; stroke: var(--ggds-color-text-inverse); stroke-width: 2; }
.ga-badge-text { fill: var(--ggds-color-text-inverse); font-size: 13px; font-weight: 700; }
.ga-accent { fill: ${accent}; }
.ga-deep { fill: ${deep}; }
/* Interactive: rings, fading, where each part is used, and the caption. */
.ga-hit { cursor: pointer; outline: none; text-decoration: none; }
.ga-hit text { text-decoration: none; }
.ga-hit:focus { outline: none; }
.ga-ring { fill: transparent; stroke: transparent; stroke-width: 3; }
.ga-hit:is(:hover, :focus-visible) .ga-ring { stroke: var(--ggds-color-flag-gold); }
.ga-hit--services .ga-ring { fill: transparent; }
.ga-hit, .ga-use, .ga-tip { transition: opacity .15s ease-out; }
.ga:has(.ga-hit:is(:hover, :focus-visible)) .ga-hit:not(:hover, :focus-visible, .ga-hit--services) { opacity: .4; }
.ga-field-text { pointer-events: none; transition: opacity .15s ease-out; }
.ga:has(.ga-hit:not(.ga-hit--field, .ga-hit--services):is(:hover, :focus-visible)) .ga-field-text { opacity: .4; }
.ga-use { fill: none; stroke: var(--ggds-color-flag-gold); stroke-width: 2.5; opacity: 0; pointer-events: none; }
.ga-tip { fill: var(--ggds-color-text-inverse); font-size: 14px; opacity: 0; }
.ga-tip--default { opacity: .85; }
.ga:has(.ga-hit:is(:hover, :focus-visible)) .ga-tip--default { opacity: 0; }
.ga:has(.ga-hit--colour:is(:hover, :focus-visible)) :is(.ga-tip--colour, .ga-use--colour) { opacity: 1; }
.ga:has(.ga-hit--type:is(:hover, :focus-visible)) :is(.ga-tip--type, .ga-use--type) { opacity: 1; }
.ga:has(.ga-hit--icons:is(:hover, :focus-visible)) :is(.ga-tip--icons, .ga-use--icons) { opacity: 1; }
.ga:has(.ga-hit--spacing:is(:hover, :focus-visible)) :is(.ga-tip--spacing, .ga-use--spacing) { opacity: 1; }
.ga:has(.ga-hit--access:is(:hover, :focus-visible)) :is(.ga-tip--access) { opacity: 1; }
.ga:has(.ga-hit--button:is(:hover, :focus-visible)) :is(.ga-tip--button, .ga-use--button) { opacity: 1; }
.ga:has(.ga-hit--field:is(:hover, :focus-visible)) :is(.ga-tip--field, .ga-use--field) { opacity: 1; }
.ga:has(.ga-hit--tag:is(:hover, :focus-visible)) :is(.ga-tip--tag, .ga-use--tag) { opacity: 1; }
.ga:has(.ga-hit--panel:is(:hover, :focus-visible)) :is(.ga-tip--panel) { opacity: 1; }
.ga:has(.ga-hit--services:is(:hover, :focus-visible)) :is(.ga-tip--services) { opacity: 1; }
/* Moves once, from the bottom up, and is still by 4.4 seconds (WCAG 2.2.2). With reduced motion, the drawing is
   shown finished, and the message does not travel.
   0.2s foundations · 0.8s arrow 1 · 0.9s components · 1.4s arrow 2 · 1.6s services · 2.3s the message leaves the
   foundations · 2.6s reaches the components (they light up, the check draws) · 3.7s reaches the service (it lights up) */
@media (prefers-reduced-motion: no-preference) {
  .ga-layer, .ga-label { opacity: 0; animation: ga-in .7s cubic-bezier(.2,.8,.2,1) forwards; }
  .ga-layer--foundations, .ga-label--foundations { animation-delay: .2s; }
  .ga-layer--components, .ga-label--components { animation-delay: .9s; }
  .ga-layer--services, .ga-label--services { animation-delay: 1.6s; }
  .ga-phone { animation: ga-phone .8s cubic-bezier(.2,.8,.2,1) 1.9s both; }
  .ga-arrow-line { stroke-dasharray: 1; stroke-dashoffset: 1; animation: ga-draw .5s ease-out forwards; }
  .ga-arrow-head, .ga-arrow-word { opacity: 0; animation: ga-fade .3s ease-out forwards; }
  .ga-arrow--1 .ga-arrow-line { animation-delay: .8s; }
  .ga-arrow--1 :is(.ga-arrow-head, .ga-arrow-word) { animation-delay: 1.2s; }
  .ga-arrow--2 .ga-arrow-line { animation-delay: 1.4s; animation-duration: .7s; }
  .ga-arrow--2 :is(.ga-arrow-head, .ga-arrow-word) { animation-delay: 2s; }
  .ga-message, .ga-message-glow { animation: ga-message 1.5s cubic-bezier(.45,0,.55,1) 2.3s both; }
  .ga-layer--foundations .ga-ring { animation: ga-flash .5s ease-out 2.2s; }
  .ga-layer--components .ga-ring { animation: ga-flash .6s ease-out 2.6s; }
  .ga-layer--services .ga-ring { animation: ga-flash .7s ease-out 3.7s; }
  .ga-check { stroke-dasharray: 26; stroke-dashoffset: 26; animation: ga-draw .6s ease-out 2.7s forwards; }
}
@keyframes ga-in { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
@keyframes ga-phone { from { transform: translateX(24px); opacity: 0; } to { transform: none; opacity: 1; } }
@keyframes ga-draw { to { stroke-dashoffset: 0; } }
@keyframes ga-fade { to { opacity: 1; } }
/* Up the first arrow (y 432 to 400), under the Components label, then up the second (352 to 176). */
@keyframes ga-message {
  0% { transform: translateY(0); opacity: 0; }
  6% { opacity: 1; }
  20% { transform: translateY(-32px); opacity: 1; }
  25% { transform: translateY(-52px); opacity: 0; }
  30% { transform: translateY(-80px); opacity: 0; }
  35% { transform: translateY(-86px); opacity: 1; }
  92% { transform: translateY(-256px); opacity: 1; }
  100% { transform: translateY(-262px); opacity: 0; }
}
@keyframes ga-flash { 0%, 100% { stroke: transparent; } 35% { stroke: var(--ggds-color-flag-gold); } }
`;
  return { svg, css };
}
