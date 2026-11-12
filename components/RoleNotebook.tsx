'use client';

import { useEffect, useState } from 'react';
import { ROLES } from '@/lib/content';

const pad = (n: number) => String(n).padStart(2, '0');

export default function RoleNotebook() {
  const [flips, setFlips] = useState(0);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let swap: ReturnType<typeof setTimeout>;
    const id = setInterval(() => {
      if (reduce) return setShown(i => (i + 1) % ROLES.length);
      setFlips(f => f + 1);
      // Swap the word while the page is edge-on, halfway through the flip.
      swap = setTimeout(() => setShown(i => (i + 1) % ROLES.length), 280);
    }, 2600);
    return () => {
      clearInterval(id);
      clearTimeout(swap);
    };
  }, []);

  return (
    <div className="relative w-fit max-w-full pt-3.5 perspective-[900px]" aria-live="polite">
      <div aria-hidden="true" className="notebook-rings absolute inset-x-[18px] top-0 z-10 h-[26px]" />
      <div
        key={flips}
        className={`relative flex origin-top items-end gap-5 rounded-2xl bg-card px-5 pt-[22px] pb-[18px] shadow-[0_18px_40px_-18px_var(--shadow-color),0_6px_0_-2px_var(--bg-2),0_10px_0_-4px_var(--line)] sm:px-[30px] sm:pt-[26px] sm:pb-[22px] ${flips ? 'animate-flip' : ''}`}
      >
        <span className="text-[clamp(30px,4.4vw,60px)] leading-none font-semibold tracking-[-0.03em] sm:whitespace-nowrap">{ROLES[shown]}</span>
        <span className="pb-1 font-mono text-[11px] text-muted">
          <b className="font-medium">{pad(shown + 1)}</b> / {pad(ROLES.length)}
        </span>
      </div>
    </div>
  );
}
