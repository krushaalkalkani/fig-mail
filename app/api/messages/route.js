import { NextResponse } from 'next/server'; import { rpc } from '../../../lib/db';
export const dynamic = 'force-dynamic';
const bool = v => v === '1' || v === 'true' ? true : v === '0' || v === 'false' ? false : null;
export async function GET(req) { const s = req.nextUrl.searchParams;
  try {
    return NextResponse.json(await rpc('fig_query', { folder: s.get('folder') || 'inbox', q: s.get('q') || null, p_from: s.get('from') || null,
      p_unread: bool(s.get('unread')), p_code: bool(s.get('code')), p_category: s.get('category') || null, p_starred: bool(s.get('starred')) }));
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); } }
