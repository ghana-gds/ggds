// Documentation homepage only (docs/home.mjs): the remembered theme, the form to try and the page to resize. The
// theme picker itself needs no script. Strict CSP: sizes are set through the CSSOM, never a style attribute.

// Remember the institution chosen in "One design system, every institution" for the whole site: theme-pref.js
// reads it on every page and sets data-ggds-theme on <html>, which themes.css colours. Here the radio button is
// ticked again to match, and a new choice is saved and applied at once.
const THEME_PREF = 'ggds-docs-theme';
const themeInputs = [...document.querySelectorAll('input[name="home-theme"]')];
if (themeInputs.length) {
  const root = document.documentElement;
  const match = themeInputs.find((i) => i.value === root.getAttribute('data-ggds-theme'));
  if (match) match.checked = true;
  for (const input of themeInputs) {
    input.addEventListener('change', () => {
      if (!input.checked) return;
      root.setAttribute('data-ggds-theme', input.value);
      root.setAttribute('data-docs-theme-chosen', ''); // cards' edges take the colour until a reload (theme-pref.js)
      try { localStorage.setItem(THEME_PREF, input.value); } catch { /* storage blocked: this page only */ }
      try { sessionStorage.setItem('ggds-docs-theme-chosen', '1'); } catch { /* storage blocked: this page only */ }
    });
  }
}

// Try a form: a Ghana Card number, checked the way a GGDS service checks it, with the error summary, the field's
// error and a confirmation panel.
const tryCard = document.querySelector('[data-home-try]');
if (tryCard) {
  const $ = (id) => document.getElementById(id);
  const form = $('home-try-form');
  const input = $('home-try-card');
  const field = $('home-try-field');
  const error = $('home-try-error');
  const summary = $('home-try-summary');
  const summaryLink = $('home-try-summary-link');
  const formScreen = $('home-try-form-screen');
  const done = $('home-try-done');
  const panel = $('home-try-panel');
  const reference = $('home-try-reference');

  // GHA, 9 digits and a check digit. People type it with spaces, without hyphens or in lower case: accept those.
  const problem = (raw) => {
    const v = raw.trim();
    if (!v) return { message: 'Enter your Ghana Card number' };
    const compact = v.toUpperCase().replace(/[\s-]/g, '');
    const m = compact.match(/^GHA(\d{9})(\d)$/);
    if (!m) return { message: 'Enter your Ghana Card number in the right format, like GHA-123456789-0' };
    return { value: `GHA-${m[1]}-${m[2]}` };
  };

  const showError = (message) => {
    field.classList.add('ggds-field--error');
    error.hidden = false;
    error.querySelector('[data-message]').textContent = message;
    input.setAttribute('aria-invalid', 'true');
    input.setAttribute('aria-describedby', 'home-try-hint home-try-error');
    summaryLink.textContent = message;
    summary.hidden = false;
    summary.focus();
  };

  const clearError = () => {
    field.classList.remove('ggds-field--error');
    error.hidden = true;
    input.removeAttribute('aria-invalid');
    input.setAttribute('aria-describedby', 'home-try-hint');
    summary.hidden = true;
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const r = problem(input.value);
    if (r.message) return showError(r.message);
    clearError();
    reference.textContent = r.value;
    formScreen.hidden = true;
    done.hidden = false;
    panel.focus();
  });

  summaryLink.addEventListener('click', (e) => {
    e.preventDefault();
    input.focus();
    field.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  });

  $('home-try-again').addEventListener('click', () => {
    form.reset();
    clearError();
    done.hidden = true;
    formScreen.hidden = false;
    input.focus();
  });

  tryCard.hidden = false;
  for (const el of document.querySelectorAll('[data-home-fallback]')) el.hidden = true;
}

// Same page, any screen: the frame is drawn at the chosen width and scaled down to fit when it is wider than the
// space it has, so a laptop-sized page still shows whole on a phone.
const screens = document.querySelector('[data-home-screens]');
if (screens) {
  const controls = screens.querySelector('[data-home-screens-controls]');
  const stage = screens.querySelector('[data-home-screens-stage]');
  const device = screens.querySelector('[data-home-screens-device]');
  const label = screens.querySelector('[data-home-screens-label]');
  const range = document.getElementById('home-width');
  const out = document.getElementById('home-width-out');
  const presets = [...screens.querySelectorAll('[data-width]')];
  const HEIGHT = device.offsetHeight || 680;
  const name = (w) => (w < 360 ? 'a small phone' : w < 600 ? 'a phone' : w < 1000 ? 'a tablet' : 'a laptop');

  const apply = () => {
    const w = Number(range.value);
    const scale = Math.min(1, stage.clientWidth / w);
    device.style.width = `${w}px`;
    device.style.transform = scale < 1 ? `scale(${scale})` : '';
    stage.style.height = `${Math.ceil(HEIGHT * scale)}px`;
    out.textContent = `${w}px: ${name(w)}${scale < 1 ? `, shown at ${Math.round(scale * 100)}%` : ''}`;
    label.textContent = `${w}px`;
    for (const b of presets) b.setAttribute('aria-pressed', String(Number(b.dataset.width) === w));
  };

  range.addEventListener('input', apply);
  for (const b of presets) b.addEventListener('click', () => { range.value = b.dataset.width; apply(); });
  new ResizeObserver(apply).observe(stage);
  controls.hidden = false;
  apply();
}
