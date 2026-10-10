'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { I, Avatar, nameOf, emailOf, fmt, full, size, copyText, buzz, findOtp, CAT_LABEL, post, ADDR } from '../lib/ui';

const LINK_RE = /(https?:\/\/[^\s<>"')\]]+[^\s<>"')\].,;:!?]|[\w.+-]+@[\w-]+(?:\.[\w-]+)+)/g;
function Linky({ t }) {
  return (t || '').split(LINK_RE).map((p, i) => i % 2 ? <a key={i} href={/^https?:/.test(p) ? p : 'mailto:' + p} target="_blank" rel="noopener noreferrer nofollow">{p}</a> : p);
}
const FOOT_RE = /^(unsubscribe|manage (your )?preferences|you (are )?receiv|this (e-?mail|message) was sent|©|copyright|\d+ [\w .]+(street|st\.?|road|rd\.?|ave|avenue|blvd)\b|x corp\.)/i;
const BUL_RE = /^\s*(?:[•\-*–·]|\d+[.)])\s+/;
/* Plain text -> paragraphs, bullet lists, muted footer. */
function Linkified({ text }) {
  const lines = (text || '').replace(/\r/g, '').split('\n');
  let fi = lines.findIndex((l, i) => i > 2 && FOOT_RE.test(l.trim())); if (fi < 0) fi = lines.length;
  const blocks = (ls) => { const out = []; let para = [], list = [];
    const flushP = () => { if (para.length) out.push(<p key={out.length}><Linky t={para.join('\n')} /></p>); para = []; };
    const flushL = () => { if (list.length) out.push(<ul key={out.length}>{list.map((x, i) => <li key={i}><Linky t={x} /></li>)}</ul>); list = []; };
    for (const raw of ls) { const l = raw.trimEnd();
      if (!l.trim()) { flushP(); flushL(); continue; }
      if (BUL_RE.test(l)) { flushP(); list.push(l.replace(BUL_RE, '')); continue; }
      // inline "text:• a • b" bullets
      if (l.includes('•') && !BUL_RE.test(l)) { const [h, ...rest] = l.split('•'); flushL(); if (h.trim()) para.push(h.trim()); flushP(); rest.forEach(x => x.trim() && list.push(x.trim())); continue; }
      flushL(); para.push(l.trim()); }
    flushP(); flushL(); return out; };
  return <div className="content selectable">{blocks(lines.slice(0, fi))}
    {fi < lines.length && <footer className="mfoot">{blocks(lines.slice(fi))}</footer>}</div>;
}
const hasRemote = h => /<img[^>]+src\s*=\s*["']?\s*(https?:)?\/\//i.test(h || '') || /url\(\s*['"]?\s*https?:/i.test(h || '');

/* HTML mail in a sandboxed iframe: no scripts (no allow-scripts), CSP blocks every
   remote load until the user taps "Load Images"; wide newsletters are zoomed to fit. */
function HtmlBody({ html, allowImages }) {
  const ref = useRef(null), [h, setH] = useState(320);
  const doc = useMemo(() => {
    const remote = allowImages ? ' https: http:' : '';
    return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'${remote}; img-src data: cid:${remote}; font-src data:${remote}; media-src 'none'; frame-src 'none'; form-action 'none'">
<base target="_blank"><meta name="color-scheme" content="light">
<style>html,body{margin:0;background:#fff;color:#111}body{padding:14px;font:16px/1.45 -apple-system,system-ui,sans-serif;overflow-wrap:anywhere;-webkit-text-size-adjust:100%}
img{max-width:100%!important;height:auto!important}table{max-width:100%}pre{white-space:pre-wrap}a{color:#0a66d8}blockquote{margin:0 0 0 8px;padding-left:10px;border-left:3px solid #ddd;color:#555}</style>
</head><body>${html}</body></html>`;
  }, [html, allowImages]);
  useEffect(() => {
    const f = ref.current; if (!f) return; let ro;
    const fit = () => { try { const d = f.contentDocument; if (!d?.body) return;
      const b = d.body, de = d.documentElement; b.style.zoom = '1'; const w = f.clientWidth || de.clientWidth;
      const sw = Math.max(de.scrollWidth, b.scrollWidth); const z = sw > w + 2 ? Math.max(.35, w / sw) : 1;
      b.style.zoom = String(+z.toFixed(4));
      const ch = Math.ceil(b.getBoundingClientRect().height * (z !== 1 && Math.abs(b.getBoundingClientRect().width - w) < 4 ? 1 : 1));
      const sh = Math.max(ch, Math.ceil(b.scrollHeight * z));
      if (sh > 0) setH(sh + 4); } catch { setH(600); } };
    const timers = [];
    const load = () => { fit(); [60, 250, 800, 2000].forEach(t => timers.push(setTimeout(fit, t)));
      try { ro?.disconnect(); ro = new ResizeObserver(fit); ro.observe(f.contentDocument.body);
      f.contentDocument.querySelectorAll('img').forEach(i => i.addEventListener('load', fit)); } catch {} };
    f.addEventListener('load', load); if (f.contentDocument?.readyState === 'complete' && f.contentDocument.body?.childNodes.length) load();
    return () => { f.removeEventListener('load', load); ro?.disconnect(); timers.forEach(clearTimeout); };
  }, [doc]);
  return <div className="mframe"><iframe ref={ref} title="Message body" sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox" referrerPolicy="no-referrer" srcDoc={doc} style={{ height: h }} /></div>;
}

function OtpCard({ code }) {
  const [ok, setOk] = useState(false);
  const go = async () => { if (await copyText(code.replace(/[- ]/g, ''))) { buzz(); setOk(true); setTimeout(() => setOk(false), 2000); } };
  return <div className="otpcard"><div className="lbl">Verification Code</div><div className="num selectable">{code}</div>
    <button className={`bigbtn ${ok ? 'ok' : ''}`} onClick={go}>{ok ? I.check : I.copy}{ok ? 'Copied' : 'Copy Code'}</button></div>;
}

function Message({ m, last, allowImages, onLoadImages, autoImages }) {
  const [details, setDetails] = useState(false), [imgs, setImgs] = useState(autoImages || allowImages);
  const otp = last ? (findOtp(m.subject, m.body_text) || m.otp) : null;
  const atts = Array.isArray(m.attachments) ? m.attachments : [];
  const remote = m.body_html && hasRemote(m.body_html);
  return <article className="msg">
    <div className="scard"><Avatar who={m.from} /><div className="sinfo">
      <div className="nm"><b>{nameOf(m.from)}</b><time title={full(m.received_at)} dateTime={m.received_at}>{fmt(m.received_at)}</time></div>
      <div className="saddr">{emailOf(m.from)}</div>
      <button className="sto" onClick={() => setDetails(d => !d)} aria-expanded={details}>to {nameOf(m.to)}{m.cc ? ' +cc' : ''} <span className={`chev ${details ? 'up' : ''}`}>›</span></button></div></div>
    {details && <div className="detail selectable"><div><span>From</span>{m.from}</div><div><span>To</span>{m.to}</div>{m.cc && <div><span>Cc</span>{m.cc}</div>}<div><span>Date</span>{full(m.received_at)}</div>{m.category && <div><span>Category</span>{CAT_LABEL[m.category]}</div>}</div>}
    {otp && <OtpCard code={otp} />}
    {m.body_html ? <>
      {remote && !imgs && <div className="imgbar"><span>Remote images are blocked to protect your privacy.</span><button onClick={() => { setImgs(true); onLoadImages?.(); }}>Load Images</button></div>}
      <HtmlBody html={m.body_html} allowImages={imgs} /></> : <Linkified text={m.body_text || m.snippet} />}
    {atts.length > 0 && <div className="atts">{atts.map((a, i) => <div className="att" key={i} title="Attachments are listed from the mirror; ask Fig to fetch the file.">
      {/^image\//.test(a.content_type || a.type || '') ? I.photo : I.doc}<div style={{ minWidth: 0 }}><b>{a.filename || a.name || 'Attachment'}</b><small>{[size(a.size), (a.content_type || a.type || '').split('/')[1]].filter(Boolean).join(' · ') || 'File'}</small></div></div>)}</div>}
  </article>;
}

export default function Reader({ sel, thread, isOut, settings, onSetCategory, onQuick }) {
  if (isOut) return <>
    <div className="rhead"><div className="subjline selectable">{sel.subject || '(No Subject)'}</div><div className="rtags"><span className={`badge ${sel.status}`}>{sel.status}</span></div></div>
    <div className="msg"><div className="who"><Avatar who={sel.to} /><div style={{ minWidth: 0, flex: 1 }}>
      <div className="nm"><b>To: {nameOf(sel.to)}</b><span>{fmt(sel.created_at)}</span></div>
      {sel.cc && <div className="meta">Cc: {sel.cc}</div>}
      <div className="meta">Queued {full(sel.created_at)}{sel.sent_at && ` · Sent ${full(sel.sent_at)}`}</div></div></div>
      {sel.error && <div className="serr" style={{ padding: '10px 0 0' }}>{sel.error}</div>}
      <Linkified text={sel.body} /></div></>;
  const head = thread[0] || sel;
  return <div className="rcol">
    <header className="rhead"><h1 className="subjline selectable">{head.subject || '(No Subject)'}</h1>
      <div className="rtags">{sel.category && <button className={`chipcat ${sel.category}`} onClick={onSetCategory} aria-label="Change category" title="Change category">{CAT_LABEL[sel.category]}</button>}
        {thread.length > 1 && <span className="chipcat">{thread.length} messages</span>}</div></header>
    {thread.map((m, i) => <Message key={m.id} m={m} last={i === thread.length - 1} autoImages={settings.loadImages} />)}
    {!sel.deleted_at && <QuickReply m={thread[thread.length - 1] || sel} onDone={onQuick} />}
  </div>;
}

function QuickReply({ m, onDone }) {
  const [t, setT] = useState(''), [busy, setBusy] = useState(false), [note, setNote] = useState(''), ref = useRef(null);
  const send = async () => { if (!t.trim() || busy) return; setBusy(true);
    const sub = /^re:/i.test(m.subject || '') ? m.subject : 'Re: ' + (m.subject || '');
    const r = await post('/api/send', { to: emailOf(m.from), subject: sub, body: t.trim(), thread: m.thread_id });
    setBusy(false); if (!r?.error) { setT(''); buzz(); setNote(`Reply queued — it sends from ${ADDR} on the next sync.`); onDone?.(true); } else { setNote('Couldn’t queue reply: ' + r.error); onDone?.(false, r.error); } };
  useEffect(() => { const el = ref.current; if (el) { el.style.height = 'auto'; el.style.height = Math.min(160, el.scrollHeight) + 'px'; } }, [t]);
  return <><div className="qreply"><textarea ref={ref} rows={1} value={t} placeholder={`Reply to ${nameOf(m.from)}…`} aria-label="Quick reply"
      onChange={e => setT(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send(); e.stopPropagation(); }} />
    <button className="qsend" disabled={!t.trim() || busy} onClick={send} aria-label="Send reply" title="Send (⌘↵)"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 4l7 7-1.4 1.4L13 7.8V20h-2V7.8l-4.6 4.6L5 11z"/></svg></button></div>
    {note && <div className="qnote" role="status">{note}</div>}</>;
}
