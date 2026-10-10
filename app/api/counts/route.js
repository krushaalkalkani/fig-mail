import { NextResponse } from 'next/server'; import { rpc } from '../../../lib/db';
export const dynamic = 'force-dynamic';
export async function GET() { try { return NextResponse.json(await rpc('fig_stats')); } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); } }
