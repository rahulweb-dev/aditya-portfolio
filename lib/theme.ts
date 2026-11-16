export type Mode = 'light' | 'dark';

/** Fired before the mode changes; the day-to-night scene (ModeTransition) may take it over. */
export const THEME_EVENT = 'adyssey:theme';

/** Sets the mode right away and remembers the choice. */
export function applyTheme(next: Mode) {
  document.documentElement.dataset.theme = next;
  try {
    localStorage.setItem('theme', next);
  } catch {}
}

/**
 * Switch day and night. If the transition scene is on the page it plays the sun sinking (or rising)
 * and changes the mode itself, halfway through; otherwise the mode changes at once.
 */
export function switchTheme(next: Mode) {
  const taken = !window.dispatchEvent(new CustomEvent<Mode>(THEME_EVENT, { detail: next, cancelable: true }));
  if (!taken) applyTheme(next);
}
