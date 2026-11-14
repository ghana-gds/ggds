// Documentation site only: the theme builder on the Themes page. Type or pick a colour; the page checks it against
// the institution colour rule (the same file as @ggds/tokens/institution.mjs, copied to assets/theme-rule/ as .js),
// previews it, and gives the theme as CSS and as design tokens for Figma, to copy or download.
//
// Strict Content Security Policy: the preview's colours are set through the CSSOM (style.setProperty), never a
// style attribute. Without JavaScript the builder stays hidden and the page shows the command-line way instead.
import { normaliseHex } from './theme-rule/color.js';
import { SLUG, checkInstitutionColour, institutionCss, institutionTokens } from './theme-rule/institution.js';

const root = document.querySelector('[data-theme-builder]');
if (root) {
  const $ = (id) => document.getElementById(id);
  const picker = $('tb-picker');
  const colour = $('tb-colour');
  const colourField = colour.closest('.ggds-field');
  const colourError = $('tb-colour-error');
  const name = $('tb-name');
  const slug = $('tb-slug');
  const slugField = slug.closest('.ggds-field');
  const slugError = $('tb-slug-error');
  const status = $('tb-status');
  const checks = $('tb-checks');
  const preview = $('tb-preview');
  const previewCaption = $('tb-preview-caption');
  const previewName = $('tb-preview-name');
  const previewPurpose = $('tb-preview-purpose');
  const cssCode = $('tb-css').querySelector('code');
  const tokensCode = $('tb-tokens').querySelector('code');
  const cli = $('tb-cli').querySelector('code');
  const downloadCss = $('tb-download-css');
  const downloadTokens = $('tb-download-tokens');
  const swatchAccent = $('tb-swatch-accent');
  const swatchDeep = $('tb-swatch-deep');
  const valueAccent = $('tb-value-accent');
  const valueDeep = $('tb-value-deep');

  // Only the two download links hold object URLs, so revoke both before making new ones.
  const urls = [];
  const setDownloads = (css, tokens, base) => {
    while (urls.length) URL.revokeObjectURL(urls.pop());
    for (const [a, text, type, file] of [[downloadCss, css, 'text/css', `${base}.css`], [downloadTokens, tokens, 'application/json', `${base}.tokens.json`]]) {
      const url = URL.createObjectURL(new Blob([text], { type }));
      urls.push(url);
      a.href = url;
      a.download = file;
      a.querySelector('[data-file]').textContent = file;
    }
  };

  const setError = (field, error, input, message) => {
    field.classList.toggle('ggds-field--error', Boolean(message));
    error.hidden = !message;
    error.querySelector('[data-message]').textContent = message ?? '';
    if (message) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
  };

  const shellQuote = (s) => `'${s.replaceAll("'", "'\\''")}'`;

  function render({ fromPicker = false } = {}) {
    const hex = normaliseHex(colour.value);
    const slugValue = slug.value.trim();
    const nameValue = name.value.trim();

    setError(colourField, colourError, colour, hex ? null : 'Enter a colour as a hex code, such as #006e35');
    const slugOk = slugValue === '' || SLUG.test(slugValue);
    setError(slugField, slugError, slug, slugOk ? null : 'Use only lower-case letters, digits and hyphens, such as my-agency');
    if (!hex) return;
    if (!fromPicker) picker.value = hex;

    const c = checkInstitutionColour(hex);
    const used = c.ok ? hex : c.suggestion;

    // Status: what the person needs to know first.
    status.className = `ggds-notice ${c.ok ? 'ggds-notice--success' : 'ggds-notice--warning'}`;
    status.replaceChildren();
    const title = document.createElement('p');
    title.className = 'ggds-notice__title';
    const body = document.createElement('p');
    if (c.ok) {
      title.textContent = `${hex} can be your institution's colour`;
      body.textContent = `Its deep shade for the hero and footer is ${c.deep}. Copy or download the theme below.`;
      status.append(title, body);
    } else {
      const ratio = c.checks.find((k) => k.id === 'name-on-white').ratio;
      title.textContent = `${hex} is too light to read on white`;
      body.textContent = `It has ${ratio.toFixed(2)}:1 contrast on white; your institution's name in the header needs 4.5:1. The nearest shade with the same hue that passes is ${c.suggestion}.`;
      const use = document.createElement('button');
      use.type = 'button';
      use.className = 'ggds-button ggds-button--secondary';
      use.textContent = `Use ${c.suggestion} instead`;
      use.addEventListener('click', () => { colour.value = c.suggestion; render(); colour.focus(); });
      status.append(title, body, use);
    }

    // The contrast checks, for the colour as entered (and, when it fails, for the suggestion's deep shade).
    checks.replaceChildren(...c.checks.map((k) => {
      const tr = document.createElement('tr');
      const th = document.createElement('th');
      th.scope = 'row';
      th.textContent = k.label;
      const ratio = document.createElement('td');
      ratio.className = 'ggds-table__numeric';
      ratio.textContent = `${k.ratio.toFixed(2)}:1`;
      const min = document.createElement('td');
      min.className = 'ggds-table__numeric';
      min.textContent = `${k.min}:1`;
      const result = document.createElement('td');
      const tag = document.createElement('strong');
      tag.className = `ggds-tag ${k.pass ? 'ggds-tag--success' : 'ggds-tag--danger'}`;
      tag.textContent = k.pass ? 'Passes' : 'Fails';
      result.append(tag);
      tr.append(th, ratio, min, result);
      return tr;
    }));

    // Preview and swatches: the CSSOM, never a style attribute.
    for (const el of [preview, swatchAccent, swatchDeep]) {
      el.style.setProperty('--ggds-color-institution', c.accent);
      el.style.setProperty('--ggds-color-institution-deep', c.deep);
    }
    valueAccent.textContent = c.accent;
    valueDeep.textContent = c.deep;
    previewCaption.textContent = c.ok ? `Preview of ${hex}` : `Preview of the suggested shade, ${c.suggestion}`;
    previewName.textContent = nameValue || 'Your institution';
    previewPurpose.textContent = nameValue ? 'Who we are and what we do' : 'Your purpose line';

    // The files.
    const opts = { name: nameValue || undefined, slug: slugOk && slugValue ? slugValue : undefined };
    const css = `/* GGDS institution theme. Load after ggds.css. Made with the GGDS theme builder. */\n${institutionCss(used, opts)}`;
    const tokens = `${JSON.stringify(institutionTokens(used, { name: opts.name }), null, 2)}\n`;
    cssCode.textContent = css;
    tokensCode.textContent = tokens;
    const base = opts.slug ?? 'theme';
    setDownloads(css, tokens, base);
    cli.textContent = `npx @ggds/themes ${shellQuote(used)}${opts.name ? ` --name ${shellQuote(opts.name)}` : ''}${opts.slug ? ` --slug ${opts.slug}` : ''} --out ${base}.css`;

    // The address keeps the theme, so it can be shared or bookmarked.
    const url = new URL(location.href);
    url.searchParams.set('colour', used.slice(1));
    for (const [k, v] of [['name', nameValue], ['slug', slugOk ? slugValue : '']]) {
      if (v) url.searchParams.set(k, v);
      else url.searchParams.delete(k);
    }
    history.replaceState(null, '', url);
  }

  // Start from the address (a shared link, or "Customise" on a ready-made theme), else the default.
  const params = new URLSearchParams(location.search);
  if (normaliseHex(params.get('colour'))) colour.value = normaliseHex(params.get('colour'));
  if (params.get('name')) name.value = params.get('name');
  if (params.get('slug')) slug.value = params.get('slug');

  picker.addEventListener('input', () => { colour.value = picker.value; render({ fromPicker: true }); });
  for (const input of [colour, name, slug]) input.addEventListener('input', () => render());
  root.querySelector('form').addEventListener('submit', (e) => { e.preventDefault(); render(); });

  root.hidden = false;
  for (const el of document.querySelectorAll('[data-theme-builder-fallback]')) el.hidden = true;
  render();
}
