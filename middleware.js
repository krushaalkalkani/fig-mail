import { NextResponse } from 'next/server';
import { verify, COOKIE } from './lib/session';
const PUBLIC = ['/login', '/api/login', '/manifest.webmanifest', '/icon.svg', '/icon-192.png', '/icon-512.png', '/apple-touch-icon.png', '/sw.js'];
export async function middleware(req) {
  const p = req.nextUrl.pathname;
  if (PUBLIC.includes(p) || p.startsWith('/_next/')) return NextResponse.next();
  const ok = await verify(req.cookies.get(COOKIE)?.value);
  if (ok) return NextResponse.next();
  if (p.startsWith('/api/')) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  return NextResponse.redirect(new URL('/login', req.url));
}
export const config = { matcher: '/((?!favicon.ico).*)' };
