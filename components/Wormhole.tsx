'use client';

import { useEffect, useRef } from 'react';

const RINGS = 46;
const STREAKS = 140;

/**
 * Stepping through a door: a tunnel of doorway frames in the door's light rushes past, twisting,
 * faster and faster, with streaks of light flying by, until the far end opens up into light.
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
    const unit = Math.min(W, H);
    const streaks = Array.from({ length: STREAKS }, () => ({ a: Math.random() * Math.PI * 2, r: Math.random(), w: 0.5 + Math.random() * 1.5 }));
    let travel = 0;
    let last = performance.now();
    const start = last;
    let raf = 0;

    const frame = (now: number) => {
      const t = (now - start) / 1000;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const speed = 0.25 + t * t * 1.4; // it gathers pace
      travel += speed * dt;
      const twist = t * 0.9 + t * t * 0.5;

      // a short trail of the last frames: motion blur
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(10, 6, 7, 0.3)';
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';

      // the far end: a growing light
      const glow = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, unit * (0.12 + t * 0.35));
      glow.addColorStop(0, `rgba(255,255,255,${Math.min(0.9, 0.25 + t * 0.4)})`);
      glow.addColorStop(0.35, color);
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);

      // the tunnel: doorway frames from far to near, drifting in a slow spiral
      ctx.strokeStyle = color;
      for (let i = 0; i < RINGS; i++) {
        const z = (((i / RINGS - travel) % 1) + 1) % 1; // 0 = at your face, 1 = far away
        const s = (unit * 0.055) / (z + 0.03);
        if (s > unit * 4) continue;
        const cx = W / 2 + Math.sin(z * 5 + twist) * W * 0.06 * z;
        const cy = H / 2 + Math.cos(z * 4 + twist * 0.8) * H * 0.05 * z;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(z * 1.4 + twist * 0.6);
        ctx.globalAlpha = Math.min(1, z * 6) * (1 - z) * 0.85;
        ctx.lineWidth = Math.max(1, s * 0.035);
        ctx.strokeRect(-s * 0.42, -s, s * 0.84, s * 2);
        ctx.restore();
      }

      // streaks of light flying past
      ctx.lineCap = 'round';
      for (const p of streaks) {
        p.r += p.r * speed * dt * 2.2 + dt * 0.05;
        if (p.r > 1.6) {
          p.r = 0.02 + Math.random() * 0.1;
          p.a = Math.random() * Math.PI * 2;
        }
        const a = p.a + twist * 0.3;
        const r0 = p.r * unit * 0.8;
        const r1 = r0 * (1 + 0.06 + speed * 0.05);
        ctx.globalAlpha = Math.min(1, p.r * 2) * 0.7;
        ctx.strokeStyle = p.w > 1.6 ? '#ffffff' : color;
        ctx.lineWidth = p.w * dpr * Math.min(2, 0.5 + p.r);
        ctx.beginPath();
        ctx.moveTo(W / 2 + Math.cos(a) * r0, H / 2 + Math.sin(a) * r0);
        ctx.lineTo(W / 2 + Math.cos(a) * r1, H / 2 + Math.sin(a) * r1);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    };
    ctx.fillStyle = 'rgb(10, 6, 7)';
    ctx.fillRect(0, 0, W, H);
    raf = requestAnimationFrame(frame);
    // fade the tunnel in over the doorway
    requestAnimationFrame(() => (cv.style.opacity = '1'));
    return () => cancelAnimationFrame(raf);
  }, [color]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[59] size-full opacity-0 transition-opacity duration-500 ease-out"
    />
  );
}
