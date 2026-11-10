'use client';
import { useEffect, useRef, useState, type HTMLAttributes, type ReactNode, type AnchorHTMLAttributes } from 'react';
import { Icon } from './Icon.js';
import { cx } from './util.js';

const NARROW = '(max-width: 79.99rem)'; // the header's navigation fits on one row from 80rem

export interface NavItem { label: string; href: string; attrs?: AnchorHTMLAttributes<HTMLAnchorElement> }

export interface HeaderProps extends HTMLAttributes<HTMLElement> {
  /** The institution's name. */
  name: string;
  /** The main sections. */
  nav: NavItem[];
  /** The href of the current section, marked aria-current="page". */
  current?: string;
  /** Initials for the round badge, used until a logo is approved. */
  initials?: string;
  /** The approved logo, such as <img className="ggds-header__logo" …>. Replaces the initials. */
  logo?: ReactNode;
  /** The line under the name. Default: "Republic of Ghana". */
  country?: string;
  /** Where the name links to. Default: "/". */
  home?: string;
  /** The search page, or false for none. Default: { href: "/search/" }. */
  search?: { href: string } | false;
  /** The navigation's id. Default: "ggds-header-nav". */
  navId?: string;
}

/**
 * The header: the institution's name and the main sections. Below 80rem the sections are behind a menu button that
 * opens in place; until the page's JavaScript runs (and without it) they are a list under the name, as in the HTML.
 */
export function Header({ name, nav, current, initials, logo, country = 'Republic of Ghana', home = '/', search = { href: '/search/' }, navId = 'ggds-header-nav', className, ...rest }: HeaderProps) {
  const [enhanced, setEnhanced] = useState(false);
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setEnhanced(true);
    const narrow = window.matchMedia(NARROW);
    const close = () => setOpen(false); // leaving the narrow layout closes the menu
    narrow.addEventListener('change', close);
    return () => narrow.removeEventListener('change', close);
  }, []);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape' && open && window.matchMedia(NARROW).matches) {
      setOpen(false);
      button.current?.focus();
    }
  };

  return (
    <header className={cx('ggds-header', className)} {...rest}>
      <div className="ggds-container ggds-header__inner">
        <a className="ggds-header__identity" href={home}>
          {logo ?? (initials && <span className="ggds-header__monogram" aria-hidden="true">{initials}</span>)}
          <span className="ggds-header__text">
            <span className={cx('ggds-header__name', name.length > 45 && 'ggds-header__name--long')}>{name}</span>
            {country && <span className="ggds-header__country">{country}</span>}
            <span className="ggds-visually-hidden"> – home</span>
          </span>
        </a>
        <nav className={cx('ggds-header__nav', enhanced && 'ggds-header__nav--collapsible', enhanced && open && 'is-open')} id={navId} aria-label="Main" onKeyDown={onKeyDown}>
          <ul className="ggds-header__list">
            {nav.map((n) => <li key={n.href}><a className="ggds-header__link" href={n.href} aria-current={n.href === current ? 'page' : undefined} {...n.attrs}>{n.label}</a></li>)}
          </ul>
        </nav>
        {search && <a className="ggds-header__search" href={search.href}><Icon name="search" className="ggds-header__icon" /><span className="ggds-header__search-label">Search</span></a>}
        <button ref={button} type="button" className="ggds-header__menu-button" aria-controls={navId} aria-expanded={enhanced && open} hidden={!enhanced} onClick={() => setOpen(!open)}>
          <Icon name="menu" className="ggds-header__icon ggds-header__icon--menu" /><Icon name="close" className="ggds-header__icon ggds-header__icon--close" /><span className="ggds-visually-hidden">Menu</span>
        </button>
      </div>
    </header>
  );
}
