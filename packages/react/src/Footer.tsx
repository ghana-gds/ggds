import type { AnchorHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { cx, fill, t, type StringsProp } from './util.js';

export interface FooterLink { label: string; href: string; attrs?: AnchorHTMLAttributes<HTMLAnchorElement> }

export interface FooterProps extends HTMLAttributes<HTMLElement> {
  /** The institution's name. */
  name: string;
  /** One sentence on what the institution does. */
  purpose?: string;
  contact?: { address?: string; email?: string; phone?: string; phoneHref?: string; moreHref?: string; moreLabel?: string };
  /** Main sections, each with up to five of its most-used pages. */
  sections?: (FooterLink & { links: FooterLink[] })[];
  /** Links in the bottom bar, such as Privacy and Accessibility. */
  bar?: FooterLink[];
  /** The copyright year. Default: this year. */
  year?: number;
  /** The institution's logo or initials badge, before its name. */
  logo?: ReactNode;
  /** GGDS's own text in another language: stringsFor('tw'). */
  strings?: StringsProp;
}

/** The footer: who runs the website, how to contact them, the main sections and the links every website must have. */
export function Footer({ name, purpose, contact, sections = [], bar = [], year = new Date().getFullYear(), logo, strings, className, ...rest }: FooterProps) {
  return (
    <footer className={cx('ggds-footer', className)} {...rest}>
      <div className="ggds-container ggds-footer__main">
        <div>
          <p className="ggds-footer__identity">{logo}<span>{name}</span></p>
          {purpose && <p className="ggds-footer__purpose">{purpose}</p>}
          {contact && (contact.address || contact.email || contact.phone) && (
            <address className="ggds-footer__contact">
              {contact.address && <span>{contact.address}</span>}
              {contact.email && <a href={`mailto:${contact.email}`}>{contact.email}</a>}
              {contact.phone && <span>{fill(strings, 'footer.enquiries', { phone: contact.phoneHref ? <a href={contact.phoneHref}>{contact.phone}</a> : contact.phone })}</span>}
            </address>
          )}
          {contact?.moreHref && <p className="ggds-footer__more"><a href={contact.moreHref}>{contact.moreLabel ?? t(strings, 'footer.contactMore')}</a></p>}
        </div>
        <div className="ggds-footer__sections">
          {sections.map((s) => (
            <nav className="ggds-footer__section" aria-label={s.label} key={s.href}>
              <p className="ggds-footer__heading"><a href={s.href} {...s.attrs}>{s.label}</a></p>
              <ul className="ggds-footer__list">
                {s.links.slice(0, 5).map((l) => <li key={l.href}><a href={l.href} {...l.attrs}>{l.label}</a></li>)}
              </ul>
            </nav>
          ))}
        </div>
      </div>
      <div className="ggds-footer__bottom">
        <ul className="ggds-container ggds-footer__bar">
          <li>© {year} {name}</li>
          {bar.map((l) => <li key={l.href}><a href={l.href} {...l.attrs}>{l.label}</a></li>)}
        </ul>
      </div>
    </footer>
  );
}
