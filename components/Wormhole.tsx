'use client';

import { useEffect, useRef } from 'react';

const STARS = 900;
const DUST = 1400;
const ARMS = 3;

const rgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const;
};
const mixHex = (hex: string, to: [number, number, number], t: number) => {
  const [r, g, b] = rgb(hex);
  return [r + (to[0] - r) * t, g + (to[1] - g) * t, b + (to[2] - b) * t].map(Math.round) as [number, number, number];
};

/**
 * Stepping through a door: falling into a wormhole in deep space. Stars stream past and stretch into
 * warp streaks, spiral arms of glowing dust (in the door's colour) wheel round a dark core ringed with
 * light, nebula clouds drift behind, and the ring opens until its light fills the screen.
 * Mounted only while it plays.
 */
export default function Wormhole({ color }: { color: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current!;
    const ctx = cv.getContext('2d')!;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const W = (cv.width = innerWidth * dpr);
    const H = (cv.height = innerHeight * dpr);
    const cx = W / 2;
    const cy = H / 2;
    const unit = Math.min(W, H);
    const reach = Math.hypot(W, H) / 2;
    const [r, g, b] = rgb(color);
    const pale = mixHex(color, [255, 255, 255], 0.65);

    // stars in a cylinder around the line of travel: x, y around the centre, z = distance ahead
    const stars = Array.from({ length: STARS }, () => ({
      a: Math.random() * Math.PI * 2,
      d: 0.15 + Math.random() * 1.6, // distance from the axis
      z: Math.random(),
      w: Math.random(),
    }));
    // dust on spiral arms: each grain has an arm, a place along it, and a little scatter
    const dust = Array.from({ length: DUST }, (_, i) => ({
      arm: i % ARMS,
      t: Math.random(), // 0 = at the core, 1 = far out
      off: (Math.random() - 0.5) * 0.5,
      s: 0.6 + Math.random() * 1.8,
      tint: Math.random(),
    }));
    // the other side, seen through the throat
    const beyond = Array.from({ length: 160 }, () => ({ a: Math.random() * Math.PI * 2, d: Math.sqrt(Math.random()), s: 0.5 + Math.random() * 1.4, tw: Math.random() * 6 }));
    // nebula clouds
    const clouds = Array.from({ length: 6 }, (_, i) => ({ a: (i / 6) * Math.PI * 2 + Math.random(), d: 0.35 + Math.random() * 0.4, s: 0.45 + Math.random() * 0.4, warm: i % 2 === 0 }));

    const start = performance.now();
    let last = start;
    let travel = 0;
    let raf = 0;

    const frame = (now: number) => {
      const t = (now - start) / 1000;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const speed = 0.35 + t * t * 2.2; // it gathers pace
      travel += speed * dt;
      const spin = t * 0.6 + t * t * 0.9;
      const open = Math.min(1, 0.08 + t * t * 0.32); // how far the ring has opened

      // deep space, with a short trail of the last frames for motion blur
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = `rgba(5, 4, 10, ${0.28 + Math.min(0.3, t * 0.1)})`;
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';

      // nebula clouds, slowly turning
      for (const c of clouds) {
        const a = c.a + spin * 0.15;
        const x = cx + Math.cos(a) * c.d * reach;
        const y = cy + Math.sin(a) * c.d * reach * 0.8;
        const rad = c.s * reach;
        const neb = ctx.createRadialGradient(x, y, 0, x, y, rad);
        neb.addColorStop(0, c.warm ? `rgba(${r},${g},${b},0.07)` : 'rgba(90,70,140,0.05)');
        neb.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = neb;
        ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
      }

      // stars rushing past, stretched into streaks as the speed builds
      ctx.lineCap = 'round';
      for (const s of stars) {
        s.z -= speed * dt * 0.55;
        if (s.z <= 0.02) {
          s.z += 1;
          s.a = Math.random() * Math.PI * 2;
        }
        const a = s.a + spin * 0.25 * (1 - s.z);
        const p = (z: number) => (s.d * unit * 0.35) / z;
        const r1 = p(s.z);
        const r0 = p(Math.min(1, s.z + speed * 0.02 + 0.004));
        if (r1 > reach * 1.2) continue;
        const near = 1 - s.z;
        ctx.globalAlpha = Math.min(1, near * 1.4) * 0.9;
        ctx.strokeStyle = s.w > 0.8 ? `rgb(${pale[0]},${pale[1]},${pale[2]})` : '#ffffff';
        ctx.lineWidth = Math.max(0.6, near * 2.2) * dpr;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
        ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
        ctx.stroke();
      }

      // the swirl: spiral arms of glowing dust wheeling round the core, flowing outwards past us
      const core = unit * (0.05 + open * 0.42);
      for (const d of dust) {
        d.t += dt * speed * 0.12;
        if (d.t > 1) d.t -= 1;
        const rad = core * 0.9 + Math.pow(d.t, 1.6) * reach * 1.1;
        const a = (d.arm / ARMS) * Math.PI * 2 + d.off + Math.log(1 + d.t * 8) * 1.9 - spin * 1.4;
        const trail = 0.05 + speed * 0.025; // longer streaks as we speed up
        const fade = Math.min(1, d.t * 5) * (1 - d.t);
        ctx.globalAlpha = fade;
        ctx.strokeStyle = d.tint > 0.7 ? `rgb(${pale[0]},${pale[1]},${pale[2]})` : `rgb(${r},${g},${b})`;
        ctx.lineWidth = d.s * dpr * (0.5 + d.t * 1.4);
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a + trail) * rad * 0.97, cy + Math.sin(a + trail) * rad * 0.97 * 0.92);
        ctx.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad * 0.92);
        ctx.stroke();
      }

      // the throat: the other side of space, seen through a ring of bent light, opening as we fall in
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      const light = Math.min(1, Math.max(0, (t - 0.6) * 1.1)); // at the end the far side floods in
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, core, 0, Math.PI * 2);
      ctx.clip();
      const deep = ctx.createRadialGradient(cx, cy, 0, cx, cy, core);
      deep.addColorStop(0, `rgb(${Math.round(14 + (pale[0] - 14) * light)},${Math.round(10 + (pale[1] - 10) * light)},${Math.round(26 + (pale[2] - 26) * light)})`);
      deep.addColorStop(1, `rgb(${Math.round(r * 0.18 + (r - r * 0.18) * light)},${Math.round(g * 0.12 + (g - g * 0.12) * light)},${Math.round(b * 0.16 + 30 + (b - b * 0.16) * light)})`);
      ctx.fillStyle = deep;
      ctx.fillRect(cx - core, cy - core, core * 2, core * 2);
      ctx.globalCompositeOperation = 'lighter';
      for (const st of beyond) {
        const a = st.a - spin * 0.5; // the far side turns the other way
        const rr = st.d * core * (0.9 + t * 0.15);
        ctx.globalAlpha = (0.45 + 0.55 * Math.abs(Math.sin(t * 3 + st.tw))) * (1 - light * 0.7);
        ctx.fillStyle = '#ffffff';
        const sz = st.s * dpr;
        ctx.fillRect(cx + Math.cos(a) * rr - sz / 2, cy + Math.sin(a) * rr - sz / 2, sz, sz);
      }
      ctx.restore();

      // the ring: a thin, bright inner edge in the door's light, fading out into a soft glow
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 1;
      const ring = ctx.createRadialGradient(cx, cy, core * 0.92, cx, cy, core * 1.9);
      ring.addColorStop(0, 'rgba(255,255,255,0)');
      ring.addColorStop(0.07, `rgba(${pale[0]},${pale[1]},${pale[2]},0.95)`);
      ring.addColorStop(0.16, `rgba(${r},${g},${b},0.6)`);
      ring.addColorStop(0.45, `rgba(${r},${g},${b},0.14)`);
      ring.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = ring;
      ctx.fillRect(cx - core * 1.9, cy - core * 1.9, core * 3.8, core * 3.8);

      raf = requestAnimationFrame(frame);
    };
    ctx.fillStyle = 'rgb(5, 4, 10)';
    ctx.fillRect(0, 0, W, H);
    raf = requestAnimationFrame(frame);
    requestAnimationFrame(() => (cv.style.opacity = '1')); // fade in over the doorway
    return () => cancelAnimationFrame(raf);
  }, [color]);

  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[59] size-full opacity-0 transition-opacity duration-500 ease-out" />;
}
