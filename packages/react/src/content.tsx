import type { AnchorHTMLAttributes, ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { Icon, type IconName } from './Icon.js';
import { cx } from './util.js';

const VARIANT = { primary: '', secondary: 'ggds-button--secondary', quiet: 'ggds-button--quiet', warning: 'ggds-button--warning' } as const;

type ButtonOwn = {
  /** primary (one per page), secondary, quiet, or warning (only for actions that delete something). */
  variant?: keyof typeof VARIANT;
};
export type ButtonProps =
  | (ButtonOwn & ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined })
  | (ButtonOwn & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string });

/** A button. With href it is a link that looks like a button: only for one link that starts a task ("Start now"). */
export function Button({ variant = 'primary', className, ...rest }: ButtonProps) {
  const cls = cx('ggds-button', VARIANT[variant], className);
  if (rest.href !== undefined) return <a className={cls} {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)} />;
  const { type = 'button', ...button } = rest as ButtonHTMLAttributes<HTMLButtonElement>;
  return <button className={cls} type={type} {...button} />;
}

/** Buttons side by side, wrapping on phones. */
export function ButtonGroup({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('ggds-button-group', className)} {...rest} />;
}

export interface BreadcrumbsProps {
  /** The pages above this one, from Home. */
  items: { label: string; href: string }[];
  /** This page's name. */
  current: string;
}

/** Where the page sits in the website. */
export function Breadcrumbs({ items, current }: BreadcrumbsProps) {
  return (
    <nav className="ggds-breadcrumbs" aria-label="Breadcrumb">
      <ol className="ggds-breadcrumbs__list">
        {items.map((i) => <li className="ggds-breadcrumbs__item" key={i.href}><a className="ggds-breadcrumbs__link" href={i.href}>{i.label}</a></li>)}
        <li className="ggds-breadcrumbs__item" aria-current="page">{current}</li>
      </ol>
    </nav>
  );
}

const NOTICE = { info: ['', 'Information:'], success: ['ggds-notice--success', 'Success:'], warning: ['ggds-notice--warning', 'Warning:'], danger: ['ggds-notice--danger', 'Important:'] } as const;

export interface NoticeProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** info (default), success, warning or danger. */
  type?: keyof typeof NOTICE;
  /** The message, in one line. */
  title: ReactNode;
}

/** A message to read before going on. Screen readers hear its type first ("Warning:"). */
export function Notice({ type = 'info', title, children, className, ...rest }: NoticeProps) {
  const [cls, word] = NOTICE[type];
  return (
    <div className={cx('ggds-notice', cls, className)} {...rest}>
      <p className="ggds-notice__title"><span className="ggds-visually-hidden">{word}</span> {title}</p>
      {children}
    </div>
  );
}

const TAG = { neutral: '', info: 'ggds-tag--info', success: 'ggds-tag--success', warning: 'ggds-tag--warning', danger: 'ggds-tag--danger' } as const;

/** A short status, such as "Approved". Say it in words; the colour only supports them. */
export function Tag({ type = 'neutral', className, ...rest }: HTMLAttributes<HTMLElement> & { type?: keyof typeof TAG }) {
  return <strong className={cx('ggds-tag', TAG[type], className)} {...rest} />;
}

/** Cards in a grid: one column on phones, two on tablets, three (or four) on wide screens. */
export function CardGrid({ columns = 3, className, ...rest }: HTMLAttributes<HTMLUListElement> & { columns?: 3 | 4 }) {
  return <ul className={cx('ggds-card-grid', columns === 4 && 'ggds-card-grid--4', className)} {...rest} />;
}

export interface CardProps {
  title: ReactNode;
  href: string;
  /** One short sentence. */
  children?: ReactNode;
  /** A GGDS icon above the title, for a page of services or topics. */
  icon?: IconName;
  /** The title's heading level. Default: 2. */
  level?: 2 | 3 | 4;
}

/** A linked summary of a page or service; the whole card is clickable. Put cards in a CardGrid. */
export function Card({ title, href, children, icon, level = 2 }: CardProps) {
  const H = `h${level}` as 'h2';
  return (
    <li className={cx('ggds-card', icon && 'ggds-card--icon')}>
      {icon && <span className="ggds-card__icon"><Icon name={icon} /></span>}
      <H className="ggds-card__title"><a className="ggds-card__link" href={href}>{title}</a></H>
      {children && <p className="ggds-card__body">{children}</p>}
    </li>
  );
}
