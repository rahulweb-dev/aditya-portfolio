'use client';

import { useRouter } from 'next/navigation';
import { useRef } from 'react';
import type { SkillKey } from '@/lib/content';
import { wakeAudio } from '@/lib/doorSound';

export default function BackToDoors({ skill }: { skill: SkillKey }) {
  const router = useRouter();
  const black = useRef<HTMLDivElement>(null);

  function back() {
    wakeAudio(); // so the pull-back out of the doorway can be heard
    try {
      sessionStorage.setItem('returnDoor', skill);
    } catch {}
    if (black.current) black.current.style.opacity = '1';
    // keep the screen black through the change of page (the home page clears it once it has
    // scrolled to the doors), so the top of the home page never flashes up in between
    setTimeout(() => (document.documentElement.dataset.returning = 'true'), 300);
    setTimeout(() => {
      delete document.documentElement.dataset.returning; // in case the page never arrives
    }, 4000);
    // The home page picks up 'returnDoor' and zooms back out of this doorway.
    setTimeout(() => router.push('/', { scroll: false }), 380);
  }

  return (
    <>
      <button
        type="button"
        onClick={back}
        className="fixed bottom-[calc(max(12px,env(safe-area-inset-bottom))+80px)] left-4 z-40 md:bottom-5 md:left-5 label-caps inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-line-strong bg-card px-5 text-fg transition hover:bg-bg-2"
      >
        ← Back to the doors
      </button>
      <div ref={black} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[60] bg-black opacity-0 transition-opacity duration-300" />
    </>
  );
}
