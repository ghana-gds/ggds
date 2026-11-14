/**
 * Dialog. The opener is a link to a confirmation page, so it works without JavaScript; with it, the link opens a
 * <dialog class="ggds-dialog"> as a modal instead. The browser keeps focus inside it, makes the page behind it
 * unavailable and closes it with Escape. Buttons with data-ggds-dialog-close close it, and focus goes back to the
 * link that opened it.
 *
 * Markup: `<a href="/confirm/" data-ggds-dialog="the-dialog-id">` and `<dialog class="ggds-dialog" id="the-dialog-id"
 * aria-labelledby="…">`.
 */
export function initDialogOpener(opener: HTMLElement): void {
  if (opener.dataset['ggdsReady']) return;
  const id = opener.dataset['ggdsDialog'];
  const dialog = id ? document.getElementById(id) : null;
  if (!(dialog instanceof HTMLDialogElement) || typeof dialog.showModal !== 'function') return;
  opener.dataset['ggdsReady'] = 'true';
  initDialog(dialog);
  opener.setAttribute('aria-haspopup', 'dialog');
  opener.addEventListener('click', (event) => {
    event.preventDefault();
    if (dialog.open) return;
    dialog.showModal();
    // Focus the first control, which is the safe choice, in every browser.
    dialog.querySelector<HTMLElement>('button, [href], input, select, textarea')?.focus();
    dialog.addEventListener('close', () => opener.focus(), { once: true });
  });
}

/** The close buttons inside a dialog. */
export function initDialog(dialog: HTMLDialogElement): void {
  // Its own flag: the same <dialog> may also be a timeout warning, which has its own set-up.
  if (dialog.dataset['ggdsDialogReady']) return;
  dialog.dataset['ggdsDialogReady'] = 'true';
  dialog.querySelectorAll<HTMLElement>('[data-ggds-dialog-close]').forEach((button) => {
    button.addEventListener('click', () => dialog.close());
  });
}
