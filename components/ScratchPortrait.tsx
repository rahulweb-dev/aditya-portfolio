'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';

const BRUSH = 46; // brush radius in CSS px
const GRID_X = 20;
const GRID_Y = 25;
const DONE_AT = 0.55; // once this much is scratched, the rest fades away

/**
 * Scratch-card portrait: a black-and-white copy sits over the colour photo
 * and the cursor (or a finger) rubs it away. Pulling the cord covers it again.
 */
export default function ScratchPortrait({ src, alt }: { src: string; alt: string }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const last = useRef<{ x: number; y: number } | null>(null);
  const cells = useRef(new Set<number>());
  const [ready, setReady] = useState(false);
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);

  // Paint the black-and-white cover, cropped like object-fit: cover.
  const cover = useCallback(() => {
    const box = boxRef.current;
    const canvas = canvasRef.current;
    if (!box || !canvas) return;
    const img = new window.Image();
    img.onload = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = box.clientWidth;
      const h = box.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
      const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
      const sw = canvas.width / scale;
      const sh = canvas.height / scale;
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, 0, 0, canvas.width, canvas.height);
      // Convert to black and white by hand (canvas filters aren't supported everywhere).
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const px = data.data;
      for (let i = 0; i < px.length; i += 4) {
        const l = Math.min(255, (0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2] - 128) * 1.08 + 128);
        px[i] = px[i + 1] = px[i + 2] = l;
      }
      ctx.putImageData(data, 0, 0);
      cells.current.clear();
      last.current = null;
      setStarted(false);
      setDone(false);
      setReady(true);
    };
    img.src = src;
  }, [src]);

  useEffect(() => {
    cover();
    // Pulling the cord (theme change) covers the photo again; resizing redraws it.
    const mo = new MutationObserver(cover);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    let t: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(t);
      t = setTimeout(cover, 200);
    };
    window.addEventListener('resize', onResize);
    return () => {
      mo.disconnect();
      window.removeEventListener('resize', onResize);
      clearTimeout(t);
    };
  }, [cover]);

  const scratch = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas || done || !ready) return;
    const rect = canvas.getBoundingClientRect();
    const k = canvas.width / rect.width;
    const x = (e.clientX - rect.left) * k;
    const y = (e.clientY - rect.top) * k;
    const r = BRUSH * k;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.globalCompositeOperation = 'destination-out';
    const from = last.current ?? { x, y };
    const dist = Math.hypot(x - from.x, y - from.y);
    const steps = Math.max(1, Math.ceil(dist / (r * 0.35)));
    for (let s = 1; s <= steps; s++) {
      const px = from.x + ((x - from.x) * s) / steps;
      const py = from.y + ((y - from.y) * s) / steps;
      // Soft-edged brush so the colour bleeds through like a real scratch card.
      const g = ctx.createRadialGradient(px, py, r * 0.25, px, py, r);
      g.addColorStop(0, 'rgba(0,0,0,0.9)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
      const cx = Math.floor((px / canvas.width) * GRID_X);
      const cy = Math.floor((py / canvas.height) * GRID_Y);
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
        const gx = cx + dx;
        const gy = cy + dy;
        if (gx >= 0 && gx < GRID_X && gy >= 0 && gy < GRID_Y) cells.current.add(gy * GRID_X + gx);
      }
    }
    last.current = { x, y };
    if (!started) setStarted(true);
    if (cells.current.size / (GRID_X * GRID_Y) > DONE_AT) setDone(true);
  };

  return (
    <div ref={boxRef} className="relative aspect-4/5 overflow-hidden rounded-[20px]">
      <Image src={src} alt={alt} fill priority sizes="(max-width: 768px) 100vw, 460px" className={`object-cover ${ready ? '' : 'grayscale'}`} />
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        onPointerMove={scratch}
        onPointerDown={scratch}
        onPointerLeave={() => (last.current = null)}
        className={`absolute inset-0 size-full cursor-crosshair touch-pan-y transition-opacity duration-700 ${ready ? '' : 'invisible'} ${done ? 'pointer-events-none opacity-0' : 'opacity-100'}`}
      />
      <span
        className={`micro-caps pointer-events-none absolute top-11 left-[18px] rounded-full border border-line-on-dark bg-dark/90 px-3 py-2 text-on-dark transition-opacity duration-500 ${
          ready && !started ? 'opacity-100' : 'opacity-0'
        }`}
      >
        Scratch to reveal
      </span>

      {/* Camera viewfinder: corner brackets and a recording light */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-3.5">
        <span className="absolute top-0 left-0 size-6 border-t-2 border-l-2 border-[#F3EBE0]/75" />
        <span className="absolute top-0 right-0 size-6 border-t-2 border-r-2 border-[#F3EBE0]/75" />
        <span className="absolute bottom-0 left-0 size-6 border-b-2 border-l-2 border-[#F3EBE0]/75" />
        <span className="absolute right-0 bottom-0 size-6 border-r-2 border-b-2 border-[#F3EBE0]/75" />
        <span className="micro-caps absolute top-2 right-9 flex items-center gap-2 text-[#F3EBE0] [text-shadow:0_1px_3px_rgba(0,0,0,0.6)]">
          <span className="rec-dot rec-blink bg-rec-on-dark" />
          Rec
          <span className="opacity-60">4K · 24 fps</span>
        </span>
      </div>
    </div>
  );
}
