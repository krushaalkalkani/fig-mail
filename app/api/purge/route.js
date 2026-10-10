import { NextResponse } from 'next/server'; import { rpc } from '../../../lib/db';
export async function POST(req) { const b = await req.json().catch(() => ({}));
  try { const n = await rpc('fig_purge', { ids: Array.isArray(b.ids) ? b.ids.map(String) : null }); return NextResponse.json({ ok: true, n }); }
  catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); } }
