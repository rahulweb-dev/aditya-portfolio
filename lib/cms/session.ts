import { jwtVerify, SignJWT } from 'jose';

// The admin's login session: a signed cookie, valid for a week. Edge-safe (used by the middleware).

export const SESSION_COOKIE = 'adyssey_admin';
export const SESSION_DAYS = 7;

const key = () => new TextEncoder().encode(process.env.AUTH_SECRET ?? '');

export async function createSession(username: string) {
  return new SignJWT({ sub: username })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(key());
}

export async function verifySession(token: string | undefined) {
  if (!token || !process.env.AUTH_SECRET) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ['HS256'] });
    return typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    return null;
  }
}
