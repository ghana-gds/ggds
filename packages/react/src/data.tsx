import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon.js';
import { cx } from './util.js';

export interface PageHeadingProps {
  /** The page's <h1>. */
  title: ReactNode;
  /** A short line above the title, such as the business name and number. */
  eyebrow?: ReactNode;
  /** One or two sentences under the title. */
  lede?: ReactNode;
  /** For a warning in force: the danger colour instead of the institution's. */
  danger?: boolean;
  /** Anything after the lede, such as <KeyFigures inverse />. */
  children?: ReactNode;
}

/** The top of an inner page in the institution's colour, such as an account's welcome or a warning. First in <main>. */
export function PageHeading({ title, eyebrow, lede, danger = false, children }: PageHeadingProps) {
  return (
    <div className={cx('ggds-page-heading', danger && 'ggds-page-heading--danger')}>
      <div className="ggds-container">
        {eyebrow && <p className="ggds-page-heading__eyebrow">{eyebrow}</p>}
        <h1 className="ggds-page-heading__title">{title}</h1>
        {lede && <p className="ggds-page-heading__lede">{lede}</p>}
        {children}
      </div>
    </div>
  );
}

export interface KeyFigure {
  value: ReactNode;
  label: ReactNode;
  /** The change, in words, such as "7% above normal". */
  change?: ReactNode;
  /** A figure that needs action. */
  danger?: boolean;
}

/** A few numbers that matter most, large. inverse: inside a PageHeading. */
export function KeyFigures({ figures, inverse = false }: { figures: KeyFigure[]; inverse?: boolean }) {
  return (
    <ul className={cx('ggds-key-figures', inverse && 'ggds-key-figures--inverse')}>
      {figures.map((f, i) => (
        <li className={cx('ggds-key-figure', f.danger && 'ggds-key-figure--danger')} key={i}>
          <p className="ggds-key-figure__value">{f.value}</p>
          <p className="ggds-key-figure__label">{f.label}</p>
          {f.change && <p className="ggds-key-figure__change">{f.change}</p>}
        </li>
      ))}
    </ul>
  );
}

export interface ProgressProps {
  current: number;
  total: number;
  /** Default: "Question <current> of <total>". */
  label?: string;
  /** Default: "ggds-progress". */
  id?: string;
}

/** How far through a task: in words, and as a native <progress> bar. */
export function Progress({ current, total, label, id = 'ggds-progress' }: ProgressProps) {
  const text = label || `Question ${current} of ${total}`;
  return (
    <div className="ggds-progress">
      <label className="ggds-progress__label" htmlFor={id}>{text}</label>
      <progress className="ggds-progress__bar" id={id} value={current} max={total}>{text}</progress>
    </div>
  );
}

export interface Stage {
  title: ReactNode;
  when?: ReactNode;
  /** "done", "current" or "" (to come). */
  state?: 'done' | 'current' | '';
  /** The hidden words before the title. Default: "Done", "Now" or "Next". */
  words?: string;
}
const STATE_WORDS = { done: 'Done', current: 'Now', '': 'Next' } as const;

/** What has happened and what happens next. Each stage says its state in words, not only by its look. */
export function Timeline({ stages }: { stages: Stage[] }) {
  return (
    <ol className="ggds-timeline">
      {stages.map((s, i) => {
        const state = s.state ?? '';
        return (
          <li className={cx('ggds-timeline__item', state && `ggds-timeline__item--${state}`)} key={i}>
            <p className="ggds-timeline__title"><span className="ggds-visually-hidden">{s.words ?? STATE_WORDS[state]}: </span>{s.title}</p>
            {s.when && <p className="ggds-timeline__when">{s.when}</p>}
          </li>
        );
      })}
    </ol>
  );
}

export interface MeterProps {
  value: number;
  max: number;
  min?: number;
  /** The fallback text inside <meter>. Default: the value. */
  text?: string;
}

/** An amount as a bar, for a table cell next to the number. Hidden from screen readers: the number says it. */
export function Meter({ value, max, min = 0, text }: MeterProps) {
  return <meter className="ggds-meter" min={min} max={max} value={value} aria-hidden="true">{text ?? String(value)}</meter>;
}

export interface Step {
  /** A GGDS icon name. */
  icon: IconName;
  /** Starts with a verb: "Move to higher ground". */
  title: ReactNode;
  /** One sentence. */
  text: ReactNode;
}

/** A few numbered steps with icons. urgent: for what to do in an emergency. */
export function Steps({ steps, urgent = false, headingLevel = 3 }: { steps: Step[]; urgent?: boolean; headingLevel?: 2 | 3 | 4 }) {
  const H = `h${headingLevel}` as 'h3';
  return (
    <ol className={cx('ggds-steps', urgent && 'ggds-steps--urgent')}>
      {steps.map((s, i) => (
        <li className="ggds-steps__item" key={i}>
          <span className="ggds-steps__icon"><Icon name={s.icon} className="ggds-icon ggds-icon--lg" /></span>
          <H className="ggds-steps__title">{s.title}</H>
          <p>{s.text}</p>
        </li>
      ))}
    </ol>
  );
}
