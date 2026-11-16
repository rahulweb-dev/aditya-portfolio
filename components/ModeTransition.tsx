'use client';

import { useEffect, useRef, useState } from 'react';
import DesertScene from './DesertScene';
import { applyTheme, THEME_EVENT, type Mode } from '@/lib/theme';

type Run = { to: Mode; scene: Mode; shown: boolean; swapped: boolean };

const FADE_IN = 320; // ms: the scene covers the page
const SWAP = 1500; // ms: the sun sinks and the moon rises (or the other way round)
const FADE_OUT = 550; // ms: the page comes back in its new mode

/** True when the hero's own desert is on screen: it already plays the sunset, so no need to cover it. */
function heroSceneInView() {
  return [...document.querySelectorAll<SVGElement>('.desert')].some(el => {
    if (el.closest('.brand-intro, .mode-transition')) return false;
    const r = el.getBoundingClientRect();
    return r.top < innerHeight * 0.4 && r.bottom > innerHeight * 0.6;
  });
}

/**
 * Day to night (and back): when someone switches modes, the desert fills the screen,
 * the sun sinks behind the dunes and the red crescent rises, then the page returns in the new mode.
 */
export default function ModeTransition() {
  const [run, setRun] = useState<Run | null>(null);
  const busy = useRef(false);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const onSwitch = (e: Event) => {
      const to = (e as CustomEvent<Mode>).detail;
      if (busy.current) {
        e.preventDefault(); // one sunset at a time
        return;
      }
      if (matchMedia('(prefers-reduced-motion: reduce)').matches || heroSceneInView()) return; // switch at once
      e.preventDefault();
      busy.current = true;
      const from: Mode = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
      setRun({ to, scene: from, shown: false, swapped: false });
      const at = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));
      // two frames so the scene is drawn in the old mode before it fades in
      requestAnimationFrame(() => requestAnimationFrame(() => setRun(r => r && { ...r, shown: true })));
      at(FADE_IN, () => {
        applyTheme(to);
        setRun(r => r && { ...r, scene: to, swapped: true });
      });
      at(FADE_IN + SWAP, () => setRun(r => r && { ...r, shown: false }));
      at(FADE_IN + SWAP + FADE_OUT, () => {
        setRun(null);
        busy.current = false;
      });
    };
    window.addEventListener(THEME_EVENT, onSwitch);
    const pending = timers.current;
    return () => {
      window.removeEventListener(THEME_EVENT, onSwitch);
      pending.forEach(clearTimeout);
    };
  }, []);

  if (!run) return null;
  const night = run.to === 'dark';
  return (
    <div
      aria-hidden="true"
      className="mode-transition pointer-events-none fixed inset-0 z-[66] transition-opacity ease-[cubic-bezier(0.22,0.9,0.3,1)]"
      style={{ opacity: run.shown ? 1 : 0, transitionDuration: `${run.shown ? FADE_IN : FADE_OUT}ms` }}
    >
      <div data-theme={run.scene} className="absolute inset-0">
        <DesertScene mode={run.scene} dusk={run.swapped} className="absolute inset-0 size-full" />
      </div>
      <p className="micro-caps absolute bottom-[max(28px,env(safe-area-inset-bottom))] left-1/2 m-0 flex -translate-x-1/2 items-center gap-2 text-[#F3EBE0]">
        <span className="rec-dot" />
        {night ? 'Night falls' : 'Day breaks'}
      </p>
    </div>
  );
}
