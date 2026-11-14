import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import Nav from '@/components/Nav';
import PullCord from '@/components/PullCord';
import BackToDoors from '@/components/BackToDoors';
import { ROOMS, SITE } from '@/lib/content';

type Props = { params: Promise<{ skill: string }> };

export function generateStaticParams() {
  return ROOMS.map(r => ({ skill: r.key }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { skill } = await params;
  const room = ROOMS.find(r => r.key === skill);
  return { title: room ? `${room.title} | ${SITE.name}` : SITE.name, description: room?.lead };
}

export default async function RoomPage({ params }: Props) {
  const { skill } = await params;
  const room = ROOMS.find(r => r.key === skill);
  if (!room) notFound();

  return (
    <>
      {/* Arriving through the door: fade in from black */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[60] animate-fade-out bg-black" />
      <PullCord />
      <Nav active={room.key} />

      <main className="px-[clamp(16px,4vw,64px)] pt-14 pb-[40vh]">
        <h1 className="text-[clamp(48px,7.5vw,112px)] leading-[0.95] font-semibold tracking-[-0.018em]">{room.title}</h1>
        <p className="mt-5 max-w-[60ch] text-[clamp(15px,1.3vw,18px)] leading-relaxed text-soft">{room.lead}</p>

        {/* Each card sticks a little lower than the last, so they stack as you scroll */}
        <div className="mt-14 flex flex-col gap-[12vh]">
          {room.projects.map((p, i) => (
            <article
              key={p.title}
              className="sticky grid min-h-[min(560px,70vh)] grid-cols-1 items-center gap-10 rounded-[28px] border border-line bg-card p-[clamp(20px,3.2vw,48px)] shadow-[0_30px_60px_-30px_var(--shadow-color)] md:grid-cols-[1.1fr_0.9fr]"
              style={{ top: 96 + i * 20 }}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl text-lg font-bold text-white" style={{ background: room.color }}>
                    {p.title.replace(/[^A-Za-z]/g, '').charAt(0) || '·'}
                  </span>
                  <span className="font-mono text-[11px] font-medium tracking-[0.12em] text-soft uppercase">{p.kicker}</span>
                </div>
                <h2 className="mt-6 text-[clamp(30px,3.6vw,52px)] leading-none font-semibold tracking-[-0.012em]">{p.title}</h2>
                <p className="mt-2 text-sm text-soft">{p.tag}</p>
                <p className="mt-6 max-w-[52ch] text-[15px] leading-relaxed text-soft">{p.blurb}</p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {p.chips.map(c => (
                    <span key={c} className="rounded-full border border-line px-3 py-1.5 text-xs text-soft">{c}</span>
                  ))}
                </div>
              </div>

              <div className="relative mx-auto aspect-[4/5] w-full max-w-[380px] overflow-hidden rounded-[26px] border-[6px] border-[#0d0e11] shadow-[0_24px_50px_-20px_rgba(0,0,0,0.6)]">
                <Image src={p.img} alt={p.title} fill sizes="(max-width: 768px) 100vw, 380px" className="object-cover" priority={i === 0} />
                {p.film && (
                  <span className="absolute inset-0 grid place-items-center">
                    <span className="grid size-16 place-items-center rounded-full bg-white/85 pl-1 text-xl text-[#111] shadow-lg">▶</span>
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      </main>

      <BackToDoors skill={room.key} />
    </>
  );
}
