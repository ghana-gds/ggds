import type { AnchorHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { Icon } from './Icon.js';
import { cx } from './util.js';

export interface Task { label: string; href: string; tag?: string; attrs?: AnchorHTMLAttributes<HTMLAnchorElement> }

export interface HeroProps extends HTMLAttributes<HTMLElement> {
  /** A question about the visitor's need, such as "What do you need to do?" */
  title: string;
  /** One sentence on what the institution does. */
  purpose?: string;
  /** A short paragraph under the title. */
  lede?: string;
  /** A search form; it works without JavaScript. */
  search?: { action: string; label: string; placeholder?: string };
  /** Up to six common tasks. */
  tasks?: Task[];
  /** Default: "Common tasks:". */
  tasksLabel?: string;
  /** A ministry hero searching all its agencies; tag each task with its agency. */
  hub?: boolean;
  /** A drawing beside the text, on wide screens. */
  art?: ReactNode;
  /** Set to false if the drawing has links. Default: true. */
  artDecorative?: boolean;
  /** Anything after the tasks. */
  after?: ReactNode;
}

/** The top of a homepage, in the institution's colour: what people can do here, a search and the common tasks. */
export function Hero({ title, purpose, lede, search, tasks = [], tasksLabel = 'Common tasks:', hub = false, art, artDecorative = true, after, className, ...rest }: HeroProps) {
  return (
    <section className={cx('ggds-hero', hub && 'ggds-hero--hub', art != null && 'ggds-hero--art', className)} aria-labelledby="hero-title" {...rest}>
      <div className="ggds-hero__inner">
        <div className="ggds-hero__body">
          {purpose && <p className="ggds-hero__purpose">{purpose}</p>}
          <h1 className="ggds-hero__title" id="hero-title">{title}</h1>
          {lede && <p className="ggds-hero__lede">{lede}</p>}
          {search && (
            <form className="ggds-hero__search" action={search.action} method="get" role="search">
              <label className="ggds-visually-hidden" htmlFor="hero-q">{search.label}</label>
              <input className="ggds-hero__input" id="hero-q" name="q" type="search" required minLength={2} enterKeyHint="search" autoComplete="off" placeholder={search.placeholder} />
              <button className="ggds-hero__button" type="submit"><Icon name="search" className="ggds-hero__button-icon" /><span className="ggds-hero__button-label">Search</span></button>
            </form>
          )}
          {tasks.length > 0 && <>
            <p className="ggds-hero__tasks-label" id="hero-tasks">{tasksLabel}</p>
            <ul className="ggds-hero__tasks" aria-labelledby="hero-tasks">
              {tasks.map((t) => <li key={t.href}><a className="ggds-hero__task" href={t.href} {...t.attrs}>{t.label}{t.tag && <> <span className="ggds-hero__task-tag">{t.tag}</span></>}</a></li>)}
            </ul>
          </>}
          {after}
        </div>
        {art != null && <div className="ggds-hero__art" aria-hidden={artDecorative ? true : undefined}>{art}</div>}
      </div>
    </section>
  );
}
