'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const LOGO_SRC = '/brand/adyssey-logo-stacked-light.svg';
const SHOW_FOR = 3200; // ms before the intro hands over to the site

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
  const pearl = paths.find(p => p.getAttribute('fill')?.toUpperCase() === '#F4F0E8')?.getAttribute('d');
  const red = paths.find(p => p.getAttribute('fill')?.toUpperCase() === '#FF3B30')?.getAttribute('d') ?? '';
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

/**
 * Loading intro: the Adyssey logo draws itself, fills in, the red REC details pop in,
 * the aura glows, then it fades into the site. Once per visit; any click or key skips it.
 */
export default function BrandIntro() {
  const [phase, setPhase] = useState<'show' | 'leaving' | 'gone'>('show');
  const [logo, setLogo] = useState<LogoData | null>(null);
  const [reduced, setReduced] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const leave = useCallback(() => {
    timers.current.forEach(clearTimeout);
    setPhase(p => (p === 'show' ? 'leaving' : p));
    timers.current = [setTimeout(() => setPhase('gone'), 800)];
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
      className={`brand-intro fixed inset-0 z-[70] grid cursor-pointer place-items-center overflow-hidden bg-[#0B0A0F] transition-[opacity,scale] duration-800 ease-[cubic-bezier(0.7,0,0.2,1)] ${
        phase === 'leaving' ? 'pointer-events-none scale-105 opacity-0' : 'opacity-100'
      } ${reduced ? 'intro-reduced' : ''}`}
    >
      {/* the aura: violet, pink and orange light behind the logo */}
      <div className="intro-aura absolute inset-0" />

      {logo && (
        <svg viewBox={logo.viewBox} className="intro-logo relative w-[min(58vw,340px)] overflow-visible">
          {/* 1. a pen line traces each stroke of the logo, left to right */}
          <g className="intro-strokes">
            {logo.pieces.map((p, i) => (
              <path
                key={i}
                d={p.d}
                pathLength={1}
                fill="none"
                stroke="#F4F0E8"
                strokeWidth={1.4}
                vectorEffect="non-scaling-stroke"
                strokeLinejoin="round"
                className="intro-stroke"
                style={{ animationDelay: `${p.delay}s`, animationDuration: `${p.duration}s` }}
              />
            ))}
          </g>
          {/* 2. the real shape fills in (so the counters of letters stay open) */}
          <path d={logo.pearl} fill="#F4F0E8" className="intro-fill" />
          {/* 3. the red lens dot and playhead */}
          <path d={logo.red} fill="#FF3B30" className="intro-rec" />
        </svg>
      )}

      <span className="absolute bottom-[max(24px,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 font-mono text-[11px] tracking-[0.14em] text-[#F4F0E8]/50 uppercase">
        Click to skip
      </span>
    </div>
  );
}
