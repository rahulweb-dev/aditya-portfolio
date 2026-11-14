'use client';

/* eslint-disable @next/next/no-img-element -- art-directed <picture>, not a resized image */
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * The Adyssey hero banner from the logo kit, shown full screen for a moment on the
 * first visit of a session, then fading into the site. Any click or key skips it.
 */
export default function BrandIntro() {
  const [phase, setPhase] = useState<'show' | 'leaving' | 'gone'>('show');
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const leave = useCallback(() => {
    timers.current.forEach(clearTimeout);
    setPhase(p => (p === 'show' ? 'leaving' : p));
    timers.current = [setTimeout(() => setPhase('gone'), 750)];
  }, []);

  useEffect(() => {
    // Already played this visit (the boot script in layout.tsx marks it before paint).
    if (document.documentElement.dataset.intro === 'seen') {
      setPhase('gone');
      return;
    }
    try {
      sessionStorage.setItem('introSeen', '1');
    } catch {}
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    timers.current = [setTimeout(leave, reduce ? 700 : 1600)];
    window.addEventListener('keydown', leave, { once: true });
    return () => {
      timers.current.forEach(clearTimeout);
      window.removeEventListener('keydown', leave);
    };
  }, [leave]);

  if (phase === 'gone') return null;

  return (
    <div
      aria-hidden="true"
      onClick={leave}
      className={`brand-intro fixed inset-0 z-[70] cursor-pointer overflow-hidden bg-[#0B0A0F] transition-[opacity,scale] duration-700 ease-[cubic-bezier(0.7,0,0.2,1)] ${
        phase === 'leaving' ? 'pointer-events-none scale-105 opacity-0' : 'opacity-100'
      }`}
    >
      <picture>
        <source media="(max-width: 767px)" srcSet="/brand/hero-aura-mobile-1080x1920.webp" />
        <img src="/brand/hero-aura-1920x1080.webp" alt="" className="size-full animate-intro object-cover" />
      </picture>
      <span className="absolute bottom-[max(24px,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 font-mono text-[11px] tracking-[0.14em] text-[#F4F0E8]/60 uppercase">
        Click to enter
      </span>
    </div>
  );
}
