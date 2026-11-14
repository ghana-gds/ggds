import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon.js';
import { cx, t, type StringsProp } from './util.js';

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
  /** GGDS's own text in another language: stringsFor('tw'). */
  strings?: StringsProp;
}

/** How far through a task: in words, and as a native <progress> bar. */
export function Progress({ current, total, label, id = 'ggds-progress', strings }: ProgressProps) {
  const text = label || t(strings, 'progress.label', { current, total });
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
const STATE_WORDS = { done: 'timeline.done', current: 'timeline.current', '': 'timeline.next' } as const;

/** What has happened and what happens next. Each stage says its state in words, not only by its look. */
export function Timeline({ stages, strings }: { stages: Stage[]; strings?: StringsProp }) {
  return (
    <ol className="ggds-timeline">
      {stages.map((s, i) => {
        const state = s.state ?? '';
        return (
          <li className={cx('ggds-timeline__item', state && `ggds-timeline__item--${state}`)} key={i}>
            <p className="ggds-timeline__title"><span className="ggds-visually-hidden">{s.words ?? t(strings, STATE_WORDS[state])}: </span>{s.title}</p>
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

export type TaskStatus = 'completed' | 'inProgress' | 'notStarted' | 'cannotStart';
export interface Task {
  label: ReactNode;
  /** The section's address. Leave it out when people cannot open it yet. */
  href?: string;
  status: TaskStatus;
  /** Extra help under the name, such as why it cannot start yet. */
  hint?: ReactNode;
  /** Used for the ids of its hint and status: <idPrefix>-<id>-status. Default: its position. */
  id?: string;
}
const TASK_TAG = { completed: 'ggds-tag ggds-tag--success', inProgress: 'ggds-tag ggds-tag--info', notStarted: 'ggds-tag', cannotStart: '' } as const;

/**
 * The sections of a long application with the status of each. Sections people can open are links, the whole row
 * being the target, and screen readers hear each link's status. The summary counts the completed sections.
 */
export function TaskList({ tasks, summary = true, idPrefix = 'task', strings }: {
  tasks: Task[];
  summary?: boolean;
  /** The start of each section's ids: give each task list on a page its own. */
  idPrefix?: string;
  strings?: StringsProp;
}) {
  const done = tasks.filter((x) => x.status === 'completed').length;
  return (
    <>
      {summary && <p className="ggds-task-list__summary">{t(strings, 'taskList.summary', { done, total: tasks.length })}</p>}
      <ol className="ggds-task-list">
        {tasks.map((task, i) => {
          const key = `${idPrefix}-${task.id ?? i + 1}`;
          const status = t(strings, `taskList.${task.status}`);
          const open = Boolean(task.href) && task.status !== 'cannotStart';
          return (
            <li className={cx('ggds-task-list__item', open && 'ggds-task-list__item--link')} key={key}>
              <div className="ggds-task-list__name">
                {open ? <a className="ggds-task-list__link" href={task.href} aria-describedby={[task.hint && `${key}-hint`, `${key}-status`].filter(Boolean).join(' ')}>{task.label}</a> : task.label}
                {task.hint && <p className="ggds-task-list__hint" id={`${key}-hint`}>{task.hint}</p>}
              </div>
              {task.status === 'cannotStart'
                ? <div className="ggds-task-list__status ggds-task-list__status--cannot-start" id={`${key}-status`}>{status}</div>
                : <div className="ggds-task-list__status" id={`${key}-status`}><strong className={TASK_TAG[task.status]}>{status}</strong></div>}
            </li>
          );
        })}
      </ol>
    </>
  );
}
