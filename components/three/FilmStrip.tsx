'use client';

import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { useOnScreen, useThemeColors } from './useThemeColors';

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

/**
 * Living light behind the hero: aura glows (violet, pink, orange) drift like stage lights in haze,
 * a warm halo follows the cursor, and moving the mouse sends soft ripples of light out from it.
 * Drawn as one full-screen pass in the same canvas as the film strip, behind it.
 */
const auraVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy * 2.0, 0.999, 1.0); // always fills the canvas, whatever the camera does
  }
`;
const auraFragment = /* glsl */ `
  uniform float uTime;
  uniform vec2 uMouse;   // 0..1, y up
  uniform float uAspect;
  uniform float uEnergy; // how fast the cursor is moving, eased
  uniform float uDark;
  varying vec2 vUv;

  float blob(vec2 p, vec2 c, float r) { vec2 d = p - c; return exp(-dot(d, d) / (r * r)); }

  void main() {
    vec3 violet = vec3(0.545, 0.420, 1.0);
    vec3 pink = vec3(1.0, 0.310, 0.847);
    vec3 orange = vec3(1.0, 0.541, 0.239);

    vec2 p = vec2(vUv.x * uAspect, vUv.y);
    float t = uTime * 0.07;
    vec2 c1 = vec2((0.22 + 0.12 * sin(t * 1.3)) * uAspect, 0.68 + 0.10 * cos(t * 1.1));
    vec2 c2 = vec2((0.60 + 0.10 * cos(t * 0.9)) * uAspect, 0.32 + 0.12 * sin(t * 1.4));
    vec2 c3 = vec2((0.86 + 0.07 * sin(t * 1.7)) * uAspect, 0.78 + 0.08 * cos(t * 0.8));
    vec3 col = violet * blob(p, c1, 0.45) * 0.55 + pink * blob(p, c2, 0.38) * 0.30 + orange * blob(p, c3, 0.32) * 0.28;

    // the halo that follows the cursor
    vec2 m = vec2(uMouse.x * uAspect, uMouse.y);
    float d = length(p - m);
    col += mix(violet, pink, 0.35) * exp(-d * d / 0.05) * 0.42;

    // ripples of light while the cursor moves
    float ring = pow(sin(d * 40.0 - uTime * 5.0) * 0.5 + 0.5, 6.0) * exp(-d * 4.0) * uEnergy;
    col += vec3(1.0, 0.86, 0.72) * ring * 0.35;

    float a = clamp(max(col.r, max(col.g, col.b)), 0.0, 1.0);
    gl_FragColor = vec4(col / max(a, 0.001), a * mix(0.3, 0.58, uDark));
  }
`;

function AuraField() {
  const { gl, size } = useThree();
  const dark = useThemeColors(['bg']).dark;
  const target = useRef(new THREE.Vector2(0.7, 0.55));
  const last = useRef(new THREE.Vector2(0.7, 0.55));
  const reduce = useMemo(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: auraVertex,
        fragmentShader: auraFragment,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        uniforms: {
          uTime: { value: 0 },
          uMouse: { value: new THREE.Vector2(0.7, 0.55) },
          uAspect: { value: 1 },
          uEnergy: { value: 0 },
          uDark: { value: 1 },
        },
      }),
    [],
  );

  // Track the cursor over the page, relative to this canvas (works while scrolling too).
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const r = gl.domElement.getBoundingClientRect();
      target.current.set((e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [gl]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);
    const u = material.uniforms;
    if (!reduce) u.uTime.value = state.clock.elapsedTime;
    u.uAspect.value = size.width / size.height;
    u.uDark.value = THREE.MathUtils.damp(u.uDark.value, dark ? 1 : 0, 4, dt);
    // the halo follows with a little lag, so it feels smooth rather than stuck to the pointer
    const mouse = u.uMouse.value as THREE.Vector2;
    mouse.lerp(target.current, 1 - Math.exp(-4 * dt));
    const speed = last.current.distanceTo(mouse) / Math.max(dt, 0.001);
    last.current.copy(mouse);
    u.uEnergy.value = reduce ? 0 : THREE.MathUtils.damp(u.uEnergy.value, Math.min(1, speed * 0.9), 3, dt);
  });

  return (
    <mesh frustumCulled={false} renderOrder={-1} material={material}>
      <planeGeometry args={[1, 1]} />
    </mesh>
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
        <AuraField />
        <Strip />
      </Canvas>
    </div>
  );
}
