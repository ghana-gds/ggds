/**
 * Timeout warning. Counts the time since the page loaded (when the server's session last started) and, `warn`
 * seconds before `timeout`, opens the warning dialog with a countdown. "Stay signed in" (or Escape) requests the
 * keep-alive address: if the server says the session is still there, the warning closes and the count starts again;
 * if not, the page goes to the sign-out address, so nobody keeps filling in a form for a session that has ended. When
 * time runs out, the page goes to the sign-out address too.
 *
 * Several tabs share one deadline (through localStorage), so a forgotten tab never signs people out while they work in
 * another. A page restored with the back button checks the session first.
 *
 * Screen readers hear the whole message when the warning opens (it is the dialog's description), then again as the
 * time passes each minute, 30 seconds and 10 seconds, not every second.
 *
 * Markup: `<dialog class="ggds-dialog ggds-timeout-warning" data-ggds-module="timeout-warning" data-ggds-timeout="1200"
 * data-ggds-warn="120" data-ggds-keep-alive="/keep-alive/" data-ggds-sign-out="/signed-out/">` with the message
 * (`<p>` holding `.ggds-timeout-warning__time`), a visually hidden live region after it, and a
 * `[data-ggds-timeout-continue]` button. The time's words can be translated with data-ggds-minutes-one,
 * -minutes-other, -seconds-one and -seconds-other.
 */
const TEXT = {
  minutesOne: '1 minute',
  minutesOther: '{count} minutes',
  secondsOne: '1 second',
  secondsOther: '{count} seconds',
};

/** The shared deadline, so every tab of the website agrees. */
const STORE = 'ggds-timeout-deadline';

/** The time left in words: whole minutes (rounded) from a minute up, then seconds. */
export function timeoutWords(left: number, words: typeof TEXT = TEXT): string {
  if (left >= 60) {
    const minutes = Math.round(left / 60);
    return (minutes === 1 ? words.minutesOne : words.minutesOther).replace('{count}', String(minutes));
  }
  return (left === 1 ? words.secondsOne : words.secondsOther).replace('{count}', String(left));
}

/** The moment screen readers hear the time again, if one was passed: each whole minute, then 30 and 10 seconds. */
export function crossedMilestone(before: number, now: number): number | null {
  const marks = [10, 30];
  for (let m = 60; m < before; m += 60) marks.push(m);
  const crossed = marks.filter((m) => before > m && now <= m);
  return crossed.length ? Math.min(...crossed) : null;
}

const readShared = (): number => {
  try { return Number(localStorage.getItem(STORE)) || 0; } catch { return 0; }
};
const writeShared = (deadline: number): void => {
  try { localStorage.setItem(STORE, String(deadline)); } catch { /* storage blocked: this tab counts alone */ }
};

export function initTimeoutWarning(dialog: HTMLElement): void {
  if (dialog.dataset['ggdsTimeoutReady'] || !(dialog instanceof HTMLDialogElement) || typeof dialog.showModal !== 'function') return;
  const d = dialog.dataset;
  const timeout = Number(d['ggdsTimeout']);
  const asked = Number(d['ggdsWarn']);
  // A missing or broken data-ggds-warn means the default, 2 minutes: never a warning that opens at once or not at all.
  const warn = Math.min(asked > 0 ? asked : 120, timeout);
  const signOut = d['ggdsSignOut'];
  const keepAlive = d['ggdsKeepAlive'];
  const time = dialog.querySelector<HTMLElement>('.ggds-timeout-warning__time');
  const message = time?.closest('p') ?? null;
  const live = dialog.querySelector<HTMLElement>('[aria-live]');
  const stay = dialog.querySelector<HTMLButtonElement>('[data-ggds-timeout-continue]');
  if (!(timeout > 0) || !signOut || !time || !message || !stay) return;
  dialog.dataset['ggdsTimeoutReady'] = 'true';

  const words = {
    minutesOne: d['ggdsMinutesOne'] ?? TEXT.minutesOne,
    minutesOther: d['ggdsMinutesOther'] ?? TEXT.minutesOther,
    secondsOne: d['ggdsSecondsOne'] ?? TEXT.secondsOne,
    secondsOther: d['ggdsSecondsOther'] ?? TEXT.secondsOther,
  };
  // The whole message with a given time in it, for the live region.
  const sentence = (left: number) => {
    const shown = time.textContent;
    time.textContent = timeoutWords(left, words);
    const out = message.textContent ?? '';
    time.textContent = shown;
    return out;
  };

  let deadline = 0;
  let previous = Infinity;

  const leave = () => window.location.assign(signOut);

  const tick = () => {
    // Another tab may have kept the session alive: follow the latest deadline.
    deadline = Math.max(deadline, readShared());
    const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
    if (left === 0) { leave(); return; }
    if (left > warn) {
      if (dialog.open) dialog.close();
      previous = Infinity;
      return;
    }
    time.textContent = timeoutWords(left, words);
    if (!dialog.open) {
      if (live) live.textContent = '';
      dialog.showModal();
      stay.focus();
    } else {
      const mark = crossedMilestone(previous, left);
      if (live && mark !== null) live.textContent = sentence(mark);
    }
    previous = left;
  };

  const start = () => {
    deadline = Date.now() + timeout * 1000;
    // The page was just served, or the session just extended: tell the other tabs.
    if (deadline > readShared()) writeShared(deadline);
    previous = Infinity;
    tick();
  };

  const extend = async () => {
    if (keepAlive) {
      try {
        const response = await fetch(keepAlive, { credentials: 'same-origin', cache: 'no-store' });
        // A redirect (usually to a sign-in page) or an error means the session has already ended.
        if (!response.ok || response.redirected) { leave(); return; }
      } catch {
        // Offline: keep the warning open, so people can try again. Time running out still signs them out.
        return;
      }
    }
    if (dialog.open) dialog.close();
    start();
  };

  stay.addEventListener('click', () => { void extend(); });
  // Escape keeps people signed in: it is the choice that loses nothing.
  dialog.addEventListener('cancel', (event) => { event.preventDefault(); void extend(); });
  // A page restored with the back button: its session may have ended while it was away.
  window.addEventListener('pageshow', (event) => { if (event.persisted) void extend(); });
  window.addEventListener('storage', (event) => { if (event.key === STORE) tick(); });
  setInterval(tick, 1000);
  start();
}
