'use client';

import { useRouter } from 'next/navigation';
import { useRef } from 'react';
import type { SkillKey } from '@/lib/content';

export default function BackToDoors({ skill }: { skill: SkillKey }) {
  const router = useRouter();
  const black = useRef<HTMLDivElement>(null);

  function back() {
    try {
      sessionStorage.setItem('returnDoor', skill);
    } catch {}
    if (black.current) black.current.style.opacity = '1';
    // The home page picks up 'returnDoor' and zooms back out of this doorway.
    setTimeout(() => router.push('/', { scroll: false }), 380);
  }

  return (
    <>
      <button
        type="button"
        onClick={back}
        className="fixed bottom-[calc(max(12px,env(safe-area-inset-bottom))+80px)] left-4 z-40 md:bottom-5 md:left-5 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-line bg-card/90 px-4 text-sm font-medium text-fg shadow-soft backdrop-blur-md transition hover:-translate-y-0.5"
      >
        ← Back to the doors
      </button>
      <div ref={black} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[60] bg-black opacity-0 transition-opacity duration-300" />
    </>
  );
}
