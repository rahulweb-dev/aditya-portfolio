'use client';

import { useEffect, useId, useRef } from 'react';

// The Red Sun desert, drawn live so it can move: sky, stars, the sun (day) or crescent (night) in the
// same spot, and five dune layers that drift slowly, far ones slower than near ones.
const W = 1920; // one repeat of every dune; each path is drawn twice as wide and slides by W
const H = 1080;

/** A dune ridge as a sum of sines whose periods divide W, so sliding by W loops seamlessly. */
function dune(base: number, waves: [amp: number, k: number, phase: number][]) {
  let d = `M0 ${H}`;
  for (let x = 0; x <= W * 2; x += 24) {
    const y = waves.reduce((acc, [a, k, p]) => acc + a * Math.sin((2 * Math.PI * k * x) / W + p), base);
    d += ` L${x} ${y.toFixed(1)}`;
  }
  return `${d} L${W * 2} ${H} Z`;
}

// far → near: [ridge height, waves, seconds per loop]
const DUNES: [string, number][] = [
  [dune(640, [[34, 1, 0.4], [16, 3, 1.7]]), 160],
  [dune(705, [[42, 1, 2.2], [14, 2, 0.3], [8, 5, 1]]), 120],
  [dune(780, [[48, 1, 4.1], [18, 3, 2.6]]), 90],
  [dune(865, [[44, 2, 1.2], [20, 1, 5]]), 70],
  [dune(960, [[52, 1, 3.3], [16, 4, 0.8]]), 54],
];

// Stars for the night sky (fixed, so the server and the browser draw the same ones)
const STARS = Array.from({ length: 90 }, (_, i) => {
  const r = (n: number) => ((Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1 + 1) % 1;
  return { x: r(1) * W, y: r(2) * 560, s: 0.6 + r(3) * 1.3, d: (r(4) * 6).toFixed(2) };
});

// Where the sun and the crescent sit (the same spot by day and by night)
const SUN = { x: 1150, y: 585, r: 118 };

type Props = {
  /** Draw the sun and crescent (the hero). The loader draws its own crescent, so it turns this off. */
  celestial?: boolean;
  /** Fix the scene to day or night; left out, it follows the site's mode. */
  mode?: 'light' | 'dark';
  /** Glow red at the horizon once (the mode switch, while the sun and moon swap). */
  dusk?: boolean;
  className?: string;
};

export default function DesertScene({ celestial = true, mode, dusk = false, className = 'absolute inset-0 -z-20 size-full' }: Props) {
  const ref = useRef<SVGSVGElement>(null);
  // Each drawing gets its own gradient and mask ids, so several scenes can share the page.
  const u = useId().replace(/[^a-zA-Z0-9]/g, '');

  // Pause the drift while the hero is off screen.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => el.classList.toggle('scene-paused', !e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <svg
      ref={ref}
      aria-hidden="true"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMax slice"
      data-scene={mode}
      className={`desert ${className}`}
    >
      <defs>
        <linearGradient id={`sky-day-${u}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F4EEE5" />
          <stop offset="1" stopColor="#EAD9C4" />
        </linearGradient>
        <linearGradient id={`sky-night-${u}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0E0A0B" />
          <stop offset="0.6" stopColor="#1E1214" />
          <stop offset="0.85" stopColor="#3A1A1E" />
          <stop offset="1" stopColor="#6E2A2C" />
        </linearGradient>
        <radialGradient id={`sun-glow-${u}`}>
          <stop offset="0.45" stopColor="#B8241B" stopOpacity="0.35" />
          <stop offset="1" stopColor="#B8241B" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`moon-glow-${u}`}>
          <stop offset="0.4" stopColor="#7A2A2C" stopOpacity="0.7" />
          <stop offset="1" stopColor="#7A2A2C" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`sun-face-${u}`} cx="0.38" cy="0.35" r="0.75">
          <stop offset="0" stopColor="#C93A2E" />
          <stop offset="1" stopColor="#B8241B" />
        </radialGradient>
        <linearGradient id={`dusk-${u}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2A1517" />
          <stop offset="0.5" stopColor="#7A2A2C" />
          <stop offset="0.72" stopColor="#D8473A" />
          <stop offset="0.9" stopColor="#E3CFAE" />
        </linearGradient>
        <mask id={`crescent-${u}`}>
          <rect x="0" y="0" width={W} height={H} fill="#fff" />
          <circle cx={SUN.x - 34} cy={SUN.y - 6} r={SUN.r} fill="#000" />
        </mask>
      </defs>

      {/* sky: day and night cross-fade */}
      <rect width={W} height={H} fill={`url(#sky-day-${u})`} />
      <rect className="scene-night" width={W} height={H} fill={`url(#sky-night-${u})`} />
      {dusk && <rect className="scene-dusk" width={W} height={H} fill={`url(#dusk-${u})`} />}
      <g className="scene-night">
        {STARS.map((s, i) => (
          <circle key={i} className="star" cx={s.x.toFixed(0)} cy={s.y.toFixed(0)} r={s.s.toFixed(2)} fill="#F3EBE0" style={{ animationDelay: `${s.d}s` }} />
        ))}
      </g>

      {/* the sun sinks behind the dunes at night; the crescent rises in its place */}
      {celestial && (
        <>
      <g className="scene-sun">
        <g className="float">
          <circle className="glow-pulse" cx={SUN.x} cy={SUN.y} r={SUN.r * 1.9} fill={`url(#sun-glow-${u})`} />
          <circle cx={SUN.x} cy={SUN.y} r={SUN.r} fill={`url(#sun-face-${u})`} />
        </g>
      </g>
      <g className="scene-moon">
        <g className="float">
          <circle className="glow-pulse" cx={SUN.x} cy={SUN.y} r={SUN.r * 2.1} fill={`url(#moon-glow-${u})`} />
          <circle cx={SUN.x} cy={SUN.y} r={SUN.r} fill="#2A1517" opacity="0.85" />
          <circle cx={SUN.x} cy={SUN.y} r={SUN.r} fill="#D8473A" mask={`url(#crescent-${u})`} />
        </g>
      </g>
        </>
      )}

      {/* dunes, far to near; each slides one repeat to the left, forever */}
      {DUNES.map(([d, secs], i) => (
        <path key={i} className="dune" d={d} style={{ fill: `var(--dune-${i + 1})`, animationDuration: `${secs}s` }} />
      ))}
    </svg>
  );
}
