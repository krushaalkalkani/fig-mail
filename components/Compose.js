'use client';
import { useEffect, useRef, useState } from 'react';
import { post, buzz, store, ADDR } from '../lib/ui';

export const loadDrafts = () => store.get('drafts', []);
export const saveDrafts = d => store.set('drafts', d);
const empty = f => !((f.to || '').trim() || (f.cc || '').trim() || (f.subject || '').trim() || (f.body || '').replace(/\n\nOn .* wrote:[\s\S]*$|\n\n---------- Forwarded message[\s\S]*$/, '').trim());

/* iOS bottom-sheet composer: grabber, Cancel / Send, hairline fields, autosaved
   drafts in localStorage, and keyboard-aware height via visualViewport. */
export default function Compose({ init, onClose, onQueued, actionSheet }) {
  const [f, setF] = useState(init), [busy, setBusy] = useState(false), [err, setErr] = useState(''), [out, setOut] = useState(false);
  const [saved, setSaved] = useState(false), [kb, setKb] = useState(0), [dy, setDy] = useState(0);
  const id = useRef(init.draftId || `d${Date.now().toString(36)}`), gy = useRef(null), sheet = useRef(null), body = useRef(null);
  const set = k => e => setF(s => ({ ...s, [k]: e.target.value }));

  // autosave (debounced)
  useEffect(() => { if (empty(f)) return; const t = setTimeout(() => {
    const d = loadDrafts().filter(x => x.id !== id.current); d.unshift({ ...f, id: id.current, updated: new Date().toISOString() }); saveDrafts(d.slice(0, 50)); setSaved(true);
  }, 500); return () => clearTimeout(t); }, [f]);
  const dropDraft = () => saveDrafts(loadDrafts().filter(x => x.id !== id.current));

  // keyboard: shrink the sheet to the visual viewport so the caret is never hidden
  useEffect(() => { const vv = window.visualViewport; if (!vv) return;
    const on = () => { const k = Math.max(0, window.innerHeight - vv.height - vv.offsetTop); setKb(k > 60 ? k : 0); };
    vv.addEventListener('resize', on); vv.addEventListener('scroll', on); on();
    return () => { vv.removeEventListener('resize', on); vv.removeEventListener('scroll', on); }; }, []);
  // lock background scroll while open
  useEffect(() => { const b = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = b; }; }, []);
  useEffect(() => { if (init.focusBody && body.current) { body.current.focus(); body.current.setSelectionRange(0, 0); body.current.scrollTop = 0; } }, [init.focusBody]);

  const close = () => { setOut(true); setTimeout(onClose, 300); };
  const cancel = () => {
    if (empty(f)) { dropDraft(); return close(); }
    actionSheet({ items: [{ label: 'Delete Draft', red: true, run: () => { dropDraft(); close(); } }, { label: 'Save Draft', run: close }] });
  };
  async function send() {
    if (!f.to.trim()) return setErr('Add at least one recipient.');
    const bad = f.to.split(',').concat((f.cc || '').split(',')).map(s => s.trim()).filter(Boolean).filter(s => !/@[^@\s]+\.[^@\s]+>?$/.test(s));
    if (bad.length) return setErr(`Check address: ${bad[0]}`);
    setBusy(true); setErr('');
    const r = await post('/api/send', { to: f.to, cc: f.cc, subject: f.subject, body: f.body, thread: f.thread });
    setBusy(false);
    if (r?.ok) { dropDraft(); buzz(); setOut(true); setTimeout(onQueued, 300); } else setErr(r?.error === 'offline' || !r ? 'You’re offline — saved as a draft.' : r.error);
  }
  // drag the grabber down to dismiss
  const gs = e => { gy.current = e.touches[0].clientY; };
  const gm = e => { if (gy.current != null) setDy(Math.max(0, e.touches[0].clientY - gy.current)); };
  const ge = () => { gy.current = null; if (dy > 120) cancel(); setDy(0); };
  const title = { reply: 'Reply', replyAll: 'Reply All', forward: 'Forward' }[f.mode] || 'New Message';

  return <>
    <div className={`dim ${out ? 'out' : ''}`} onClick={cancel} />
    <div ref={sheet} className={`sheet ${out ? 'out' : ''}`} role="dialog" aria-modal="true" aria-label={title}
      style={{ ...(kb ? { bottom: kb } : null), ...(dy ? { transform: `translate3d(0,${dy}px,0)`, transition: 'none' } : null) }}>
      <div onTouchStart={gs} onTouchMove={gm} onTouchEnd={ge} className="chrome">
        <div className="grab" />
        <div className="sheetbar"><button className="nbtn" onClick={cancel}>Cancel</button><span className="ttl">{title}</span>
          <button className="nbtn b" disabled={busy || !f.to.trim()} onClick={send}>{busy ? 'Sending…' : 'Send'}</button></div>
      </div>
      <div className="field"><label htmlFor="c-to">To:</label><input id="c-to" value={f.to} onChange={set('to')} type="text" inputMode="email" autoCapitalize="off" autoCorrect="off" autoComplete="email" enterKeyHint="next" autoFocus={!f.to} /></div>
      <div className="field"><label htmlFor="c-cc">Cc:</label><input id="c-cc" value={f.cc} onChange={set('cc')} type="text" inputMode="email" autoCapitalize="off" autoCorrect="off" enterKeyHint="next" /></div>
      <div className="field"><label htmlFor="c-sub">Subject:</label><input id="c-sub" value={f.subject} onChange={set('subject')} enterKeyHint="next" /></div>
      {err && <div className="serr" role="alert">{err}</div>}
      <textarea ref={body} aria-label="Message" value={f.body} onChange={set('body')} />
      <div className="draftnote">{saved ? 'Draft saved on this device · ' : ''}Sends from {ADDR} via Fig</div>
    </div>
  </>;
}
