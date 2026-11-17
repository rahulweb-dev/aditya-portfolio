'use client';

import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useOnScreen } from './useThemeColors';

// Frames on the strip: the hero passes in photographs from the Photography gallery (ImageKit).
// These stock frames are only a fallback if none come through.
const FALLBACK = ['/assets/city.jpg', '/assets/silk.jpg', '/assets/flare.jpg', '/assets/dune.jpg', '/assets/sea.jpg', '/assets/mono.jpg', '/assets/forest.jpg', '/assets/portrait.jpg'];

const TEX_W = 4096;
const TEX_H = 512;
const FRAME_COUNT = 8;
const PITCH = TEX_W / FRAME_COUNT; // one frame per 512px
const HOLES_PER_FRAME = 12; // sprocket holes divide each frame exactly, so the loop has no seam
const STRIP_W = 18; // world units; the texture repeats once across this width
const STRIP_H = STRIP_W * (TEX_H / TEX_W);
// The ribbon itself is much longer than the film pattern (which repeats along it), so neither end
// ever comes into view, however the strip leans towards the mouse.
const REPEATS = 3;
const RIBBON_W = STRIP_W * REPEATS;

// One speed for everything: the film rolls left and its waves travel left at the same pace,
// so the strip moves as one ribbon instead of sliding over its own ripples.
const ROLL = 0.018; // texture widths per second
const SPEED = ROLL * STRIP_W; // world units per second

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // ImageKit allows it; without it the canvas couldn't become a texture
    img.onload = () => resolve(img);
    img.onerror = () => resolve(img);
    img.src = src;
  });

/** Draws the whole strip once every photo has loaded, so nothing pops in. */
function useFilmTexture(frames: string[], onReady: () => void) {
  const { canvas, texture } = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = TEX_W;
    canvas.height = TEX_H;
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.repeat.x = REPEATS;
    texture.anisotropy = 8;
    return { canvas, texture };
  }, []);

  useEffect(() => {
    let cancelled = false;
    // always eight frames: repeat the photos if there are fewer
    const list = frames.length ? Array.from({ length: FRAME_COUNT }, (_, i) => frames[i % frames.length]) : FALLBACK;
    Promise.all(list.map(loadImage)).then(images => {
      if (cancelled) return;
      const g = canvas.getContext('2d')!;
      const band = 78;
      // film base (night) with cream sprocket holes, evenly spaced across every frame
      g.fillStyle = '#140D0E';
      g.fillRect(0, 0, TEX_W, TEX_H);
      g.fillStyle = '#F3EBE0';
      const step = PITCH / HOLES_PER_FRAME;
      for (let i = 0; i < FRAME_COUNT * HOLES_PER_FRAME; i++) {
        const x = i * step + (step - 24) / 2;
        for (const y of [24, TEX_H - 52]) {
          g.beginPath();
          g.roundRect(x, y, 24, 28, 5);
          g.fill();
        }
      }
      // frame numbers in sand
      g.fillStyle = '#E3CFAE';
      g.font = '400 20px "Space Mono", ui-monospace, Consolas, monospace';
      images.forEach((img, i) => {
        g.fillText(`${12 + i}`, i * PITCH + 18, band - 8);
        g.fillText(`${12 + i}A  ▸`, i * PITCH + PITCH / 2, TEX_H - band + 26);
        if (!img.width) return;
        // cover-fit each photo into its frame
        const fx = i * PITCH + 14;
        const fw = PITCH - 28;
        const fh = TEX_H - band * 2;
        const scale = Math.max(fw / img.width, fh / img.height);
        const sw = fw / scale;
        const sh = fh / scale;
        g.save();
        g.beginPath();
        g.roundRect(fx, band, fw, fh, 10);
        g.clip();
        g.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, fx, band, fw, fh);
        g.restore();
      });
      texture.needsUpdate = true;
      onReady();
    });
    return () => {
      cancelled = true;
    };
  }, [canvas, texture, onReady, frames]);

  return texture;
}

function Strip({ frames, onReady, still }: { frames: string[]; onReady: () => void; still: boolean }) {
  const group = useRef<THREE.Group>(null);
  const texture = useFilmTexture(frames, onReady);
  const geometry = useMemo(() => new THREE.PlaneGeometry(RIBBON_W, STRIP_H, 120 * REPEATS, 1), []);
  const base = useMemo(() => Float32Array.from(geometry.attributes.position.array), [geometry]);
  const time = useRef(0);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 20); // after a pause, never jump
    if (!still) time.current += dt;
    const t = time.current;
    texture.offset.x = (t * ROLL) % 1;

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

    // A gentle lean towards the mouse, eased so it never snaps
    if (group.current) {
      const s = 1 - Math.exp(-2 * dt);
      group.current.rotation.x += (-state.pointer.y * 0.12 - group.current.rotation.x) * s;
      group.current.rotation.y += (state.pointer.x * 0.16 - group.current.rotation.y) * s;
    }
  });

  return (
    <group ref={group}>
      <mesh geometry={geometry} rotation-z={0.15} position={[0.4, -2.35, -0.5]} scale={0.8}>
        {/* Unlit: no lighting maths per pixel, which keeps the hero smooth */}
        <meshBasicMaterial map={texture} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/** 3D film strip that flows across the dunes behind the hero and leans towards the mouse. */
export default function FilmStrip({ frames = [] }: { frames?: string[] }) {
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
        <Strip frames={frames} onReady={markReady} still={still} />
      </Canvas>
    </div>
  );
}
