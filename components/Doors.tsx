'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { isSkill, type Room, type SkillKey } from '@/lib/content';
import { useContent } from './ContentProvider';
import DoorDetails from './DoorDetails';
import GlowDoors, { DOOR_GLOW, type DoorSpot } from './GlowDoors';
import { Eyebrow } from './ui';
import Wormhole from './Wormhole';

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isDesktop = () => window.matchMedia('(min-width: 768px)').matches;

// In order, left to right; each on its own dune: mid, far, near, mid
const PLACES: { key: SkillKey; frac: number; layer: number }[] = [
  { key: 'photo', frac: 0.17, layer: 1 },
  { key: 'design', frac: 0.39, layer: 0 },
  { key: 'video', frac: 0.61, layer: 2 },
  { key: 'ai', frac: 0.83, layer: 1 },
];

/** Where each door stands (desktop), and one door per small scene (phones). Built once per set of words. */
function useSpots(rooms: Room[]) {
  return useMemo(() => {
    const room = (key: SkillKey) => rooms.find(r => r.key === key)!;
    const desktop: DoorSpot[] = PLACES.map(p => ({ room: room(p.key), frac: p.frac, layer: p.layer }));
    const phone = Object.fromEntries(rooms.map(r => [r.key, [{ room: r, frac: 0.5, layer: 1 }]])) as Record<SkillKey, DoorSpot[]>;
    return { desktop, phone };
  }, [rooms]);
}

const ZOOM = 9;

/**
 * Steps into a doorway: scales `scene` around the door's centre and slides that centre to the middle
 * of the screen, so you always walk straight in. Measure before zooming (on = true), not during.
 */
function zoomInto(scene: HTMLElement, target: Element, on: boolean, seconds: number) {
  if (on) {
    const s = scene.getBoundingClientRect();
    const t = target.getBoundingClientRect();
    const ox = t.left + t.width / 2 - s.left;
    const oy = t.top + t.height / 2 - s.top;
    scene.style.transformOrigin = `${ox}px ${oy}px`;
    scene.dataset.shift = `${innerWidth / 2 - s.left - ox}px, ${innerHeight / 2 - s.top - oy}px`;
  }
  scene.style.transition = seconds ? `transform ${seconds}s cubic-bezier(0.7, 0, 0.2, 1)` : 'none';
  scene.style.transform = on ? `translate(${scene.dataset.shift}) scale(${ZOOM})` : 'none';
}

function fadeBlack(el: HTMLElement | null, on: boolean, duration = '0.6s', delay = '0s') {
  if (!el) return;
  el.style.transition = duration === '0s' ? 'none' : `opacity ${duration} ease ${delay}`;
  el.style.opacity = on ? '1' : '0';
}

export default function Doors() {
  const ROOMS = useContent().rooms;
  const { desktop: DESKTOP_SPOTS, phone: PHONE_SPOTS } = useSpots(ROOMS);
  const router = useRouter();
  const sectionRef = useRef<HTMLElement>(null);
  const deskRef = useRef<HTMLDivElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);
  const blackRef = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  const [hovered, setHovered] = useState<SkillKey | null>(null);
  const [openKey, setOpenKey] = useState<SkillKey | null>(null);
  const [tunnel, setTunnel] = useState<SkillKey | null>(null);

  useEffect(() => {
    ROOMS.forEach(r => router.prefetch(`/work/${r.key}`));
  }, [router]);

  // Coming back from a room: start inside that doorway's light and pull back out into the dunes.
  useEffect(() => {
    let key: string | null = null;
    try {
      key = sessionStorage.getItem('returnDoor');
      sessionStorage.removeItem('returnDoor');
    } catch {}
    if (!key || !isSkill(key) || !sectionRef.current) return;
    const skill = key;

    const top = sectionRef.current.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top, behavior: 'instant' });
    busy.current = true;
    fadeBlack(blackRef.current, true, '0s');

    const scene = isDesktop() ? deskRef.current : null;
    const door = scene?.querySelector(`[data-door="${skill}"] [data-core]`);
    if (!scene || !door || reducedMotion()) {
      requestAnimationFrame(() => fadeBlack(blackRef.current, false, '0.6s'));
      busy.current = false;
      return;
    }
    // wait two frames so the doors are in place, then fly out
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        setOpenKey(skill);
        zoomInto(scene, door, true, 0);
        scene.getBoundingClientRect(); // apply the zoom before easing out of it
        requestAnimationFrame(() => {
          zoomInto(scene, door, false, 1.3);
          fadeBlack(blackRef.current, false, '0.7s');
        });
        setTimeout(() => setOpenKey(null), 500);
        setTimeout(() => {
          scene.style.transition = '';
          busy.current = false;
        }, 1400);
      }),
    );
  }, []);

  const enter = useCallback(
    (key: SkillKey, scene: HTMLElement | null, door: Element | null | undefined) => {
      if (busy.current) return;
      busy.current = true;
      setOpenKey(key);
      if (reducedMotion() || !scene || !door) return router.push(`/work/${key}`);
      // the doorway lifts and whites out, we rush into its light, and fall through the wormhole
      setTimeout(() => zoomInto(scene, door, true, 0.9), 150);
      setTimeout(() => setTunnel(key), 420);
      fadeBlack(blackRef.current, true, '0.4s', '1.75s');
      setTimeout(() => router.push(`/work/${key}`), 2200);
    },
    [router],
  );

  const enterDesktop = (key: SkillKey) => enter(key, deskRef.current, deskRef.current?.querySelector(`[data-door="${key}"] [data-core]`));

  return (
    <section id="work" ref={sectionRef} className="relative overflow-hidden bg-bg">
      {/* Desktop: four doors of light in the dunes. Hover one to light it up and read what's behind it. */}
      <div className="relative hidden h-screen min-h-[680px] md:block">
        <div ref={deskRef} className="absolute inset-0 will-change-transform">
          <GlowDoors
            spots={DESKTOP_SPOTS}
            hovered={hovered}
            openKey={openKey}
            onHover={k => !busy.current && setHovered(k)}
            onEnter={enterDesktop}
            className="absolute inset-0 size-full"
          />
          <div className="pointer-events-none absolute inset-x-0 top-[clamp(80px,11vh,120px)] flex flex-col items-center gap-3 px-6 text-center">
            <Eyebrow>02 — What I do</Eyebrow>
            <h2 className="m-0 text-[clamp(40px,5vw,72px)] leading-[1.03] tracking-[-0.015em] text-balance text-fg">
              Magic happens <span className="serif-accent">behind the doors</span>
            </h2>
          </div>

          {/* what's behind the door you're looking at, at the bottom in the middle */}
          <div className="pointer-events-none absolute inset-x-0 bottom-[clamp(20px,5vh,44px)] flex justify-center px-6">
            <div className="relative grid min-h-[104px] w-full max-w-[640px] place-items-center">
              <p className={`micro-caps col-start-1 row-start-1 m-0 rounded-full border border-line bg-card/80 px-5 py-2.5 text-soft backdrop-blur-md transition-opacity duration-500 ${hovered ? 'opacity-0' : 'opacity-100'}`}>
                Hover a door to see what&apos;s behind it · click to step through
              </p>
              {ROOMS.map(r => (
                <div
                  key={r.key}
                  aria-hidden={hovered !== r.key}
                  className={`col-start-1 row-start-1 flex flex-col items-center gap-2 rounded-2xl border border-line bg-card/85 px-8 py-4 text-center backdrop-blur-md transition-[opacity,translate] duration-600 ease-[cubic-bezier(0.22,0.9,0.3,1)] ${hovered === r.key ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}`}
                >
                  <h3 className="m-0 text-[clamp(26px,2.4vw,34px)] leading-none font-normal text-fg">{r.title}</h3>
                  <p className="micro-caps m-0 flex items-center gap-2 text-soft">
                    <span className="size-2 rounded-full" style={{ background: DOOR_GLOW[r.key], boxShadow: `0 0 8px ${DOOR_GLOW[r.key]}` }} />
                    {r.motto}
                  </p>
                  <p className="label-caps m-0 text-fg">Enter →</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Phones: each door in its own small scene, details beside it */}
      <div ref={phoneRef} className="px-4 pt-24 pb-16 md:hidden">
        <div className="flex flex-col items-center gap-3 text-center">
          <Eyebrow>02 — What I do</Eyebrow>
          <h2 className="m-0 text-[44px] leading-[48px] tracking-[-0.015em] text-balance text-fg">
            Magic happens <span className="serif-accent">behind the doors</span>
          </h2>
        </div>
        <div className="mt-12 flex flex-col gap-10">
          {ROOMS.map((r, i) => (
            <div key={r.key} className="grid grid-cols-[minmax(112px,136px)_minmax(0,1fr)] items-center gap-5">
              <button
                type="button"
                aria-label={`Enter ${r.title}`}
                onClick={e => enter(r.key, phoneRef.current, e.currentTarget.querySelector('[data-core]'))}
                className="relative block aspect-[136/200] w-full cursor-pointer overflow-hidden rounded-2xl border border-line bg-transparent p-0"
              >
                <GlowDoors spots={PHONE_SPOTS[r.key]} openKey={openKey === r.key ? r.key : null} scale={2.1} labels={false} interactive={false} phase={20 + i * 23} className="absolute inset-0 size-full" />
              </button>
              <DoorDetails room={r} visible />
            </div>
          ))}
        </div>
      </div>

      {tunnel && <Wormhole color={DOOR_GLOW[tunnel]} />}
      <div ref={blackRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-60 bg-black opacity-0" />
    </section>
  );
}
