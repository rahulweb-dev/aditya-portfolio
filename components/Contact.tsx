import Reveal from './Reveal';
import { Eyebrow, GhostButton, SolidButton } from './ui';
import { SITE } from '@/lib/content';

export default function Contact() {
  return (
    <section id="contact" className="flex flex-col gap-[26px] border-t border-line px-[clamp(16px,4vw,64px)] pt-24 pb-20">
      <Reveal className="flex flex-col gap-[26px]">
        <Eyebrow live>Open to new projects</Eyebrow>
        <h2 className="text-[clamp(48px,8vw,120px)] leading-[0.98] font-semibold tracking-[-0.045em]">
          Got a project?
          <br />
          <span className="text-muted">Let&apos;s <span className="serif-accent text-fg">make it</span> together.</span>
        </h2>
      </Reveal>
      <p className="m-0 max-w-[56ch] text-[17px] leading-relaxed text-soft">
        Photography and photo editing, social media creatives, ad banners, reels or AI visuals. Tell me what you&apos;re working on.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <SolidButton href={`mailto:${SITE.email}`}>Start a project</SolidButton>
        <GhostButton href={SITE.socials[0].href}>See my ArtStation</GhostButton>
      </div>
      <dl className="mt-4 grid grid-cols-1 gap-x-12 gap-y-4 text-sm sm:w-fit sm:grid-cols-[repeat(3,auto)]">
        <div>
          <dt className="font-mono text-[11px] tracking-[0.1em] text-soft uppercase">Email</dt>
          <dd className="m-0 mt-1"><a href={`mailto:${SITE.email}`} className="break-all text-fg">{SITE.email}</a></dd>
        </div>
        <div>
          <dt className="font-mono text-[11px] tracking-[0.1em] text-soft uppercase">Phone</dt>
          <dd className="m-0 mt-1"><a href={SITE.phoneHref} className="text-fg">{SITE.phone}</a></dd>
        </div>
        <div>
          <dt className="font-mono text-[11px] tracking-[0.1em] text-soft uppercase">Based in</dt>
          <dd className="m-0 mt-1 text-fg">{SITE.location}</dd>
        </div>
      </dl>
    </section>
  );
}
