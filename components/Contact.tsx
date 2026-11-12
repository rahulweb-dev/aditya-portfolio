import { Eyebrow, GhostButton, SolidButton } from './ui';
import { SITE } from '@/lib/content';

export default function Contact() {
  return (
    <section id="contact" className="flex flex-col gap-[26px] border-t border-line px-[clamp(16px,4vw,64px)] pt-[120px] pb-20">
      <Eyebrow live>Available for new work</Eyebrow>
      <h2 className="text-[clamp(48px,8vw,120px)] leading-[0.98] font-semibold tracking-[-0.045em]">
        Got a project?
        <br />
        <span className="text-muted">Let&apos;s make it together.</span>
      </h2>
      <p className="m-0 max-w-[56ch] text-[17px] leading-relaxed text-soft">
        I&apos;m taking on new work: photo shoots, brand films, edits, design and AI video. Tell me what you&apos;re making and I&apos;ll get back to you within a day.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <SolidButton href={`mailto:${SITE.email}`}>Start a project</SolidButton>
        <GhostButton href="#work">See my work</GhostButton>
      </div>
    </section>
  );
}
