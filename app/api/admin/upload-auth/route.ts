import { NextResponse } from 'next/server';
import { isSkill } from '@/lib/content';
import { requireAdmin } from '@/lib/cms/auth';
import { folderOf, POSTERS, uploadAuth } from '@/lib/cms/imagekit';

// The browser uploads straight to ImageKit (so big videos never pass through this server);
// it asks here first for a one-time signature. The private key never leaves the server.
export async function GET(req: Request) {
  const who = await requireAdmin(req);
  if ('error' in who) return who.error;
  const params = new URL(req.url).searchParams;
  if (params.get('kind') === 'poster') return NextResponse.json({ ...uploadAuth(), folder: POSTERS }, { headers: { 'Cache-Control': 'no-store' } });
  const craft = params.get('craft') ?? '';
  if (!isSkill(craft)) return NextResponse.json({ error: 'Unknown craft' }, { status: 400 });
  return NextResponse.json({ ...uploadAuth(), folder: folderOf(craft) }, { headers: { 'Cache-Control': 'no-store' } });
}
