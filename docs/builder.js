// Documentation site only: the website builder (builder.html). Reads the form, previews the homepage, checks the
// answers the GGDS way (error summary, a message on each field, "Error:" in the title), then makes the website with
// the starter's own code (copied beside this file by docs/build.mjs) and saves it as a zip. Nothing leaves the
// browser. Strict Content Security Policy: no inline script or style; colours are set through the CSSOM.
import { starterProject } from './starter.js';
import { PARTS, SITE_FILE, checkSite, normaliseSite } from './starter-site.js';
import { header, hero, mark } from './parts.js';
import { checkInstitutionColour } from './institution.js';
import { normaliseHex } from './color.js';
import { makeZip } from './zip.js';

const root = document.querySelector('[data-wb]');
if (root) {
  const $ = (id) => document.getElementById(id);
  const form = $('wb-form');
  const errors = $('wb-errors');
  const preview = $('wb-preview');
  const themeSelect = $('wb-theme');
  const colourField = $('wb-colour-field');
  const colour = $('wb-colour');
  const picker = $('wb-picker');
  const colourStatus = $('wb-colour-status');
  const version = root.dataset.version;
  const filesUrl = new URL(root.dataset.files, location.href);
  const themes = [...themeSelect.options].map((o) => o.value).filter((v) => v !== 'custom');
  const pageTitle = document.title;
  let logo = null; // { path, bytes, dataUrl }
  let logoProblem = ''; // why the chosen logo cannot be used

  const value = (id) => $(`wb-${id}`).value;
  const lines = (id) => value(id).split('\n').map((l) => l.trim()).filter(Boolean);

  /** The settings as typed. Empty fields stay empty here, so checkSite can say what is missing. */
  function read() {
    const offices = [];
    if (lines('office1-lines').length) offices.push({ name: value('office1-name').trim() || 'Head office', lines: lines('office1-lines') });
    if (lines('office2-lines').length) offices.push({ name: value('office2-name').trim() || 'Office', lines: lines('office2-lines') });
    const custom = themeSelect.value === 'custom';
    return {
      name: value('name'), short: value('short'), purpose: value('purpose'), host: value('host'),
      phone: value('phone'), hours: value('hours'), email: value('email'),
      offices: offices.length ? offices : undefined,
      theme: custom ? (normaliseHex(colour.value) ?? colour.value) : themeSelect.value,
      parts: Object.fromEntries(PARTS.map((p) => [p.id, $(`wb-part-${p.id}`).checked])),
      forms: value('forms'), live: $('wb-live').checked,
      logo: logo?.path ?? '',
    };
  }

  /** Fills the form from saved settings (ggds-site.json). */
  function fill(saved) {
    const s = normaliseSite(saved);
    for (const k of ['name', 'short', 'purpose', 'host', 'phone', 'hours', 'email', 'forms']) $(`wb-${k}`).value = saved[k] ? s[k] : '';
    const [o1, o2] = Array.isArray(saved.offices) ? s.offices : [];
    $('wb-office1-name').value = o1?.name ?? 'Head office';
    $('wb-office1-lines').value = o1?.lines.join('\n') ?? '';
    $('wb-office2-name').value = o2?.name ?? '';
    $('wb-office2-lines').value = o2?.lines.join('\n') ?? '';
    if (/^#[0-9a-f]{6}$/i.test(s.theme)) { themeSelect.value = 'custom'; colour.value = s.theme; picker.value = s.theme; }
    else if (themes.includes(s.theme)) themeSelect.value = s.theme;
    for (const p of PARTS) $(`wb-part-${p.id}`).checked = s.parts[p.id];
    $('wb-live').checked = s.live;
  }

  // ---- Errors, the GGDS way ----------------------------------------------------------------------------------
  const INPUT = { offices: 'office1-lines', theme: 'theme', colour: 'colour', live: 'live', settings: 'settings', logo: 'logo' };
  const inputFor = (field) => $(`wb-${INPUT[field] ?? field}`);
  function setError(field, message) {
    const input = inputFor(field);
    const box = input?.closest('.ggds-field');
    if (!box) return;
    const id = `wb-${INPUT[field] ?? field}-error`;
    const error = $(id) ?? box.querySelector('.ggds-error-message');
    box.classList.toggle('ggds-field--error', Boolean(message));
    if (error) { error.hidden = !message; error.querySelector('[data-message]').textContent = message ?? ''; }
    const described = (input.getAttribute('aria-describedby') ?? '').split(' ').filter((x) => x && x !== error?.id);
    if (message) { input.setAttribute('aria-invalid', 'true'); if (error) described.push(error.id); }
    else input.removeAttribute('aria-invalid');
    if (described.length) input.setAttribute('aria-describedby', described.join(' ')); else input.removeAttribute('aria-describedby');
  }
  function clearErrors() {
    for (const box of form.querySelectorAll('.ggds-field--error')) box.classList.remove('ggds-field--error');
    for (const f of ['name', 'short', 'purpose', 'host', 'phone', 'hours', 'email', 'offices', 'theme', 'colour', 'forms', 'live', 'logo', 'settings']) setError(f, null);
    errors.hidden = true;
    document.title = pageTitle;
  }
  function showErrors(problems) {
    for (const p of problems) setError(p.field, p.message);
    errors.querySelector('.ggds-error-summary__list').replaceChildren(...problems.map((p) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = `#${inputFor(p.field)?.id ?? 'wb-form'}`;
      a.textContent = p.message;
      li.append(a);
      return li;
    }));
    errors.hidden = false;
    document.title = `Error: ${pageTitle}`;
    errors.focus();
  }
  errors.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const target = $(a.getAttribute('href').slice(1));
    if (target) { e.preventDefault(); target.focus(); target.scrollIntoView({ block: 'center' }); }
  });

  // ---- Colour and preview -------------------------------------------------------------------------------------
  function palette() {
    if (themeSelect.value !== 'custom') {
      const o = themeSelect.selectedOptions[0];
      return { accent: o.dataset.accent, deep: o.dataset.deep };
    }
    const hex = normaliseHex(colour.value);
    if (!hex) { colourStatus.textContent = 'Enter a colour as a hex code, such as #006e35.'; return null; }
    const c = checkInstitutionColour(hex);
    colourStatus.textContent = c.ok ? `${hex} passes every contrast check.` : `${hex} is too light to read on white, so your website will use ${c.suggestion}, the nearest darker shade.`;
    return { accent: c.accent, deep: c.deep };
  }

  function render() {
    colourField.hidden = themeSelect.value !== 'custom';
    const s = normaliseSite(Object.fromEntries(Object.entries(read()).filter(([, v]) => v !== '' && v !== undefined)));
    const has = (f) => ({ 'apply-for-a-licence.html': s.parts.apply, 'complaint.html': s.parts.complaint, 'fees.html': s.parts.fees })[f] ?? true;
    const nav = [['Services', 'services.html', true], ['News & notices', 'news.html', s.parts.news], ['Publications', 'publications.html', s.parts.publications], ['About & contact', 'about.html', true]]
      .filter(([, , on]) => on).map(([label, href]) => ({ label, href }));
    const badge = logo ? `<img class="ggds-header__logo" src="${logo.dataUrl}" alt="" width="44" height="44">` : mark({ initials: s.short });
    const html = `${header({ name: s.name, logo: badge, nav, current: '', navId: 'wb-preview-nav', home: '#', search: '#' })}
${hero({
    purpose: s.purpose, title: 'What do you need to do?', lede: 'Apply for a licence, make a complaint about a provider, or find our rules and reports.',
    search: { action: '#', label: `Search ${s.name}`, placeholder: 'For example: licence fees' }, tasksLabel: 'Most people come to:',
    tasks: [['Apply for a licence', 'apply-for-a-licence.html'], ['Make a complaint', 'complaint.html'], ['See our fees', 'fees.html'], ['Contact us', 'contact.html']].filter(([, h]) => has(h)).map(([label, href]) => ({ label, href })),
  })}`;
    // The preview is GGDS's own markup, made from escaped text, and inert: nothing in it can be used or focused.
    const doc = new DOMParser().parseFromString(`<div class="wb__preview-inner">${html}</div>`, 'text/html');
    // This page has one h1: the preview's heading is a paragraph that looks the same.
    for (const h of doc.querySelectorAll('h1')) { const p = doc.createElement('p'); p.className = h.className; p.append(...h.childNodes); h.replaceWith(p); }
    for (const el of doc.querySelectorAll('[id]')) el.id = `wb-p-${el.id}`;
    for (const el of doc.querySelectorAll('[for],[aria-labelledby],[aria-controls]')) for (const a of ['for', 'aria-labelledby', 'aria-controls']) if (el.hasAttribute(a)) el.setAttribute(a, `wb-p-${el.getAttribute(a)}`);
    preview.replaceChildren(doc.body.firstElementChild);
    const p = palette();
    if (p) { preview.style.setProperty('--ggds-color-institution', p.accent); preview.style.setProperty('--ggds-color-institution-deep', p.deep); }
  }

  themeSelect.addEventListener('change', render);
  picker.addEventListener('input', () => { colour.value = picker.value; render(); });
  colour.addEventListener('input', () => { const hex = normaliseHex(colour.value); if (hex) picker.value = hex; render(); });
  form.addEventListener('input', (e) => { if (e.target.type !== 'file') render(); });

  // ---- Files people choose ------------------------------------------------------------------------------------
  $('wb-settings').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    setError('settings', null);
    if (!file) return;
    try {
      const saved = JSON.parse(await file.text());
      if (!saved || typeof saved !== 'object' || Array.isArray(saved)) throw new Error('not settings');
      fill(saved);
      render();
      if (saved.logo && !logo) setError('settings', 'Your settings are filled in. Choose your logo again: the settings file does not hold it.');
    } catch {
      setError('settings', `Choose the ${SITE_FILE} file from a website made here`);
    }
  });

  const LOGO_TYPES = { 'image/svg+xml': 'svg', 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' };
  $('wb-logo').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    logo = null;
    logoProblem = '';
    if (file) {
      const ext = LOGO_TYPES[file.type];
      if (!ext) logoProblem = 'The logo must be an SVG, PNG, JPEG or WebP image';
      else if (file.size > 200 * 1024) logoProblem = 'The logo must be smaller than 200 KB';
      else {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const dataUrl = await new Promise((done) => { const r = new FileReader(); r.onload = () => done(r.result); r.readAsDataURL(file); });
        logo = { path: `assets/logo.${ext}`, bytes, dataUrl };
      }
    }
    setError('logo', logoProblem || null);
    render();
  });

  // ---- Making the website -------------------------------------------------------------------------------------
  let ggdsFiles;
  const loadGgds = async () => {
    if (ggdsFiles) return ggdsFiles;
    const list = await (await fetch(filesUrl)).json();
    const base = new URL('./', filesUrl);
    const got = await Promise.all(list.files.map(async (path) => {
      const res = await fetch(new URL(path, new URL(list.base, base)));
      if (!res.ok) throw new Error(`${path}: ${res.status}`);
      return [path, new Uint8Array(await res.arrayBuffer())];
    }));
    ggdsFiles = Object.fromEntries(got);
    return ggdsFiles;
  };
  const slug = (s) => s.short.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'website';
  let downloadUrl;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();
    const typed = read();
    const problems = checkSite(typed, { themes }).filter((p) => !p.warning)
      .map((p) => (p.field === 'theme' && themeSelect.value === 'custom' ? { field: 'colour', message: 'Enter your colour as a hex code, such as #006e35' } : p));
    if (logoProblem) problems.push({ field: 'logo', message: logoProblem });
    if (problems.length) { showErrors(problems); return; }

    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    button.textContent = 'Making your website…';
    try {
      const site = normaliseSite(typed);
      const stack = form.querySelector('input[name="stack"]:checked')?.value ?? 'html';
      const project = starterProject({ version, site, stack });
      const files = { ...project.files };
      if (logo) files[`${project.assetDir}${logo.path.slice('assets/'.length)}`] = logo.bytes;
      // Plain HTML carries GGDS in ggds/; a framework project installs it as a package.
      if (project.ggds) Object.assign(files, await loadGgds());
      const name = `${slug(site)}-website`;
      const zip = makeZip(Object.fromEntries(Object.entries(files).sort(([a], [b]) => a.localeCompare(b))), { folder: name });
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
      downloadUrl = URL.createObjectURL(new Blob([zip], { type: 'application/zip' }));
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${name}.zip`;
      document.body.append(a);
      a.click();
      a.remove();
      $('wb-done-file').textContent = `${name}.zip (${Math.round(zip.length / 1024)} KB)`;
      $('wb-next-host').textContent = site.host;
      $('wb-done').hidden = false;
      $('wb-next').hidden = false;
      $('wb-done').focus();
    } catch (err) {
      showErrors([{ field: 'settings', message: `The website could not be made: ${err.message}. Check your connection and try again.` }]);
    } finally {
      button.disabled = false;
      button.textContent = 'Download my website';
    }
  });
  $('wb-again').addEventListener('click', (e) => { e.preventDefault(); $('wb-name').focus(); });

  root.hidden = false;
  for (const el of document.querySelectorAll('[data-wb-fallback]')) el.hidden = true;
  render();
}
