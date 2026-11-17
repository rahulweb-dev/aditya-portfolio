import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/cms/auth';
import { deleteWork, updateWork, type Meta } from '@/lib/cms/imagekit';

type Ctx = { params: Promise<{ id: string }> };

/** Rename a piece (or set its size after upload). */
export async function PATCH(req: Request, { params }: Ctx) {
  const who = await requireAdmin(req);
  if ('error' in who) return who.error;
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as Meta;
  const patch: Meta = {};
  if (typeof body.title === 'string') patch.title = body.title.slice(0, 200);
  for (const k of ['order', 'w', 'h', 'secs', 'film'] as const) if (typeof body[k] === 'number' && Number.isFinite(body[k])) patch[k] = body[k];
  try {
    await updateWork(id, patch);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
  revalidateTag('works');
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, { params }: Ctx) {
  const who = await requireAdmin(req);
  if ('error' in who) return who.error;
  const { id } = await params;
  try {
    await deleteWork(id);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
  revalidateTag('works');
  return NextResponse.json({ ok: true });
}
