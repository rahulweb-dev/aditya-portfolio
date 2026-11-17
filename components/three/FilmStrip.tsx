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
      onReady();
    });
    return () => {
      cancelled = true;
    };
  }, [canvas, texture, onReady, list, n, px]);

  return { texture, period: n * FRAME_WORLD, n };
}

function Strip({ frames, onReady, still, onOpen }: { frames: FilmFrame[]; onReady: () => void; still: boolean; onOpen?: (index: number, at: { x: number; y: number }) => void }) {
  const maxTex = useThree(s => s.gl.capabilities.maxTextureSize);
  const { texture, period, n } = useFilmTexture(frames, maxTex, onReady);
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

  });

  return (
    <group>
      <mesh
        onClick={e => {
          // a click that landed on a button, link or the portrait belongs to them, not the film
          const target = e.nativeEvent.target as Element | null;
          if (!onOpen || !frames.length || target?.closest('a, button, [role="button"], [role="switch"], figure, input, label, header, nav')) return;
          if (!e.uv) return;
          e.stopPropagation();
          // which frame: where on the film this point is, given how far it has rolled
          const u = (((e.uv.x * texture.repeat.x + texture.offset.x) % 1) + 1) % 1;
          const frame = Math.floor(u * n) % frames.length;
          onOpen(frame, { x: e.nativeEvent.clientX, y: e.nativeEvent.clientY });
        }}
        onPointerOver={() => onOpen && (document.body.style.cursor = 'pointer')}
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

  return (
    <div
      ref={wrap}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 -z-[5] hidden transition-opacity duration-1000 md:block ${ready ? 'opacity-100' : 'opacity-0'}`}
    >
      <Canvas
        flat
        dpr={[1, 1.5]}
        frameloop={onScreen ? (still ? 'demand' : 'always') : 'never'}
        camera={{ fov: 40, position: [0, 0, 8] }}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        eventSource={typeof document !== 'undefined' ? document.body : undefined}
        eventPrefix="client"
      >
        <Strip frames={frames} onReady={markReady} still={still} onOpen={onOpen} />
      </Canvas>
    </div>
  );
}
