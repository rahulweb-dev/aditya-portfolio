'use client';

import { useState } from 'react';
import { switchTheme } from '@/lib/theme';

/** The pull cord: a thread with a brass bulb. Pull it to switch day and night (the sun and moon switch follows). */
export default function PullCord() {
  const [pulled, setPulled] = useState(false);

  function pull() {
    setPulled(true);
    setTimeout(() => {
      switchTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
      setPulled(false);
    }, 220);
  }

  return (
    <button
      type="button"
      onClick={pull}
      aria-label="Pull to switch light and dark mode"
      className={`fixed top-0 right-[max(10px,env(safe-area-inset-right))] z-40 flex w-8 origin-top cursor-grab flex-col items-center border-0 bg-transparent p-0 md:right-[clamp(10px,1.4vw,20px)] ${pulled ? '' : 'animate-sway'}`}
    >
      <span className={`w-0.5 bg-linear-to-b from-line-strong to-soft transition-[height] duration-250 ${pulled ? 'h-40' : 'h-30'}`} />
      <span className="cord-bulb -mt-px h-[22px] w-3.5 shadow-[0_4px_10px_rgba(0,0,0,0.25)]" />
    </button>
  );
}
