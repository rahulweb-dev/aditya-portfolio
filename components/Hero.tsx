import HeroRoles from './HeroRoles';
import ScratchPortrait from './ScratchPortrait';
import AbilityCard from './AbilityCard';
import DesertScene from './DesertScene';
import HeroFilm from './HeroFilm';
import { Eyebrow, GhostButton, SolidButton } from './ui';
import { getContent } from '@/lib/cms/content';
import { listWorks } from '@/lib/cms/imagekit';

/**
 * Photographs for the film strip: the ones marked "Film strip" in the Content studio (in gallery order),
 * as many as are marked; if none are, eight spread through the gallery. Each is cropped to a frame around its subject.
 */
async function filmFrames() {
  const photos = await listWorks('photo');
  if (!photos.length) return [];
  const marked = photos.filter(p => p.film);
  const n = Math.min(8, photos.length);
  return (marked.length ? marked : Array.from({ length: n }, (_, i) => photos[Math.floor((i * photos.length) / n)])).map(p => `${p.src}${p.src.includes('?') ? '&' : '?'}tr=w-720,h-540,fo-auto`);
}

/**
 * The hero: the living desert (red sun by day, red crescent by night, same spot), with a soft fade of the
 * page colour so the words sit on the calm sky. Words left, the sun between, the portrait right, its top
 * level with the name. It runs up behind the transparent header.
 */
export default async function Hero() {
  const [{ site: SITE }, frames] = await Promise.all([getContent(), filmFrames()]);
  return (
    <section
      id="home"
      className="relative isolate -mt-16 grid min-h-[clamp(860px,100vh,900px)] grid-cols-1 items-start gap-10 px-[clamp(24px,4vw,48px)] pt-32 pb-28 md:grid-cols-[minmax(0,1fr)_auto] md:gap-16 md:pt-36"
    >
      <DesertScene />
      <HeroFilm frames={frames} />
      <div aria-hidden="true" className="desert-fade absolute inset-0 -z-10" />

      <div className="flex min-w-0 flex-col gap-6">
        <Eyebrow>{SITE.fullName}</Eyebrow>
        <HeroRoles name={SITE.name} />
        <p className="m-0 max-w-[46ch] text-[17px] leading-[30px] text-soft">
          Graphic designer, photographer, videographer and AI creator in {SITE.location}.
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <SolidButton href="#contact">Start a project</SolidButton>
          <GhostButton href="#work">See my work</GhostButton>
        </div>
      </div>

      {/* Scratch card: black and white until the visitor rubs the colour through */}
      <figure className="m-0 w-full max-w-[380px] md:w-[clamp(280px,24vw,360px)]">
        <div className="relative">
          <ScratchPortrait src="/assets/aditya.jpg" alt={`${SITE.fullName} sitting among plants, looking over his shoulder`} />
          <AbilityCard />
        </div>
        <figcaption className="micro-caps mt-3 flex justify-between gap-3 text-soft">
          <span>Frame 01 · {SITE.name}</span>
          <span>{SITE.location}</span>
        </figcaption>
      </figure>

      <p className="micro-caps absolute bottom-8 left-[clamp(24px,4vw,48px)] m-0 flex items-center gap-2 rounded-full bg-[#140D0E]/85 px-3 py-2 text-on-dark">
        <span className="rec-dot rec-blink" />
        Based in {SITE.location}
      </p>
      <a href="#adyssey" className="micro-caps absolute right-[clamp(24px,4vw,48px)] bottom-8 hidden rounded-full bg-[#140D0E]/85 px-3 py-2 text-on-dark no-underline md:block">
        Scroll to explore ↓
      </a>
    </section>
  );
}
