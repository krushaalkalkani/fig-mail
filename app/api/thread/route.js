import { NextResponse } from 'next/server'; import { rpc } from '../../../lib/db';
export const dynamic = 'force-dynamic';
export async function GET(req) { try { return NextResponse.json(await rpc('fig_thread', { tid: req.nextUrl.searchParams.get('id') })); } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); } }
