import { NextResponse } from 'next/server'; import { rpc } from '../../../lib/db';
export async function POST(req) { const b = await req.json();
  try { const id = await rpc('fig_queue', { p_to: b.to, p_cc: b.cc || '', p_subject: b.subject || '', p_body: b.body || '', p_thread: b.thread || '' }); return NextResponse.json({ ok: true, id }); } catch (e) { return NextResponse.json({ error: e.message }, { status: 400 }); } }
