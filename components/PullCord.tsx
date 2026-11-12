'use client';

import { useState } from 'react';

export default function PullCord() {
  const [pulled, setPulled] = useState(false);

  function pull() {
    setPulled(true);
    setTimeout(() => {
      const root = document.documentElement;
      const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next;
      try {
        localStorage.setItem('theme', next);
      } catch {}
      setPulled(false);
    }, 220);
  }

  return (
    <button
      type="button"
      onClick={pull}
      aria-label="Pull to switch light and dark mode"
      className={`fixed top-0 right-[clamp(16px,3vw,40px)] z-40 flex w-8 origin-top cursor-grab flex-col items-center border-0 bg-transparent p-0 ${pulled ? '' : 'animate-sway'}`}
    >
      <span className={`w-0.5 bg-linear-to-b from-muted to-soft transition-[height] duration-250 ${pulled ? 'h-40' : 'h-30'}`} />
      <span className="cord-bulb -mt-px h-[22px] w-3.5 shadow-[0_4px_10px_rgba(0,0,0,0.25)]" />
    </button>
  );
}
