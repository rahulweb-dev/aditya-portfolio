'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { ROOMS, isSkill, type Room, type SkillKey } from '@/lib/content';
import DoorDetails from './DoorDetails';
import { Eyebrow } from './ui';
import type { Flight } from './three/DoorRoom';

// The 3D room only loads in the browser.
const DoorRoom = dynamic(() => import('./three/DoorRoom'), { ssr: false });

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isDesktop = () => window.matchMedia('(min-width: 768px)').matches;

/** Phones: zooms the 2D list into one doorway by scaling around its centre. */
function zoomScene(scene: HTMLElement, target: HTMLElement) {
  const s = scene.getBoundingClientRect();
  const t = target.getBoundingClientRect();
  scene.style.transformOrigin = `${t.left + t.width / 2 - s.left}px ${t.top + t.height * 0.55 - s.top}px`;
  scene.style.transition = 'transform 0.95s cubic-bezier(0.7, 0, 0.2, 1)';
  scene.style.transform = 'scale(9)';
}

function fadeBlack(el: HTMLElement | null, on: boolean, duration = '0.6s', delay = '0s') {
  if (!el) return;
  el.style.transition = duration === '0s' ? 'none' : `opacity ${duration} ease ${delay}`;
  el.style.opacity = on ? '1' : '0';
}

export default function Doors() {
  const router = useRouter();
  const sectionRef = useRef<HTMLElement>(null);
  const blackRef = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  const ready = useRef(false);
  const pendingReturn = useRef<SkillKey | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [openKey, setOpenKey] = useState<SkillKey | null>(null);
  const [flight, setFlight] = useState<Flight>(null);

  useEffect(() => {
    ROOMS.forEach(r => router.prefetch(`/work/${r.key}`));
  }, [router]);

  // Coming back from a room: fly back out of that doorway, then close the door.
  const flyOut = useCallback((key: SkillKey) => {
    pendingReturn.current = null;
    setHovered(null);
    setOpenKey(key);
    setFlight({ key, dir: 'out' });
    requestAnimationFrame(() => fadeBlack(blackRef.current, false, '0.6s'));
    setTimeout(() => setOpenKey(null), 1100);
    setTimeout(() => {
      setFlight(null);
      busy.current = false;
    }, 1400);
  }, []);

  useEffect(() => {
    let key: string | null = null;
    try {
      key = sessionStorage.getItem('returnDoor');
      sessionStorage.removeItem('returnDoor');
    } catch {}
    if (!key || !isSkill(key) || !sectionRef.current) return;

    const top = sectionRef.current.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top, behavior: 'instant' });
    busy.current = true;
    fadeBlack(blackRef.current, true, '0s');

    if (!isDesktop() || reducedMotion()) {
      requestAnimationFrame(() => fadeBlack(blackRef.current, false, '0.6s'));
      busy.current = false;
      return;
    }
    // Wait for the 3D scene to exist before flying out of the doorway.
    if (ready.current) flyOut(key);
    else pendingReturn.current = key;
  }, [flyOut]);

  const onReady = useCallback(() => {
    ready.current = true;
    if (pendingReturn.current) flyOut(pendingReturn.current);
  }, [flyOut]);

  const enter = useCallback(
    (key: SkillKey, recess?: HTMLElement | null) => {
      if (busy.current) return;
      busy.current = true;
      setOpenKey(key);
      if (reducedMotion()) return router.push(`/work/${key}`);

      if (recess) {
        // Phones (2D): the door swings, then the list zooms into the doorway.
        setTimeout(() => {
          const scene = recess.closest<HTMLElement>('[data-scene]');
          if (scene) zoomScene(scene, recess);
          fadeBlack(blackRef.current, true, '0.55s', '0.35s');
        }, 600);
      } else {
        // Desktop (3D): the door swings open and the camera flies through it.
        setHovered(null);
        setFlight({ key, dir: 'in' });
        fadeBlack(blackRef.current, true, '0.45s', '1.05s');
      }
      setTimeout(() => router.push(`/work/${key}`), 1550);
    },
    [router],
  );

  return (
    <section id="work" ref={sectionRef} className="relative overflow-hidden bg-(--scene-wall)">
      {/* Desktop: a 3D room of doors. Hover one to fade the rest and read its details. */}
      <div className="relative hidden h-screen min-h-[680px] md:block" onMouseLeave={() => !busy.current && setHovered(null)}>
        <DoorRoom hovered={hovered} setHovered={setHovered} openKey={openKey} flight={flight} onSelect={key => enter(key)} onReady={onReady} />
        <div aria-hidden="true" className="scene-vignette pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute inset-x-0 top-[clamp(80px,11vh,120px)] flex flex-col items-center gap-3 px-6 text-center">
          <Eyebrow onDark>02 — What I do</Eyebrow>
          <h2 className="m-0 text-[clamp(40px,5vw,72px)] leading-[1.03] tracking-[-0.015em] text-balance text-on-dark">
            Magic happens <span className="serif-accent text-[#E35A52]">behind the doors</span>
          </h2>
        </div>
        {/* Keyboard access to the 3D doors */}
        <div className="sr-only">
          {ROOMS.map((room, i) => (
            <button key={room.key} type="button" onFocus={() => setHovered(i)} onBlur={() => setHovered(null)} onClick={() => enter(room.key)}>
              Enter {room.title}
            </button>
          ))}
        </div>
      </div>

      {/* Phones: doors stacked, details beside each */}
      <div data-scene className="scene-wall px-4 pt-24 pb-16 md:hidden">
        <div className="flex flex-col items-center gap-3 text-center">
          <Eyebrow onDark>02 — What I do</Eyebrow>
          <h2 className="m-0 text-[44px] leading-[48px] tracking-[-0.015em] text-balance text-on-dark">
            Magic happens <span className="serif-accent text-[#E35A52]">behind the doors</span>
          </h2>
        </div>
        <div className="mt-12 flex flex-col gap-12">
          {ROOMS.map(room => (
            <div key={room.key} className="grid grid-cols-[112px_minmax(0,1fr)] items-center gap-6">
              <FlatDoor room={room} open={openKey === room.key} onEnter={enter} />
              <DoorDetails room={room} visible />
            </div>
          ))}
        </div>
      </div>

      <div ref={blackRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-60 bg-black opacity-0" />
    </section>
  );
}

/** 2D door used on phones. */
function FlatDoor({ room, open, onEnter }: { room: Room; open: boolean; onEnter: (key: SkillKey, recess: HTMLElement | null) => void }) {
  return (
    <button
      type="button"
      aria-label={`Enter ${room.title}`}
      onClick={e => onEnter(room.key, e.currentTarget.querySelector('[data-recess]'))}
      className="relative w-full cursor-pointer border-0 bg-transparent p-0"
      style={{ '--door': room.color } as CSSProperties}
    >
      <span data-recess={room.key} className="door-recess gothic-arch relative block aspect-1/2 w-full perspective-distant">
        <span className={`door-leaf gothic-arch absolute inset-0 origin-left transition-transform duration-900 ease-[cubic-bezier(0.6,0.05,0.25,1)] ${open ? 'rotate-y-78' : ''}`}>
          <span className="door-plate absolute top-[34%] left-1/2 w-[52%] -translate-x-1/2 px-1 py-[3%] text-center font-mono text-[7px] leading-[1.15] font-bold tracking-[0.08em] uppercase">
            {room.plate}
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element -- small SVG icon */}
          <img src={`/icons/icon-${room.key}-night.svg`} alt="" className="absolute top-[18%] left-1/2 w-[26%] -translate-x-1/2" />
          <span className="door-gold absolute top-[55.5%] right-[13%] h-[2.4%] w-[24%] rounded-full" />
          <span className="door-gold absolute top-[54.4%] right-[10%] aspect-square w-[8%] rounded-full" />
          <span className="door-keyhole absolute top-[60%] right-[11.6%] aspect-1/2 w-[4.6%] rounded-xs" />
        </span>
      </span>
    </button>
  );
}
