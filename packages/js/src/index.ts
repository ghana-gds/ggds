/**
 * @ggds/js: optional progressive enhancement for GGDS components. Every component works without it.
 * Load as a module (`<script type="module" src="ggds.js">`): no inline script is needed, so it runs under a
 * strict Content Security Policy.
 */
import { initCharacterCount } from './character-count.js';
import { initDialog, initDialogOpener } from './dialog.js';
import { initErrorSummary } from './error-summary.js';
import { initMenu } from './menu.js';
import { initPasswordInput } from './password-input.js';
import { initTimeoutWarning } from './timeout-warning.js';

export { initCharacterCount, initDialog, initDialogOpener, initErrorSummary, initMenu, initPasswordInput, initTimeoutWarning };

/** Enhance every GGDS component inside `root` (default: the whole document). Safe to call more than once. */
export function initAll(root: ParentNode = document): void {
  document.documentElement.classList.add('ggds-js-enabled');
  root.querySelectorAll<HTMLButtonElement>('.ggds-header__menu-button[aria-controls]').forEach(initMenu);
  root.querySelectorAll<HTMLElement>('[data-ggds-module="error-summary"]').forEach(initErrorSummary);
  root.querySelectorAll<HTMLElement>('[data-ggds-module="character-count"]').forEach(initCharacterCount);
  root.querySelectorAll<HTMLElement>('[data-ggds-module="password-input"]').forEach(initPasswordInput);
  root.querySelectorAll<HTMLElement>('[data-ggds-dialog]').forEach(initDialogOpener);
  root.querySelectorAll<HTMLDialogElement>('dialog.ggds-dialog').forEach(initDialog);
  root.querySelectorAll<HTMLElement>('[data-ggds-module="timeout-warning"]').forEach(initTimeoutWarning);
}
