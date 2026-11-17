import { NextResponse } from 'next/server';
import { checkLogin } from '@/lib/cms/auth';
import { createSession, SESSION_COOKIE, SESSION_DAYS } from '@/lib/cms/session';

// A small brake on guessing: failed attempts per address, reset after a quiet quarter hour.
const attempts = new Map<string, { n: number; at: number }>();

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local';
  const a = attempts.get(ip);
  if (a && Date.now() - a.at > 15 * 60_000) attempts.delete(ip);
  if ((attempts.get(ip)?.n ?? 0) >= 8) {
    return NextResponse.json({ error: 'Too many attempts. Try again in 15 minutes.' }, { status: 429 });
  }

  const { username = '', password = '' } = (await req.json().catch(() => ({}))) as { username?: string; password?: string };
  if (!checkLogin(String(username), String(password))) {
    attempts.set(ip, { n: (attempts.get(ip)?.n ?? 0) + 1, at: Date.now() });
    await new Promise(r => setTimeout(r, 600)); // slow down guessing
    return NextResponse.json({ error: 'That username or password is not right.' }, { status: 401 });
  }
  attempts.delete(ip);

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, await createSession(String(username).trim().toLowerCase()), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
  return res;
}
