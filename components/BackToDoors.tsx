'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import type { SkillKey } from '@/lib/content';
import { playBack, wakeAudio } from '@/lib/doorSound';
import { DOOR_GLOW } from './GlowDoors';
import Wormhole from './Wormhole';

/**
 * "Back to the doors": the tunnel you came in through, played backwards (in this door's light, with
 * the pull-back sound), then the home page opens and the black fades softly away onto the doors.
 */
export default function BackToDoors({ skill }: { skill: SkillKey }) {
  const router = useRouter();
  const black = useRef<HTMLDivElement>(null);
  const [tunnel, setTunnel] = useState(false);
  const going = useRef(false);

  function back() {
    if (going.current) return;
    going.current = true;
    wakeAudio();
    try {
      sessionStorage.setItem('returnDoor', skill);
    } catch {}
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // the tunnel, as on the way in (skipped for anyone who prefers less motion)
    if (!still) {
      setTunnel(true);
      playBack(skill);
    }
    const fadeAt = still ? 0 : 1400;
    setTimeout(() => {
      if (black.current) {
        black.current.style.transitionDuration = '400ms';
        black.current.style.opacity = '1';
      }
    }, fadeAt);
    // keep the screen black through the change of page (the home page clears it once it has
    // scrolled to the doors), so the top of the home page never flashes up in between
    setTimeout(() => (document.documentElement.dataset.returning = 'true'), fadeAt + 380);
    setTimeout(() => {
      delete document.documentElement.dataset.returning; // in case the page never arrives
    }, fadeAt + 4000);
    setTimeout(() => router.push('/', { scroll: false }), fadeAt + 420);
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
      {tunnel && <Wormhole color={DOOR_GLOW[skill]} reverse />}
      <div ref={black} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[60] bg-black opacity-0 transition-opacity duration-300" />
    </>
  );
}
