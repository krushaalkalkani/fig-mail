import { NextResponse } from 'next/server'; import { rpc } from '../../../lib/db';
export async function POST(req) { const b = await req.json().catch(() => ({}));
  if (!Array.isArray(b.ids) || !b.ids.length) return NextResponse.json({ error: 'ids required' }, { status: 400 });
  try { const n = await rpc('fig_set', { ids: b.ids.map(String), p_read: b.read ?? null, p_starred: b.starred ?? null, p_archived: b.archived ?? null, p_deleted: b.deleted ?? null, p_category: b.category ?? null });
    return NextResponse.json({ ok: true, n }); } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); } }
