import { NextResponse } from 'next/server';
import { COOKIE } from '../../../lib/session';
export async function POST() { const r = NextResponse.json({ ok: true }); r.cookies.set(COOKIE, '', { path: '/', maxAge: 0 }); return r; }
