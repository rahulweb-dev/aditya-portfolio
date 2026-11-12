'use client';

import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { useOnScreen } from './useThemeColors';

// Frames shown on the strip. Swap these for your own work in /public/assets.
const FRAMES = ['/assets/portrait.jpg', '/assets/city.jpg', '/assets/silk.jpg', '/assets/flare.jpg', '/assets/dune.jpg', '/assets/sea.jpg', '/assets/mono.jpg', '/assets/forest.jpg'];

const TEX_W = 4096;
const TEX_H = 512;
const STRIP_W = 18;
const STRIP_H = STRIP_W * (TEX_H / TEX_W);

/** Draws a strip of 35mm film (sprocket holes, frame numbers, photos) onto a canvas texture. */
function useFilmTexture() {
  const { canvas, texture } = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = TEX_W;
    canvas.height = TEX_H;
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.anisotropy = 8;
    return { canvas, texture };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const g = canvas.getContext('2d')!;
    const pitch = TEX_W / FRAMES.length;
    const band = 78;

    const drawBase = () => {
      g.fillStyle = '#121214';
      g.fillRect(0, 0, TEX_W, TEX_H);
      g.fillStyle = '#e9e3d3';
      for (let x = 14; x < TEX_W; x += 44) {
        for (const y of [24, TEX_H - 52]) {
          g.beginPath();
          g.roundRect(x, y, 26, 28, 5);
          g.fill();
        }
      }
      g.fillStyle = '#e8a33d';
      g.font = '500 20px ui-monospace, Consolas, monospace';
      FRAMES.forEach((_, i) => {
        g.fillText(`${12 + i}`, i * pitch + 18, band - 8);
        g.fillText(`${12 + i}A  ▸`, i * pitch + pitch / 2, TEX_H - band + 26);
      });
    };
    drawBase();
    texture.needsUpdate = true;

    FRAMES.forEach((src, i) => {
      const img = new Image();
      img.onload = () => {
        if (cancelled) return;
        // Cover-fit each photo into its frame.
        const fx = i * pitch + 14;
        const fy = band;
        const fw = pitch - 28;
        const fh = TEX_H - band * 2;
        const scale = Math.max(fw / img.width, fh / img.height);
        const sw = fw / scale;
        const sh = fh / scale;
        g.save();
        g.beginPath();
        g.roundRect(fx, fy, fw, fh, 10);
        g.clip();
        g.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, fx, fy, fw, fh);
        g.restore();
        texture.needsUpdate = true;
      };
      img.src = src;
    });
    return () => {
      cancelled = true;
    };
  }, [canvas, texture]);

  return texture;
}

function Strip() {
  const group = useRef<THREE.Group>(null);
  const mesh = useRef<THREE.Mesh>(null);
  const texture = useFilmTexture();
  const geometry = useMemo(() => new THREE.PlaneGeometry(STRIP_W, STRIP_H, 96, 1), []);
  const base = useMemo(() => Float32Array.from(geometry.attributes.position.array), [geometry]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);
    const t = state.clock.elapsedTime;
    // Ripple and twist the strip like film unspooling in the air.
    const pos = geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = base[i * 3];
      const y = base[i * 3 + 1];
      const twist = Math.sin(x * 0.22 + t * 0.35) * 0.55;
      const wave = Math.sin(x * 0.42 + t * 0.6) * 0.55;
      pos.setXYZ(i, x, y * Math.cos(twist) + Math.sin(x * 0.28 + t * 0.4) * 0.22, wave + y * Math.sin(twist));
    }
    pos.needsUpdate = true;

    texture.offset.x = (texture.offset.x + dt * 0.012) % 1; // film rolls slowly

    if (group.current) {
      const s = 1 - Math.exp(-2.5 * dt);
      group.current.rotation.x += (-state.pointer.y * 0.18 - group.current.rotation.x) * s;
      group.current.rotation.y += (state.pointer.x * 0.25 - group.current.rotation.y) * s;
    }
  });

  return (
    <group ref={group}>
      <mesh ref={mesh} geometry={geometry} rotation-z={0.14} position={[0.6, -1.95, -0.5]}>
        {/* Unlit: no lighting maths per pixel, which keeps the hero smooth */}
        <meshBasicMaterial map={texture} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/** 3D film strip that waves behind the hero and leans towards the mouse. */
export default function FilmStrip() {
  const wrap = useRef<HTMLDivElement>(null);
  const onScreen = useOnScreen(wrap);
  return (
    <div ref={wrap} aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
      <Canvas
        flat
        dpr={[1, 1.5]}
        frameloop={onScreen ? 'always' : 'never'}
        camera={{ fov: 40, position: [0, 0, 8] }}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        eventSource={typeof document !== 'undefined' ? document.body : undefined}
        eventPrefix="client"
      >
        <Strip />
      </Canvas>
    </div>
  );
}
