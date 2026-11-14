import type { ReactNode } from 'react';
import { LANGUAGES } from './strings.js';
import { fill, t, type StringsProp } from './util.js';

export interface BackLinkProps {
  href: string;
  /** Only if "Back" would be unclear, such as "Back to your applications". */
  label?: string;
  strings?: StringsProp;
}

/** A link to the previous page of a task, above the content. */
export function BackLink({ href, label, strings }: BackLinkProps) {
  return <a className="ggds-back-link" href={href}>{label ?? t(strings, 'backLink.label')}</a>;
}

export interface PhaseBannerProps {
  /** "alpha" or "beta" (default). */
  phase?: 'alpha' | 'beta';
  /** Where people tell you what went wrong. */
  feedbackHref?: string;
  strings?: StringsProp;
}

/** Under the header: the service is new, and feedback helps improve it. */
export function PhaseBanner({ phase = 'beta', feedbackHref, strings }: PhaseBannerProps) {
  const word = t(strings, 'phaseBanner.feedback');
  return (
    <div className="ggds-phase-banner">
      <p className="ggds-container ggds-phase-banner__content">
        <strong className="ggds-phase-banner__tag">{t(strings, `phaseBanner.${phase}`)}</strong>
        {' '}<span className="ggds-phase-banner__text">{fill(strings, 'phaseBanner.text', { feedback: feedbackHref ? <a href={feedbackHref}>{word}</a> : word })}</span>
      </p>
    </div>
  );
}

export interface SideNavItem { label: string; href: string; links?: { label: string; href: string }[] }

export interface SideNavProps {
  items: SideNavItem[];
  /** The current page's path. Its pages are shown under it. */
  current?: string;
  /** Default: "In this section". */
  label?: string;
  strings?: StringsProp;
}

/** The pages of one section, beside its content. */
export function SideNav({ items, current, label, strings }: SideNavProps) {
  return (
    <nav className="ggds-side-nav" aria-label={label ?? t(strings, 'sideNav.label')}>
      <ul className="ggds-side-nav__list">
        {items.map((i) => {
          const open = i.href === current || (i.links ?? []).some((l) => l.href === current);
          return (
            <li key={i.href}>
              <a className="ggds-side-nav__link" href={i.href} aria-current={i.href === current ? 'page' : undefined}>{i.label}</a>
              {open && i.links && i.links.length > 0 && (
                <ul className="ggds-side-nav__list ggds-side-nav__list--sub">
                  {i.links.map((l) => <li key={l.href}><a className="ggds-side-nav__link" href={l.href} aria-current={l.href === current ? 'page' : undefined}>{l.label}</a></li>)}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export interface ContentsProps {
  /** The page's sections: their headings' words, and "#id". */
  items: { label: string; href: string }[];
  /** Default: "On this page". */
  title?: string;
  /** The title's id. Default: "contents-title". */
  id?: string;
  strings?: StringsProp;
}

/** "On this page": links to the page's own sections. */
export function Contents({ items, title, id = 'contents-title', strings }: ContentsProps) {
  return (
    <nav className="ggds-contents" aria-labelledby={id}>
      <h2 className="ggds-contents__title" id={id}>{title ?? t(strings, 'contents.title')}</h2>
      <ol className="ggds-contents__list">
        {items.map((i) => <li key={i.href}><a className="ggds-contents__link" href={i.href}>{i.label}</a></li>)}
      </ol>
    </nav>
  );
}

export interface LanguageSwitcherProps {
  /** Each language this page is in: its code and the page's address in it. own: its name in itself, if GGDS does not list it. */
  languages: { code: string; href: string; own?: string }[];
  /** The page's language code. */
  current: string;
  /** Default: "Choose a language". */
  label?: string;
  strings?: StringsProp;
}

/** The same page in other languages, each named in its own language. Renders nothing for one language. */
export function LanguageSwitcher({ languages, current, label, strings }: LanguageSwitcherProps) {
  if (languages.length < 2) return null;
  const own = (code: string) => LANGUAGES.find((l) => l.code === code)?.own ?? code;
  return (
    <nav className="ggds-language-switcher" aria-label={label ?? t(strings, 'languageSwitcher.label')}>
      <ul className="ggds-language-switcher__list">
        {languages.map((l) => (
          <li key={l.code}><a className="ggds-language-switcher__link" href={l.href} lang={l.code} hrefLang={l.code} aria-current={l.code === current ? 'true' : undefined}>{l.own ?? own(l.code)}</a></li>
        ))}
      </ul>
    </nav>
  );
}

export interface CookieBannerProps {
  /** The website's or service's name: "Cookies on {service}". */
  service: string;
  /** "" or absent: ask. "accept" or "reject": the choice just made, to confirm. "hidden": render nothing. */
  choice?: '' | 'accept' | 'reject' | 'hidden';
  /** Where the form posts (name "cookies": accept, reject or hide). Default: "/cookies/". */
  action?: string;
  /** The cookies page. Default: "/cookies/". */
  viewHref?: string;
  /** Anything else the form must send, such as a hidden CSRF input. */
  children?: ReactNode;
  strings?: StringsProp;
}

/** Asks before setting cookies the website does not need, such as analytics. Works without JavaScript. */
export function CookieBanner({ service, choice = '', action = '/cookies/', viewHref = '/cookies/', children, strings }: CookieBannerProps) {
  if (choice === 'hidden') return null;
  const s = strings;
  return (
    <div className="ggds-cookie-banner" role="region" aria-label={t(s, 'cookieBanner.label', { service })}>
      <div className="ggds-container ggds-cookie-banner__inner">
        {!choice ? <>
          <h2 className="ggds-cookie-banner__title">{t(s, 'cookieBanner.title', { service })}</h2>
          <div className="ggds-cookie-banner__body">
            <p>{t(s, 'cookieBanner.essential')}</p>
            <p>{t(s, 'cookieBanner.analytics')}</p>
          </div>
          <form className="ggds-cookie-banner__actions" method="post" action={action}>
            {children}
            <button className="ggds-button" type="submit" name="cookies" value="accept">{t(s, 'cookieBanner.accept')}</button>
            <button className="ggds-button" type="submit" name="cookies" value="reject">{t(s, 'cookieBanner.reject')}</button>
            <a href={viewHref}>{t(s, 'cookieBanner.view')}</a>
          </form>
        </> : <>
          <div className="ggds-cookie-banner__body">
            <p>{t(s, choice === 'accept' ? 'cookieBanner.accepted' : 'cookieBanner.rejected')} {fill(s, 'cookieBanner.change', { change: <a href={viewHref}>{t(s, 'cookieBanner.changeLink')}</a> })}</p>
          </div>
          <form className="ggds-cookie-banner__actions" method="post" action={action}>
            {children}
            <button className="ggds-button ggds-button--secondary" type="submit" name="cookies" value="hide">{t(s, 'cookieBanner.hide')}</button>
          </form>
        </>}
      </div>
    </div>
  );
}
