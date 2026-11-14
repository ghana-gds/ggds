/**
 * Character count. Without JavaScript the field shows its limit as a hint ("You can enter up to 500 characters").
 * With it, a count under the textarea updates as people type, and screen readers hear the count once they pause, so
 * it does not interrupt every key. The hint stays, hidden, as the textarea's description. Too many characters is
 * shown in words and in bold, and the textarea's border turns red; the server still checks the length.
 *
 * Markup: `<div class="ggds-field ggds-character-count" data-ggds-module="character-count" data-ggds-max="500">`
 * around the label, textarea and `<p class="ggds-hint ggds-character-count__message">`. The count's words can be
 * translated with data-ggds-remaining-one, -remaining-other, -over-one and -over-other, with {count} for the number.
 */
const TEXT = {
  remainingOne: 'You have 1 character remaining',
  remainingOther: 'You have {count} characters remaining',
  overOne: 'You have 1 character too many',
  overOther: 'You have {count} characters too many',
};

/** How long after the last key press screen readers hear the count. */
const PAUSE_MS = 1000;

export function initCharacterCount(field: HTMLElement): void {
  if (field.dataset['ggdsReady']) return;
  const textarea = field.querySelector<HTMLTextAreaElement>('textarea');
  const message = field.querySelector<HTMLElement>('.ggds-character-count__message');
  const max = Number(field.dataset['ggdsMax']);
  if (!textarea || !message || !Number.isInteger(max) || max <= 0) return;
  field.dataset['ggdsReady'] = 'true';

  const words = {
    remainingOne: field.dataset['ggdsRemainingOne'] ?? TEXT.remainingOne,
    remainingOther: field.dataset['ggdsRemainingOther'] ?? TEXT.remainingOther,
    overOne: field.dataset['ggdsOverOne'] ?? TEXT.overOne,
    overOther: field.dataset['ggdsOverOther'] ?? TEXT.overOther,
  };

  // The limit stays the textarea's description for screen readers; sighted people see the live count instead.
  message.classList.add('ggds-visually-hidden');
  // What sighted people see, at once. Hidden from screen readers, which hear the copy below.
  const status = document.createElement('p');
  status.className = 'ggds-hint ggds-character-count__message ggds-character-count__status';
  status.setAttribute('aria-hidden', 'true');
  // What screen readers hear, after a pause.
  const live = document.createElement('p');
  live.className = 'ggds-visually-hidden';
  live.setAttribute('aria-live', 'polite');
  message.after(status, live);

  let timer: ReturnType<typeof setTimeout> | undefined;
  const text = () => {
    const left = max - textarea.value.length;
    const n = Math.abs(left);
    const template = left >= 0 ? (n === 1 ? words.remainingOne : words.remainingOther) : (n === 1 ? words.overOne : words.overOther);
    return { over: left < 0, words: template.replace('{count}', String(n)) };
  };
  const update = () => {
    const now = text();
    status.textContent = now.words;
    status.classList.toggle('ggds-character-count__status--over', now.over);
    textarea.classList.toggle('ggds-character-count__textarea--over', now.over);
    clearTimeout(timer);
    timer = setTimeout(() => { live.textContent = now.words; }, PAUSE_MS);
  };
  textarea.addEventListener('input', update);
  // Show the count for any text already there (a page shown again with an error), without announcing it.
  const now = text();
  status.textContent = now.words;
  status.classList.toggle('ggds-character-count__status--over', now.over);
  textarea.classList.toggle('ggds-character-count__textarea--over', now.over);
}
