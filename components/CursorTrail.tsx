'use client';

import { useEffect, useRef } from 'react';

type P = { x: number; y: number; vx: number; vy: number; born: number; life: number; size: number; color: string; star: boolean; spin: number };

// Stardust in the brand colours: sun red and sand by day, REC red, cream and sand by night
const DAY = ['#B8241B', '#B8241B', '#9C7A58', '#C6A684'];
const NIGHT = ['#FF5A48', '#FF5A48', '#F3EBE0', '#E3CFAE'];
const MAX = 160;

/**
 * The cursor's trail: fine stardust shed as the pointer moves, drifting down like sand and fading.
 * The normal cursor stays as it is. Mouse and trackpad only.
 */
export default function CursorTrail() {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!matchMedia('(pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const cv = canvas.current!;
    const ctx = cv.getContext('2d')!;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const fit = () => {
      cv.width = innerWidth * dpr;
      cv.height = innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    fit();

    const parts: P[] = [];
    let seen = false;
    let last = { x: 0, y: 0 };
    let raf = 0;

    const spawn = (x: number, y: number, dx: number, dy: number) => {
      const night = document.documentElement.dataset.theme === 'dark';
      const palette = night ? NIGHT : DAY;
      const n = Math.min(4, Math.ceil(Math.hypot(dx, dy) / 9));
      for (let i = 0; i < n && parts.length < MAX; i++) {
        const t = i / n; // spread along the path just travelled
        const star = Math.random() < 0.12;
        parts.push({
          x: x - dx * t + (Math.random() - 0.5) * 6,
          y: y - dy * t + (Math.random() - 0.5) * 6,
          vx: (Math.random() - 0.5) * 0.35 - dx * 0.012,
          vy: (Math.random() - 0.5) * 0.35 - dy * 0.012,
          born: performance.now(),
          life: 650 + Math.random() * 600,
          size: star ? 3 + Math.random() * 2.5 : 0.8 + Math.random() * 1.6,
          color: palette[(Math.random() * palette.length) | 0],
          star,
          spin: Math.random() * Math.PI,
        });
      }
    };

    const drawStar = (x: number, y: number, r: number, a: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a);
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const rr = i % 2 ? r * 0.28 : r;
        const ang = (i * Math.PI) / 4;
        ctx.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    const tick = () => {
      const now = performance.now();
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      ctx.globalCompositeOperation = document.documentElement.dataset.theme === 'dark' ? 'lighter' : 'source-over';
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        const age = (now - p.born) / p.life;
        if (age >= 1) {
          parts.splice(i, 1);
          continue;
        }
        p.vx *= 0.97;
        p.vy = p.vy * 0.97 + 0.012; // a little gravity: it settles like sand
        p.x += p.vx;
        p.y += p.vy;
        ctx.globalAlpha = (1 - age) * (1 - age) * 0.9;
        ctx.fillStyle = p.color;
        if (p.star) drawStar(p.x, p.y, p.size * (1 - age * 0.4), p.spin + age * 2);
        else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (1 - age * 0.5), 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      // keep going only while there is dust in the air
      raf = parts.length ? requestAnimationFrame(tick) : 0;
    };
    const wake = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      if (!seen) {
        seen = true;
        last = { x: e.clientX, y: e.clientY };
      }
      const dx = e.clientX - last.x;
      const dy = e.clientY - last.y;
      if (Math.hypot(dx, dy) > 4) {
        spawn(e.clientX, e.clientY, dx, dy);
        last = { x: e.clientX, y: e.clientY };
      }
      wake();
    };
    const onLeave = () => {
      seen = false;
    };

    addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    addEventListener('resize', fit);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      removeEventListener('resize', fit);
    };
  }, []);

  return <canvas ref={canvas} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[68] size-full" />;
}
