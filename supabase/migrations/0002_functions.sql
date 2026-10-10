-- Fig Mail: helper functions, enrichment trigger, and token-checked RPCs.
-- Every public fig_* function is SECURITY DEFINER and starts with private.chk(tok), which compares
-- sha256(tok) to the hash in private.app_config. Without the right token every call raises 'unauthorized'.

CREATE OR REPLACE FUNCTION private.chk(tok text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$ begin if tok is null or encode(sha256(tok::bytea),'hex') <> (select v from private.app_config where k='db_token') then raise exception 'unauthorized'; end if; end $function$
;

CREATE OR REPLACE FUNCTION private.extract_otp(subj text, body text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO ''
AS $function$
declare t text := coalesce(subj,'') || E'\n' || coalesce(body,''); m text;
begin
  m := substring(t from '(?i)\m([0-9]{4,8})\M\s+is\s+your');
  if m is null then m := substring(t from '(?i)(?:verification|security|login|sign[- ]?in|one[- ]time|confirmation|access|auth(?:entication)?|otp|2fa)\s*(?:code|pin|passcode|password)?[^0-9A-Za-z]{0,30}(?:is|:)?[^0-9]{0,20}\m([0-9]{4,8})\M'); end if;
  if m is null then m := substring(t from '(?i)(?:code|passcode|pin|otp)\s*(?:is|:)\s*\m([0-9]{4,8})\M'); end if;
  if m is null then m := substring(t from '(?i)(?:code|passcode)[^0-9]{0,40}\m([0-9]{3}[- ][0-9]{3})\M'); end if;
  return m;
end $function$
;

CREATE OR REPLACE FUNCTION private.categorize(sender text, subj text, body text, code text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO ''
AS $function$
declare s text := lower(coalesce(sender,'')); sb text := lower(coalesce(subj,'')); b text := lower(coalesce(body,''));
begin
  if code is not null or sb ~ '(verification code|verify your|confirm your email|one-time|passcode|security code|sign-?in code|login code|2fa|two-factor)' then return 'otp'; end if;
  if sb ~ '(receipt|invoice|order (confirm|#|number)|your order|payment (received|confirmation)|purchase|billing|subscription (renew|confirm)|refund|shipped|delivery)' or b ~ '(order total|amount paid|invoice number|receipt (no|number|#))' then return 'receipts'; end if;
  if sb ~ '(welcome|get started|activate your|confirm your (account|subscription)|thanks for (signing|joining|registering)|your new account|account created|finish (setting|signing))' then return 'signups'; end if;
  if b ~ 'unsubscribe' or s ~ '(newsletter|digest|news@|updates@|marketing|hello@|team@|substack|mailchimp|beehiiv)' or sb ~ '(newsletter|digest|weekly|edition|issue #)' then return 'newsletters'; end if;
  if s ~ '(no-?reply|do-?not-?reply|notifications?@|alerts?@|mailer|bounce|automated|support@|info@)' then return 'newsletters'; end if;
  return 'personal';
end $function$
;

CREATE OR REPLACE FUNCTION private.msg_enrich()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  new.otp := private.extract_otp(new.subject, new.body_text);
  if not coalesce(new.category_manual,false) then
    new.category := case when 'SENT' = any(new.labels) then 'personal' else private.categorize(new."from", new.subject, new.body_text, new.otp) end;
  end if;
  return new;
end $function$
;

drop trigger if exists msg_enrich on public.messages;
CREATE TRIGGER msg_enrich BEFORE INSERT OR UPDATE OF subject, body_text, "from", labels, category_manual ON public.messages FOR EACH ROW EXECUTE FUNCTION private.msg_enrich();

-- Legacy RPCs (fig_counts, fig_list, fig_update) are kept to match the original schema; the app uses fig_query, fig_stats, fig_set.

CREATE OR REPLACE FUNCTION public.fig_query(tok text, folder text DEFAULT 'inbox'::text, q text DEFAULT NULL::text, p_from text DEFAULT NULL::text, p_unread boolean DEFAULT NULL::boolean, p_code boolean DEFAULT NULL::boolean, p_category text DEFAULT NULL::text, p_starred boolean DEFAULT NULL::boolean, p_limit integer DEFAULT 300)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare r jsonb; tsq tsquery;
begin perform private.chk(tok);
  if q is not null and length(trim(q)) > 0 then tsq := websearch_to_tsquery('simple', q); end if;
  select coalesce(jsonb_agg(x order by x.received_at desc nulls last), '[]'::jsonb) into r from (
    select m.id, m.thread_id, m."from", m."to", m.cc, m.subject, m.snippet, m.received_at, m.read, m.starred, m.archived,
      m.deleted_at, m.labels, m.category, m.otp, jsonb_array_length(m.attachments) > 0 as has_attachments, m.body_html is not null as has_html
    from public.messages m where
      (case folder
        when 'trash' then m.deleted_at is not null
        when 'starred' then m.starred and m.deleted_at is null
        when 'sent' then 'SENT' = any(m.labels) and m.deleted_at is null
        when 'archive' then m.archived and m.deleted_at is null
        when 'all' then m.deleted_at is null
        else not m.archived and m.deleted_at is null and not ('SENT' = any(m.labels)) end)
      and (tsq is null or m.fts @@ tsq or m.subject ilike '%'||q||'%' or m."from" ilike '%'||q||'%' or m.body_text ilike '%'||q||'%')
      and (p_from is null or m."from" ilike '%'||p_from||'%')
      and (p_unread is null or m.read = not p_unread)
      and (p_code is null or (m.otp is not null) = p_code)
      and (p_category is null or m.category = p_category)
      and (p_starred is null or m.starred = p_starred)
    order by m.received_at desc nulls last limit least(greatest(p_limit,1),1000)) x;
  return r; end $function$
;

CREATE OR REPLACE FUNCTION public.fig_stats(tok text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin perform private.chk(tok);
  return jsonb_build_object(
    'inbox', (select count(*) from public.messages where not read and not archived and deleted_at is null and not ('SENT'=any(labels))),
    'starred', (select count(*) from public.messages where starred and deleted_at is null),
    'trash', (select count(*) from public.messages where deleted_at is not null),
    'outbox', (select count(*) from public.outbox where status='pending'),
    'cats', coalesce((select jsonb_object_agg(category, n) from (select category, count(*) n from public.messages where not read and not archived and deleted_at is null and not ('SENT'=any(labels)) group by category) c), '{}'::jsonb));
end $function$
;

CREATE OR REPLACE FUNCTION public.fig_thread(tok text, tid text)
 RETURNS SETOF public.messages
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$ begin perform private.chk(tok); return query select * from public.messages where thread_id=tid order by received_at asc; end $function$
;

CREATE OR REPLACE FUNCTION public.fig_outbox(tok text)
 RETURNS SETOF public.outbox
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$ begin perform private.chk(tok); return query select * from public.outbox order by created_at desc limit 200; end $function$
;

CREATE OR REPLACE FUNCTION public.fig_queue(tok text, p_to text, p_cc text, p_subject text, p_body text, p_thread text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$ declare nid uuid; begin perform private.chk(tok);
if p_to is null or length(trim(p_to))=0 then raise exception 'recipient required'; end if;
insert into public.outbox("to",cc,subject,body,in_reply_to_thread) values (p_to,nullif(p_cc,''),p_subject,p_body,nullif(p_thread,'')) returning id into nid; return nid; end $function$
;

CREATE OR REPLACE FUNCTION public.fig_set(tok text, ids text[], p_read boolean DEFAULT NULL::boolean, p_starred boolean DEFAULT NULL::boolean, p_archived boolean DEFAULT NULL::boolean, p_deleted boolean DEFAULT NULL::boolean, p_category text DEFAULT NULL::text)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare n int; begin perform private.chk(tok);
  if p_category is not null and p_category not in ('otp','newsletters','signups','receipts','personal') then raise exception 'bad category'; end if;
  update public.messages set read = coalesce(p_read, read), starred = coalesce(p_starred, starred), archived = coalesce(p_archived, archived),
    deleted_at = case when p_deleted is null then deleted_at when p_deleted then coalesce(deleted_at, now()) else null end,
    category = coalesce(p_category, category), category_manual = category_manual or p_category is not null
  where id = any(ids);
  get diagnostics n = row_count; return n; end $function$
;

CREATE OR REPLACE FUNCTION public.fig_purge(tok text, ids text[] DEFAULT NULL::text[])
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare n int; begin perform private.chk(tok);
  delete from public.messages where deleted_at is not null and (ids is null or id = any(ids));
  get diagnostics n = row_count; return n; end $function$
;

CREATE OR REPLACE FUNCTION public.fig_counts(tok text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$ begin perform private.chk(tok); return json_build_object('inbox',(select count(*) from public.messages where not read and not archived and not ('SENT'=any(labels))),'outbox',(select count(*) from public.outbox where status='pending')); end $function$
;

CREATE OR REPLACE FUNCTION public.fig_list(tok text, folder text, q text DEFAULT NULL::text)
 RETURNS SETOF public.messages
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$ begin perform private.chk(tok);
return query select * from public.messages m where
 (case folder when 'starred' then m.starred when 'sent' then 'SENT'=any(m.labels) when 'archive' then m.archived else not m.archived and not ('SENT'=any(m.labels)) end)
 and (q is null or q='' or m.subject ilike '%'||q||'%' or m."from" ilike '%'||q||'%' or m."to" ilike '%'||q||'%' or m.body_text ilike '%'||q||'%')
 order by m.received_at desc nulls last limit 500; end $function$
;

CREATE OR REPLACE FUNCTION public.fig_update(tok text, ids text[], p_read boolean DEFAULT NULL::boolean, p_starred boolean DEFAULT NULL::boolean, p_archived boolean DEFAULT NULL::boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$ begin perform private.chk(tok);
update public.messages set read=coalesce(p_read,read), starred=coalesce(p_starred,starred), archived=coalesce(p_archived,archived) where id=any(ids); end $function$
;

-- Execute grants: private helpers are owner-only; RPCs are callable via the Data API but gated by the token.
revoke all on function private.chk(text), private.extract_otp(text,text), private.categorize(text,text,text,text), private.msg_enrich() from public, anon, authenticated;
grant execute on function public.fig_query(text,text,text,text,boolean,boolean,text,boolean,integer) to anon, authenticated, service_role;
grant execute on function public.fig_stats(text) to anon, authenticated, service_role;
grant execute on function public.fig_thread(text,text) to anon, authenticated, service_role;
grant execute on function public.fig_outbox(text) to anon, authenticated, service_role;
grant execute on function public.fig_queue(text,text,text,text,text,text) to anon, authenticated, service_role;
grant execute on function public.fig_set(text,text[],boolean,boolean,boolean,boolean,text) to anon, authenticated, service_role;
grant execute on function public.fig_purge(text,text[]) to anon, authenticated, service_role;
grant execute on function public.fig_counts(text) to anon, authenticated, service_role;
grant execute on function public.fig_list(text,text,text) to anon, authenticated, service_role;
grant execute on function public.fig_update(text,text[],boolean,boolean,boolean) to anon, authenticated, service_role;
