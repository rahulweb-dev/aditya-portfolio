'use client';

import * as THREE from 'three';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ROOMS, type Room, type SkillKey } from '@/lib/content';
import DoorDetails from '../DoorDetails';
import { useOnScreen, useThemeColors } from './useThemeColors';

// World units: a door is 1 wide and 2 tall, doors sit 1.5 apart, centred on x = 0.
const W = 1;
const H = 2;
const PITCH = 1.5;
const CASE = 0.12;
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

/** Arch outline: a rectangle with a semicircle on top, standing on y = 0. */
function arch<T extends THREE.Path>(path: T, cx: number, w: number, h: number): T {
  path.moveTo(cx - w / 2, 0);
  path.lineTo(cx + w / 2, 0);
  path.lineTo(cx + w / 2, h - w / 2);
  path.absarc(cx, h - w / 2, w / 2, 0, Math.PI, false);
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
  const floorMat = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 0.85 }), []);
  const baseMat = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 0.8 }), []);
  const invalidate = useThree(s => s.invalidate);
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

      <Rig flight={flight} />
    </>
  );
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
    // Fit the row of doors (about 8 units wide) into view at any window size.
    const dist = Math.min(15, Math.max(6.5, 4.1 / (Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * aspect)));
    v.home.set(state.pointer.x * 0.4, 1.55 + state.pointer.y * 0.15, dist);
    v.homeLook.set(state.pointer.x * 0.12, 1.25, 0);

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

/** Vertical grooves for the door leaf, tinted by the door colour. */
function useGrooveTexture() {
  return useMemo(() => {
    const cv = document.createElement('canvas');
    cv.width = 64;
    cv.height = 4;
    const g = cv.getContext('2d')!;
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, 64, 4);
    g.fillStyle = 'rgba(0,0,0,0.3)';
    g.fillRect(0, 0, 5, 4);
    g.fillStyle = 'rgba(255,255,255,0.6)';
    g.fillRect(5, 0, 2, 4);
    const t = new THREE.CanvasTexture(cv);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(12, 1);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
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

function Door({ room, index, hovered, open, busy, colors, setHovered, onSelect }: DoorProps) {
  const x = doorX(index);
  const focused = hovered === index;
  const faded = hovered !== null && !focused && !open;
  const leaf = useRef<THREE.Group>(null);
  const casing = useRef<THREE.Mesh>(null);
  const tunnel = useRef<THREE.Mesh>(null);
  const light = useRef<THREE.SpotLight>(null);
  const fade = useRef(1);
  const grooves = useGrooveTexture();
  const plateTex = usePlateTexture(room.plate);

  const m = useMemo(
    () => ({
      leaf: new THREE.MeshStandardMaterial({ map: grooves, roughness: 0.65, transparent: true }),
      casing: new THREE.MeshStandardMaterial({ roughness: 0.8, transparent: true }),
      patch: new THREE.MeshStandardMaterial({ roughness: 0.95, transparent: true, opacity: 0, depthWrite: false }),
      baseFill: new THREE.MeshStandardMaterial({ roughness: 0.8, transparent: true, opacity: 0, depthWrite: false }),
      gold: new THREE.MeshStandardMaterial({ color: '#f0c45a', metalness: 0.35, roughness: 0.3, emissive: '#6b4a0c', transparent: true }),
      plate: new THREE.MeshStandardMaterial({ map: plateTex, roughness: 0.4, metalness: 0.3, transparent: true }),
      slot: new THREE.MeshBasicMaterial({ color: '#111111', transparent: true }),
      dark: new THREE.MeshBasicMaterial({ color: '#030405', side: THREE.BackSide }),
    }),
    [grooves, plateTex],
  );
  useEffect(() => {
    m.leaf.color.set(room.color);
    m.casing.color.set(colors['scene-casing']);
    m.patch.color.set(colors['scene-wall']);
    m.baseFill.color.set(colors['scene-baseboard']);
  }, [m, room.color, colors]);

  const geo = useMemo(() => {
    const lw = W - 0.02;
    const leafGeo = new THREE.ExtrudeGeometry(arch(new THREE.Shape(), 0, lw, H - 0.01), { depth: 0.05, bevelEnabled: false, curveSegments: 32 });
    leafGeo.translate(lw / 2, 0, -0.05); // hinge on the left edge, front face at z = 0
    const frame = arch(new THREE.Shape(), 0, W + CASE * 2, H + CASE);
    frame.holes.push(arch(new THREE.Path(), 0, W, H));
    const casingGeo = new THREE.ExtrudeGeometry(frame, { depth: 0.07, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 2, curveSegments: 32 });
    const patchGeo = new THREE.ShapeGeometry(arch(new THREE.Shape(), 0, W + CASE * 2 + 0.04, H + CASE + 0.02), 32);
    const tunnelGeo = new THREE.ExtrudeGeometry(arch(new THREE.Shape(), 0, W, H), { depth: 6, bevelEnabled: false, curveSegments: 32 });
    tunnelGeo.translate(0, 0, -6);
    return { leafGeo, casingGeo, patchGeo, tunnelGeo };
  }, []);

  const target = useMemo(() => new THREE.Object3D(), []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1); // after a rest, don't jump
    const lightTarget = (focused ? 2.2 : 1) * (colors.dark ? 9 : 5) * (faded ? 0 : 1);
    const swing = open ? 1.35 : 0;

    // Fade the other doors out (and a wall-coloured patch in) when one door is hovered.
    fade.current = THREE.MathUtils.damp(fade.current, faded ? 0 : 1, 7, dt);
    const f = fade.current;
    m.leaf.opacity = m.casing.opacity = m.gold.opacity = m.plate.opacity = m.slot.opacity = f;
    m.patch.opacity = m.baseFill.opacity = 1 - f;
    // A see-through frame must not hide the patch behind it, or its edges show as dark lines.
    m.casing.depthWrite = m.leaf.depthWrite = f > 0.98;
    if (casing.current) casing.current.visible = f > 0.01;
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

  return (
    <group position={[x, 0, 0]}>
      <primitive object={target} position={[0, 0.9, 0]} />
      <spotLight ref={light} position={[0, 3.6, 1.8]} target={target} angle={0.55} penumbra={0.85} decay={1.2} distance={9} color="#fff3dc" intensity={0} />

      {/* the dark room behind the doorway: an arch-shaped tunnel, so nothing pokes out past the opening */}
      <mesh ref={tunnel} geometry={geo.tunnelGeo} material={m.dark} raycast={() => null} />

      {/* frame, plus the patch that hides the doorway when this door fades out */}
      <mesh ref={casing} geometry={geo.casingGeo} material={m.casing} onPointerOver={over} onPointerOut={out} onClick={click} />
      <mesh geometry={geo.patchGeo} material={m.patch} position={[0, 0, 0.004]} renderOrder={2} raycast={() => null} />
      <mesh material={m.baseFill} position={[0, 0.07, 0.02]} renderOrder={3} raycast={() => null}>
        <boxGeometry args={[W + CASE * 2 + 0.002, 0.14, 0.04]} />
      </mesh>

      {/* the door leaf, hinged on its left edge */}
      <group ref={leaf} position={[-W / 2 + 0.01, 0, -0.004]}>
        <mesh geometry={geo.leafGeo} material={m.leaf} onPointerOver={over} onPointerOut={out} onClick={click} />
        <mesh material={m.plate} position={[W / 2, H * 0.62, 0.002]}>
          <planeGeometry args={[0.5, 0.11]} />
        </mesh>
        {/* rose, lever handle and keyhole */}
        <mesh material={m.gold} position={[W * 0.86, 0.98, 0.012]} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.042, 0.042, 0.024, 24]} />
        </mesh>
        <mesh material={m.gold} position={[W * 0.86 - 0.1, 0.98, 0.04]}>
          <boxGeometry args={[0.22, 0.028, 0.028]} />
        </mesh>
        <mesh material={m.gold} position={[W * 0.86, 0.98, 0.026]} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.014, 0.014, 0.03, 12]} />
        </mesh>
        <mesh material={m.gold} position={[W * 0.86, 0.85, 0.004]}>
          <boxGeometry args={[0.036, 0.078, 0.008]} />
        </mesh>
        <mesh material={m.slot} position={[W * 0.86, 0.852, 0.0085]}>
          <planeGeometry args={[0.01, 0.036]} />
        </mesh>
      </group>
    </group>
  );
}
