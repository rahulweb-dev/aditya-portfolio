'use client';

import { Fragment, useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import type { Room, SkillKey } from '@/lib/content';
import { DUNE_LAYERS, duneOffset, dunePath, H, ridgeY, STARS, W } from '@/lib/dunes';

/** Each door's light, left to right: red, golden hour, projector white-blue, digital cyan. */
export const DOOR_GLOW: Record<SkillKey, string> = {
  photo: '#FF5A48',
  design: '#F2C46D',
  video: '#A9C8FF',
  ai: '#3FE0CF',
};

/** Where a door stands: across the visible width (0–1) and on which dune layer (0 far … 2 near). */
export type DoorSpot = { room: Room; frac: number; layer: number };

// The doorway's opening on each layer (farther is smaller)
const SIZE: [w: number, h: number][] = [
  [92, 200],
  [112, 246],
  [134, 296],
];
const SINK = 0.11; // how far the foot sits below the dune's ridge: the sand hides it (× height)
const RISE = 0.05; // how far it lifts on hover; its foot stays in the sand (× height)
const PAD = 340; // room around a door for its glow, in scene units (more than the widest blur reaches)
// Mouse parallax per dune layer, far → near (scene units at full tilt)
const PARALLAX = [6, 12, 20, 30, 42];

const DUNE_PATHS = DUNE_LAYERS.map(dunePath);

// ---------- The glow, painted once into images (so moving a door costs nothing) ----------

type Tex = { soft: string; bright: string };
const cache = new Map<string, Promise<Tex>>();
const OFF = 6000; // draw shapes off canvas and keep only their blurred shadow

function mix(hex: string, to: string, t: number) {
  const a = parseInt(hex.slice(1), 16);
  const b = parseInt(to.slice(1), 16);
  const ch = (s: number) => Math.round(((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t);
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
}

function haze(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, blur: number, color: string, alpha: number) {
  g.save();
  g.globalAlpha = alpha;
  g.shadowColor = color;
  g.shadowBlur = blur;
  g.shadowOffsetX = OFF;
  g.fillStyle = color;
  g.fillRect(x - OFF, y, w, h);
  g.restore();
}

/** The soft light around a doorway (the opening itself is drawn crisply in the SVG). */
function haloCanvas(color: string, w: number, h: number, bright: boolean) {
  const c = document.createElement('canvas');
  c.width = w + PAD * 2;
  c.height = h + PAD * 2;
  const g = c.getContext('2d')!;
  const [a1, a2, a3] = bright ? [0.55, 0.7, 0.85] : [0.3, 0.42, 0.55];
  haze(g, PAD - 30, PAD - 30, w + 60, h + 60, bright ? 200 : 170, color, a1);
  haze(g, PAD - 8, PAD - 8, w + 16, h + 16, bright ? 80 : 66, color, a2);
  haze(g, PAD - 2, PAD - 2, w + 4, h + 4, bright ? 26 : 20, mix(color, '#ffffff', 0.4), a3);
  return c;
}

const toUrl = (c: HTMLCanvasElement) =>
  new Promise<string>(res => c.toBlob(b => res(b ? URL.createObjectURL(b) : c.toDataURL())));
const idle = () =>
  new Promise<void>(res => {
    const ric = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
    if (ric) ric(() => res(), { timeout: 400 });
    else setTimeout(res, 30);
  });

function doorTextures(color: string, w: number, h: number) {
  const key = `${color}|${w}|${h}`;
  let p = cache.get(key);
  if (!p) {
    p = (async () => {
      await idle();
      const soft = await toUrl(haloCanvas(color, w, h, false));
      await idle();
      const bright = await toUrl(haloCanvas(color, w, h, true));
      return { soft, bright };
    })();
    cache.set(key, p);
  }
  return p;
}

// ---------- The scene ----------

type Props = {
  spots: DoorSpot[];
  hovered?: SkillKey | null;
  openKey?: SkillKey | null;
  onHover?: (key: SkillKey | null) => void;
  onEnter?: (key: SkillKey) => void;
  /** Bigger doors for the small phone scenes */
  scale?: number;
  labels?: boolean;
  interactive?: boolean;
  /** Seconds into the drift to start from, so scenes don't all look the same */
  phase?: number;
  className?: string;
};

/**
 * Doorways of light standing in the dunes. Each stands in its own dune, the sand's own crest hiding its
 * foot; the dunes drift and each door rides its dune, all from one clock. Moving the mouse shifts near
 * dunes more than far ones, for depth. The scene follows the site: dunes under a paper sky by day,
 * under stars by night. Hover lifts a door a little and its light blooms.
 */
export default function GlowDoors({ spots, hovered = null, openKey = null, onHover, onEnter, scale = 1, labels = true, interactive = true, phase = 40, className = '' }: Props) {
  const u = useId().replace(/[^a-zA-Z0-9]/g, '');
  const svg = useRef<SVGSVGElement>(null);
  const doors = useRef<(SVGGElement | null)[]>([]);
  const fronts = useRef<(SVGGElement | null)[]>([]);
  const frozen = useRef(false);
  frozen.current = !!openKey;
  const [tex, setTex] = useState<Partial<Record<SkillKey, Tex>>>({});

  // Where a door stands at time t, with the parallax shift of its layer
  const xs = useRef(spots.map(s => W * s.frac));
  const transformAt = (i: number, t: number, shift = 0) => {
    const s = spots[i];
    const layer = DUNE_LAYERS[s.layer];
    const x = xs.current[i];
    const y = ridgeY(layer, x + duneOffset(layer, t)) + SIZE[s.layer][1] * scale * SINK;
    return `translate(${(x + shift).toFixed(2)} ${y.toFixed(2)}) scale(${scale})`;
  };

  // Where everything starts (fixed, so a re-render never puts a door back; the clock moves them from here)
  const [first] = useState(() => ({
    doors: spots.map((_, i) => transformAt(i, phase)),
    dunes: DUNE_LAYERS.map(l => `translate(${(-duneOffset(l, phase)).toFixed(2)} 0)`),
  }));

  // Paint the glows once the browser is idle
  useEffect(() => {
    let alive = true;
    spots.forEach(s => {
      const [w, h] = SIZE[s.layer];
      doorTextures(DOOR_GLOW[s.room.key], w, h).then(t => alive && setTex(prev => ({ ...prev, [s.room.key]: t })));
    });
    return () => {
      alive = false;
    };
  }, [spots]);

  // One clock for the dunes and the doors, plus the mouse parallax
  useEffect(() => {
    const el = svg.current;
    if (!el) return;
    let t = phase;
    let raf = 0;
    let last = 0;
    let visible = false;
    let px = 0; // eased mouse position, -1 … 1
    let target = 0;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    // each dune with doors is drawn behind them and again in front (its crest hides their feet)
    const duneEls = DUNE_LAYERS.map((_, i) => [...el.querySelectorAll<SVGPathElement>(`[data-dune="${i}"]`)]);

    const draw = () => {
      DUNE_LAYERS.forEach((l, i) => {
        // a dune repeats every W, so keep its slide within one repeat and it always covers the view
        let x = -duneOffset(l, t) + px * PARALLAX[i];
        if (x > 0) x -= W;
        if (x < -W) x += W;
        const tr = `translate(${x.toFixed(2)} 0)`;
        duneEls[i].forEach(d => d.setAttribute('transform', tr));
      });
      spots.forEach((s, i) => {
        const tr = transformAt(i, t, px * PARALLAX[s.layer]);
        doors.current[i]?.setAttribute('transform', tr);
        fronts.current[i]?.setAttribute('transform', tr);
      });
    };
    // Spread the doors across whatever part of the scene is on screen
    const place = () => {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const sc = Math.max(r.width / W, r.height / H);
      const visW = Math.min(W, r.width / sc);
      const x0 = (W - visW) / 2;
      xs.current = spots.map(s => x0 + visW * s.frac);
      draw();
    };
    const tick = (now: number) => {
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0; // after a pause, don't jump
      last = now;
      if (!frozen.current) t += dt;
      px += (target - px) * Math.min(1, dt * 3);
      draw();
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (raf || reduce || !visible) return;
      last = 0;
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || frozen.current) return;
      target = (e.clientX / innerWidth) * 2 - 1;
    };

    place();
    const ro = new ResizeObserver(place);
    ro.observe(el);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) start();
      else stop();
    });
    io.observe(el);
    if (interactive) addEventListener('pointermove', onMove, { passive: true });
    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      removeEventListener('pointermove', onMove);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the scene is set up once per set of doors
  }, [spots, scale, phase, interactive]);

  const dimOthers = hovered !== null || openKey !== null;

  const props = (s: DoorSpot) => {
    const key = s.room.key;
    const on = hovered === key || openKey === key;
    return { 'data-door': key, 'data-hover': on, 'data-dim': dimOthers && !on, 'data-open': openKey === key };
  };

  /** The doorway itself, drawn behind the sand that hides its foot. */
  const door = (s: DoorSpot, i: number) => {
    const key = s.room.key;
    const [w, h] = SIZE[s.layer];
    const t = tex[key];
    const F = Math.max(5, Math.round(w * 0.07)); // a slim stone frame
    return (
      <g
        key={key}
        ref={el => {
          doors.current[i] = el;
        }}
        transform={first.doors[i]}
        {...props(s)}
        className="gdoor"
        aria-hidden="true"
      >
        <g className="gdoor-body" style={{ '--rise': `${-h * RISE}px` } as CSSProperties}>
          {t && (
            <>
              <image className="gdoor-soft" href={t.soft} x={-w / 2 - PAD} y={-h - PAD} width={w + PAD * 2} height={h + PAD * 2} style={{ animationDelay: `${-i * 1.7}s` }} />
              <image className="gdoor-bright" href={t.bright} x={-w / 2 - PAD} y={-h - PAD} width={w + PAD * 2} height={h + PAD * 2} />
            </>
          )}
          {/* the light in the opening, brightest a little above the middle */}
          <rect x={-w / 2} y={-h} width={w} height={h + 30} fill={`url(#core-${key}-${u})`} />
          <rect x={-w / 2} y={-h} width={w} height={h + 30} fill={`url(#lum-${u})`} />
          {/* a slim stone frame, its inner edge catching the light */}
          <path fillRule="evenodd" d={`M${-w / 2 - F} ${-h - F} H${w / 2 + F} V30 H${-w / 2 - F} Z M${-w / 2} ${-h} V30 H${w / 2} V${-h} Z`} fill={`url(#stone-${u})`} />
          <path d={`M${-w / 2} 30 V${-h} H${w / 2} V30`} fill="none" stroke={DOOR_GLOW[key]} strokeOpacity={0.6} strokeWidth={1.5} />
          {/* the craft's symbol, in ink on the light: hidden at rest, it surfaces on hover */}
          <image className="gdoor-icon" href={`/icons/icon-${key}-day.svg`} x={-w * 0.22} y={-h * 0.62} width={w * 0.44} height={w * 0.44} />
          {/* stepping through: the doorway whites out */}
          <rect data-core className="gdoor-flare" x={-w / 2} y={-h} width={w} height={h} fill="#ffffff" />
          {labels && (
            <text className="gdoor-label" x={0} y={-h - F - 24} textAnchor="middle">
              {s.room.plate}
            </text>
          )}
        </g>
      </g>
    );
  };

  /** In front of the sand: the light the door spills on its dune, and the part that answers the mouse. */
  const front = (s: DoorSpot, i: number) => {
    const key = s.room.key;
    const [w, h] = SIZE[s.layer];
    const F = Math.max(5, Math.round(w * 0.07));
    return (
      <g
        key={key}
        ref={el => {
          fronts.current[i] = el;
        }}
        transform={first.doors[i]}
        {...props(s)}
        className="gdoor gdoor-front"
        {...(interactive
          ? {
              role: 'link',
              tabIndex: 0,
              'aria-label': `Enter ${s.room.title}`,
              onPointerEnter: () => onHover?.(key),
              onPointerLeave: () => onHover?.(null),
              onFocus: () => onHover?.(key),
              onBlur: () => onHover?.(null),
              onClick: () => onEnter?.(key),
              onKeyDown: (e: KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onEnter?.(key);
                }
              },
            }
          : { 'aria-hidden': true })}
      >
        <ellipse className="gdoor-pool" cx={0} cy={-h * SINK + 6} rx={w * 1.4} ry={w * 0.2} fill={`url(#pool-${key}-${u})`} />
        {/* only the doorway answers the mouse: its frame, plus the height it lifts to (so it never flickers) */}
        {interactive && <rect className="gdoor-hit" x={-w / 2 - F} y={-h - F - h * RISE} width={w + F * 2} height={h + F + h * RISE - h * SINK} fill="transparent" />}
      </g>
    );
  };

  const layersWithDoors = new Set(spots.map(s => s.layer));

  return (
    <svg ref={svg} aria-hidden={!interactive} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice" className={`glow-doors ${className}`}>
      <defs>
        <linearGradient id={`gd-day-${u}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F4EEE5" />
          <stop offset="0.75" stopColor="#EFE3D3" />
          <stop offset="1" stopColor="#E6D2B8" />
        </linearGradient>
        <linearGradient id={`gd-sky-${u}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0E0A0B" />
          <stop offset="0.6" stopColor="#1E1214" />
          <stop offset="0.85" stopColor="#3A1A1E" />
          <stop offset="1" stopColor="#6E2A2C" />
        </linearGradient>
        <linearGradient id={`stone-${u}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--gd-stone-top)' }} />
          <stop offset="1" style={{ stopColor: 'var(--gd-stone-bottom)' }} />
        </linearGradient>
        <radialGradient id={`lum-${u}`} cx="0.5" cy="0.38" r="0.62">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.6" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        {spots.map(s => {
          const c = DOOR_GLOW[s.room.key];
          const k = s.room.key;
          return (
            <Fragment key={k}>
              <linearGradient id={`core-${k}-${u}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={mix(c, '#ffffff', 0.9)} />
                <stop offset="0.6" stopColor={mix(c, '#ffffff', 0.82)} />
                <stop offset="1" stopColor={mix(c, '#ffffff', 0.62)} />
              </linearGradient>
              <radialGradient id={`pool-${k}-${u}`}>
                <stop offset="0" stopColor={c} stopOpacity="0.75" />
                <stop offset="0.5" stopColor={c} stopOpacity="0.25" />
                <stop offset="1" stopColor={c} stopOpacity="0" />
              </radialGradient>
            </Fragment>
          );
        })}
      </defs>

      {/* the sky: paper by day; by night, dark with stars (cross-fading with the site's mode) */}
      <rect width={W} height={H} fill={`url(#gd-day-${u})`} />
      <g className="gd-night">
        <rect width={W} height={H} fill={`url(#gd-sky-${u})`} />
        {STARS.map((s, i) => (
          <circle key={i} className="star" cx={s.x.toFixed(0)} cy={s.y.toFixed(0)} r={s.s.toFixed(2)} fill="#F3EBE0" style={{ animationDelay: `${s.d}s` }} />
        ))}
      </g>

      {/* dunes far → near; a dune with doors is drawn behind them and again in front, so its crest hides their feet */}
      {DUNE_LAYERS.map((_, li) => (
        <Fragment key={li}>
          <path data-dune={li} d={DUNE_PATHS[li]} className="gd-dune" style={{ fill: `var(--dune-${li + 1})` }} transform={first.dunes[li]} />
          {spots.map((s, i) => (s.layer === li ? door(s, i) : null))}
          {layersWithDoors.has(li) && <path data-dune={li} d={DUNE_PATHS[li]} className="gd-dune" style={{ fill: `var(--dune-${li + 1})` }} transform={first.dunes[li]} />}
          {spots.map((s, i) => (s.layer === li ? front(s, i) : null))}
        </Fragment>
      ))}
    </svg>
  );
}
