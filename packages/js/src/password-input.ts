/**
 * Password input. Without JavaScript, a normal password field. With it, a Show button beside the field switches it
 * between hidden and visible, its name says what it will do ("Show password", "Hide password"), and screen readers
 * hear which it is now. The password is hidden again when the form is sent, so the browser never keeps it as text.
 *
 * Markup: `<div class="ggds-field ggds-password-input" data-ggds-module="password-input">` around the label and
 * `.ggds-password-input__wrapper`, which holds the input and `<button class="ggds-password-input__toggle" hidden>`.
 * The words can be translated with data-ggds-show, -hide, -show-label, -hide-label, -shown and -hidden.
 */
const TEXT = {
  show: 'Show',
  hide: 'Hide',
  showLabel: 'Show password',
  hideLabel: 'Hide password',
  shown: 'Your password is visible',
  hidden: 'Your password is hidden',
};

export function initPasswordInput(field: HTMLElement): void {
  if (field.dataset['ggdsReady']) return;
  const input = field.querySelector<HTMLInputElement>('.ggds-password-input__input');
  const toggle = field.querySelector<HTMLButtonElement>('.ggds-password-input__toggle');
  if (!input || !toggle) return;
  field.dataset['ggdsReady'] = 'true';

  const d = field.dataset;
  const words = {
    show: d['ggdsShow'] ?? TEXT.show,
    hide: d['ggdsHide'] ?? TEXT.hide,
    showLabel: d['ggdsShowLabel'] ?? TEXT.showLabel,
    hideLabel: d['ggdsHideLabel'] ?? TEXT.hideLabel,
    shown: d['ggdsShown'] ?? TEXT.shown,
    hidden: d['ggdsHidden'] ?? TEXT.hidden,
  };

  const status = document.createElement('p');
  status.className = 'ggds-visually-hidden';
  status.setAttribute('aria-live', 'polite');
  field.append(status);

  const set = (visible: boolean, announce: boolean) => {
    input.type = visible ? 'text' : 'password';
    toggle.textContent = visible ? words.hide : words.show;
    toggle.setAttribute('aria-label', visible ? words.hideLabel : words.showLabel);
    if (announce) status.textContent = visible ? words.shown : words.hidden;
  };

  toggle.addEventListener('click', () => set(input.type === 'password', true));
  // Hidden again before the form is sent (any form holding the field, even one added later), and when people come
  // back to the page with the back button.
  document.addEventListener('submit', (event) => {
    if (event.target instanceof HTMLFormElement && event.target.contains(input)) set(false, false);
  }, true);
  window.addEventListener('pageshow', () => set(false, false));
  set(false, false);
  toggle.hidden = false;
}
