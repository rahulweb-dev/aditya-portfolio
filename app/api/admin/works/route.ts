import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { isSkill } from '@/lib/content';
import { requireAdmin } from '@/lib/cms/auth';
import { listWorks, updateWork } from '@/lib/cms/imagekit';

/** The pieces in one craft, fresh from ImageKit. */
export async function GET(req: Request) {
  const who = await requireAdmin(req);
  if ('error' in who) return who.error;
  const craft = new URL(req.url).searchParams.get('craft') ?? '';
  if (!isSkill(craft)) return NextResponse.json({ error: 'Unknown craft' }, { status: 400 });
  return NextResponse.json({ works: await listWorks(craft, { fresh: true }) });
}

/** Save a new order: the dashboard sends only the pieces whose position changed. */
export async function PUT(req: Request) {
  const who = await requireAdmin(req);
  if ('error' in who) return who.error;
  const { orders } = (await req.json().catch(() => ({}))) as { orders?: { id: string; order: number }[] };
  if (!Array.isArray(orders) || orders.some(o => typeof o?.id !== 'string' || !Number.isFinite(o?.order))) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
  // a few at a time
  const queue = [...orders];
  try {
    await Promise.all(Array.from({ length: 4 }, async () => {
      for (let o = queue.shift(); o; o = queue.shift()) await updateWork(o.id, { order: o.order });
    }));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
  revalidateTag('works');
  return NextResponse.json({ ok: true, changed: orders.length });
}

/** After uploads finish: refresh the public pages. */
export async function POST(req: Request) {
  const who = await requireAdmin(req);
  if ('error' in who) return who.error;
  revalidateTag('works');
  return NextResponse.json({ ok: true });
}
