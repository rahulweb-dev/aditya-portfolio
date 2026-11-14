import RoleNotebook from './RoleNotebook';
import ScratchPortrait from './ScratchPortrait';
import AbilityCard from './AbilityCard';
import HeroBackdrop from './HeroBackdrop';
import { Eyebrow, GhostButton, SolidButton } from './ui';
import { BRAND, SITE } from '@/lib/content';

export default function Hero() {
  return (
    <section
      id="home"
      className="relative isolate grid min-h-[min(860px,calc(100vh-70px))] grid-cols-1 items-center gap-8 px-[clamp(16px,4vw,64px)] pt-10 pb-24 md:grid-cols-[1.1fr_0.9fr]"
    >
      <HeroBackdrop />
      <div className="flex min-w-0 flex-col gap-7">
        <Eyebrow>{SITE.fullName}</Eyebrow>
        <h1 className="text-[clamp(44px,6.4vw,92px)] leading-[1.02] font-semibold tracking-[-0.035em] text-balance">
          Hi, I&apos;m {SITE.name}.<br />
          <span className="serif-accent text-[1.08em] text-muted">I am a</span>
        </h1>
        <RoleNotebook />
        <div className="flex flex-wrap items-center gap-3">
          <SolidButton href="#contact">Start a project</SolidButton>
          <GhostButton href="#work">See my work</GhostButton>
        </div>
      </div>

      {/* Scratch card: black and white until the visitor rubs the colour through */}
      <div className="relative w-full max-w-[420px] md:max-w-[460px] md:justify-self-end">
        <ScratchPortrait src="/assets/aditya.jpg" alt={`${SITE.fullName} sitting among plants, looking over his shoulder`} />
        <AbilityCard />
        <SpinBadge />
      </div>

      <p className="absolute bottom-7 left-[clamp(16px,4vw,64px)] m-0 rounded-full bg-bg/90 px-2.5 py-1 font-mono text-[11px] font-medium tracking-[0.08em] text-soft uppercase md:left-1/2 md:-translate-x-1/2">
        Based in {SITE.location}
      </p>
      <a href="#adyssey" className="absolute right-[clamp(16px,4vw,64px)] bottom-7 font-mono text-[11px] font-medium tracking-[0.08em] text-soft uppercase no-underline">
        Scroll to explore ↓
      </a>
    </section>
  );
}

/** Retro rotating badge with the brand line around it and a REC dot in the middle. */
function SpinBadge() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute -top-11 -left-11 z-10 hidden size-[124px] rounded-full bg-bg shadow-soft md:block">
      <svg viewBox="0 0 124 124" className="spin-slow size-full">
        <defs>
          <path id="badge-circle" d="M62 62 m-46 0 a46 46 0 1 1 92 0 a46 46 0 1 1 -92 0" />
        </defs>
        <text className="fill-fg font-mono text-[10.5px] tracking-[0.2em] uppercase">
          <textPath href="#badge-circle">{BRAND.name} ✶ visual adventures ✶ </textPath>
        </text>
      </svg>
      <span className="absolute inset-0 m-auto size-3 rounded-full bg-rec" />
    </div>
  );
}
