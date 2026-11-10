/**
 * Header menu on narrow screens. Markup: a `.ggds-header__menu-button` (rendered with `hidden`) whose
 * `aria-controls` names the `<nav>`. Without this script the button stays hidden and the navigation stays visible.
 *
 * The menu opens in place and pushes the page down; it never covers the page, so focus cannot move onto hidden
 * content behind it (a full-screen drawer that covers the page fails WCAG 2.4.11 Focus Not Obscured).
 */
const NARROW = '(max-width: 79.99rem)'; // --ggds-breakpoint-wide: the header nav fits one row from 80rem

export function initMenu(button: HTMLButtonElement): void {
  const navId = button.getAttribute('aria-controls');
  const nav = navId ? document.getElementById(navId) : null;
  if (!nav || button.dataset['ggdsReady']) return;
  button.dataset['ggdsReady'] = 'true';

  const narrow = window.matchMedia(NARROW);
  const setOpen = (open: boolean): void => {
    button.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
  };

  nav.classList.add('ggds-header__nav--collapsible');
  button.hidden = false;
  setOpen(false);

  button.addEventListener('click', () => setOpen(button.getAttribute('aria-expanded') !== 'true'));

  // Escape closes the menu from anywhere inside it and returns focus to the button.
  nav.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && narrow.matches && nav.classList.contains('is-open')) {
      setOpen(false);
      button.focus();
    }
  });

  // Leaving the narrow layout closes the menu, so it is closed again if the screen narrows later.
  narrow.addEventListener('change', () => setOpen(false));
}
