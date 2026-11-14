// Documentation site only: the website builder (builder.html). A guided form in five steps that keeps what people
// type on their own device as they go (localStorage), previews any page of their website at desktop or phone size,
// checks the answers the GGDS way (error summary, a message on each field, "Error:" in the title), then makes the
// website with the starter's own code (copied beside this file by docs/build.mjs) as a zip: plain HTML for an IT team
// or someone on their own, a WordPress import, or a framework project. Nothing leaves the browser. Strict Content
// Security Policy: no inline script or style; colours are set through the CSSOM.
import { starterModel, starterProject } from './starter.js';
import { KINDS, PARTS, SITE_FILE, checkSite, exampleWords, normaliseSite } from './starter-site.js';
import { banner, footer, header } from './parts.js';
import { checkInstitutionColour } from './institution.js';
import { normaliseHex } from './color.js';
import { makeZip } from './zip.js';

const root = document.querySelector('[data-wb]');
if (root) {
  const $ = (id) => document.getElementById(id);
  const form = $('wb-form');
  const errors = $('wb-errors');
  const steps = [...form.querySelectorAll('[data-step]')];
  const themeSelect = $('wb-theme');
  const colourField = $('wb-colour-field');
  const colour = $('wb-colour');
  const picker = $('wb-picker');
  const colourStatus = $('wb-colour-status');
  const previewBox = $('wb-preview');
  const previewInner = $('wb-preview-inner');
  const previewPage = $('wb-preview-page');
  const version = root.dataset.version;
  const filesUrl = new URL(root.dataset.files, location.href);
  const themes = [...themeSelect.options].map((o) => o.value).filter((v) => v !== 'custom');
  const pageTitle = document.title;
  const STORE = 'ggds-website-builder';
  const SECTIONS = ['home', 'services', 'fees', 'news', 'publications', 'jobs', 'about'];
  const esc = (t) => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  // ---- What people have typed ----------------------------------------------------------------------------------
  /** A new, empty form: the institution's details blank, the words those of the kind of institution. */
  const blank = (kind = KINDS[0].id) => ({
    ...normaliseSite({ kind }),
    name: '', short: '', purpose: '', host: '', phone: '', hours: '', email: '', theme: themeSelect.value,
    offices: [{ name: 'Head office', lines: [] }, { name: '', lines: [] }],
  });
  let state = blank();
  let edited = new Set(); // which words people have changed: a new kind of institution leaves those alone
  let step = 0;
  let logo = null; // { path, bytes, dataUrl }
  let logoProblem = '';
  let previewFile = 'index.html';

  const get = (path) => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), state);
  function set(path, value) {
    const keys = path.split('.');
    let o = state;
    keys.slice(0, -1).forEach((k, i) => { if (o[k] == null) o[k] = /^\d+$/.test(keys[i + 1]) ? [] : {}; o = o[k]; });
    o[keys.at(-1)] = value;
  }
  const sectionOf = (path) => { const k = path.split('.')[0]; return k === 'question' || k === 'lede' ? 'home' : k; };

  /** The settings as typed, ready to check: empty details stay empty, so checkSite says what is missing. */
  function typed() {
    const s = structuredClone(state);
    s.offices = (s.offices ?? []).filter((o) => o.lines?.length).map((o, i) => ({ name: o.name || (i ? 'Office' : 'Head office'), lines: o.lines }));
    if (!s.offices.length) delete s.offices;
    s.theme = themeSelect.value === 'custom' ? (normaliseHex(colour.value) ?? colour.value) : themeSelect.value;
    s.parts = { ...s.parts, apply: s.services.some((x) => x.online && x.title) };
    s.logo = logo?.path ?? '';
    return s;
  }
  /** The settings for the preview: what is not typed yet is the example's. */
  const forPreview = () => Object.fromEntries(Object.entries(typed()).filter(([, v]) => v !== '' && v !== undefined));

  function save() {
    try {
      localStorage.setItem(STORE, JSON.stringify({ state, edited: [...edited], step, previewFile, logo: logo && { path: logo.path, dataUrl: logo.dataUrl },
        colour: colour.value, theme: themeSelect.value, output: form.querySelector('[name="output"]:checked')?.value, stack: form.querySelector('[name="stack"]:checked')?.value }));
    } catch { /* private browsing, or storage full: the form still works */ }
  }

  // ---- The form, from the settings -----------------------------------------------------------------------------
  /** Puts each setting in its field (data-path), inside el. */
  function fillFields(el = form) {
    for (const input of el.querySelectorAll('[data-path]')) {
      const v = get(input.dataset.path);
      if (input.type === 'checkbox') input.checked = Boolean(v);
      else if ('lines' in input.dataset) input.value = (v ?? []).join('\n');
      else input.value = v ?? '';
    }
    for (const d of form.querySelectorAll('[data-part]')) d.hidden = !state.parts[d.dataset.part];
  }

  const field = (id, label, path, o = {}) => `<div class="ggds-field" data-field="${id}">
<label class="ggds-label" for="wb-${id}">${label}</label>${o.hint ? `\n<p class="ggds-hint" id="wb-${id}-hint">${o.hint}</p>` : ''}
<p class="ggds-error-message" id="wb-${id}-error" hidden><span class="ggds-visually-hidden">Error:</span> <span data-message></span></p>
${o.rows
    ? `<textarea class="ggds-textarea" id="wb-${id}" rows="${o.rows}" data-path="${path}"${o.lines ? ' data-lines' : ''}${o.hint ? ` aria-describedby="wb-${id}-hint"` : ''}></textarea>`
    : `<input class="ggds-input${o.width ? ` ggds-input--width-${o.width}` : ''}" id="wb-${id}" type="text" data-path="${path}"${o.hint ? ` aria-describedby="wb-${id}-hint"` : ''}>`}
</div>`;
  const tick = (id, label, path, hint = '') => `<div class="ggds-choice"><input class="ggds-choice__input" id="wb-${id}" type="checkbox" data-path="${path}"${hint ? ` aria-describedby="wb-${id}-hint"` : ''}><label class="ggds-choice__label" for="wb-${id}">${label}${hint ? ` <span class="ggds-choice__hint" id="wb-${id}-hint">${hint}</span>` : ''}</label></div>`;
  const remove = (list, i, what) => `<button class="wb__link-button" type="button" data-remove="${list}" data-index="${i}">Remove<span class="ggds-visually-hidden"> ${what}</span></button>`;

  const LISTS = {
    services: {
      empty: () => ({ title: '', summary: '', group: state.services.at(-1)?.group ?? 'Services', task: false, online: false, who: [], need: [], time: '', cost: '', how: '', options: [], steps: [] }),
      item: (x, i) => `<div class="wb__item" data-preview-service="${i}">
<div class="wb__item-head"><h4>Service ${i + 1}</h4>${remove('services', i, `service ${i + 1}`)}</div>
${field(`svc-${i}-title`, 'What people come to do', `services.${i}.title`, { hint: 'Starting with a verb, such as "Apply for a building permit" or "Book an appointment"', width: 'long' })}
${field(`svc-${i}-summary`, 'In one line', `services.${i}.summary`, { hint: 'On its card: who it is for, or when people need it.', width: 'long' })}
${field(`svc-${i}-group`, 'Heading on the Services page', `services.${i}.group`, { width: 'medium' })}
<div class="ggds-choices">
${tick(`svc-${i}-task`, 'On the homepage, as a common task', `services.${i}.task`)}
${tick(`svc-${i}-online`, 'People can apply online', `services.${i}.online`, 'A form, check your answers and a confirmation. One service at most.')}
</div>
<details class="ggds-disclosure">
<summary class="ggds-disclosure__summary">Write its page</summary>
<div class="ggds-disclosure__content">
${field(`svc-${i}-who`, 'Who it is for', `services.${i}.who`, { hint: 'One a line.', rows: 3, lines: true })}
${field(`svc-${i}-need`, 'What they need', `services.${i}.need`, { hint: 'Documents, numbers and fees: one a line.', rows: 4, lines: true })}
${field(`svc-${i}-time`, 'How long it takes', `services.${i}.time`, { rows: 2 })}
${field(`svc-${i}-cost`, 'What it costs', `services.${i}.cost`, { rows: 2 })}
${field(`svc-${i}-how`, 'What to do', `services.${i}.how`, { hint: 'How to apply, pay or get it. Leave a blank line between paragraphs.', rows: 3 })}
${x.online ? field(`svc-${i}-options`, 'What people choose on the form', `services.${i}.options`, { hint: 'Such as the kinds of licence. One a line, or none.', rows: 3, lines: true }) : ''}
</div>
</details>
</div>`,
    },
    fees: {
      empty: () => state.fees.columns.map(() => ''),
      item: (row, i) => `<div class="wb__row">${state.fees.columns.map((col, c) => field(`fee-${i}-${c}`, esc(col), `fees.rows.${i}.${c}`)).join('')}<p>${remove('fees', i, `fee ${i + 1}`)}</p></div>`,
    },
    news: {
      empty: () => ({ title: '', type: 'News', date: '', summary: '', body: '' }),
      item: (x, i) => `<div class="wb__item"><div class="wb__item-head"><h4>News ${i + 1}</h4>${remove('news', i, `news ${i + 1}`)}</div>
${field(`news-${i}-title`, 'Title', `news.${i}.title`, { width: 'long' })}
<div class="wb__row">${field(`news-${i}-type`, 'Type', `news.${i}.type`, { hint: 'News, Notice, Consultation or Press release' })}${field(`news-${i}-date`, 'Date', `news.${i}.date`, { hint: 'Such as 10 November 2026' })}</div>
${field(`news-${i}-summary`, 'In one or two sentences', `news.${i}.summary`, { rows: 2 })}
${field(`news-${i}-body`, 'The full article (optional)', `news.${i}.body`, { hint: 'Leave a blank line between paragraphs.', rows: 4 })}
</div>`,
    },
    publications: {
      empty: () => ({ title: '', type: 'Report', date: '' }),
      item: (x, i) => `<div class="wb__row">${field(`doc-${i}-title`, 'Title', `publications.${i}.title`)}${field(`doc-${i}-type`, 'Type', `publications.${i}.type`)}${field(`doc-${i}-date`, 'Published', `publications.${i}.date`)}<p>${remove('publications', i, `document ${i + 1}`)}</p></div>`,
    },
    jobs: {
      empty: () => ({ title: '', place: '', terms: 'Full time', closes: '' }),
      item: (x, i) => `<div class="wb__row">${field(`job-${i}-title`, 'Job', `jobs.${i}.title`)}${field(`job-${i}-place`, 'Where', `jobs.${i}.place`)}${field(`job-${i}-terms`, 'Grade and hours', `jobs.${i}.terms`)}${field(`job-${i}-closes`, 'Closes', `jobs.${i}.closes`, { hint: 'Such as 20 November' })}<p>${remove('jobs', i, `job ${i + 1}`)}</p></div>`,
    },
  };
  const listItems = (name) => (name === 'fees' ? state.fees.rows : state[name]);
  function renderList(name) {
    const box = form.querySelector(`[data-list="${name}"]`);
    // GGDS markup made from escaped text only.
    box.innerHTML = listItems(name).map((x, i) => LISTS[name].item(x, i)).join('\n');
    fillFields(box);
  }
  const renderLists = () => Object.keys(LISTS).forEach(renderList);

  // ---- Errors, the GGDS way ------------------------------------------------------------------------------------
  const INPUT = { offices: 'office1-lines', live: 'live', settings: 'settings', logo: 'logo', colour: 'colour', theme: 'theme', kind: 'kind-agency' };
  const inputFor = (f) => $(`wb-${INPUT[f] ?? f}`);
  function setError(f, message) {
    const input = inputFor(f);
    const box = input?.closest('.ggds-field');
    if (!box) return;
    const error = box.querySelector('.ggds-error-message');
    box.classList.toggle('ggds-field--error', Boolean(message));
    if (error) { error.hidden = !message; error.querySelector('[data-message]').textContent = message ?? ''; }
    const described = (input.getAttribute('aria-describedby') ?? '').split(' ').filter((x) => x && x !== error?.id);
    if (message) { input.setAttribute('aria-invalid', 'true'); if (error) described.push(error.id); } else input.removeAttribute('aria-invalid');
    if (described.length) input.setAttribute('aria-describedby', described.join(' ')); else input.removeAttribute('aria-describedby');
  }
  function clearErrors() {
    for (const box of form.querySelectorAll('.ggds-field--error')) {
      box.classList.remove('ggds-field--error');
      const f = box.querySelector('[id^="wb-"]:is(input, textarea, select)');
      if (f) setError(f.id.slice(3), null);
    }
    setError('settings', null);
    setError('logo', null);
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
    const target = a && $(a.getAttribute('href').slice(1));
    if (!target) return;
    e.preventDefault();
    showStep(stepOf(target), { focus: false });
    target.closest('details')?.setAttribute('open', '');
    target.focus();
    target.scrollIntoView({ block: 'center' });
  });

  const stepOf = (el) => Number(el.closest('[data-step]')?.dataset.step ?? 0);
  /** What is wrong, in plain words: [{ field, message }], only for the step given (or every step). */
  function problems(only) {
    const t = typed();
    const out = checkSite(t, { themes }).filter((p) => !p.warning)
      .map((p) => (p.field === 'theme' && themeSelect.value === 'custom' ? { field: 'colour', message: 'Enter your colour as a hex code, such as #006e35' } : p));
    if (logoProblem) out.push({ field: 'logo', message: logoProblem });
    if (!state.services.some((x) => x.title.trim())) out.push({ field: 'svc-0-title', message: 'Add at least one thing people come to do' });
    state.services.forEach((x, i) => { if (!x.title.trim() && state.services.length > 1) out.push({ field: `svc-${i}-title`, message: `Say what people come to do in service ${i + 1}, or remove it` }); });
    return only === undefined ? out : out.filter((p) => { const el = inputFor(p.field); return el && stepOf(el) === only; });
  }

  // ---- Steps ---------------------------------------------------------------------------------------------------
  function showStep(i, { focus = true } = {}) {
    step = Math.max(0, Math.min(steps.length - 1, i));
    steps.forEach((s, n) => { s.hidden = n !== step; });
    for (const a of document.querySelectorAll('[data-goto]')) { if (Number(a.dataset.goto) === step) a.setAttribute('aria-current', 'step'); else a.removeAttribute('aria-current'); }
    if (steps[step].dataset.preview) setPreview(steps[step].dataset.preview);
    if (step === steps.length - 1) showExamples();
    if (focus) { const h = steps[step].querySelector('h2'); h.tabIndex = -1; h.focus(); h.scrollIntoView({ block: 'start' }); }
    save();
  }
  for (const a of document.querySelectorAll('[data-goto]')) a.addEventListener('click', (e) => { e.preventDefault(); clearErrors(); showStep(Number(a.dataset.goto)); });
  form.addEventListener('click', (e) => {
    if (e.target.closest('[data-back]')) { clearErrors(); showStep(step - 1); return; }
    if (e.target.closest('[data-next]')) {
      clearErrors();
      const found = problems(step);
      if (found.length) showErrors(found); else showStep(step + 1);
      return;
    }
    const add = e.target.closest('[data-add]');
    if (add) {
      const name = add.dataset.add;
      listItems(name).push(LISTS[name].empty());
      edited.add(name);
      renderList(name);
      const items = form.querySelectorAll(`[data-list="${name}"] [data-path$=".title"], [data-list="${name}"] [data-path^="fees.rows."]`);
      items[items.length - (name === 'fees' ? state.fees.columns.length : 1)]?.focus();
      changed();
      return;
    }
    const rm = e.target.closest('[data-remove]');
    if (rm) {
      const name = rm.dataset.remove;
      listItems(name).splice(Number(rm.dataset.index), 1);
      edited.add(name);
      renderList(name);
      form.querySelector(`[data-add="${name}"]`).focus();
      changed();
    }
  });

  // ---- Typing --------------------------------------------------------------------------------------------------
  let timer;
  function changed() {
    clearTimeout(timer);
    timer = setTimeout(() => { render(); save(); if (step === steps.length - 1) showExamples(); }, 150);
  }
  form.addEventListener('input', (e) => {
    const el = e.target;
    if (el.name === 'kind') { changeKind(el.value); return; }
    if (!el.dataset.path) { changed(); return; }
    const path = el.dataset.path;
    let value = el.type === 'checkbox' ? el.checked : 'lines' in el.dataset ? el.value.split('\n').map((l) => l.trim()).filter(Boolean) : el.value;
    if (path.startsWith('parts.')) { set(path, value); fillFields(); changed(); return; }
    set(path, value);
    if (SECTIONS.includes(sectionOf(path))) edited.add(sectionOf(path));
    // One service at most has the online application.
    if (/^services\.\d+\.online$/.test(path)) {
      if (value) state.services.forEach((x, i) => { if (`services.${i}.online` !== path) x.online = false; });
      renderList('services');
      form.querySelector(`[data-path="${path}"]`)?.focus();
    }
    changed();
  });
  // Editing a service, a fee or a news item shows its page in the preview.
  form.addEventListener('focusin', (e) => {
    const svc = e.target.closest('[data-preview-service]');
    if (svc) { setPreview(model?.content.services[Number(svc.dataset.previewService)]?.file); return; }
    const where = e.target.closest('[data-preview]');
    if (where && where !== steps[step]) setPreview(where.dataset.preview);
  });

  function changeKind(kind) {
    const fresh = normaliseSite({ kind });
    state.kind = kind;
    if (!edited.has('home')) { state.question = fresh.question; state.lede = fresh.lede; }
    for (const k of ['services', 'fees', 'news', 'publications', 'jobs', 'about']) if (!edited.has(k)) state[k] = fresh[k];
    fillFields();
    renderLists();
    changed();
  }

  $('wb-known').addEventListener('change', (e) => {
    const o = e.target.selectedOptions[0];
    if (!o.value) return;
    state.name = o.dataset.name;
    state.short = o.dataset.short;
    themeSelect.value = o.value;
    fillFields();
    changed();
  });

  // ---- Colour --------------------------------------------------------------------------------------------------
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
  themeSelect.addEventListener('change', () => { colourField.hidden = themeSelect.value !== 'custom'; changed(); });
  picker.addEventListener('input', () => { colour.value = picker.value; changed(); });
  colour.addEventListener('input', () => { const hex = normaliseHex(colour.value); if (hex) picker.value = hex; changed(); });

  // ---- Preview -------------------------------------------------------------------------------------------------
  let model = null;
  function setPreview(file) {
    if (!file) return;
    previewFile = file;
    render();
  }
  previewPage.addEventListener('change', () => setPreview(previewPage.value));
  $('wb-preview-size').addEventListener('click', (e) => {
    const phone = e.currentTarget.getAttribute('aria-pressed') !== 'true';
    e.currentTarget.setAttribute('aria-pressed', String(phone));
    previewBox.classList.toggle('wb__preview--phone', phone);
  });

  // Full screen: the preview over the whole page. Everything behind it is inert, so focus cannot go behind it, and
  // Escape closes it, back to the button.
  const fullButton = $('wb-preview-full');
  const aside = root.querySelector('.wb__aside');
  let behind = [];
  function setFull(on) {
    fullButton.setAttribute('aria-pressed', String(on));
    fullButton.textContent = on ? 'Exit full screen' : 'Full screen';
    aside.classList.toggle('wb__aside--full', on);
    document.documentElement.classList.toggle('wb-full', on);
    if (on) {
      for (let el = aside; el.parentElement && el !== document.body; el = el.parentElement) {
        for (const other of el.parentElement.children) if (other !== el && !other.inert) { other.inert = true; behind.push(other); }
      }
    } else {
      for (const el of behind) el.inert = false;
      behind = [];
    }
  }
  fullButton.addEventListener('click', () => setFull(fullButton.getAttribute('aria-pressed') !== 'true'));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && fullButton.getAttribute('aria-pressed') === 'true') { setFull(false); fullButton.focus(); }
  });

  function render() {
    try { model = starterModel({ version, site: forPreview() }); } catch { return; }
    const pages = model.pages.filter((p) => p.file !== '404.html');
    const options = pages.map((p) => `${p.file}\t${p.title}`).join('\n');
    if (previewPage.dataset.options !== options) {
      previewPage.replaceChildren(...pages.map((p) => { const o = document.createElement('option'); o.value = p.file; o.textContent = p.file === 'index.html' ? 'Homepage' : p.title; return o; }));
      previewPage.dataset.options = options;
    }
    const page = pages.find((p) => p.file === previewFile) ?? pages[0];
    previewPage.value = page.file;
    const { frame } = model;
    const html = `${banner(frame.banner)}${header({ ...frame.header, current: frame.current(page) })}<main>${page.main}</main>${footer(frame.footer)}`;
    // The preview is GGDS's own markup, made from escaped text, and inert: nothing in it can be used or focused.
    const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
    // This page has one h1: the preview's heading is a paragraph that looks the same.
    for (const h of doc.querySelectorAll('h1')) { const p = doc.createElement('p'); p.className = `${h.className} wb__h1`.trim(); p.append(...h.childNodes); h.replaceWith(p); }
    for (const el of doc.querySelectorAll('[id]')) el.id = `wb-p-${el.id}`;
    for (const el of doc.querySelectorAll('[for],[aria-labelledby],[aria-controls],[aria-describedby]')) for (const a of ['for', 'aria-labelledby', 'aria-controls', 'aria-describedby']) if (el.hasAttribute(a)) el.setAttribute(a, el.getAttribute(a).split(' ').map((x) => `wb-p-${x}`).join(' '));
    if (logo) for (const img of doc.querySelectorAll('img[src^="assets/logo."]')) img.src = logo.dataUrl;
    previewInner.replaceChildren(...doc.body.firstElementChild.childNodes);
    const p = palette();
    if (p) { previewBox.style.setProperty('--ggds-color-institution', p.accent); previewBox.style.setProperty('--ggds-color-institution-deep', p.deep); }
  }

  function showExamples() {
    const left = exampleWords(typed());
    $('wb-examples').hidden = !left.length;
    $('wb-examples-list').replaceChildren(...left.map((x) => { const li = document.createElement('li'); li.textContent = `${x.where}: ${x.what}`; return li; }));
  }

  // ---- Files people choose -------------------------------------------------------------------------------------
  /** The form from saved settings (ggds-site.json): every word in it counts as the institution's own. */
  function load(saved) {
    const s = normaliseSite(saved);
    state = { ...s, offices: [...s.offices, { name: '', lines: [] }].slice(0, Math.max(2, s.offices.length)) };
    for (const k of ['name', 'short', 'purpose', 'host', 'phone', 'hours', 'email']) if (!saved[k]) state[k] = '';
    edited = new Set(SECTIONS.filter((k) => (k === 'home' ? saved.question || saved.lede : saved[k] !== undefined)));
    if (/^#[0-9a-f]{6}$/i.test(s.theme)) { themeSelect.value = 'custom'; colour.value = s.theme; picker.value = s.theme; } else if (themes.includes(s.theme)) themeSelect.value = s.theme;
    colourField.hidden = themeSelect.value !== 'custom';
    form.querySelector(`[name="kind"][value="${s.kind}"]`).checked = true;
    fillFields();
    renderLists();
  }
  $('wb-settings').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    setError('settings', null);
    if (!file) return;
    try {
      const saved = JSON.parse(await file.text());
      if (!saved || typeof saved !== 'object' || Array.isArray(saved)) throw new Error('not settings');
      load(saved);
      render();
      save();
      if (saved.logo && !logo) setError('settings', 'Your settings are filled in. Choose your logo again, in step 4: the settings file does not hold it.');
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
        const dataUrl = await new Promise((done) => { const r = new FileReader(); r.onload = () => done(r.result); r.readAsDataURL(file); });
        logo = { path: `assets/logo.${ext}`, bytes: new Uint8Array(await file.arrayBuffer()), dataUrl };
      }
    }
    setError('logo', logoProblem || null);
    changed();
  });

  // ---- Where to go online --------------------------------------------------------------------------------------
  const output = () => form.querySelector('[name="output"]:checked')?.value ?? 'team';
  form.addEventListener('change', (e) => { if (e.target.name === 'output') $('wb-stacks').hidden = e.target.value !== 'developer'; if (e.target.name === 'output' || e.target.name === 'stack') save(); });

  const NEXT = {
    team: (site) => `<h2>What to do next</h2>
<ol>
<li>Send the zip to your IT team or web host. <code>HANDOVER.md</code> inside it says what to do, in their words: it is a website of plain files, with the settings for security and speed for each kind of server.</li>
<li>Ask them to put it at <strong>${esc(site.host)}</strong>. Addresses that end in .gov.gh are managed by the National Information Technology Agency (NITA).</li>
<li>Rewrite the example words before it goes live. To change anything, open <code>${SITE_FILE}</code> from the zip on this page.</li>
<li>When it is online, check it: <code>npx @ggds/check https://${esc(site.host)}</code></li>
</ol>`,
    self: (site) => `<h2>Put it online yourself</h2>
<h3>With hosting that has a control panel (cPanel)</h3>
<ol>
<li>Log in to your hosting's control panel, and open <strong>File Manager</strong>.</li>
<li>Go to the <code>public_html</code> folder. Choose <strong>Upload</strong>, and upload the zip.</li>
<li>Choose the zip, then <strong>Extract</strong>. Move everything from the folder it makes into <code>public_html</code>, including <code>.htaccess</code>: it sets the security and speed settings.</li>
<li>Open your address. Your website is there.</li>
</ol>
<h3>With free hosting, to try it first</h3>
<ol>
<li>Unzip the website on your computer.</li>
<li>Go to <a href="https://app.netlify.com/drop">Netlify Drop</a> and drag the folder onto the page. Your website is online at an address Netlify gives you.</li>
<li>To use <strong>${esc(site.host)}</strong>, ask the National Information Technology Agency (NITA), which manages .gov.gh addresses, to point it at your hosting.</li>
</ol>
<p>Before it goes live, rewrite the example words: open <code>${SITE_FILE}</code> from the zip on this page to change anything. When it is online, check it: <code>npx @ggds/check https://${esc(site.host)}</code></p>`,
    wordpress: () => `<h2>What to do next</h2>
<ol>
<li>Open the zip and read <code>README.md</code>. In short: install the GGDS theme, then <strong>Tools &gt; Import &gt; WordPress</strong> and choose <code>wordpress-import.xml</code>.</li>
<li>Your menus are already named for the GGDS theme, so they appear in the header, homepage and footer straight away.</li>
<li>Already have a WordPress website with pages in it? <a href="wordpress.html">GGDS Switch</a> may be the better way: it keeps the pages you have.</li>
</ol>`,
    developer: (site) => `<h2>What to do next</h2>
<ol>
<li>Give the zip to your developer. Its <code>README.md</code> says how to run it, build it and put it online.</li>
<li>Keep <code>${SITE_FILE}</code>. To change your details later, or move to a newer GGDS, open it on this page.</li>
<li>When it is online, check it: <code>npx @ggds/check https://${esc(site.host)}</code></li>
</ol>`,
  };

  // ---- Making the website --------------------------------------------------------------------------------------
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
    const found = problems();
    if (found.length) { showErrors(found); return; }
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    button.textContent = 'Making your website…';
    try {
      const site = normaliseSite(typed());
      const how = output();
      const stack = how === 'wordpress' ? 'wordpress' : how === 'developer' ? (form.querySelector('[name="stack"]:checked')?.value ?? 'next') : 'html';
      const project = starterProject({ version, site, stack });
      const files = { ...project.files };
      if (logo) files[`${project.assetDir}${logo.path.slice('assets/'.length)}`] = logo.bytes;
      // Plain HTML carries GGDS in ggds/; a framework project installs it as a package; WordPress has the theme.
      if (project.ggds) Object.assign(files, await loadGgds());
      const name = `${slug(site)}-${stack === 'wordpress' ? 'wordpress' : 'website'}`;
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
      // Made from escaped text only.
      $('wb-next').innerHTML = `${NEXT[how](site)}\n<p><a href="#wb-form" id="wb-again">Change something and download again</a></p>`;
      $('wb-again').addEventListener('click', (ev) => { ev.preventDefault(); showStep(0); });
      $('wb-done').hidden = false;
      $('wb-next').hidden = false;
      $('wb-done').focus();
      $('wb-done').scrollIntoView({ block: 'start' });
    } catch (err) {
      showErrors([{ field: 'settings', message: `The website could not be made: ${err.message}. Check your connection and try again.` }]);
    } finally {
      button.disabled = false;
      button.textContent = 'Download my website';
    }
  });

  // ---- Start: what was typed last time on this device, or an empty form ---------------------------------------
  $('wb-reset').addEventListener('click', () => {
    try { localStorage.removeItem(STORE); } catch { /* nothing kept */ }
    state = blank();
    edited = new Set();
    logo = null;
    themeSelect.value = themes[0];
    form.querySelector('[name="kind"][value="agency"]').checked = true;
    fillFields();
    renderLists();
    $('wb-restored').hidden = true;
    showStep(0);
    render();
  });

  let kept = null;
  try { kept = JSON.parse(localStorage.getItem(STORE) ?? 'null'); } catch { kept = null; }
  if (kept?.state) {
    state = { ...blank(kept.state.kind), ...kept.state };
    edited = new Set(kept.edited ?? []);
    if (kept.theme) themeSelect.value = kept.theme;
    if (kept.colour) { colour.value = kept.colour; picker.value = normaliseHex(kept.colour) ?? picker.value; }
    if (kept.logo?.dataUrl) {
      const bin = atob(kept.logo.dataUrl.split(',')[1] ?? '');
      logo = { path: kept.logo.path, dataUrl: kept.logo.dataUrl, bytes: Uint8Array.from(bin, (ch) => ch.charCodeAt(0)) };
    }
    form.querySelector(`[name="kind"][value="${state.kind}"]`).checked = true;
    if (kept.output) form.querySelector(`[name="output"][value="${kept.output}"]`).checked = true;
    if (kept.stack) form.querySelector(`[name="stack"][value="${kept.stack}"]`)?.setAttribute('checked', '');
    $('wb-stacks').hidden = output() !== 'developer';
    previewFile = kept.previewFile ?? previewFile;
    $('wb-restored').hidden = false;
  }
  colourField.hidden = themeSelect.value !== 'custom';
  fillFields();
  renderLists();
  root.hidden = false;
  for (const el of document.querySelectorAll('[data-wb-fallback]')) el.hidden = true;
  showStep(kept?.step ?? 0, { focus: false });
  render();
}
