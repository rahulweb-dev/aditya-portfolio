'use client';

import * as THREE from 'three';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ROOMS, type Room, type SkillKey } from '@/lib/content';
import DoorDetails from '../DoorDetails';
import { useOnScreen, useThemeColors } from './useThemeColors';

// World units: a door is 1 wide and 2 tall, doors sit 1.6 apart, centred on x = 0.
const W = 1;
const H = 2;
const PITCH = 1.6;
const CASE = 0.15;
const LAMP_Y = H + CASE + 0.27; // wall lamp above each door
const N = ROOMS.length;
const doorX = (i: number) => (i - (N - 1) / 2) * PITCH;
const indexOf = (key: SkillKey) => ROOMS.findIndex(r => r.key === key);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

export type Flight = { key: SkillKey; dir: 'in' | 'out' } | null;

type Props = {
  hovered: number | null;
  setHovered: (i: number | null) => void;
  openKey: SkillKey | null;
  flight: Flight;
  onSelect: (key: SkillKey) => void;
  onReady: () => void;
};

/** Soft round gradient in one colour (r,g,b): used for light pools, halos, shadows and dust. */
const radialCache = new Map<string, THREE.Texture>();
function radial(rgb: string) {
  const hit = radialCache.get(rgb);
  if (hit) return hit;
  const cv = document.createElement('canvas');
  cv.width = cv.height = 128;
  const g = cv.getContext('2d')!;
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, `rgba(${rgb},1)`);
  grad.addColorStop(0.35, `rgba(${rgb},0.55)`);
  grad.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  radialCache.set(rgb, t);
  return t;
}

/** Rounded rectangle centred on (0, 0). */
function roundedRect(w: number, h: number, r: number) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2 + r, -h / 2);
  s.lineTo(w / 2 - r, -h / 2);
  s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  s.lineTo(w / 2, h / 2 - r);
  s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  s.lineTo(-w / 2 + r, h / 2);
  s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  s.lineTo(-w / 2, -h / 2 + r);
  s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  return s;
}

/**
 * Gothic (equilateral pointed) arch standing on y = 0, total height h:
 * straight sides, then two arcs whose radius equals the width, meeting in a point.
 */
function arch<T extends THREE.Path>(path: T, cx: number, w: number, h: number): T {
  const spring = h - w * Math.sin(Math.PI / 3); // where the curve starts
  path.moveTo(cx - w / 2, 0);
  path.lineTo(cx + w / 2, 0);
  path.lineTo(cx + w / 2, spring);
  path.absarc(cx - w / 2, spring, w, 0, Math.PI / 3, false); // right side, up to the point
  path.absarc(cx + w / 2, spring, w, (2 * Math.PI) / 3, Math.PI, false); // left side, back down
  path.lineTo(cx - w / 2, 0);
  return path;
}

export default function DoorRoom(props: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const pills = useRef<(HTMLDivElement | null)[]>([]);
  const details = useRef<(HTMLDivElement | null)[]>([]);
  const onScreen = useOnScreen(wrap);

  // The room only animates for a couple of seconds after something happens
  // (mouse move, hover, click, theme change), then rests until the next one.
  const [awake, setAwake] = useState(true);
  const sleepTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const wake = useCallback(() => {
    setAwake(true);
    clearTimeout(sleepTimer.current);
    sleepTimer.current = setTimeout(() => setAwake(false), 2000);
  }, []);
  useEffect(wake, [wake, props.hovered, props.openKey, props.flight, onScreen]);
  useEffect(() => {
    const mo = new MutationObserver(wake);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => {
      mo.disconnect();
      clearTimeout(sleepTimer.current);
    };
  }, [wake]);

  const frameloop = props.flight ? 'always' : !onScreen ? 'never' : awake ? 'always' : 'demand';

  return (
    <div ref={wrap} className="absolute inset-0" onPointerMove={wake}>
      <Canvas
        flat
        dpr={[1, 1.5]}
        frameloop={frameloop}
        camera={{ fov: 35, position: [0, 1.5, 9], near: 0.05, far: 80 }}
        onCreated={() => props.onReady()}
        onPointerMissed={() => props.setHovered(null)}
      >
        <Scene {...props} />
        <LabelTracker pills={pills} details={details} />
      </Canvas>

      {/* Labels are plain page elements that follow their door on screen */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {ROOMS.map((room, i) => {
          const showing = props.hovered === i && !props.openKey && !props.flight;
          return (
            <div key={room.key}>
              <div ref={el => { pills.current[i] = el; }} className="absolute top-0 left-0 will-change-transform">
                <span
                  className={`block -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-medium whitespace-nowrap text-[#15171a] shadow-md transition-opacity duration-300 ${
                    showing ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  Click to enter
                </span>
              </div>
              <div ref={el => { details.current[i] = el; }} className="absolute top-0 left-0 will-change-transform">
                <DoorDetails
                  room={room}
                  visible={showing}
                  className="w-[min(340px,24vw)]"
                  style={{ transform: isLeftHalf(i) ? 'translate(0, -50%)' : 'translate(-100%, -50%)' }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const isLeftHalf = (i: number) => i <= Math.floor((N - 1) / 2);

/** Each frame, moves every label to its door's position on screen. */
function LabelTracker({ pills, details }: { pills: React.RefObject<(HTMLDivElement | null)[]>; details: React.RefObject<(HTMLDivElement | null)[]> }) {
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera, size }) => {
    const place = (el: HTMLDivElement | null | undefined, x: number, y: number) => {
      if (!el) return;
      v.set(x, y, 0).project(camera);
      el.style.transform = `translate3d(${((v.x + 1) / 2) * size.width}px, ${((1 - v.y) / 2) * size.height}px, 0)`;
    };
    ROOMS.forEach((_, i) => {
      const x = doorX(i);
      place(pills.current[i], x, 1.1);
      place(details.current[i], isLeftHalf(i) ? x + W / 2 + CASE + 0.3 : x - (W / 2 + CASE + 0.3), 1.15);
    });
  });
  return null;
}

function Scene({ hovered, setHovered, openKey, flight, onSelect }: Props) {
  const c = useThemeColors(['scene-wall', 'scene-casing', 'scene-baseboard', 'scene-floor']);

  const wallMat = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 0.95 }), []);
  // A slightly polished floor, so the door lights catch on it.
  const floorMat = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 0.5, metalness: 0.2 }), []);
  const baseMat = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 0.8 }), []);
  const invalidate = useThree(s => s.invalidate);
  const gl = useThree(s => s.gl);
  const scene = useThree(s => s.scene);

  // Soft studio reflections (generated here, nothing to download) so lacquer, iron and brass read as real.
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    invalidate();
    return () => {
      scene.environment = null;
      env.dispose();
      pmrem.dispose();
    };
  }, [gl, scene, invalidate]);
  useEffect(() => {
    scene.environmentIntensity = c.dark ? 0.28 : 0.5;
  }, [scene, c.dark]);

  useEffect(() => {
    wallMat.color.set(c['scene-wall']);
    floorMat.color.set(c['scene-floor']);
    baseMat.color.set(c['scene-baseboard']);
    invalidate();
  }, [c, wallMat, floorMat, baseMat, invalidate]);

  // The wall is one big plane with an arched hole cut for each door.
  const wallGeo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-16, 0).lineTo(16, 0).lineTo(16, 10).lineTo(-16, 10).lineTo(-16, 0);
    ROOMS.forEach((_, i) => s.holes.push(arch(new THREE.Path(), doorX(i), W, H)));
    return new THREE.ShapeGeometry(s, 32);
  }, []);

  // Baseboard runs along the wall, stopping at each door frame.
  const baseboards = useMemo(() => {
    const edges = [-16, ...ROOMS.flatMap((_, i) => [doorX(i) - W / 2 - CASE, doorX(i) + W / 2 + CASE]), 16];
    const out: { x: number; w: number }[] = [];
    for (let k = 0; k < edges.length; k += 2) out.push({ x: (edges[k] + edges[k + 1]) / 2, w: edges[k + 1] - edges[k] });
    return out;
  }, []);

  return (
    <>
      <color attach="background" args={[c['scene-wall']]} />
      <hemisphereLight args={['#ffffff', c['scene-floor'], c.dark ? 0.55 : 1.1]} />
      <directionalLight position={[2, 6, 6]} intensity={c.dark ? 0.35 : 0.7} />

      {/* moving onto bare wall or floor brings every door back */}
      <mesh geometry={wallGeo} material={wallMat} onPointerOver={() => setHovered(null)} />
      <mesh material={floorMat} rotation-x={-Math.PI / 2} position={[0, 0, 6]} onPointerOver={() => setHovered(null)}>
        <planeGeometry args={[40, 12]} />
      </mesh>
      {baseboards.map(b => (
        <mesh key={b.x} material={baseMat} position={[b.x, 0.07, 0.02]}>
          <boxGeometry args={[b.w, 0.14, 0.04]} />
        </mesh>
      ))}

      {ROOMS.map((room, i) => (
        <Door
          key={room.key}
          room={room}
          index={i}
          hovered={hovered}
          open={openKey === room.key}
          busy={!!flight || !!openKey}
          colors={c}
          setHovered={setHovered}
          onSelect={onSelect}
        />
      ))}

      <Dust dark={c.dark} />
      <Rig flight={flight} />
    </>
  );
}

/** Dust drifting slowly through the light, like a film set. */
function Dust({ dark }: { dark: boolean }) {
  const COUNT = 220;
  const points = useRef<THREE.Points>(null);
  const { geometry, seeds } = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    const seeds = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 1] = Math.random() * 3.2;
      pos[i * 3 + 2] = 0.15 + Math.random() * 2.4;
      seeds[i] = Math.random() * Math.PI * 2;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return { geometry, seeds };
  }, []);
  const material = useMemo(
    () => new THREE.PointsMaterial({ size: 0.022, map: radial('255,255,255'), transparent: true, depthWrite: false, sizeAttenuation: true }),
    [],
  );
  useEffect(() => {
    material.color.set(dark ? '#ffe2b0' : '#9c8460');
    material.opacity = dark ? 0.6 : 0.35;
    material.blending = dark ? THREE.AdditiveBlending : THREE.NormalBlending;
    material.needsUpdate = true;
  }, [dark, material]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);
    const t = state.clock.elapsedTime;
    const pos = geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < COUNT; i++) {
      let y = pos.getY(i) + dt * (0.03 + (seeds[i] % 1) * 0.03);
      if (y > 3.3) y = 0.05;
      pos.setY(i, y);
      pos.setX(i, pos.getX(i) + Math.sin(t * 0.3 + seeds[i]) * dt * 0.02);
    }
    pos.needsUpdate = true;
  });
  return <points ref={points} geometry={geometry} material={material} raycast={() => null} />;
}

/** Camera: drifts with the mouse, and flies through a doorway when one is entered. */
function Rig({ flight }: { flight: Flight }) {
  const look = useRef(new THREE.Vector3(0, 1.2, 0));
  const started = useRef<{ flight: Flight; t0: number } | null>(null);
  const v = useMemo(
    () => ({ home: new THREE.Vector3(), homeLook: new THREE.Vector3(), front: new THREE.Vector3(), inside: new THREE.Vector3(), insideLook: new THREE.Vector3(), tmp: new THREE.Vector3() }),
    [],
  );

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1); // after an idle pause, don't jump
    const cam = state.camera as THREE.PerspectiveCamera;
    const aspect = state.size.width / state.size.height;
    // Fit the row of doors (plus some wall either side) into view at any window size.
    const halfWidth = ((N - 1) / 2) * PITCH + W / 2 + CASE + 0.5;
    const dist = Math.min(15, Math.max(6.5, halfWidth / (Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * aspect)));
    v.home.set(state.pointer.x * 0.4, 1.7 + state.pointer.y * 0.15, dist);
    v.homeLook.set(state.pointer.x * 0.12, 1.4, 0);

    if (flight) {
      if (started.current?.flight !== flight) started.current = { flight, t0: state.clock.elapsedTime };
      const t = state.clock.elapsedTime - started.current.t0;
      const x = doorX(indexOf(flight.key));
      v.front.set(x, 1.0, 2.2);
      v.inside.set(x, 0.95, -1.8);
      v.insideLook.set(x, 0.95, -5);
      const curve = new THREE.QuadraticBezierCurve3(v.home, v.front, v.inside);
      // In: wait for the door to swing, then walk through. Out: walk back out to the row.
      const k = flight.dir === 'in' ? easeInOut(clamp01((t - 0.45) / 1.05)) : 1 - easeOut(clamp01(t / 1.25));
      curve.getPoint(k, cam.position);
      look.current.lerpVectors(v.homeLook, v.insideLook, k);
    } else {
      started.current = null;
      const s = 1 - Math.exp(-3 * dt);
      cam.position.lerp(v.home, s);
      look.current.lerp(v.homeLook, s);
    }
    cam.lookAt(look.current);
  });
  return null;
}

/** Painted wooden planks with grain and knots: white, so the door colour tints it. Also used for depth. */
function useWoodTextures() {
  return useMemo(() => {
    const cv = document.createElement('canvas');
    cv.width = 512;
    cv.height = 1024;
    const g = cv.getContext('2d')!;
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, 512, 1024);
    const planks = 7;
    const pw = 512 / planks;
    let seed = 7;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let p = 0; p < planks; p++) {
      const x0 = p * pw;
      g.fillStyle = `rgba(0,0,0,${0.02 + rand() * 0.06})`; // each plank a slightly different shade
      g.fillRect(x0, 0, pw, 1024);
      for (let k = 0; k < 34; k++) {
        // grain: long, gently wavy lines
        const gx = x0 + rand() * pw;
        g.strokeStyle = `rgba(0,0,0,${0.03 + rand() * 0.09})`;
        g.lineWidth = 0.6 + rand() * 1.4;
        g.beginPath();
        for (let y = 0; y <= 1024; y += 32) g.lineTo(gx + Math.sin(y * 0.012 + k) * (1.5 + rand() * 2.5), y);
        g.stroke();
      }
      if (rand() > 0.45) {
        // a knot
        const ky = 120 + rand() * 780;
        g.fillStyle = 'rgba(0,0,0,0.16)';
        g.beginPath();
        g.ellipse(x0 + pw * (0.3 + rand() * 0.4), ky, 6, 14, 0, 0, Math.PI * 2);
        g.fill();
      }
      g.fillStyle = 'rgba(0,0,0,0.6)'; // the gap between planks
      g.fillRect(x0, 0, 3, 1024);
      g.fillStyle = 'rgba(255,255,255,0.45)';
      g.fillRect(x0 + 3, 0, 1.5, 1024);
    }
    const make = (srgb: boolean) => {
      const t = new THREE.CanvasTexture(cv);
      if (srgb) t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
      // leaf UVs run from -width/2..width/2 and 0..height: map that onto the whole texture
      t.repeat.set(1 / (W - 0.02), 1 / (H - 0.01));
      t.offset.set(0.5, 0);
      return t;
    };
    return { map: make(true), bump: make(false) };
  }, []);
}

/** Leaded stained glass in diamond panes, in tints of the door's own colour plus amber. */
function useStainedGlass(color: string) {
  return useMemo(() => {
    const cv = document.createElement('canvas');
    cv.width = 256;
    cv.height = 384;
    const g = cv.getContext('2d')!;
    const base = new THREE.Color(color);
    const tint = (l: number) => `#${base.clone().offsetHSL(0, 0.05, l).getHexString()}`;
    const grad = g.createLinearGradient(0, 0, 0, 384);
    grad.addColorStop(0, tint(0.32));
    grad.addColorStop(0.55, tint(0.12));
    grad.addColorStop(1, '#ffb347');
    g.fillStyle = grad;
    g.fillRect(0, 0, 256, 384);
    // diamond panes, each a little different
    const step = 48;
    let seed = color.length * 97;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let y = -step; y < 384 + step; y += step / 2) {
      for (let x = -step; x < 256 + step; x += step) {
        const cx = x + ((y / (step / 2)) % 2 ? step / 2 : 0);
        g.fillStyle = rand() > 0.75 ? 'rgba(255,190,90,0.35)' : rand() > 0.5 ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.18)';
        g.beginPath();
        g.moveTo(cx, y - step / 2);
        g.lineTo(cx + step / 2, y);
        g.lineTo(cx, y + step / 2);
        g.lineTo(cx - step / 2, y);
        g.closePath();
        g.fill();
      }
    }
    // the lead between the panes
    g.strokeStyle = '#141216';
    g.lineWidth = 5;
    for (let d = -384; d < 640; d += step) {
      g.beginPath(); g.moveTo(d, 0); g.lineTo(d + 384 * 0.5 * 2, 384); g.stroke();
      g.beginPath(); g.moveTo(d + 384, 0); g.lineTo(d + 384 - 384, 384); g.stroke();
    }
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [color]);
}

/** Gives a flat shape's UVs a 0..1 range across its own bounding box. */
function normaliseUVs(geo: THREE.BufferGeometry) {
  geo.computeBoundingBox();
  const b = geo.boundingBox!;
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) - b.min.x) / (b.max.x - b.min.x), (pos.getY(i) - b.min.y) / (b.max.y - b.min.y));
  uv.needsUpdate = true;
  return geo;
}

/** Gold name plate with engraved text. */
function usePlateTexture(text: string) {
  return useMemo(() => {
    const cv = document.createElement('canvas');
    cv.width = 512;
    cv.height = 112;
    const g = cv.getContext('2d')!;
    const grad = g.createLinearGradient(0, 0, 512, 112);
    grad.addColorStop(0, '#f8dd85');
    grad.addColorStop(0.55, '#c99a2e');
    grad.addColorStop(1, '#f3d27a');
    g.fillStyle = grad;
    g.fillRect(0, 0, 512, 112);
    g.strokeStyle = 'rgba(110,75,10,0.6)';
    g.lineWidth = 6;
    g.strokeRect(3, 3, 506, 106);
    let size = 44;
    g.font = `600 ${size}px ui-monospace, Consolas, monospace`;
    const label = text.toUpperCase();
    while (g.measureText(label).width > 450 && size > 20) {
      size -= 2;
      g.font = `600 ${size}px ui-monospace, Consolas, monospace`;
    }
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = 'rgba(255,240,190,0.7)';
    g.fillText(label, 256, 58);
    g.fillStyle = '#3b2a07';
    g.fillText(label, 256, 56);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }, [text]);
}

type DoorProps = {
  room: Room;
  index: number;
  hovered: number | null;
  open: boolean;
  busy: boolean;
  colors: SceneColors;
  setHovered: (i: number | null) => void;
  onSelect: (key: SkillKey) => void;
};

type SceneColors = Record<'scene-wall' | 'scene-casing' | 'scene-baseboard' | 'scene-floor', string> & { dark: boolean };

// Leaf-local layout (the leaf runs from x = 0 at the hinge to LW, y = 0 to H)
const LW = W - 0.02;
const WIN = { w: 0.34, h: 0.5, y: 1.4 }; // stained glass window
const STRAPS = [0.32, 1.06]; // iron strap hinges
const RING = { x: 0.84, y: 0.97 }; // iron ring pull

function Door({ room, index, hovered, open, busy, colors, setHovered, onSelect }: DoorProps) {
  const x = doorX(index);
  const focused = hovered === index;
  const faded = hovered !== null && !focused && !open;
  const leaf = useRef<THREE.Group>(null);
  const frame = useRef<THREE.Group>(null);
  const tunnel = useRef<THREE.Mesh>(null);
  const light = useRef<THREE.SpotLight>(null);
  const fade = useRef(1);
  const glow = useRef(0.4);
  const wood = useWoodTextures();
  const glassTex = useStainedGlass(room.color);
  const plateTex = usePlateTexture(room.plate);

  const m = useMemo(
    () => ({
      // lacquered painted wood: grain in the paint, a glossy clear coat on top
      leaf: new THREE.MeshPhysicalMaterial({ map: wood.map, bumpMap: wood.bump, bumpScale: 1.2, roughness: 0.55, clearcoat: 0.6, clearcoatRoughness: 0.28, transparent: true }),
      stone: new THREE.MeshStandardMaterial({ roughness: 0.92, transparent: true }),
      iron: new THREE.MeshStandardMaterial({ color: '#19181d', metalness: 0.8, roughness: 0.4, transparent: true }),
      glass: new THREE.MeshBasicMaterial({ map: glassTex, transparent: true, toneMapped: false }),
      patch: new THREE.MeshStandardMaterial({ roughness: 0.95, transparent: true, opacity: 0, depthWrite: false }),
      baseFill: new THREE.MeshStandardMaterial({ roughness: 0.8, transparent: true, opacity: 0, depthWrite: false }),
      gold: new THREE.MeshStandardMaterial({ color: '#f0c45a', metalness: 0.6, roughness: 0.3, emissive: '#4a3208', transparent: true }),
      plate: new THREE.MeshStandardMaterial({ map: plateTex, roughness: 0.35, metalness: 0.4, transparent: true }),
      dark: new THREE.MeshBasicMaterial({ color: '#030405', side: THREE.BackSide }),
      lampShade: new THREE.MeshStandardMaterial({ color: '#2b2219', metalness: 0.7, roughness: 0.35, side: THREE.DoubleSide, transparent: true }),
      bulb: new THREE.MeshBasicMaterial({ color: '#ffe4b0', transparent: true, toneMapped: false }),
      // soft light and shadow, painted with gradient textures
      halo: new THREE.MeshBasicMaterial({ map: radial('255,214,150'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }),
      spill: new THREE.MeshBasicMaterial({ map: radial('255,196,120'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }),
      seam: new THREE.MeshBasicMaterial({ color: '#ffcf8a', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }),
      shadow: new THREE.MeshBasicMaterial({ map: radial('0,0,0'), transparent: true, depthWrite: false }),
    }),
    [wood, glassTex, plateTex],
  );
  useEffect(() => {
    m.leaf.color.set(room.color);
    m.stone.color.set(colors['scene-casing']);
    m.patch.color.set(colors['scene-wall']);
    m.baseFill.color.set(colors['scene-baseboard']);
  }, [m, room.color, colors]);

  const geo = useMemo(() => {
    const leafGeo = new THREE.ExtrudeGeometry(arch(new THREE.Shape(), 0, LW, H - 0.01), { depth: 0.05, bevelEnabled: false, curveSegments: 40 });
    leafGeo.translate(LW / 2, 0, -0.05); // hinge on the left edge, front face at z = 0

    // stone surround: a wide outer band and a deeper inner moulding, stepped like a cathedral door
    const outer = arch(new THREE.Shape(), 0, W + CASE * 2, H + CASE);
    outer.holes.push(arch(new THREE.Path(), 0, W, H));
    const outerGeo = new THREE.ExtrudeGeometry(outer, { depth: 0.08, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 3, curveSegments: 40 });
    const inner = arch(new THREE.Shape(), 0, W + 0.07, H + 0.04);
    inner.holes.push(arch(new THREE.Path(), 0, W, H));
    const innerGeo = new THREE.ExtrudeGeometry(inner, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.008, bevelSegments: 2, curveSegments: 40 });

    const patchGeo = new THREE.ShapeGeometry(arch(new THREE.Shape(), 0, W + CASE * 2 + 0.04, H + CASE + 0.1), 40);
    const tunnelGeo = new THREE.ExtrudeGeometry(arch(new THREE.Shape(), 0, W, H), { depth: 6, bevelEnabled: false, curveSegments: 40 });
    tunnelGeo.translate(0, 0, -6);

    // one raised panel low on the door
    const lowerPanelGeo = new THREE.ExtrudeGeometry(roundedRect(0.62, 0.5, 0.03), { depth: 0.012, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.012, bevelSegments: 3 });
    lowerPanelGeo.translate(LW / 2, 0.5, 0);

    // pointed stained glass window and its iron frame
    const glassGeo = normaliseUVs(new THREE.ShapeGeometry(arch(new THREE.Shape(), 0, WIN.w, WIN.h), 32));
    glassGeo.translate(LW / 2, WIN.y, 0.004);
    const winFrame = arch(new THREE.Shape(), 0, WIN.w + 0.05, WIN.h + 0.035);
    winFrame.holes.push(arch(new THREE.Path(), 0, WIN.w, WIN.h));
    const winFrameGeo = new THREE.ExtrudeGeometry(winFrame, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 2, curveSegments: 32 });
    winFrameGeo.translate(LW / 2, WIN.y - 0.018, 0);

    return { leafGeo, outerGeo, innerGeo, patchGeo, tunnelGeo, lowerPanelGeo, glassGeo, winFrameGeo };
  }, []);

  const target = useMemo(() => new THREE.Object3D(), []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1); // after a rest, don't jump
    const lightTarget = (focused ? 2.2 : 1) * (colors.dark ? 9 : 5) * (faded ? 0 : 1);
    const swing = open ? 1.35 : 0;

    // Fade the other doors out (and a wall-coloured patch in) when one door is hovered.
    fade.current = THREE.MathUtils.damp(fade.current, faded ? 0 : 1, 7, dt);
    const f = fade.current;
    m.leaf.opacity = m.stone.opacity = m.iron.opacity = m.gold.opacity = m.plate.opacity = m.glass.opacity = f;
    m.lampShade.opacity = m.bulb.opacity = f;
    m.patch.opacity = m.baseFill.opacity = 1 - f;
    // Warm light under the door, through the glass and around the lamp: brighter on hover, brightest when opened.
    glow.current = THREE.MathUtils.damp(glow.current, faded ? 0 : open ? 1 : focused ? 0.9 : 0.35, 5, dt);
    const lit = glow.current * (colors.dark ? 1 : 0.55);
    m.spill.opacity = lit * 0.9;
    m.seam.opacity = Math.min(1, lit * 1.4);
    m.halo.opacity = (0.25 + glow.current * 0.45) * f * (colors.dark ? 1 : 0.5);
    m.shadow.opacity = 0.5 * f;
    m.glass.color.setScalar(0.55 + glow.current * 0.75);
    // A see-through frame must not hide the patch behind it, or its edges show as dark lines.
    m.stone.depthWrite = m.leaf.depthWrite = m.iron.depthWrite = m.gold.depthWrite = m.plate.depthWrite = m.glass.depthWrite = f > 0.98;
    if (frame.current) frame.current.visible = f > 0.01;
    if (tunnel.current) tunnel.current.visible = f > 0.02;
    if (leaf.current) {
      leaf.current.visible = f > 0.01;
      // Positive rotation swings the door inward, away from the viewer.
      leaf.current.rotation.y = THREE.MathUtils.damp(leaf.current.rotation.y, swing, open ? 2.6 : 5, dt);
    }
    if (light.current) {
      light.current.intensity = THREE.MathUtils.damp(light.current.intensity, lightTarget, 6, dt);
    }
  });

  const over = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (busy) return;
    setHovered(index);
    document.body.style.cursor = 'pointer';
  };
  const out = () => {
    document.body.style.cursor = '';
  };
  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!busy) onSelect(room.key);
  };
  const hit = { onPointerOver: over, onPointerOut: out, onClick: click };

  return (
    <group position={[x, 0, 0]}>
      <primitive object={target} position={[0, 0.9, 0]} />
      <spotLight ref={light} position={[0, 3.6, 1.8]} target={target} angle={0.55} penumbra={0.85} decay={1.2} distance={9} color="#fff3dc" intensity={0} />

      {/* the dark room behind the doorway: an arch-shaped tunnel, so nothing pokes out past the opening */}
      <mesh ref={tunnel} geometry={geo.tunnelGeo} material={m.dark} raycast={() => null} />

      {/* stone surround with a small carved diamond finial at the point */}
      <group ref={frame}>
        <mesh geometry={geo.outerGeo} material={m.stone} {...hit} />
        <mesh geometry={geo.innerGeo} material={m.stone} {...hit} />
        <mesh material={m.stone} position={[0, H + CASE + 0.03, 0.05]} rotation-z={Math.PI / 4} {...hit}>
          <boxGeometry args={[0.075, 0.075, 0.09]} />
        </mesh>
      </group>
      {/* the patch that hides the doorway when this door fades out */}
      <mesh geometry={geo.patchGeo} material={m.patch} position={[0, 0, 0.004]} renderOrder={2} raycast={() => null} />
      <mesh material={m.baseFill} position={[0, 0.07, 0.02]} renderOrder={3} raycast={() => null}>
        <boxGeometry args={[W + CASE * 2 + 0.002, 0.14, 0.04]} />
      </mesh>

      {/* on the floor: a soft shadow, warm light spilling from under the door, and the bright seam */}
      <mesh material={m.shadow} rotation-x={-Math.PI / 2} position={[0, 0.002, 0.22]} renderOrder={4} raycast={() => null}>
        <planeGeometry args={[1.9, 0.7]} />
      </mesh>
      <mesh material={m.spill} rotation-x={-Math.PI / 2} position={[0, 0.004, 0.5]} renderOrder={5} raycast={() => null}>
        <planeGeometry args={[1.5, 1.1]} />
      </mesh>
      <mesh material={m.seam} position={[0, 0.006, 0.006]} renderOrder={5} raycast={() => null}>
        <planeGeometry args={[W - 0.06, 0.012]} />
      </mesh>

      {/* brass wall lamp above the door, with its halo on the wall */}
      <mesh material={m.halo} position={[0, LAMP_Y - 0.05, 0.012]} renderOrder={5} raycast={() => null}>
        <planeGeometry args={[1.5, 1.2]} />
      </mesh>
      <mesh material={m.gold} position={[0, LAMP_Y + 0.06, 0.012]}>
        <boxGeometry args={[0.1, 0.05, 0.02]} />
      </mesh>
      <mesh material={m.gold} position={[0, LAMP_Y + 0.06, 0.06]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.008, 0.008, 0.1, 8]} />
      </mesh>
      <mesh material={m.lampShade} position={[0, LAMP_Y + 0.02, 0.11]}>
        <cylinderGeometry args={[0.035, 0.1, 0.09, 28, 1, true]} />
      </mesh>
      <mesh material={m.bulb} position={[0, LAMP_Y - 0.01, 0.11]}>
        <sphereGeometry args={[0.03, 16, 12]} />
      </mesh>

      {/* the door leaf, hinged on its left edge */}
      <group ref={leaf} position={[-W / 2 + 0.01, 0, -0.004]}>
        <mesh geometry={geo.leafGeo} material={m.leaf} {...hit} />
        <mesh geometry={geo.lowerPanelGeo} material={m.leaf} {...hit} />

        {/* stained glass, lit from the room behind */}
        <mesh geometry={geo.glassGeo} material={m.glass} {...hit} />
        <mesh geometry={geo.winFrameGeo} material={m.iron} {...hit} />

        {/* brass name plate */}
        <mesh material={m.plate} position={[LW / 2, H * 0.62, 0.02]}>
          <planeGeometry args={[0.5, 0.11]} />
        </mesh>

        {/* black iron strap hinges with rivets */}
        {STRAPS.map(y => (
          <group key={y}>
            <mesh material={m.iron} position={[0.36, y, 0.012]}>
              <boxGeometry args={[0.72, 0.05, 0.012]} />
            </mesh>
            <mesh material={m.iron} position={[0.72, y, 0.012]} rotation-x={Math.PI / 2}>
              <cylinderGeometry args={[0.045, 0.045, 0.012, 24]} />
            </mesh>
            {[0.08, 0.26, 0.44, 0.62].map(rx => (
              <mesh key={rx} material={m.iron} position={[rx, y, 0.02]}>
                <sphereGeometry args={[0.011, 10, 8]} />
              </mesh>
            ))}
          </group>
        ))}

        {/* iron ring pull on a round boss, with a keyhole plate below */}
        <mesh material={m.iron} position={[RING.x, RING.y + 0.07, 0.012]} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.035, 0.035, 0.02, 24]} />
        </mesh>
        <mesh material={m.iron} position={[RING.x, RING.y, 0.026]}>
          <torusGeometry args={[0.065, 0.009, 10, 40]} />
        </mesh>
        <mesh material={m.iron} position={[RING.x, RING.y - 0.17, 0.006]}>
          <boxGeometry args={[0.045, 0.09, 0.008]} />
        </mesh>
        <mesh material={m.gold} position={[RING.x, RING.y - 0.165, 0.011]}>
          <boxGeometry args={[0.01, 0.03, 0.002]} />
        </mesh>
      </group>
    </group>
  );
}
