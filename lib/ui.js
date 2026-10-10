'use client';
/* Shared icons + helpers for Fig Mail (client only). */
const P = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
export const I = {
  inbox: <svg viewBox="0 0 24 24" {...P}><path d="M3.5 13.5 6 5.8A2 2 0 0 1 7.9 4.5h8.2A2 2 0 0 1 18 5.8l2.5 7.7V18a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/><path d="M3.5 13.5H8a1 1 0 0 1 1 .9 3 3 0 0 0 6 0 1 1 0 0 1 1-.9h4.5"/></svg>,
  star: <svg viewBox="0 0 24 24" {...P}><path d="m12 3.6 2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z"/></svg>,
  starFill: <svg viewBox="0 0 24 24" fill="currentColor"><path d="m12 3.6 2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z"/></svg>,
  sent: <svg viewBox="0 0 24 24" {...P}><path d="M20.5 3.5 10 14"/><path d="m20.5 3.5-6.6 17-3.9-6.5-6.5-3.9z"/></svg>,
  archive: <svg viewBox="0 0 24 24" {...P}><rect x="3" y="4" width="18" height="4.5" rx="1.2"/><path d="M4.5 8.5V18a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V8.5M10 12.5h4"/></svg>,
  trash: <svg viewBox="0 0 24 24" {...P}><path d="M4 6.5h16M9.5 6.5V4.8c0-.7.6-1.3 1.3-1.3h2.4c.7 0 1.3.6 1.3 1.3v1.7M6 6.5l.9 12.2A2 2 0 0 0 8.9 20.5h6.2a2 2 0 0 0 2-1.8L18 6.5M10 10.5v6M14 10.5v6"/></svg>,
  outbox: <svg viewBox="0 0 24 24" {...P}><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>,
  draft: <svg viewBox="0 0 24 24" {...P}><path d="M14 3.5H7a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8.5z"/><path d="M14 3.5v5h5M9 13h6M9 16.5h4"/></svg>,
  back: <svg viewBox="0 0 12 20" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2 2 10l8 8"/></svg>,
  chev: <svg viewBox="0 0 8 13" className="chev" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m1.5 1.5 5 5-5 5"/></svg>,
  search: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="7" cy="7" r="5"/><path d="m11 11 3.5 3.5"/></svg>,
  x: <svg viewBox="0 0 16 16" width="17" height="17"><circle cx="8" cy="8" r="8" fill="currentColor"/><path d="m5.3 5.3 5.4 5.4m0-5.4-5.4 5.4" stroke="var(--bg2)" strokeWidth="1.6" strokeLinecap="round"/></svg>,
  compose: <svg viewBox="0 0 24 24" {...P}><path d="M20 12.5V19a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19V6a1.5 1.5 0 0 1 1.5-1.5H12"/><path d="M17.8 3.2a1.8 1.8 0 0 1 2.6 2.6L12.2 14l-3.4.8.8-3.4z"/></svg>,
  reply: <svg viewBox="0 0 24 24" {...P}><path d="M9.5 6 4 11.5 9.5 17"/><path d="M4.5 11.5H14a6 6 0 0 1 6 6v1"/></svg>,
  replyAll: <svg viewBox="0 0 24 24" {...P}><path d="M8 7 3 11.5 8 16"/><path d="M12.5 7 7.5 11.5l5 4.5"/><path d="M8 11.5h6a6 6 0 0 1 6 6v1"/></svg>,
  forward: <svg viewBox="0 0 24 24" {...P}><path d="M14.5 6 20 11.5 14.5 17"/><path d="M19.5 11.5H10a6 6 0 0 0-6 6v1"/></svg>,
  envOpen: <svg viewBox="0 0 24 24" {...P}><path d="M3.5 10 12 4.5 20.5 10v8.5a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5z"/><path d="m3.5 10 8.5 6 8.5-6"/></svg>,
  envDot: <svg viewBox="0 0 24 24" {...P}><rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="m3.5 7 8.5 6 8.5-6"/><circle cx="19.2" cy="5.8" r="3.3" fill="currentColor" stroke="none"/></svg>,
  copy: <svg viewBox="0 0 24 24" {...P}><rect x="8.5" y="8.5" width="11.5" height="11.5" rx="2.2"/><path d="M15.5 8.5V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7.5a2 2 0 0 0 2 2h2.5"/></svg>,
  check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>,
  gear: <svg viewBox="0 0 24 24" {...P}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>,
  filter: <svg viewBox="0 0 24 24" {...P}><circle cx="12" cy="12" r="9"/><path d="M7.5 9.5h9M9 12.5h6M10.5 15.5h3"/></svg>,
  filterOn: <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M7.5 9.5h9M9 12.5h6M10.5 15.5h3" stroke="var(--bg2)" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  key: <svg viewBox="0 0 24 24" {...P}><circle cx="8" cy="15" r="4"/><path d="m11 12 8.5-8.5M16.5 6.5l2.5 2.5M14 9l2 2"/></svg>,
  clip: <svg viewBox="0 0 24 24" {...P}><path d="m20 11.5-7.8 7.8a5 5 0 0 1-7.1-7.1l8.3-8.3a3.4 3.4 0 0 1 4.8 4.8l-8.2 8.2a1.7 1.7 0 0 1-2.4-2.4l7.6-7.6"/></svg>,
  doc: <svg viewBox="0 0 24 24" {...P}><path d="M14 3.5H7a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8.5z"/><path d="M14 3.5v5h5"/></svg>,
  photo: <svg viewBox="0 0 24 24" {...P}><rect x="3" y="4.5" width="18" height="15" rx="2.5"/><circle cx="8.5" cy="9.5" r="1.8"/><path d="m21 15.5-5-5-9 9"/></svg>,
  wifiOff: <svg viewBox="0 0 24 24" {...P}><path d="M3 3l18 18M8.5 12.5a6 6 0 0 1 3.5-1.4M5 9.2a11 11 0 0 1 3.2-2M12 5.5a11 11 0 0 1 7 3.7M15.5 12.5a6 6 0 0 1 1 1"/><circle cx="12" cy="18" r="1.2" fill="currentColor"/></svg>,
  person: <svg viewBox="0 0 24 24" {...P}><circle cx="12" cy="8" r="4"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/></svg>,
  receipt: <svg viewBox="0 0 24 24" {...P}><path d="M6 3.5h12v17l-2.5-1.5-2 1.5-1.5-1.5-1.5 1.5-2-1.5L6 20.5z"/><path d="M9 8.5h6M9 12h6M9 15.5h3"/></svg>,
  news: <svg viewBox="0 0 24 24" {...P}><rect x="3.5" y="4.5" width="14" height="15" rx="2"/><path d="M17.5 8.5h3V18a1.5 1.5 0 0 1-3 0M7 8.5h7M7 12h7M7 15.5h4"/></svg>,
  sparkle: <svg viewBox="0 0 24 24" {...P}><path d="M12 3.5 13.8 10 20.5 12l-6.7 2L12 20.5 10.2 14 3.5 12l6.7-2z"/></svg>,
  grid: <svg viewBox="0 0 24 24" {...P}><rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/></svg>,
  spinner: <svg viewBox="0 0 24 24" className="spin">{Array.from({ length: 8 }, (_, i) => <rect key={i} x="11" y="2" width="2" height="6" rx="1" fill="currentColor" opacity={(i + 2) / 10} transform={`rotate(${i * 45} 12 12)`} />)}</svg>,
};
export const CATS = [['otp', 'Codes', I.key], ['personal', 'Personal', I.person], ['receipts', 'Receipts', I.receipt], ['signups', 'Signups', I.sparkle], ['newsletters', 'Newsletters', I.news]];
export const CAT_LABEL = Object.fromEntries(CATS.map(([k, l]) => [k, l]));
// Inbox address shown in the UI and skipped on reply-all. Set NEXT_PUBLIC_INBOX_ADDRESS at build time.
export const ME = (process.env.NEXT_PUBLIC_INBOX_ADDRESS || '').trim().toLowerCase();
export const ADDR = ME || 'your inbox';
const COLORS = ['#ff9500', '#ff2d55', '#5856d6', '#34c759', '#007aff', '#af52de', '#ff3b30', '#30b0c7', '#a2845e', '#7B3F8C'];

export const emailOf = s => { const m = /<([^>]+)>/.exec(s || ''); return (m ? m[1] : (s || '')).trim().toLowerCase(); };
export const nameOf = s => (s || '').replace(/<.*>/, '').replace(/"/g, '').trim() || emailOf(s) || 'Unknown';
export const splitAddrs = s => (s || '').split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map(x => x.trim()).filter(Boolean);
export const hue = s => { let h = 0; for (const c of s || '') h = (h * 31 + c.charCodeAt(0)) >>> 0; return COLORS[h % COLORS.length]; };
export const initials = s => { const w = nameOf(s).replace(/@.*/, '').split(/[\s._-]+/).filter(Boolean); return ((w[0]?.[0] || '?') + (w[1]?.[0] || '')).toUpperCase(); };
export function Avatar({ who }) { return <div className="avatar" aria-hidden style={{ backgroundColor: hue(emailOf(who) || nameOf(who)) }}>{initials(who)}</div>; }
export const fmt = d => { if (!d) return ''; const t = new Date(d), n = new Date(), day = 864e5;
  if (t.toDateString() === n.toDateString()) return t.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (new Date(n - day).toDateString() === t.toDateString()) return 'Yesterday';
  if (n - t < day * 6) return t.toLocaleDateString([], { weekday: 'long' });
  return t.toLocaleDateString([], { month: 'numeric', day: 'numeric', year: '2-digit' }); };
export const full = d => d ? new Date(d).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';
export const size = n => !n ? '' : n < 1024 ? `${n} B` : n < 1048576 ? `${Math.round(n / 1024)} KB` : `${(n / 1048576).toFixed(1)} MB`;

/* network: never throws; flags offline (service-worker fallback marks cached responses) */
export let onNet = () => {};
export const setNetListener = f => { onNet = f; };
export async function api(u, o) {
  try { const r = await fetch(u, { cache: 'no-store', credentials: 'same-origin', ...o });
    if (r.status === 401) { location.replace('/login'); return null; }
    onNet(!(r.status === 503 || r.headers.get('X-Fig-Offline'))); return await r.json();
  } catch { onNet(false); return null; } }
export const post = (u, b) => api(u, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) });

export async function copyText(t) {
  try { await navigator.clipboard.writeText(t); return true; } catch {}
  try { const a = document.createElement('textarea'); a.value = t; a.setAttribute('readonly', ''); a.style.cssText = 'position:fixed;opacity:0;font-size:16px';
    document.body.appendChild(a); a.select(); a.setSelectionRange(0, t.length); const ok = document.execCommand('copy'); a.remove(); return ok; } catch { return false; } }
export const buzz = () => { try { navigator.vibrate?.(8); } catch {} };

/* search syntax: from:x  has:code  is:unread|read|starred  cat:receipts  + free text */
export function parseQuery(raw) {
  const out = { text: [], params: {} };
  for (const tok of (raw || '').match(/(\w+:"[^"]*"|\S+)/g) || []) {
    const m = /^(\w+):(.+)$/.exec(tok); const v = m ? m[2].replace(/^"|"$/g, '') : null;
    if (m && m[1] === 'from') out.params.from = v;
    else if (m && m[1] === 'has' && /^(code|otp)$/i.test(v)) out.params.code = '1';
    else if (m && m[1] === 'is' && v === 'unread') out.params.unread = '1';
    else if (m && m[1] === 'is' && v === 'read') out.params.unread = '0';
    else if (m && m[1] === 'is' && v === 'starred') out.params.starred = '1';
    else if (m && /^(cat|category|label)$/.test(m[1])) { const c = CATS.find(([k, l]) => k === v.toLowerCase() || l.toLowerCase() === v.toLowerCase() || (v.toLowerCase() === 'code' && k === 'otp')); if (c) out.params.category = c[0]; }
    else out.text.push(tok);
  }
  return { q: out.text.join(' '), ...out.params };
}

/* client-side OTP extraction (mirrors the DB trigger) for full bodies in the reader */
export function findOtp(subject, text) {
  const t = `${subject || ''}\n${text || ''}`;
  const pats = [/\b(\d{4,8})\b\s+is\s+your/i,
    /(?:verification|security|login|sign[- ]?in|one[- ]time|confirmation|access|auth(?:entication)?|otp|2fa)\s*(?:code|pin|passcode|password)?[^0-9A-Za-z]{0,30}(?:is|:)?[^0-9]{0,20}\b(\d{4,8})\b/i,
    /(?:code|passcode|pin|otp)\s*(?:is|:)\s*\b(\d{4,8})\b/i, /(?:code|passcode)[^0-9]{0,40}\b(\d{3}[- ]\d{3})\b/i];
  for (const p of pats) { const m = p.exec(t); if (m) return m[1]; }
  return null;
}

/* local settings & drafts */
export const store = {
  get(k, d) { try { const v = localStorage.getItem('fig:' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('fig:' + k, JSON.stringify(v)); } catch {} },
};
export const DEFAULTS = { theme: 'system', refresh: 5, swipeLeft: 'archive', groupBySender: false, loadImages: false, preview: 2 };
