// GGDS icons: 24px grid, drawn with stroke="currentColor". Decorative: the text beside each icon names it.
// Used by the Astro components and the documentation site, so both draw the same icons.
export const ICONS = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 9.5V20h13V9.5"/>',
  building: '<path d="M4 20h16M6 20V9l6-4 6 4v11"/><path d="M10 20v-5h4v5"/>',
  services: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 9h8M8 13h8M8 17h5"/>',
  help: '<circle cx="12" cy="12" r="8.5"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14"/><path d="M12 17h.01"/>',
  comment: '<path d="M5 5h14v10H9l-4 4z"/>',
  scale: '<path d="M12 4v16M7 20h10M5 8h14"/><path d="m5 8-2.5 6a2.5 2.5 0 0 0 5 0z"/><path d="m19 8-2.5 6a2.5 2.5 0 0 0 5 0z"/>',
  chart: '<path d="M4 20V4M4 20h16"/><path d="M8 16v-5M12 16V8M16 16v-3"/>',
  megaphone: '<path d="M4 10v4h3l7 4V6L7 10z"/><path d="M17.5 9a4 4 0 0 1 0 6"/>',
  book: '<path d="M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h10"/>',
};

/** An icon as SVG markup. cls: its class. */
export const icon = (name, cls) => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONS[name] ?? ICONS.services}</svg>`;
