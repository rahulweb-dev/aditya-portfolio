'use client';

import { useState } from 'react';
import { ABILITIES, CERTIFICATIONS, LANGUAGES, TOOLS } from '@/lib/content';

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
        <div
          id="ability"
          className="absolute right-[18px] bottom-[66px] max-h-[calc(100%-84px)] w-[min(320px,calc(100%-36px))] animate-rise overflow-y-auto rounded-2xl bg-card p-[18px] shadow-soft"
        >
          <p className="mb-2.5 font-mono text-xs font-medium text-soft">What I do</p>
          <ul className="m-0 grid list-none gap-2.5 p-0">
            {ABILITIES.map(a => (
              <li key={a.skill} className="grid gap-0.5 text-sm">
                <b className="font-semibold">{a.skill}</b>
                <span className="text-[13px] text-soft">{a.detail}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 mb-2 font-mono text-xs font-medium text-soft">Tools</p>
          <div className="flex flex-wrap gap-1.5">
            {TOOLS.map(t => (
              <span key={t} className="rounded-full border border-line px-2.5 py-1 text-[11px] text-soft">{t}</span>
            ))}
          </div>
          <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
            <dt className="font-mono text-soft">Certified</dt>
            <dd className="m-0">{CERTIFICATIONS.join(', ')}</dd>
            <dt className="font-mono text-soft">Languages</dt>
            <dd className="m-0">{LANGUAGES.join(', ')}</dd>
          </dl>
        </div>
      )}
    </>
  );
}
