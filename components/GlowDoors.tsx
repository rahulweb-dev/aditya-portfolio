'use client';

import { Fragment, useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import type { Room, SkillKey } from '@/lib/content';
import { DUNE_LAYERS, duneOffset, dunePath, H, NIGHT_DUNES, ridgeY, STARS, W } from '@/lib/dunes';

/** Each craft's light: ink red, golden hour, projector white-blue, digital cyan. */
export const DOOR_GLOW: Record<SkillKey, string> = {
  design: '#FF5A48',
  photo: '#F2C46D',
  video: '#A9C8FF',
  ai: '#3FE0CF',
};

/** Where a door stands: across the visible width (0–1) and on which dune layer (0 far … 2 near). */
export type DoorSpot = { room: Room; frac: number; layer: number };

// Door size on each layer (farther is smaller), and how deep it sits in the sand
const SIZE: [w: number, h: number][] = [
  [92, 200],
  [112, 246],
  [134, 296],
];
const SINK = 0.05;
const PAD = 280; // room around a door for its glow, in scene units (more than the widest blur reaches)
const PATH_LEN = 520; // the light path on the sand in front of a door

const DUNE_PATHS = DUNE_LAYERS.map(dunePath);

// ---------- The glow, painted once into images (so moving a door costs nothing) ----------

type Tex = { soft: string; bright: string; path: string };
const cache = new Map<string, Promise<Tex>>();
const OFF = 5000; // draw shapes off canvas and keep only their blurred shadow

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

function doorCanvas(color: string, w: number, h: number, bright: boolean) {
  const c = document.createElement('canvas');
  c.width = w + PAD * 2;
  c.height = h + PAD * 2;
  const g = c.getContext('2d')!;
  const k = bright ? 1 : 0.62;
  haze(g, PAD - 26, PAD - 26, w + 52, h + 52, 150, color, 0.75 * k);
  haze(g, PAD - 8, PAD - 8, w + 16, h + 16, 56, color, 0.95 * k);
  haze(g, PAD - 2, PAD - 2, w + 4, h + 4, 18, mix(color, '#ffffff', 0.5), bright ? 1 : 0.85);
  // the doorway itself: near-white light, tinted a little towards the bottom
  const core = g.createLinearGradient(0, PAD, 0, PAD + h);
  core.addColorStop(0, mix(color, '#ffffff', bright ? 0.96 : 0.9));
  core.addColorStop(0.55, mix(color, '#ffffff', bright ? 0.93 : 0.84));
  core.addColorStop(1, mix(color, '#ffffff', bright ? 0.8 : 0.66));
  g.fillStyle = core;
  g.fillRect(PAD, PAD, w, h);
  return c;
}

function pathCanvas(color: string, w: number) {
  const cw = Math.round(w * 4);
  const c = document.createElement('canvas');
  c.width = cw;
  c.height = PATH_LEN;
  const g = c.getContext('2d')!;
  const grad = g.createLinearGradient(0, 0, 0, PATH_LEN);
  grad.addColorStop(0, color);
  grad.addColorStop(0.35, color);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.save();
  g.shadowColor = color;
  g.shadowBlur = 30;
  g.shadowOffsetX = OFF;
  g.translate(-OFF, 0);
  g.beginPath();
  g.moveTo(cw / 2 - w * 0.45, 12);
  g.lineTo(cw / 2 + w * 0.45, 12);
  g.lineTo(cw / 2 + w * 1.45, PATH_LEN - 30);
  g.lineTo(cw / 2 - w * 1.45, PATH_LEN - 30);
  g.closePath();
  g.fillStyle = grad;
  g.fill();
  g.restore();
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
      const soft = await toUrl(doorCanvas(color, w, h, false));
      await idle();
      const bright = await toUrl(doorCanvas(color, w, h, true));
      await idle();
      const path = await toUrl(pathCanvas(color, w));
      return { soft, bright, path };
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
 * Doorways of light standing in the night dunes. The dunes drift and each door rides its own dune,
 * all from one clock, so they never fall out of step. Farther doors are smaller and sit higher.
 */
export default function GlowDoors({ spots, hovered = null, openKey = null, onHover, onEnter, scale = 1, labels = true, interactive = true, phase = 40, className = '' }: Props) {
  const u = useId().replace(/[^a-zA-Z0-9]/g, '');
  const svg = useRef<SVGSVGElement>(null);
  const dunes = useRef<(SVGPathElement | null)[]>([]);
  const doors = useRef<(SVGGElement | null)[]>([]);
  const paths = useRef<(SVGGElement | null)[]>([]);
  const frozen = useRef(false);
  frozen.current = !!openKey;
  const [tex, setTex] = useState<Partial<Record<SkillKey, Tex>>>({});

  // Where a door stands at time t (the first paint uses the full width; the effect corrects it)
  const xs = useRef(spots.map(s => W * s.frac));
  const transformAt = (i: number, t: number) => {
    const s = spots[i];
    const layer = DUNE_LAYERS[s.layer];
    const x = xs.current[i];
    const y = ridgeY(layer, x + duneOffset(layer, t)) + SIZE[s.layer][1] * scale * SINK;
    return `translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${scale})`;
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

  // One clock for the dunes and the doors
  useEffect(() => {
    const el = svg.current;
    if (!el) return;
    let t = phase;
    let raf = 0;
    let last = 0;
    let visible = false;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

    const draw = () => {
      DUNE_LAYERS.forEach((l, i) => dunes.current[i]?.setAttribute('transform', `translate(${(-duneOffset(l, t)).toFixed(2)} 0)`));
      spots.forEach((_, i) => {
        const tr = transformAt(i, t);
        doors.current[i]?.setAttribute('transform', tr);
        paths.current[i]?.setAttribute('transform', tr);
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

    place();
    const ro = new ResizeObserver(place);
    ro.observe(el);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) start();
      else stop();
    });
    io.observe(el);
    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the scene is set up once per set of doors
  }, [spots, scale, phase]);

  const dimOthers = hovered !== null || openKey !== null;

  const door = (s: DoorSpot, i: number) => {
    const key = s.room.key;
    const [w, h] = SIZE[s.layer];
    const color = DOOR_GLOW[key];
    const t = tex[key];
    const on = hovered === key || openKey === key;
    return (
      <g
        key={key}
        ref={el => {
          doors.current[i] = el;
        }}
        transform={first.doors[i]}
        data-door={key}
        data-hover={on}
        data-dim={dimOthers && !on}
        data-open={openKey === key}
        className="gdoor"
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
        <g className="gdoor-body" style={{ transformOrigin: `50% ${(((h + PAD) / (h + PAD * 2)) * 100).toFixed(2)}%` }}>
          {/* keeps the box the same before and after the glow loads, so it grows from its foot */}
          <rect x={-w / 2 - PAD} y={-h - PAD} width={w + PAD * 2} height={h + PAD * 2} fill="none" />
          {/* light pooling on the sand around its foot */}
          <ellipse className="gdoor-pool" cx={0} cy={-2} rx={w * 1.5} ry={w * 0.2} fill={`url(#pool-${key}-${u})`} />
          {t ? (
            <>
              <image className="gdoor-soft" href={t.soft} x={-w / 2 - PAD} y={-h - PAD} width={w + PAD * 2} height={h + PAD * 2} style={{ animationDelay: `${-i * 1.7}s` }} />
              <image className="gdoor-bright" href={t.bright} x={-w / 2 - PAD} y={-h - PAD} width={w + PAD * 2} height={h + PAD * 2} />
            </>
          ) : (
            <rect x={-w / 2} y={-h} width={w} height={h} fill={mix(color, '#ffffff', 0.85)} />
          )}
          {/* the craft's symbol, drawn in ink on the light: hidden at rest, it surfaces on hover */}
          <image className="gdoor-icon" href={`/icons/icon-${key}-day.svg`} x={-w * 0.24} y={-h * 0.58} width={w * 0.48} height={w * 0.48} />
          {/* stepping through: the doorway whites out */}
          <rect data-core className="gdoor-flare" x={-w / 2} y={-h} width={w} height={h} fill="#ffffff" />
        </g>
        {labels && (
          <text className="gdoor-label" x={0} y={-h - 38} textAnchor="middle">
            {s.room.plate}
          </text>
        )}
        {interactive && <rect x={-w / 2 - 30} y={-h - 70} width={w + 60} height={h + 80} fill="transparent" />}
      </g>
    );
  };

  return (
    <svg ref={svg} aria-hidden={!interactive} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice" className={`glow-doors ${className}`}>
      <defs>
        <linearGradient id={`gd-sky-${u}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0E0A0B" />
          <stop offset="0.6" stopColor="#1E1214" />
          <stop offset="0.85" stopColor="#3A1A1E" />
          <stop offset="1" stopColor="#6E2A2C" />
        </linearGradient>
        {spots.map(s => (
          <radialGradient key={s.room.key} id={`pool-${s.room.key}-${u}`}>
            <stop offset="0" stopColor={DOOR_GLOW[s.room.key]} stopOpacity="0.85" />
            <stop offset="1" stopColor={DOOR_GLOW[s.room.key]} stopOpacity="0" />
          </radialGradient>
        ))}
      </defs>

      <rect width={W} height={H} fill={`url(#gd-sky-${u})`} />
      <g>
        {STARS.map((s, i) => (
          <circle key={i} className="star" cx={s.x.toFixed(0)} cy={s.y.toFixed(0)} r={s.s.toFixed(2)} fill="#F3EBE0" style={{ animationDelay: `${s.d}s` }} />
        ))}
      </g>

      {/* dunes far → near, each door standing on its own dune */}
      {DUNE_LAYERS.map((_, li) => (
        <Fragment key={li}>
          <path
            ref={el => {
              dunes.current[li] = el;
            }}
            d={DUNE_PATHS[li]}
            fill={NIGHT_DUNES[li]}
            transform={first.dunes[li]}
          />
          {spots.map((s, i) => (s.layer === li ? door(s, i) : null))}
        </Fragment>
      ))}

      {/* each door's light, laid across the sand towards us */}
      <g className="gdoor-paths">
        {spots.map((s, i) => {
          const t = tex[s.room.key];
          const [w] = SIZE[s.layer];
          const on = hovered === s.room.key || openKey === s.room.key;
          return (
            <g
              key={s.room.key}
              ref={el => {
                paths.current[i] = el;
              }}
              transform={first.doors[i]}
              data-hover={on}
              data-dim={dimOthers && !on}
              className="gdoor-path"
            >
              {t && <image href={t.path} x={-Math.round(w * 4) / 2} y={-14} width={Math.round(w * 4)} height={PATH_LEN} />}
            </g>
          );
        })}
      </g>
    </svg>
  );
}
