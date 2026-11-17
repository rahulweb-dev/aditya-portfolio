'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useContent } from './ContentProvider';
import DesertScene from './DesertScene';

const LOGO_SRC = '/logo/adyssey-logo-stacked-night.svg'; // cream + REC red, Red Sun kit
const SHOW_FOR = 3700; // ms before the intro hands over to the site

type Piece = { d: string; delay: number; duration: number };
type LogoData = { viewBox: string; pearl: string; red: string; pieces: Piece[] };

/**
 * Splits the logo's outline into its separate strokes (the A, the lens, the nib, each letter)
 * and times them left to right, so drawing them looks like the logo being written.
 */
function parseLogo(svgText: string): LogoData | null {
  const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
  const svg = doc.querySelector('svg');
  const paths = [...doc.querySelectorAll('path')];
  const pearl = paths.find(p => p.getAttribute('fill')?.toUpperCase() === '#F3EBE0')?.getAttribute('d');
  const red = paths.find(p => p.getAttribute('fill')?.toUpperCase() === '#FF5A48')?.getAttribute('d') ?? '';
  const viewBox = svg?.getAttribute('viewBox');
  if (!pearl || !viewBox) return null;

  const [vx, , vw] = viewBox.split(/\s+/).map(Number);
  const subpaths = pearl.split(/(?=M)/).filter(Boolean);
  const maxPoints = Math.max(...subpaths.map(s => s.split('L').length));
  const pieces = subpaths.map(d => {
    const xs = (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number).filter((_, i) => i % 2 === 0);
    const left = (Math.min(...xs) - vx) / vw; // 0 = far left, 1 = far right
    const size = Math.sqrt(d.split('L').length / maxPoints); // big strokes take longer
    return { d, delay: 0.15 + left * 0.85, duration: 0.45 + size * 1.0 };
  });
  return { viewBox, pearl, red, pieces };
}

// True once the intro has played in this page load. A refresh starts a new page load,
// so it plays again; clicking "Home" inside the site doesn't.
let playedThisLoad = false;

/** Coming back through a door (or the intro already ran): don't cover the page. */
function shouldSkip() {
  if (typeof window === 'undefined') return false;
  if (playedThisLoad || document.documentElement.dataset.intro === 'seen') return true;
  try {
    return !!sessionStorage.getItem('returnDoor');
  } catch {
    return false;
  }
}

/**
 * Loading intro: the Adyssey logo draws itself, fills in, the red REC details pop in,
 * the aura glows, then it fades into the site. Plays on every page load; any click or key skips it.
 */
export default function BrandIntro() {
  const BRAND = useContent().brand;
  // Decided once, before anything runs (React may run the setup below twice in development).
  const skip = useRef(shouldSkip());
  const [phase, setPhase] = useState<'show' | 'leaving' | 'gone'>(() => (skip.current ? 'gone' : 'show'));
  const [logo, setLogo] = useState<LogoData | null>(null);
  const [reduced, setReduced] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const leave = useCallback(() => {
    timers.current.forEach(clearTimeout);
    setPhase(p => (p === 'show' ? 'leaving' : p));
    timers.current = [setTimeout(() => setPhase('gone'), 800)];
  }, []);

  useEffect(() => {
    if (skip.current) {
      setPhase('gone');
      return;
    }
    playedThisLoad = true;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setReduced(reduce);

    let cancelled = false;
    fetch(LOGO_SRC)
      .then(r => r.text())
      .then(text => {
        if (cancelled) return;
        const data = parseLogo(text);
        if (!data) return leave();
        setLogo(data);
        timers.current.push(setTimeout(leave, reduce ? 900 : SHOW_FOR));
      })
      .catch(() => leave());

    window.addEventListener('keydown', leave, { once: true });
    return () => {
      cancelled = true;
      timers.current.forEach(clearTimeout);
      window.removeEventListener('keydown', leave);
    };
  }, [leave]);

  if (phase === 'gone') return null;

  return (
    <div
      aria-hidden="true"
      onClick={leave}
      className={`brand-intro fixed inset-0 z-[70] grid cursor-pointer place-items-center overflow-hidden bg-[#140D0E] transition-[opacity,scale] duration-800 ease-[cubic-bezier(0.7,0,0.2,1)] ${
        phase === 'leaving' ? 'pointer-events-none scale-105 opacity-0' : 'opacity-100'
      } ${reduced ? 'intro-reduced' : ''}`}
    >
      {/* the Red Sun night: sky, twinkling stars and the night dunes drifting along the bottom
          (data-theme="dark" so it is always the night scene, whatever mode the site is in) */}
      <div data-theme="dark" className="absolute inset-0">
        <DesertScene celestial={false} mode="dark" className="absolute inset-0 size-full" />
      </div>
      {/* the night-horizon glow behind the logo */}
      <div className="intro-aura absolute inset-0" />

      {logo && (
        <div className="relative flex -translate-y-[6vh] flex-col items-center gap-6">
          <svg viewBox={logo.viewBox} className="intro-logo relative w-[min(58vw,340px)] overflow-visible">
            {/* 1. a pen line traces each stroke of the logo, left to right */}
            <g className="intro-strokes">
              {logo.pieces.map((p, i) => (
                <path
                  key={i}
                  d={p.d}
                  pathLength={1}
                  fill="none"
                  stroke="#F3EBE0"
                  strokeWidth={1.4}
                  vectorEffect="non-scaling-stroke"
                  strokeLinejoin="round"
                  className="intro-stroke"
                  style={{ animationDelay: `${p.delay}s`, animationDuration: `${p.duration}s` }}
                />
              ))}
            </g>
            {/* 2. the real shape fills in (so the counters of letters stay open) */}
            <path d={logo.pearl} fill="#F3EBE0" className="intro-fill" />
            {/* 3. the red lens dot and playhead */}
            <path d={logo.red} fill="#FF5A48" className="intro-rec" />
          </svg>
          {/* 4. what the name means */}
          <p className="intro-tagline m-0 text-center">
            <span className="block font-display text-[clamp(22px,3vw,30px)] text-[#F3EBE0] italic">{BRAND.tagline}</span>
            </p>
        </div>
      )}

      <span className="absolute bottom-[max(24px,env(safe-area-inset-bottom))] left-1/2 flex -translate-x-1/2 items-center gap-2 micro-caps text-[#C2B3A8]">
        <span className="rec-dot rec-blink" />
        <span className="md:hidden">Tap to skip</span>
        <span className="hidden md:inline">Click to skip</span>
      </span>
    </div>
  );
}
