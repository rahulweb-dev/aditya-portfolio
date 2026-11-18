'use client';

import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useOnScreen } from './useThemeColors';
import type { WorkItem } from '../WorkGallery';

// Frames on the strip: the hero passes in photographs from the Photography gallery (ImageKit).
// These stock frames are only a fallback if none come through.
/** One frame on the strip: a photograph, or a film shown by a still (secs = its length). `item` is the piece it opens. */
export type FilmFrame = { src: string; secs?: number; item?: WorkItem };

const FALLBACK: FilmFrame[] = (['/assets/city.jpg', '/assets/silk.jpg', '/assets/flare.jpg', '/assets/dune.jpg', '/assets/sea.jpg', '/assets/mono.jpg', '/assets/forest.jpg', '/assets/portrait.jpg']).map(src => ({ src }));

// Each frame is drawn 512px square on the film texture, and is 2.25 world units long on the ribbon.
// The texture holds every photo once; with many photos the frames are drawn a little smaller so the
// texture stays within what the graphics card allows (about 32 photos at full size on most screens).
const FRAME_PX = 512;
const FRAME_WORLD = 2.25;
const MIN_FRAMES = 4; // a few photos are repeated so the pattern isn't too short
const HOLES_PER_FRAME = 12; // sprocket holes divide each frame exactly, so the loop has no seam
const STRIP_H = FRAME_WORLD;
// The ribbon is much longer than the screen, so neither end ever comes into view, however it leans.
const RIBBON_W = 54;

// One speed for everything: the film rolls left and its waves travel left at the same pace,
// so the strip moves as one ribbon instead of sliding over its own ripples.
const SPEED = 0.324; // world units per second

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // ImageKit allows it; without it the canvas couldn't become a texture
    img.onload = () => resolve(img);
    img.onerror = () => resolve(img);
    img.src = src;
  });

/** A film's place on the strip: its frame's picture area on the texture, and the video that fills it. */
type Slot = { video: HTMLVideoElement; canvas: HTMLCanvasElement; tex: THREE.CanvasTexture; x: number; y: number; w: number; h: number; secs: number };

/** Draws a video's current picture into its slot: cover-fit, rounded corners, its running time. */
function paintSlot(s: Slot) {
  const g = s.canvas.getContext('2d')!;
  const v = s.video;
  g.fillStyle = '#140D0E';
  g.fillRect(0, 0, s.w, s.h);
  g.save();
  g.beginPath();
  g.roundRect(0, 0, s.w, s.h, Math.max(4, s.w * 0.021));
  g.clip();
  const scale = Math.max(s.w / v.videoWidth, s.h / v.videoHeight);
  const sw = s.w / scale;
  const sh = s.h / scale;
  g.drawImage(v, (v.videoWidth - sw) / 2, (v.videoHeight - sh) / 2, sw, sh, 0, 0, s.w, s.h);
  g.restore();
  // the running time with a REC dot, small in the corner
  const k = s.w / 484;
  const label = `${Math.floor(s.secs / 60)}:${String(Math.round(s.secs) % 60).padStart(2, '0')}`;
  g.font = `700 ${Math.round(22 * k)}px "Space Mono", ui-monospace, Consolas, monospace`;
  const tw = g.measureText(label).width;
  g.fillStyle = 'rgba(20, 13, 14, 0.72)';
  g.beginPath();
  g.roundRect(14 * k, 14 * k, tw + 48 * k, 36 * k, 18 * k);
  g.fill();
  g.fillStyle = '#FF5A48';
  g.beginPath();
  g.arc(34 * k, 32 * k, 6 * k, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#F3EBE0';
  g.fillText(label, 46 * k, 40 * k);
}

/** Draws the whole strip once every photo has loaded, so nothing pops in. */
function useFilmTexture(frames: FilmFrame[], maxTex: number, onReady: () => void) {
  // every chosen photo once (at least a few frames), else the stock frames
  const list = useMemo(
    () => (frames.length ? Array.from({ length: Math.max(MIN_FRAMES, frames.length) }, (_, i) => frames[i % frames.length]) : FALLBACK),
    [frames],
  );
  const n = list.length;
  const px = Math.max(160, Math.min(FRAME_PX, Math.floor(Math.min(maxTex, 16384) / n))); // pixels per frame

  const { canvas, texture } = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = px * n;
    canvas.height = px;
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.repeat.x = RIBBON_W / (n * FRAME_WORLD); // the photos repeat along the ribbon
    texture.anisotropy = 8;
    return { canvas, texture };
  }, [n, px]);
  useEffect(() => () => texture.dispose(), [texture]);
  const slots = useRef<Slot[]>([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all(list.map(f => loadImage(f.src))).then(images => {
      if (cancelled) return;
      const g = canvas.getContext('2d')!;
      g.setTransform(px / FRAME_PX, 0, 0, px / FRAME_PX, 0, 0); // draw in 512px frames, whatever the size
      const W = FRAME_PX * n;
      const H = FRAME_PX;
      const band = 78;
      // film base (night) with cream sprocket holes, evenly spaced across every frame
      g.fillStyle = '#140D0E';
      g.fillRect(0, 0, W, H);
      g.fillStyle = '#F3EBE0';
      const step = FRAME_PX / HOLES_PER_FRAME;
      for (let i = 0; i < n * HOLES_PER_FRAME; i++) {
        const x = i * step + (step - 24) / 2;
        for (const y of [24, H - 52]) {
          g.beginPath();
          g.roundRect(x, y, 24, 28, 5);
          g.fill();
        }
      }
      // frame numbers in sand
      g.fillStyle = '#E3CFAE';
      g.font = '400 20px "Space Mono", ui-monospace, Consolas, monospace';
      images.forEach((img, i) => {
        g.fillText(`${12 + i}`, i * FRAME_PX + 18, band - 8);
        g.fillText(`${12 + i}A  ▸`, i * FRAME_PX + FRAME_PX / 2, H - band + 26);
        if (!img.width) return;
        // cover-fit each photo into its frame
        const fx = i * FRAME_PX + 14;
        const fw = FRAME_PX - 28;
        const fh = H - band * 2;
        const scale = Math.max(fw / img.width, fh / img.height);
        const sw = fw / scale;
        const sh = fh / scale;
        g.save();
        g.beginPath();
        g.roundRect(fx, band, fw, fh, 10);
        g.clip();
        g.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, fx, band, fw, fh);
        g.restore();
        // a film: a play button in the middle and its running time in the corner
        const secs = list[i].secs;
        if (secs !== undefined) {
          const cx = fx + fw / 2;
          const cy = band + fh / 2;
          g.fillStyle = 'rgba(20, 13, 14, 0.62)';
          g.beginPath();
          g.arc(cx, cy, 44, 0, Math.PI * 2);
          g.fill();
          g.strokeStyle = 'rgba(243, 235, 224, 0.85)';
          g.lineWidth = 3;
          g.stroke();
          g.fillStyle = '#F3EBE0';
          g.beginPath();
          g.moveTo(cx - 13, cy - 20);
          g.lineTo(cx + 22, cy);
          g.lineTo(cx - 13, cy + 20);
          g.closePath();
          g.fill();
          const label = `${Math.floor(secs / 60)}:${String(Math.round(secs) % 60).padStart(2, '0')}`;
          g.font = '700 22px "Space Mono", ui-monospace, Consolas, monospace';
          const tw = g.measureText(label).width;
          g.fillStyle = 'rgba(20, 13, 14, 0.72)';
          g.beginPath();
          g.roundRect(fx + 14, band + 14, tw + 48, 36, 18);
          g.fill();
          g.fillStyle = '#FF5A48';
          g.beginPath();
          g.arc(fx + 34, band + 32, 6, 0, Math.PI * 2);
          g.fill();
          g.fillStyle = '#F3EBE0';
          g.fillText(label, fx + 46, band + 40);
          g.font = '400 20px "Space Mono", ui-monospace, Consolas, monospace';
          g.fillStyle = '#E3CFAE';
        }
      });
      texture.needsUpdate = true;
      // films play on the strip: each gets a muted, looping video that paints its own frame area
      const k = px / FRAME_PX;
      slots.current = list.flatMap((fr, i) => {
        if (fr.secs === undefined || !fr.item?.src) return [];
        const video = document.createElement('video');
        video.crossOrigin = 'anonymous'; // ImageKit allows it; the strip can then copy its pictures
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.preload = 'auto';
        video.src = fr.item.src;
        const w = Math.round((FRAME_PX - 28) * k);
        const h = Math.round((FRAME_PX - band * 2) * k);
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        return [{ video, canvas: c, tex: new THREE.CanvasTexture(c), x: Math.round((i * FRAME_PX + 14) * k), y: Math.round(band * k), w, h, secs: fr.secs }];
      });
      onReady();
    });
    return () => {
      cancelled = true;
      slots.current.forEach(sl => {
        sl.video.pause();
        sl.video.removeAttribute('src');
        sl.video.load();
        sl.tex.dispose();
      });
      slots.current = [];
    };
  }, [canvas, texture, onReady, list, n, px]);

  return { texture, period: n * FRAME_WORLD, n, slots, height: px };
}

function Strip({ frames, onReady, still, active, area, onOpen }: { frames: FilmFrame[]; onReady: () => void; still: boolean; active: boolean; area: React.RefObject<HTMLDivElement | null>; onOpen?: (index: number, at: { x: number; y: number }) => void }) {
  const gl = useThree(s => s.gl);
  const maxTex = gl.capabilities.maxTextureSize;
  const { texture, period, n, slots, height } = useFilmTexture(frames, maxTex, onReady);
  const sinceVideo = useRef(0);
  const at = useMemo(() => new THREE.Vector2(), []);

  // the films play while the strip is on screen, and rest when it isn't
  useEffect(() => {
    const go = () => slots.current.forEach(sl => (active && !still ? sl.video.play().catch(() => {}) : sl.video.pause()));
    go();
    const t = setTimeout(go, 1500); // the films may be set up a moment after the strip
    return () => clearTimeout(t);
  }, [active, still, slots, frames]);
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(RIBBON_W, STRIP_H, 360, 1);
    // the ribbon bends as it rolls: a roomier bounding sphere so clicks are never missed
    g.computeBoundingSphere();
    g.boundingSphere!.radius += 1.5;
    return g;
  }, []);
  const base = useMemo(() => Float32Array.from(geometry.attributes.position.array), [geometry]);
  const time = useRef(0);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 20); // after a pause, never jump
    if (!still) time.current += dt;
    const t = time.current;
    texture.offset.x = ((t * SPEED) / period) % 1; // the film rolls at SPEED, however long it is

    // Every bend travels left at the roll speed: phase = k·(x + SPEED·t).
    const pos = geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = base[i * 3];
      const y = base[i * 3 + 1];
      const u = x + SPEED * t;
      const twist = Math.sin(u * 0.22) * 0.42;
      const lift = Math.sin(u * 0.3 + 1.1) * 0.2;
      const depth = Math.sin(u * 0.4) * 0.45;
      pos.setXYZ(i, x, y * Math.cos(twist) + lift, depth + y * Math.sin(twist));
    }
    pos.needsUpdate = true;

    // ~15 times a second, copy each playing film's picture into its frame on the film (only that small
    // area is sent to the graphics card, so the strip stays smooth)
    sinceVideo.current += dt;
    if (sinceVideo.current >= 1 / 15 && slots.current.length) {
      sinceVideo.current = 0;
      for (const sl of slots.current) {
        if (sl.video.readyState < 2 || sl.video.paused) continue;
        paintSlot(sl);
        at.set(sl.x, height - sl.y - sl.h); // the film's rows run bottom-up on the card
        gl.copyTextureToTexture(sl.tex, texture, null, at);
      }
    }
  });

  return (
    <group>
      <mesh
        onClick={e => {
          // a click that landed on a button, link or the portrait belongs to them, not the film
          const target = e.nativeEvent.target as Element | null;
          if (!onOpen || !frames.length || target?.closest('a, button, [role="button"], [role="switch"], figure, input, label, header, nav')) return;
          // only the part of the film you can see: the ribbon runs on well past the screen's edges
          const r = area.current?.getBoundingClientRect();
          const { clientX: cx, clientY: cy } = e.nativeEvent;
          if (!r || cx < r.left || cx > r.right || cy < r.top || cy > r.bottom) return;
          if (!e.uv) return;
          e.stopPropagation();
          // which frame: where on the film this point is, given how far it has rolled
          const u = (((e.uv.x * texture.repeat.x + texture.offset.x) % 1) + 1) % 1;
          const frame = Math.floor(u * n) % frames.length;
          onOpen(frame, { x: e.nativeEvent.clientX, y: e.nativeEvent.clientY });
        }}
        onPointerMove={e => {
          // a pointer only over the visible film, never over buttons or the portrait
          const target = e.nativeEvent.target as Element | null;
          const r = area.current?.getBoundingClientRect();
          const { clientX: cx, clientY: cy } = e.nativeEvent;
          const inside = !!r && cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom;
          document.body.style.cursor = onOpen && inside && !target?.closest('a, button, figure, header, nav, input, label') ? 'pointer' : '';
        }}
        onPointerOut={() => (document.body.style.cursor = '')}
        geometry={geometry} rotation-z={0.15} position={[0.4, -2.35, -0.5]} scale={0.8}>
        {/* Unlit: no lighting maths per pixel, which keeps the hero smooth */}
        <meshBasicMaterial map={texture} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/** 3D film strip that flows across the dunes behind the hero. Click a frame to open that piece. */
export default function FilmStrip({ frames = [], onOpen }: { frames?: FilmFrame[]; onOpen?: (index: number, at: { x: number; y: number }) => void }) {
  const wrap = useRef<HTMLDivElement>(null);
  const onScreen = useOnScreen(wrap);
  const [ready, setReady] = useState(false);
  const [still, setStill] = useState(false);
  const markReady = useMemo(() => () => setReady(true), []);
  useEffect(() => setStill(window.matchMedia('(prefers-reduced-motion: reduce)').matches), []);
  // it listens to the mouse only over the hero, not the whole page
  const [source, setSource] = useState<HTMLElement | null>(null);
  useEffect(() => setSource(wrap.current?.closest('section') ?? null), []);

  return (
    <div
      ref={wrap}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 -z-[5] hidden transition-opacity duration-1000 md:block ${ready ? 'opacity-100' : 'opacity-0'}`}
    >
      {source && <Canvas
        flat
        dpr={[1, 1.5]}
        frameloop={onScreen ? (still ? 'demand' : 'always') : 'never'}
        camera={{ fov: 40, position: [0, 0, 8] }}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        eventSource={source}
        eventPrefix="client"
      >
        <Strip frames={frames} onReady={markReady} still={still} active={onScreen} area={wrap} onOpen={onOpen} />
      </Canvas>}
    </div>
  );
}
