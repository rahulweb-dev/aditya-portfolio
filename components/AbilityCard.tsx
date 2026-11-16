'use client';

import { useState } from 'react';
import RoleIcon from './RoleIcon';
import { ABILITIES, CERTIFICATIONS, LANGUAGES, ROOMS, TOOLS } from '@/lib/content';

/** "My ability card": a dark card (night colours in both modes) with the four craft symbols. */
export default function AbilityCard() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-controls="ability"
        className="label-caps absolute right-4 bottom-4 min-h-9 cursor-pointer rounded-full border border-line-on-dark bg-dark/90 px-3.5 text-on-dark"
      >
        My ability card
      </button>
      {open && (
        <div
          id="ability"
          className="absolute right-4 bottom-[60px] max-h-[calc(100%-76px)] w-[min(320px,calc(100%-32px))] animate-rise overflow-y-auto rounded-[20px] border border-line-on-dark bg-dark p-5 text-on-dark"
        >
          <div className="mb-4 flex gap-3">
            {ROOMS.map(r => (
              <RoleIcon key={r.key} craft={r.key} tone="night" size={28} />
            ))}
          </div>
          <p className="label-caps mb-3 text-muted-on-dark">What I do</p>
          <ul className="m-0 grid list-none gap-3 p-0">
            {ABILITIES.map(a => (
              <li key={a.skill} className="grid gap-0.5">
                <b className="font-display text-[18px] leading-6 font-medium">{a.skill}</b>
                <span className="text-[13px] leading-[22px] text-muted-on-dark">{a.detail}</span>
              </li>
            ))}
          </ul>
          <p className="label-caps mt-5 mb-2 text-muted-on-dark">Tools</p>
          <div className="flex flex-wrap gap-1.5">
            {TOOLS.map(t => (
              <span key={t} className="micro-caps rounded-full border border-line-on-dark px-2.5 py-1 text-muted-on-dark">{t}</span>
            ))}
          </div>
          <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[13px]">
            <dt className="text-muted-on-dark">Certified</dt>
            <dd className="m-0">{CERTIFICATIONS.join(', ')}</dd>
            <dt className="text-muted-on-dark">Languages</dt>
            <dd className="m-0">{LANGUAGES.join(', ')}</dd>
          </dl>
        </div>
      )}
    </>
  );
}
