import { NextResponse } from 'next/server';
import { sign, COOKIE } from '../../../lib/session';
export async function POST(req) {
  const { password } = await req.json().catch(() => ({}));
  const real = process.env.APP_PASSWORD || '';
  const a = new TextEncoder().encode(password || ''), b = new TextEncoder().encode(real);
  let d = a.length ^ b.length; for (let i = 0; i < b.length; i++) d |= (a[i] || 0) ^ b[i];
  if (!real || d) { await new Promise(r => setTimeout(r, 600)); return NextResponse.json({ error: 'Wrong password' }, { status: 401 }); }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, await sign({ u: 'owner', exp: Date.now() + 30 * 864e5 }), { httpOnly: true, secure: !/^(localhost|127\.0\.0\.1)$/.test(req.nextUrl.hostname), sameSite: 'lax', path: '/', maxAge: 30 * 86400 });
  return res;
}
