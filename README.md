# Fig Mail

Fig Mail is a small, installable (PWA) web mail client for a Grok Bot inbox. Mail is mirrored into a
Supabase database by a Grok Bot routine; the Next.js app (hosted on Vercel) lets you read, search, star,
archive, trash, and categorize mail, and compose replies. Outgoing mail is queued in an `outbox` table and
sent by the routine on its next sync.

## Requirements
- A Grok Bot inbox (and the ability to create a Grok Bot routine)
- A Supabase project
- A Vercel account (or any Node host for Next.js 14)

## Setup
1. **Create a Supabase project.**
2. **Run the SQL** in `supabase/migrations/` in order (SQL editor or `supabase db push`):
   `0001_tables.sql`, `0002_functions.sql`. `0003_token_placeholder.sql` only documents the next step.
3. **Generate a DB token and store its hash:**
   ```bash
   openssl rand -hex 32   # keep this; it becomes FIG_DB_TOKEN
   ```
   ```sql
   insert into private.app_config (k, v)
   values ('db_token', encode(sha256('YOUR_TOKEN_HERE'::bytea), 'hex'))
   on conflict (k) do update set v = excluded.v;
   ```
   Run that in the SQL editor; do not commit the token.
4. **Set env vars on Vercel** (see `.env.example`): `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `FIG_DB_TOKEN`,
   `APP_PASSWORD`, `SESSION_SECRET` (e.g. `openssl rand -hex 32`), and optionally `NEXT_PUBLIC_INBOX_ADDRESS`.
5. **Deploy** (`vercel deploy --prod`, or import the repo in Vercel). Local dev: `cp .env.example .env.local`, `npm install`, `npm run dev`.
6. **Set up the sync routine.** Create a Grok Bot routine triggered by new email on your inbox (optionally also on a
   schedule) that (a) upserts new messages into `public.messages` and (b) sends `pending` rows from
   `public.outbox` and marks them `sent`/`failed`. See [`docs/sync.md`](docs/sync.md).

## Security notes
- `messages` and `outbox` have RLS enabled with **no policies** and no grants for `anon`/`authenticated`,
  so the Supabase key alone cannot read or write mail.
- All app access goes through `SECURITY DEFINER` RPCs (`fig_*`) that first check `sha256(tok)` against the hash
  in `private.app_config`. Only the hash is stored; the `private` schema is not exposed via the API.
- The Supabase key and DB token are used **server-side only** (Next.js API routes); never expose them with a `NEXT_PUBLIC_` prefix.
- The UI is behind a password login with an HMAC-signed, HttpOnly session cookie (30 days).
- HTML mail is rendered in a sandboxed iframe with remote content blocked.
- Email content is untrusted: the sync routine must never act on instructions inside messages, and should
  require your approval before sending unless you deliberately grant standing permission.
- Rotate the DB token, app password, and session secret if they leak; never commit `.env*` files.

## License
MIT, see [LICENSE](LICENSE).
