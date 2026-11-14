'use client';
import { useEffect, useRef, useState } from 'react';
import { t, type StringsProp } from './util.js';

export interface TimeoutWarningProps {
  /** Seconds of inactivity before the server signs people out. */
  timeout: number;
  /** Seconds before that to warn them: at least 120 (the default). */
  warn?: number;
  /** An address on your website that extends the session when requested, and fails or redirects if it has ended. */
  keepAlive: string;
  /** Where to go when time runs out: a page that says they were signed out and their answers are saved. */
  signOut: string;
  /** Where "Sign out" goes. Default: signOut. */
  signOutHref?: string;
  id?: string;
  strings?: StringsProp;
}

/** The shared deadline, so every tab of the website agrees (the same key as @ggds/js). */
const STORE = 'ggds-timeout-deadline';
const readShared = (): number => {
  try { return Number(localStorage.getItem(STORE)) || 0; } catch { return 0; }
};
const writeShared = (deadline: number): void => {
  try { localStorage.setItem(STORE, String(deadline)); } catch { /* storage blocked: this tab counts alone */ }
};

/** The moment screen readers hear the time again, if one was passed: each whole minute, then 30 and 10 seconds. */
function crossedMilestone(before: number, now: number): number | null {
  const marks = [10, 30];
  for (let m = 60; m < before; m += 60) marks.push(m);
  const crossed = marks.filter((m) => before > m && now <= m);
  return crossed.length ? Math.min(...crossed) : null;
}

/**
 * Warns people before they are signed out, counts down, and lets them stay signed in. "Stay signed in" (or Escape)
 * requests keepAlive; if the session has already ended, the page goes to signOut. Several tabs share one deadline.
 * Screen readers hear the message when it opens, then as the time passes each minute, 30 and 10 seconds. Put it on
 * every signed-in page. Changing its props after it starts (such as a new strings object) never resets the count.
 */
export function TimeoutWarning({ timeout, warn = 120, keepAlive, signOut, signOutHref, id = 'timeout-warning', strings }: TimeoutWarningProps) {
  const first = Math.min(warn > 0 ? warn : 120, timeout);
  const ref = useRef<HTMLDialogElement>(null);
  const [left, setLeft] = useState(first);
  const [said, setSaid] = useState<number | null>(null);
  // The latest props, read by the timer without restarting it.
  const say = (n: number) => {
    if (n >= 60) {
      const minutes = Math.round(n / 60);
      return minutes === 1 ? t(strings, 'timeoutWarning.minutesOne') : t(strings, 'timeoutWarning.minutesOther', { count: minutes });
    }
    return n === 1 ? t(strings, 'timeoutWarning.secondsOne') : t(strings, 'timeoutWarning.secondsOther', { count: n });
  };
  const [before, after] = t(strings, 'timeoutWarning.message').split('{time}');
  const latest = useRef({ timeout, first, keepAlive, signOut, say });
  latest.current = { timeout, first, keepAlive, signOut, say };
  const controls = useRef<{ extend: () => void } | null>(null);

  // Started once. The deadline, the countdown and what screen readers last heard live in this effect.
  useEffect(() => {
    let deadline = 0;
    let previous = Infinity;
    const leave = () => window.location.assign(latest.current.signOut);
    const tick = () => {
      const dialog = ref.current;
      if (!dialog) return;
      deadline = Math.max(deadline, readShared());
      const n = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      if (n === 0) { leave(); return; }
      if (n > latest.current.first) {
        if (dialog.open) dialog.close();
        previous = Infinity;
        return;
      }
      if (!dialog.open) {
        // The countdown must show the right time before the dialog opens: its message is read on opening.
        const shown = dialog.querySelector('.ggds-timeout-warning__time');
        if (shown) shown.textContent = latest.current.say(n);
        setLeft(n);
        setSaid(null);
        dialog.showModal();
        dialog.querySelector<HTMLButtonElement>('button')?.focus();
      } else {
        setLeft(n);
        const mark = crossedMilestone(previous, n);
        if (mark !== null) setSaid(mark);
      }
      previous = n;
    };
    const start = () => {
      deadline = Date.now() + latest.current.timeout * 1000;
      if (deadline > readShared()) writeShared(deadline);
      previous = Infinity;
      setLeft(latest.current.first);
      tick();
    };
    const extend = async () => {
      try {
        const response = await fetch(latest.current.keepAlive, { credentials: 'same-origin', cache: 'no-store' });
        if (!response.ok || response.redirected) { leave(); return; }
      } catch {
        return; // Offline: keep the warning open, so people can try again.
      }
      if (ref.current?.open) ref.current.close();
      start();
    };
    controls.current = { extend: () => { void extend(); } };
    const onCancel = (event: Event) => { event.preventDefault(); void extend(); };
    const onShow = (event: PageTransitionEvent) => { if (event.persisted) void extend(); };
    const onStorage = (event: StorageEvent) => { if (event.key === STORE) tick(); };
    const dialog = ref.current;
    dialog?.addEventListener('cancel', onCancel);
    window.addEventListener('pageshow', onShow);
    window.addEventListener('storage', onStorage);
    const ticker = setInterval(tick, 1000);
    start();
    return () => {
      clearInterval(ticker);
      dialog?.removeEventListener('cancel', onCancel);
      window.removeEventListener('pageshow', onShow);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return (
    <dialog ref={ref} className="ggds-dialog ggds-timeout-warning" id={id} aria-labelledby={`${id}-title`} aria-describedby={`${id}-message`}>
      <h2 className="ggds-dialog__title" id={`${id}-title`}>{t(strings, 'timeoutWarning.title')}</h2>
      <div className="ggds-dialog__body">
        <p id={`${id}-message`}>{before}<span className="ggds-timeout-warning__time">{say(left)}</span>{after}</p>
        <p className="ggds-visually-hidden" aria-live="polite">{said === null ? '' : `${before}${say(said)}${after}`}</p>
      </div>
      <div className="ggds-dialog__actions">
        <button className="ggds-button" type="button" onClick={() => controls.current?.extend()}>{t(strings, 'timeoutWarning.continue')}</button>
        <a href={signOutHref ?? signOut}>{t(strings, 'timeoutWarning.signOut')}</a>
      </div>
    </dialog>
  );
}
