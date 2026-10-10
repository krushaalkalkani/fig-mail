'use client';
import { useEffect, useRef, useState } from 'react';
import Row from './Row';
import { I, nameOf, emailOf, buzz, ADDR } from '../lib/ui';

const EMPTY = {
  inbox: [I.inbox, 'Inbox Zero', `New mail to ${ADDR} shows up here.`],
  starred: [I.star, 'No Starred Mail', 'Star messages to keep them handy.'],
  sent: [I.sent, 'Nothing Sent', 'Mail sent from Fig appears here.'],
  archive: [I.archive, 'Archive Is Empty', 'Swipe left on a message to archive it.'],
  trash: [I.trash, 'Trash Is Empty', 'Deleted mail stays here until you empty the trash.'],
  outbox: [I.outbox, 'Nothing Queued', 'Messages you send wait here until Fig delivers them.'],
  drafts: [I.draft, 'No Drafts', 'Unsent messages are saved automatically.'],
};

function Skeleton() {
  return <div aria-hidden>{Array.from({ length: 7 }, (_, i) => <div key={i} className="skel">
    <i style={{ width: 40, height: 40, borderRadius: 20, flex: 'none' }} />
    <div style={{ flex: 1, display: 'grid', gap: 7, paddingTop: 2 }}>
      <i style={{ height: 14, width: `${45 + (i * 13) % 30}%` }} /><i style={{ height: 12, width: `${70 + (i * 7) % 25}%` }} /><i style={{ height: 12, width: '92%' }} />
    </div></div>)}</div>;
}

/* Scrollable list with iOS pull-to-refresh (native non-passive listeners; list has
   overscroll-behavior:none so the native bounce doesn't fight our spinner). */
export default function List({ items, loading, err, folder, kind, query, header, onScroll, refresh, groupBySender, rowProps }) {
  const sc = useRef(null), st = useRef(null), [pull, setPull] = useState(0), [busy, setBusy] = useState(false), pullRef = useRef(0);
  useEffect(() => {
    const el = sc.current; if (!el) return;
    const start = e => { st.current = el.scrollTop <= 0 && !busy ? { y: e.touches[0].clientY, x: e.touches[0].clientX, armed: false, on: null } : null; };
    const move = e => { const s = st.current; if (!s) return; const dy = e.touches[0].clientY - s.y, dx = e.touches[0].clientX - s.x;
      if (s.on == null && (Math.abs(dy) > 6 || Math.abs(dx) > 6)) s.on = dy > 0 && Math.abs(dy) > Math.abs(dx) && el.scrollTop <= 0;
      if (!s.on) return; e.preventDefault();
      const p = Math.max(0, dy < 160 ? dy * .5 : 80 + (dy - 160) * .2); pullRef.current = p; setPull(p);
      const armed = p > 64; if (armed !== s.armed) { s.armed = armed; if (armed) buzz(); } };
    const end = async () => { const s = st.current; st.current = null; if (!s || !s.on) return;
      if (s.armed) { setBusy(true); setPull(56); try { await refresh(); } finally { await new Promise(r => setTimeout(r, 400)); setBusy(false); setPull(0); } }
      else setPull(0); };
    el.addEventListener('touchstart', start, { passive: true }); el.addEventListener('touchmove', move, { passive: false });
    el.addEventListener('touchend', end, { passive: true }); el.addEventListener('touchcancel', end, { passive: true });
    return () => { el.removeEventListener('touchstart', start); el.removeEventListener('touchmove', move); el.removeEventListener('touchend', end); el.removeEventListener('touchcancel', end); };
  }, [refresh, busy]);

  let body;
  if (err && !items.length) body = <div className="empty">{I.wifiOff}<b>Can’t Load Mail</b>{err === 'offline' ? 'You’re offline. Pull down to try again.' : 'Something went wrong. Pull down to retry.'}</div>;
  else if (loading && !items.length) body = <Skeleton />;
  else if (!items.length) { const e = query ? [I.search, 'No Results', `Nothing matches “${query}”.`] : EMPTY[folder] || EMPTY.inbox; body = <div className="empty">{e[0]}<b>{e[1]}</b>{e[2]}</div>; }
  else if (groupBySender && kind === 'mail') {
    const groups = new Map();
    for (const m of items) { const k = emailOf(m.from) || m.from; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(m); }
    body = [...groups].map(([k, ms]) => <section key={k}><div className="sender-h"><span>{nameOf(ms[0].from)}</span><span>{ms.length}</span></div>
      {ms.map(m => <Row key={m.id} m={m} kind={kind} {...rowProps(m)} />)}</section>);
  } else body = items.map(m => <Row key={m.id} m={m} kind={kind} {...rowProps(m)} />);

  return <div className="scroll list-scroll" ref={sc} onScroll={onScroll} style={{ paddingBottom: 'calc(64px + var(--sb))' }}>
    {header}
    <div className="ptr" aria-hidden style={{ height: pull, transition: st.current?.on ? 'none' : 'height .4s var(--ease)' }}>
      <div style={{ opacity: busy ? 1 : Math.min(1, pull / 60), transform: busy ? 'none' : `rotate(${pull * 3}deg) scale(${.6 + Math.min(1, pull / 64) * .4})` }}>
        <span className={busy ? 'spinwrap go' : 'spinwrap'}>{I.spinner}</span></div>
    </div>
    <div role="list" aria-busy={loading}>{body}</div>
  </div>;
}
