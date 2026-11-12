'use client';

import { useState } from 'react';
import { ABILITIES } from '@/lib/content';

export default function AbilityCard() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-controls="ability"
        className="absolute right-[18px] bottom-[18px] cursor-pointer rounded-full border border-white/50 bg-[rgba(16,17,20,0.8)] px-3.5 py-2 text-xs font-medium text-[#f3f3f1]"
      >
        My ability card
      </button>
      {open && (
        <div id="ability" className="absolute right-[18px] bottom-[66px] w-[min(300px,calc(100%-36px))] animate-rise rounded-2xl bg-card p-[18px] shadow-soft">
          <p className="mb-2.5 font-mono text-xs font-medium text-soft">What I do</p>
          <ul className="m-0 grid list-none gap-2.5 p-0">
            {ABILITIES.map(a => (
              <li key={a.skill} className="grid gap-0.5 text-sm">
                <b className="font-semibold">{a.skill}</b>
                <span className="text-[13px] text-soft">{a.detail}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3.5 text-xs text-muted">Tools: [add your tools]</p>
        </div>
      )}
    </>
  );
}
