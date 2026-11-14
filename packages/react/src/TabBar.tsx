import type { AnchorHTMLAttributes, HTMLAttributes } from 'react';
import { Icon, type IconName } from './Icon.js';
import { cx, t, type StringsProp } from './util.js';

export interface Tab { label: string; href: string; icon: IconName; current?: boolean; attrs?: AnchorHTMLAttributes<HTMLAnchorElement> }

export interface TabBarProps extends HTMLAttributes<HTMLElement> {
  /** Home first, up to three main sections, Search last. */
  tabs: Tab[];
  /** GGDS's own text in another language: stringsFor('tw'). */
  strings?: StringsProp;
}

/** Quick links fixed to the bottom of the screen, on phones only. */
export function TabBar({ tabs, strings, className, ...rest }: TabBarProps) {
  return (
    <nav className={cx('ggds-tab-bar', className)} aria-label={t(strings, 'tabBar.label')} {...rest}>
      <ul className="ggds-tab-bar__list">
        {tabs.map((t) => <li key={t.href}><a className="ggds-tab-bar__link" href={t.href} aria-current={t.current ? 'page' : undefined} {...t.attrs}><Icon name={t.icon} className="ggds-tab-bar__icon" /><span>{t.label}</span></a></li>)}
      </ul>
    </nav>
  );
}
