'use client';

import { useEffect, useState } from 'react';
import { useContent } from './ContentProvider';

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * "Hi, I'm Aditya. I am a" and the notebook card below it, which flips like a page through the crafts.
 * The word on the card is the headline's one italic phrase, in the red for words; "a" becomes "an" for AI.
 */
export default function HeroRoles({ name }: { name: string }) {
  const ROLES = useContent().roles;
  const [flips, setFlips] = useState(0);
  const [shown, setShown] = useState(1); // start on "photographer", as in the guidelines

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

  const role = ROLES[shown];
  return (
    <>
      <h1 className="m-0 text-[clamp(52px,6.4vw,92px)] leading-[0.98] tracking-[-0.02em]">
        Hi, I&apos;m {name}.
        <br />
        I am {role.article}
        <span className="sr-only"> {role.word}.</span>
      </h1>

      <div aria-hidden="true" className="relative w-fit max-w-full pt-3.5 perspective-[900px]">
        <div className="notebook-rings absolute inset-x-[18px] top-0 z-10 h-[26px]" />
        <div
          key={flips}
          className={`relative flex origin-top items-end gap-5 rounded-[20px] border border-line bg-card px-5 pt-[22px] pb-[18px] shadow-[0_6px_0_-2px_var(--bg-2),0_10px_0_-4px_var(--line)] sm:px-[30px] sm:pt-[26px] sm:pb-[22px] ${flips ? 'animate-flip' : ''}`}
        >
          <span className="serif-accent text-[clamp(34px,4.6vw,62px)] leading-none sm:whitespace-nowrap">
            {role.word.charAt(0).toUpperCase() + role.word.slice(1)}
          </span>
          <span className="micro-caps pb-1 text-soft">
            <b className="text-fg">{pad(shown + 1)}</b> / {pad(ROLES.length)}
          </span>
        </div>
      </div>
    </>
  );
}
