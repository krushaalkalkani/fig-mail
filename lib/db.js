// Server-only. Calls token-gated SECURITY DEFINER RPCs; tables are RLS-locked with no anon grants.
export async function rpc(fn, args = {}) {
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
  const r = await fetch(`${url}/rest/v1/rpc/${fn}`, {
    method: 'POST', cache: 'no-store',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ tok: process.env.FIG_DB_TOKEN, ...args }),
  });
  const t = await r.text();
  if (!r.ok) throw new Error(`db ${fn} ${r.status}: ${t.slice(0, 200)}`);
  return t ? JSON.parse(t) : null;
}
