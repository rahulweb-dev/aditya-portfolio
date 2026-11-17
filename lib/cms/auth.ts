import 'server-only';
import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySession } from './session';

/**
 * Checks a login against ADMIN_USERNAME and either ADMIN_PASSWORD_HASH ("salt:hash", scrypt; preferred)
 * or a plain ADMIN_PASSWORD. Both are compared in constant time.
 */
export function checkLogin(username: string, password: string) {
  const user = process.env.ADMIN_USERNAME ?? '';
  if (!user) return false;
  const sameUser = username.trim().toLowerCase() === user.toLowerCase();

  const [salt, hash] = (process.env.ADMIN_PASSWORD_HASH ?? '').split(':');
  if (salt && hash) {
    const given = crypto.scryptSync(password, salt, 64);
    const want = Buffer.from(hash, 'hex');
    return sameUser && want.length === given.length && crypto.timingSafeEqual(given, want);
  }

  const plain = process.env.ADMIN_PASSWORD ?? '';
  if (!plain) return false;
  // compare digests so different lengths take the same time
  const digest = (s: string) => crypto.createHash('sha256').update(s).digest();
  return sameUser && crypto.timingSafeEqual(digest(password), digest(plain));
}

/** For admin API routes: the signed-in admin, or a 401 response. Also refuses requests from other sites. */
export async function requireAdmin(req: Request): Promise<{ user: string } | { error: NextResponse }> {
  const origin = req.headers.get('origin');
  if (origin && new URL(origin).host !== new URL(req.url).host) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  const user = await verifySession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!user) return { error: NextResponse.json({ error: 'Please sign in again.' }, { status: 401 }) };
  return { user };
}
