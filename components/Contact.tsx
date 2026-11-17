import Reveal from './Reveal';
import { Eyebrow, GhostButton, SolidButton, TextLink } from './ui';
import { getContent } from '@/lib/cms/content';

export default async function Contact() {
  const SITE = (await getContent()).site;
  return (
    <section id="contact" className="flex flex-col gap-8 border-t border-line px-[clamp(24px,4vw,48px)] py-[clamp(64px,8vw,128px)]">
      <Reveal className="flex flex-col gap-6">
        <Eyebrow live>Open to new projects</Eyebrow>
        <h2 className="m-0 text-[clamp(44px,6.6vw,96px)] leading-[1.02] tracking-[-0.02em] text-balance">
          Got a project?
          <br />
          <span className="serif-accent">Let&apos;s make it together.</span>
        </h2>
      </Reveal>
      <p className="m-0 max-w-[52ch] text-[17px] leading-[30px] text-soft">
        Photography and photo editing, social media creatives, ad banners, reels or AI visuals. Tell me what you&apos;re working on.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <SolidButton href={`mailto:${SITE.email}`}>Start a project</SolidButton>
        {SITE.socials[0] && <GhostButton href={SITE.socials[0].href}>See my {SITE.socials[0].label}</GhostButton>}
        <TextLink href={`mailto:${SITE.email}`}>Let&apos;s talk</TextLink>
      </div>
      <dl className="mt-2 grid grid-cols-1 gap-x-12 gap-y-4 text-[15px] sm:w-fit sm:grid-cols-[repeat(2,auto)] lg:grid-cols-[repeat(4,auto)]">
        <div>
          <dt className="micro-caps text-soft">Email</dt>
          <dd className="m-0 mt-1"><a href={`mailto:${SITE.email}`} className="break-all text-fg">{SITE.email}</a></dd>
        </div>
        <div>
          <dt className="micro-caps text-soft">Phone</dt>
          <dd className="m-0 mt-1"><a href={SITE.phoneHref} className="text-fg">{SITE.phone}</a></dd>
        </div>
        <div>
          <dt className="micro-caps text-soft">Instagram</dt>
          <dd className="m-0 mt-1">
            <a href="https://www.instagram.com/the._adyssey/" target="_blank" rel="noopener noreferrer" className="text-fg">@the._adyssey</a>
          </dd>
        </div>
        <div>
          <dt className="micro-caps text-soft">Based in</dt>
          <dd className="m-0 mt-1 text-fg">{SITE.location}</dd>
        </div>
      </dl>
    </section>
  );
}
