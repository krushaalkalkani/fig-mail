'use client';
import { useEffect, useRef, useState, memo } from 'react';
import { I, Avatar, nameOf, fmt, buzz, copyText, CAT_LABEL } from '../lib/ui';

/* One message row. Native (non-passive) touch listeners so a horizontal swipe can
   claim the gesture without fighting vertical scroll; touches that start at the
   screen edge are ignored so iOS's edge-swipe-back still works. */
function Row({ m, kind, sel, picked, selecting, swipeLeft, onOpen, onPick, onSwipe, onCopied, showCat }) {
  const wrap = useRef(null), row = useRef(null), g = useRef(null), moved = useRef(false), pressT = useRef(0);
  const [dx, setDx] = useState(0), [anim, setAnim] = useState(false), [press, setPress] = useState(false);
  const canSwipe = kind === 'mail' && !selecting;
  const TH = () => Math.min(130, (wrap.current?.offsetWidth || 390) * .32);

  useEffect(() => {
    const el = row.current; if (!el) return;
    const start = e => {
      const t = e.touches[0]; moved.current = false;
      g.current = { x: t.clientX, y: t.clientY, lock: null, dx: 0, edge: t.clientX < 24, armed: false };
      clearTimeout(pressT.current); pressT.current = setTimeout(() => setPress(true), 90);
    };
    const move = e => {
      const s = g.current; if (!s) return; const t = e.touches[0], ddx = t.clientX - s.x, ddy = t.clientY - s.y;
      if (s.lock == null && (Math.abs(ddx) > 6 || Math.abs(ddy) > 6)) {
        s.lock = !s.edge && canSwipe && Math.abs(ddx) > Math.abs(ddy) * 1.2 ? 'x' : 'y';
        moved.current = true; clearTimeout(pressT.current); setPress(false);
      }
      if (s.lock !== 'x') return;
      e.preventDefault(); setAnim(false);
      const th = TH(), a = Math.abs(ddx), v = a > th ? Math.sign(ddx) * (th + (a - th) * .55) : ddx;
      const armed = a > th; if (armed !== s.armed) { s.armed = armed; buzz(); }
      s.dx = v; setDx(v);
    };
    const end = () => {
      clearTimeout(pressT.current); setTimeout(() => setPress(false), 120);
      const s = g.current; g.current = null; if (!s || s.lock !== 'x') return;
      setAnim(true);
      if (s.armed && s.dx < 0) { setDx(-(wrap.current?.offsetWidth || 400) - 20); setTimeout(() => onSwipe(m, 'left'), 260); }
      else { if (s.armed && s.dx > 0) onSwipe(m, 'right'); setDx(0); }
    };
    const cancel = () => { clearTimeout(pressT.current); setPress(false); g.current = null; setAnim(true); setDx(0); };
    el.addEventListener('touchstart', start, { passive: true });
    el.addEventListener('touchmove', move, { passive: false });
    el.addEventListener('touchend', end, { passive: true });
    el.addEventListener('touchcancel', cancel, { passive: true });
    return () => { el.removeEventListener('touchstart', start); el.removeEventListener('touchmove', move); el.removeEventListener('touchend', end); el.removeEventListener('touchcancel', cancel); };
  }, [m, canSwipe, onSwipe]);
  useEffect(() => { setDx(0); }, [m.id, m.read, m.archived, m.deleted_at]);

  const click = e => { if (moved.current || Math.abs(dx) > 3) return; if (selecting) onPick(m); else onOpen(m); };
  const unread = kind === 'mail' && !m.read;
  const who = kind === 'out' || kind === 'draft' || (m.labels || []).includes('SENT') ? (m.to || '') : m.from;
  const whoLabel = kind === 'draft' ? (m.to ? `To: ${nameOf(m.to)}` : 'No Recipients') : kind === 'out' || (m.labels || []).includes('SENT') ? `To: ${nameOf(m.to)}` : nameOf(m.from);
  const leftAct = swipeLeft === 'trash' || m.deleted_at ? 'trash' : 'archive';
  const copy = async e => { e.stopPropagation(); if (await copyText(m.otp)) { buzz(); onCopied(m.otp); } };

  return <div className="rowwrap" ref={wrap}>
    {dx !== 0 && <div className="acts" aria-hidden>
      {dx > 0 && <div className="lt" style={{ width: dx }}>{m.read ? I.envDot : I.envOpen}<span>{m.read ? 'Unread' : 'Read'}</span></div>}
      {dx < 0 && <div className={`rt ${leftAct}`} style={{ width: -dx }}>{leftAct === 'trash' ? I.trash : m.archived ? I.inbox : I.archive}<span>{leftAct === 'trash' ? (m.deleted_at ? 'Restore' : 'Trash') : m.archived ? 'Inbox' : 'Archive'}</span></div>}
    </div>}
    <div ref={row} role="button" tabIndex={-1} aria-selected={!!sel} aria-label={`${whoLabel}, ${m.subject || 'No Subject'}${unread ? ', unread' : ''}`}
      className={`row ${anim ? 'anim' : ''} ${sel ? 'sel' : ''} ${press ? 'press' : ''}`} style={{ transform: dx ? `translate3d(${dx}px,0,0)` : undefined }} onClick={click}>
      {selecting ? <span className={`check ${picked ? 'on' : ''}`}>{picked && I.check}</span>
        : <div className="lead">{unread && <span className="dot" aria-hidden />}</div>}
      <Avatar who={who} />
      <div className="main">
        <div className="l1"><span className={`from ${unread ? 'u' : ''}`}>{whoLabel}</span>
          <span className="time">{m.has_attachments && <span className="mini" aria-label="Attachment">{I.clip}</span>}{m.starred && <span className="mini star" aria-label="Starred">{I.starFill}</span>}{fmt(m.received_at || m.created_at || m.updated)}{I.chev}</span></div>
        <div className={`subj ${unread ? 'u' : ''}`}><span>{m.subject || '(No Subject)'}</span>{kind === 'out' && <span className={`badge ${m.status}`}>{m.status}</span>}{kind === 'draft' && <span className="badge">Draft</span>}</div>
        <div className="prev">{kind === 'mail' ? (m.snippet || '') : (m.body || '')}</div>
        {kind === 'mail' && (m.otp || (showCat && m.category)) && <div className="tags">
          {m.otp && <button className="code" onClick={copy} aria-label={`Copy code ${m.otp}`}>{I.copy}{m.otp}</button>}
          {showCat && m.category && !m.otp && <span className={`tag ${m.category}`}>{CAT_LABEL[m.category]}</span>}
        </div>}
      </div>
    </div>
  </div>;
}
export default memo(Row);
