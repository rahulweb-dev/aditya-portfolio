import RoleNotebook from './RoleNotebook';
import ScratchPortrait from './ScratchPortrait';
import AbilityCard from './AbilityCard';
import HeroBackdrop from './HeroBackdrop';
import { Eyebrow, GhostButton, SolidButton } from './ui';
import { SITE } from '@/lib/content';

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
          <span className="text-muted">I am a</span>
        </h1>
        <RoleNotebook />
        <div className="flex flex-wrap items-center gap-3">
          <SolidButton href="#contact">Start a project</SolidButton>
          <GhostButton href="#work">See my work</GhostButton>
        </div>
      </div>

      {/* Scratch card: black and white until the visitor rubs the colour through */}
      <div className="relative w-full max-w-[420px] md:max-w-[460px] md:justify-self-end">
        <ScratchPortrait src="/assets/portrait.jpg" alt={`Portrait of ${SITE.name}`} />
        <AbilityCard />
      </div>

      <p className="absolute bottom-7 left-[clamp(16px,4vw,64px)] m-0 rounded-full bg-bg/90 px-2.5 py-1 font-mono text-[11px] font-medium tracking-[0.08em] text-soft uppercase md:left-1/2 md:-translate-x-1/2">
        Based in {SITE.location}
      </p>
      <a href="#work" className="absolute right-[clamp(16px,4vw,64px)] bottom-7 font-mono text-[11px] font-medium tracking-[0.08em] text-soft uppercase no-underline">
        Scroll to explore ↓
      </a>
    </section>
  );
}
