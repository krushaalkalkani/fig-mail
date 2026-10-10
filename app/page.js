'use client';
import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { I, CATS, CAT_LABEL, ME, ADDR, nameOf, emailOf, splitAddrs, full, api, post, buzz, copyText, parseQuery, store, DEFAULTS, setNetListener } from '../lib/ui';
import List from '../components/List';
import Reader from '../components/Reader';
import Compose, { loadDrafts, saveDrafts } from '../components/Compose';
import Settings, { ActionSheet } from '../components/Settings';

const FOLDERS = [['inbox', 'Inbox', I.inbox], ['drafts', 'Drafts', I.draft], ['starred', 'Starred', I.star], ['sent', 'Sent', I.sent], ['outbox', 'Outbox', I.outbox], ['archive', 'Archive', I.archive], ['trash', 'Trash', I.trash]];
const TITLE = Object.fromEntries(FOLDERS.map(([k, l]) => [k, l]));
const useCollapse = () => { const [s, set] = useState(false); return [s, useCallback(e => set(e.currentTarget.scrollTop > 36), [])]; };
const isDesk = () => typeof window !== 'undefined' && window.matchMedia('(min-width:1024px)').matches;
const quote = (m) => `\n\nOn ${full(m.received_at)}, ${nameOf(m.from)} <${emailOf(m.from)}> wrote:\n> ${(m.body_text || m.snippet || '').split('\n').join('\n> ')}`;

export default function Mail() {
  const [settings, setSettings] = useState(DEFAULTS);
  const [folder, setFolder] = useState('inbox'), [cat, setCat] = useState(null), [qLive, setQLive] = useState(''), [q, setQ] = useState('');
  const [items, setItems] = useState([]), [loading, setLoading] = useState(true), [err, setErr] = useState('');
  const [sel, setSel] = useState(null), [thread, setThread] = useState([]), [counts, setCounts] = useState({});
  const [stack, setStack] = useState(1), [noAnim, setNoAnim] = useState(false);
  const [selecting, setSelecting] = useState(false), [picked, setPicked] = useState(() => new Set());
  const [compose, setCompose] = useState(null), [showSettings, setShowSettings] = useState(false), [sheet, setSheet] = useState(null);
  const [banner, setBanner] = useState(null), [undo, setUndo] = useState(null), [offline, setOffline] = useState(false), [updated, setUpdated] = useState(null);
  const [drafts, setDrafts] = useState([]), [unreadOnly, setUnreadOnly] = useState(false);
  const [boxSolid, onBoxScroll] = useCollapse(), [listSolid, onListScroll] = useCollapse(), [readSolid, onReadScroll] = useCollapse();
  const fromBoxes = useRef(false), known = useRef(null), bt = useRef(null), ut = useRef(null), edgeT = useRef(0), searchRef = useRef(null), loadSeq = useRef(0);
  const kind = folder === 'outbox' ? 'out' : folder === 'drafts' ? 'draft' : 'mail';

  /* ---- settings & theme ---- */
  useEffect(() => { const s = { ...DEFAULTS, ...store.get('settings', {}) }; s.theme = store.get('theme', 'system'); setSettings(s); setDrafts(loadDrafts()); }, []);
  const set = useCallback(p => setSettings(s => { const n = { ...s, ...p }; const { theme, ...rest } = n; store.set('settings', rest); store.set('theme', theme); return n; }), []);
  useEffect(() => { const r = document.documentElement; if (settings.theme === 'system') delete r.dataset.theme; else r.dataset.theme = settings.theme;
    const dark = settings.theme === 'dark' || (settings.theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
    document.querySelectorAll('meta[name=theme-color]').forEach(mt => { mt.setAttribute('content', dark ? '#000000' : '#ffffff'); }); }, [settings.theme]);

  /* ---- network / offline ---- */
  useEffect(() => { setNetListener(ok => setOffline(!ok)); const on = () => setOffline(!navigator.onLine);
    addEventListener('online', on); addEventListener('offline', on); on(); return () => { removeEventListener('online', on); removeEventListener('offline', on); }; }, []);
  useEffect(() => { if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {}); }, []);

  const flash = useCallback((title, body, ms = 3800) => { clearTimeout(bt.current); setBanner({ title, body }); bt.current = setTimeout(() => setBanner(null), ms); }, []);
  const toastUndo = useCallback((text, revert) => { clearTimeout(ut.current); setUndo({ text, revert }); ut.current = setTimeout(() => setUndo(null), 5000); }, []);

  /* ---- data ---- */
  const params = useMemo(() => { const p = parseQuery(q); if (cat && folder === 'inbox') p.category = cat; if (unreadOnly && folder !== 'drafts' && folder !== 'outbox') p.unread = '1'; return p; }, [q, cat, unreadOnly, folder]);
  const load = useCallback(async (silent) => {
    if (folder === 'drafts') { const d = loadDrafts(); setDrafts(d); setItems(d.filter(x => !q || JSON.stringify(x).toLowerCase().includes(q.toLowerCase()))); setLoading(false); return; }
    const seq = ++loadSeq.current; if (!silent) { setLoading(true); setErr(''); }
    const qs = new URLSearchParams({ folder, ...Object.fromEntries(Object.entries(params).filter(([, v]) => v)) });
    const d = folder === 'outbox' ? await api('/api/outbox') : await api(`/api/messages?${qs}`);
    if (seq !== loadSeq.current) return;
    if (Array.isArray(d)) {
      if (folder === 'outbox') setItems(d);
      else { const seen = new Set(); setItems(d.filter(m => { const k = m.thread_id || m.id; if (seen.has(k)) return false; seen.add(k); return true; })); }
      setUpdated(new Date()); setErr('');
    } else if (!silent || !items.length) setErr(d?.error || 'offline');
    setLoading(false);
    const c = await api('/api/counts'); if (c && !c.error) setCounts(c);
  }, [folder, params]); // eslint-disable-line react-hooks/exhaustive-deps
  const checkNew = useCallback(async () => {
    const d = await api('/api/messages?folder=inbox'); if (!Array.isArray(d)) return;
    if (known.current) { const fresh = d.filter(m => !known.current.has(m.id));
      if (fresh.length) { flash(fresh.length === 1 ? nameOf(fresh[0].from) : 'New Mail', fresh.length === 1 ? (fresh[0].otp ? `Code ${fresh[0].otp} · ${fresh[0].subject || ''}` : fresh[0].subject || '(No Subject)') : `${fresh.length} new messages`); load(true); } }
    known.current = new Set(d.map(m => m.id));
  }, [load, flash]);
  useEffect(() => { setItems([]); load(); }, [load]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    let t = null; const ms = (settings.refresh || 0) * 1000;
    const tick = () => { if (document.visibilityState === 'visible') { checkNew(); load(true); } };
    const start = () => { if (ms && !t) t = setInterval(tick, ms); }, stop = () => { clearInterval(t); t = null; };
    const onVis = () => { if (document.visibilityState === 'visible') { tick(); start(); } else stop(); };
    checkNew(); if (document.visibilityState === 'visible') start();
    document.addEventListener('visibilitychange', onVis); addEventListener('focus', tick); addEventListener('pageshow', tick);
    return () => { stop(); document.removeEventListener('visibilitychange', onVis); removeEventListener('focus', tick); removeEventListener('pageshow', tick); };
  }, [load, checkNew, settings.refresh]);
  useEffect(() => { document.title = counts.inbox > 0 ? `(${counts.inbox}) Fig Mail` : 'Fig Mail'; }, [counts.inbox]);

  /* ---- navigation stack wired to history (system back / edge swipe pop it) ---- */
  useEffect(() => {
    history.replaceState({ s: 1 }, ''); // never push without a user gesture: WebKit/Chrome skip such entries on Back
    const pop = e => { const s = e.state?.s ?? 1;
      if (Date.now() - edgeT.current < 1200) { setNoAnim(true); setTimeout(() => setNoAnim(false), 60); } // Safari already animated the edge swipe
      setStack(s); if (s < 2) setTimeout(() => !isDesk() && setSel(null), 500); };
    const ts = e => { const x = e.touches[0].clientX; if (x < 24 || x > innerWidth - 24) edgeT.current = Date.now(); };
    addEventListener('popstate', pop); addEventListener('touchstart', ts, { passive: true });
    return () => { removeEventListener('popstate', pop); removeEventListener('touchstart', ts); };
  }, []);
  const push = n => { if (n > stack) { for (let i = stack + 1; i <= n; i++) history.pushState({ s: i }, ''); setStack(n); } };
  const pop = () => { if (stack === 1 && history.state?.s === 1 && !fromBoxes.current) { history.replaceState({ s: 0 }, ''); setStack(0); } else history.back(); };

  /* ---- actions ---- */
  const refreshCounts = () => api('/api/counts').then(c => c && !c.error && setCounts(c));
  async function open(m) {
    if (kind === 'draft') return setCompose({ ...m, draftId: m.id });
    setSel(m); setThread(kind === 'mail' ? [m] : []); push(2); onReadScroll({ currentTarget: { scrollTop: 0 } });
    if (kind !== 'mail') return;
    const t = await api(`/api/thread?id=${encodeURIComponent(m.thread_id || m.id)}`);
    const all = Array.isArray(t) && t.length ? t.filter(x => folder === 'trash' ? x.deleted_at : !x.deleted_at) : [m];
    setThread(all.length ? all : [m]);
    const unread = all.filter(x => !x.read).map(x => x.id);
    if (unread.length) { setItems(s => s.map(x => x.id === m.id ? { ...x, read: true } : x)); await post('/api/update', { ids: unread, read: true }); refreshCounts(); }
  }
  const idsFor = m => (sel?.id === m.id && thread.length ? thread.map(x => x.id) : [m.id]);
  const removes = p => (p.deleted !== undefined) || (p.archived !== undefined && folder !== 'starred') || (p.read === false && false);
  async function apply(list, p, label, inverse) {
    const ids = [...new Set(list.flatMap(idsFor))]; if (!ids.length) return;
    if (removes(p)) setItems(s => s.filter(x => !list.some(m => m.id === x.id)));
    else setItems(s => s.map(x => list.some(m => m.id === x.id) ? { ...x, ...p, deleted_at: p.deleted === undefined ? x.deleted_at : p.deleted ? 1 : null } : x));
    if (sel && list.some(m => m.id === sel.id)) { if (removes(p)) { if (isDesk()) setSel(null); else if (stack === 2) pop(); } else setSel(s => s && { ...s, ...p }); }
    const r = await post('/api/update', { ids, ...p });
    if (!r?.ok) { flash('Couldn’t Update', 'Check your connection and try again.'); load(true); return; }
    if (label && inverse) toastUndo(label, async () => { await post('/api/update', { ids, ...inverse }); load(true); refreshCounts(); });
    refreshCounts(); load(true);
  }
  const archive = list => { const a = !list[0].archived; apply(list, { archived: a }, `${list.length > 1 ? list.length + ' messages' : 'Message'} ${a ? 'archived' : 'moved to Inbox'}`, { archived: !a }); };
  const trash = list => { if (folder === 'trash') return apply(list, { deleted: false }, `${list.length > 1 ? list.length + ' messages' : 'Message'} restored`, { deleted: true });
    apply(list, { deleted: true }, `${list.length > 1 ? list.length + ' messages' : 'Message'} moved to Trash`, { deleted: false }); };
  const purge = list => setSheet({ title: `Delete ${list.length > 1 ? list.length + ' messages' : 'this message'} permanently? This can’t be undone.`, items: [{ label: 'Delete Forever', red: true, run: async () => {
    const ids = [...new Set(list.flatMap(idsFor))]; setItems(s => s.filter(x => !ids.includes(x.id))); if (sel && ids.includes(sel.id)) { isDesk() ? setSel(null) : stack === 2 && pop(); }
    await post('/api/purge', { ids }); refreshCounts(); } }] });
  const star = list => { const v = !list.every(m => m.starred); apply(list, { starred: v }); };
  const markRead = (list, v) => apply(list, { read: v });
  const onSwipe = useCallback((m, dir) => {
    if (dir === 'right') return apply([m], { read: !m.read });
    if (settings.swipeLeft === 'trash' || folder === 'trash') trash([m]); else archive([m]);
  }, [settings.swipeLeft, folder, sel, thread, stack, items]); // eslint-disable-line react-hooks/exhaustive-deps
  const setCategory = () => setSheet({ title: 'Move to Category', items: CATS.map(([k, l]) => ({ label: (sel?.category === k ? '✓ ' : '') + l, run: () => apply([sel], { category: k }) })) });

  /* compose variants */
  const newMsg = () => setCompose({ to: '', cc: '', subject: '', body: '', mode: 'new' });
  function reply(m, mode = 'reply') {
    const last = thread[thread.length - 1] || m, mine = (last.labels || []).includes('SENT');
    const subj = (p, s) => new RegExp(`^${p}:`, 'i').test(s || '') ? s : `${p}: ${s || ''}`;
    if (mode === 'forward') return setCompose({ to: '', cc: '', mode, subject: subj('Fwd', m.subject),
      body: `\n\n---------- Forwarded message ---------\nFrom: ${last.from}\nDate: ${full(last.received_at)}\nSubject: ${last.subject || ''}\nTo: ${last.to}${last.cc ? `\nCc: ${last.cc}` : ''}\n\n${last.body_text || last.snippet || ''}` });
    const to = mine ? last.to : last.from;
    let cc = '';
    if (mode === 'replyAll') { const skip = new Set([ME, emailOf(to)]); cc = [...splitAddrs(last.to), ...splitAddrs(last.cc)].filter(a => { const e = emailOf(a); if (skip.has(e)) return false; skip.add(e); return true; }).join(', '); }
    setCompose({ to: to || '', cc, mode, subject: subj('Re', m.subject), body: quote(last), thread: m.thread_id || m.id, focusBody: true });
  }
  const replyMenu = m => setSheet({ items: [{ label: 'Reply', run: () => reply(m) }, { label: 'Reply All', run: () => reply(m, 'replyAll') }, { label: 'Forward', run: () => reply(m, 'forward') },
    { label: m.read === false ? 'Mark as Read' : 'Mark as Unread', run: () => markRead([m], m.read === false) }, { label: CAT_LABEL[m.category] ? `Category: ${CAT_LABEL[m.category]}…` : 'Set Category…', run: setCategory }] });

  /* select mode */
  const togglePick = useCallback(m => setPicked(p => { const n = new Set(p); n.has(m.id) ? n.delete(m.id) : n.add(m.id); return n; }), []);
  const endSelect = () => { setSelecting(false); setPicked(new Set()); };
  const pickedList = items.filter(m => picked.has(m.id));
  const bulk = fn => { if (!pickedList.length) return; fn(pickedList); endSelect(); };
  const deleteDrafts = list => { const ids = new Set(list.map(d => d.id)); const d = loadDrafts().filter(x => !ids.has(x.id)); saveDrafts(d); setDrafts(d); setItems(d); };

  const pick = (f, c = null) => { if (f !== folder || c !== cat) { setItems([]); setSel(null); } setFolder(f); setCat(c); endSelect(); setUnreadOnly(false);
    if (!isDesk() && stack === 0) { fromBoxes.current = true; push(1); } };

  /* desktop keyboard shortcuts */
  useEffect(() => {
    const key = e => {
      if (e.metaKey || e.ctrlKey || e.altKey) return; const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) { if (e.key === 'Escape') e.target.blur(); return; }
      if (compose || showSettings || sheet) { if (e.key === 'Escape') { setSheet(null); setShowSettings(false); } return; }
      const i = sel ? items.findIndex(x => x.id === sel.id) : -1, cur = sel || items[0];
      const k = e.key;
      if (k === 'j' || k === 'ArrowDown') { const n = items[Math.min(items.length - 1, i + 1)]; if (n) open(n); }
      else if (k === 'k' || k === 'ArrowUp') { const n = items[Math.max(0, i - 1)]; if (n) open(n); }
      else if (k === 'Enter' && cur) open(cur);
      else if (k === 'c') newMsg();
      else if (k === '/') { searchRef.current?.focus(); }
      else if (k === 'Escape') { if (selecting) endSelect(); else if (stack === 2 && !isDesk()) pop(); }
      else if (!cur || kind !== 'mail') return;
      else if (k === 'e') archive([cur]);
      else if (k === '#' || k === 'Delete' || k === 'Backspace') trash([cur]);
      else if (k === 's') star([cur]);
      else if (k === 'u') markRead([cur], !cur.read);
      else if (k === 'r' && sel) reply(sel);
      else if (k === 'a' && sel) reply(sel, 'replyAll');
      else if (k === 'f' && sel) reply(sel, 'forward');
      else if (k === 'x') { setSelecting(true); togglePick(cur); }
      else return;
      e.preventDefault();
    };
    addEventListener('keydown', key); return () => removeEventListener('keydown', key);
  });

  const title = cat && folder === 'inbox' ? CAT_LABEL[cat] : TITLE[folder];
  const cls = n => `screen ${['boxes', 'list', 'reader'][n]} ${stack === n ? 'top' : stack > n ? 'under' : 'off-right'}`;
  const copyAddr = async () => { if (await copyText(ME)) { buzz(); flash('Copied', ADDR, 1800); } };
  const rowProps = useCallback(m => ({ sel: sel?.id === m.id, picked: picked.has(m.id), selecting, swipeLeft: settings.swipeLeft, onOpen: open, onPick: togglePick, onSwipe,
    onCopied: c => flash('Code Copied', c, 1800), showCat: folder !== 'inbox' || !cat }), [sel, picked, selecting, settings.swipeLeft, onSwipe, folder, cat, items, thread, stack]); // eslint-disable-line react-hooks/exhaustive-deps
  const signOut = async () => { try { navigator.serviceWorker?.controller?.postMessage('clear'); } catch {} await post('/api/logout', {}); location.replace('/login'); };
  const allPicked = items.length > 0 && picked.size === items.length;

  return <div className="shell" style={noAnim ? { '--ease': 'steps(1,end)' } : undefined}>
    {/* ---------------- mailboxes ---------------- */}
    <section className={cls(0)} aria-label="Mailboxes" aria-hidden={stack !== 0 && !isDesk() ? true : undefined}>
      <div className={`navbar chrome ${boxSolid ? 'solid' : ''}`}><div className="mid">Mailboxes</div>
        <div className="r"><button className="nbtn" aria-label="Settings" onClick={() => setShowSettings(true)}>{I.gear}</button></div></div>
      <div className="scroll" onScroll={onBoxScroll} style={{ paddingBottom: 'calc(24px + var(--sb))' }}>
        <div className="head chrome"><h1 className="t-large">Mailboxes</h1>
          <button className="addr" onClick={copyAddr} aria-label={`Copy ${ADDR}`}>{I.copy}<span>{ADDR}</span></button></div>
        <button className="compose-d desk-only" onClick={newMsg}>{I.compose} New Message</button>
        <div className="ghead">Fig Mail</div>
        <div className="group">
          {FOLDERS.map(([k, l, ic]) => <button key={k} className={`cell ${folder === k && !cat ? 'on' : ''}`} onClick={() => pick(k)}>
            <span className="ic">{ic}</span><span className="lb">{l}</span>
            <span className="ct">{k === 'inbox' ? counts.inbox || '' : k === 'outbox' ? counts.outbox || '' : k === 'drafts' ? drafts.length || '' : k === 'trash' ? counts.trash || '' : k === 'starred' ? counts.starred || '' : ''}</span>{I.chev}
          </button>)}
        </div>
        <div className="ghead">Categories</div>
        <div className="group">
          {CATS.map(([k, l, ic]) => <button key={k} className={`cell ${folder === 'inbox' && cat === k ? 'on' : ''}`} onClick={() => pick('inbox', k)}>
            <span className="ic">{ic}</span><span className="lb">{l}</span><span className="ct">{counts.cats?.[k] || ''}</span>{I.chev}</button>)}
        </div>
        <div className="group desk-only" style={{ flexDirection: 'column' }}><button className="cell" onClick={() => setShowSettings(true)}><span className="ic">{I.gear}</span><span className="lb">Settings</span></button></div>
      </div>
      <div className="shade" />
    </section>

    {/* ---------------- message list ---------------- */}
    <section className={cls(1)} aria-label={title} aria-hidden={stack !== 1 && !isDesk() ? true : undefined}>
      <div className={`navbar chrome ${listSolid ? 'solid' : ''}`}>
        <div className="l">{selecting
          ? <button className="nbtn" onClick={() => setPicked(allPicked ? new Set() : new Set(items.map(m => m.id)))}>{allPicked ? 'Deselect All' : 'Select All'}</button>
          : <button className="nbtn back mob-only" onClick={pop} aria-label="Back to Mailboxes">{I.back}<span>Mailboxes</span></button>}</div>
        <div className="mid">{selecting ? `${picked.size} Selected` : title}</div>
        <div className="r">{items.length > 0 && kind !== 'out' && <button className={`nbtn ${selecting ? 'b' : ''}`} onClick={() => selecting ? endSelect() : setSelecting(true)}>{selecting ? 'Done' : 'Edit'}</button>}</div>
      </div>
      {offline && <div className="offline" role="status">{I.wifiOff}Offline — showing saved mail</div>}
      <List items={items} loading={loading} err={err} folder={folder} kind={kind} query={q} onScroll={onListScroll} refresh={() => Promise.all([load(true), checkNew()])}
        groupBySender={settings.groupBySender} rowProps={rowProps}
        header={<>
          <div className="head"><h1 className="t-large chrome">{selecting ? `${picked.size} Selected` : title}</h1>
            <form className="searchbox" role="search" onSubmit={e => { e.preventDefault(); setQ(qLive.trim()); e.currentTarget.querySelector('input').blur(); }}>
              {I.search}<input ref={searchRef} type="search" enterKeyHint="search" placeholder="Search" aria-label="Search mail" value={qLive} autoCapitalize="off" autoCorrect="off"
                onChange={e => { setQLive(e.target.value); if (!e.target.value) setQ(''); }} />
              {qLive && <button type="button" className="sclear" aria-label="Clear search" onClick={() => { setQLive(''); setQ(''); }}>{I.x}</button>}
            </form>
            {qLive && !q && <div className="hint">Try <b>from:</b>name · <b>has:code</b> · <b>is:unread</b> · <b>is:starred</b> · <b>cat:receipts</b></div>}
          </div>
          {folder === 'inbox' && <div className="chips" role="tablist" aria-label="Categories">
            <button role="tab" aria-selected={!cat && !unreadOnly} className={`chip ${!cat && !unreadOnly ? 'on' : ''}`} onClick={() => { setCat(null); setUnreadOnly(false); }}>All</button>
            <button role="tab" aria-selected={unreadOnly} className={`chip ${unreadOnly ? 'on' : ''}`} onClick={() => setUnreadOnly(u => !u)}>Unread{counts.inbox ? <span className="n">{counts.inbox}</span> : null}</button>
            {CATS.map(([k, l, ic]) => <button key={k} role="tab" aria-selected={cat === k} className={`chip ${cat === k ? 'on' : ''}`} onClick={() => setCat(c => c === k ? null : k)}>{ic}{l}{counts.cats?.[k] ? <span className="n">{counts.cats[k]}</span> : null}</button>)}
          </div>}
        </>} />
      {selecting
        ? <div className="status chrome" style={{ justifyContent: 'space-between' }}>
          {kind === 'draft' ? <><span /><button className="tbtn txt red" disabled={!picked.size} onClick={() => { deleteDrafts(pickedList); endSelect(); }}>Delete</button></>
            : folder === 'trash' ? <><button className="tbtn txt" disabled={!picked.size} onClick={() => bulk(trash)}>Restore</button><button className="tbtn txt red" disabled={!picked.size} onClick={() => bulk(purge)}>Delete</button></>
            : <><button className="tbtn txt" disabled={!picked.size} onClick={() => setSheet({ items: [{ label: 'Mark as Read', run: () => bulk(l => markRead(l, true)) }, { label: 'Mark as Unread', run: () => bulk(l => markRead(l, false)) }, { label: pickedList.every(m => m.starred) ? 'Unstar' : 'Star', run: () => bulk(star) }] })}>Mark</button>
              <button className="tbtn" aria-label="Star" disabled={!picked.size} onClick={() => bulk(star)}>{I.star}</button>
              <button className="tbtn txt" disabled={!picked.size} onClick={() => bulk(archive)}>{folder === 'archive' ? 'Inbox' : 'Archive'}</button>
              <button className="tbtn txt red" disabled={!picked.size} onClick={() => bulk(trash)}>Trash</button></>}
        </div>
        : <div className="status chrome mob-only">
          <button className="tbtn" aria-label={unreadOnly ? 'Show all mail' : 'Show unread only'} aria-pressed={unreadOnly} onClick={() => setUnreadOnly(u => !u)}>{unreadOnly ? I.filterOn : I.filter}</button>
          <div className="mid" aria-live="polite">{offline ? 'Offline' : unreadOnly ? 'Filtered by: Unread' : updated ? `Updated ${updated.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : 'Checking for Mail…'}
            <small>{kind === 'out' ? `${counts.outbox || 0} queued` : folder === 'inbox' && counts.inbox ? `${counts.inbox} Unread` : '\u00a0'}</small></div>
          <button className="tbtn" aria-label="New message" onClick={newMsg}>{I.compose}</button>
        </div>}
      <div className="shade" />
    </section>

    {/* ---------------- reader ---------------- */}
    <section className={cls(2)} aria-label="Message" aria-hidden={stack !== 2 && !isDesk() ? true : undefined}>
      <div className={`navbar chrome mob-only ${readSolid ? 'solid' : ''}`}>
        <div className="l"><button className="nbtn back" onClick={pop} aria-label={`Back to ${title}`}>{I.back}<span>{title}</span></button></div>
        <div className="mid">{readSolid ? sel?.subject || '' : ''}</div>
        {sel && kind === 'mail' && <div className="r">
          <button className="nbtn" aria-label="Previous message" disabled={items.findIndex(x => x.id === sel.id) <= 0} onClick={() => { const i = items.findIndex(x => x.id === sel.id); if (i > 0) open(items[i - 1]); }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 14.5 6-6 6 6"/></svg></button>
          <button className="nbtn" aria-label="Next message" disabled={items.findIndex(x => x.id === sel.id) >= items.length - 1} onClick={() => { const i = items.findIndex(x => x.id === sel.id); if (i >= 0 && i < items.length - 1) open(items[i + 1]); }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9.5 6 6 6-6"/></svg></button>
        </div>}
      </div>
      {!sel ? <div className="blank">{I.envOpen}<span>No Message Selected</span></div> : <>
        <div className="scroll" onScroll={onReadScroll} style={{ paddingBottom: 'calc(72px + var(--sb))' }} key={sel.id}>
          <Reader sel={sel} thread={thread} isOut={kind === 'out'} settings={settings} onSetCategory={setCategory} />
        </div>
        {kind === 'mail' && (folder === 'trash'
          ? <div className="toolbar chrome"><button className="tbtn txt" onClick={() => trash([sel])}>Restore</button><button className="tbtn txt red" onClick={() => purge([sel])}>Delete Forever</button></div>
          : <>
            <div className="toolbar chrome mob-only">
              <button className="tbtn" aria-label={sel.archived ? 'Move to Inbox' : 'Archive'} onClick={() => archive([sel])}>{sel.archived ? I.inbox : I.archive}</button>
              <button className="tbtn" aria-label="Trash" onClick={() => trash([sel])}>{I.trash}</button>
              <button className={`tbtn ${sel.starred ? 'on' : ''}`} aria-label={sel.starred ? 'Unstar' : 'Star'} aria-pressed={!!sel.starred} onClick={() => star([sel])}>{sel.starred ? I.starFill : I.star}</button>
              <button className="tbtn" aria-label="Reply, Reply All, Forward" onClick={() => replyMenu(sel)}>{I.reply}</button>
              <button className="tbtn" aria-label="New message" onClick={newMsg}>{I.compose}</button>
            </div>
            <div className="toolbar desk desk-only chrome">
              <button className="tbtn" title="Archive (e)" aria-label="Archive" onClick={() => archive([sel])}>{sel.archived ? I.inbox : I.archive}</button>
              <button className="tbtn" title="Trash (#)" aria-label="Trash" onClick={() => trash([sel])}>{I.trash}</button>
              <button className="tbtn" title="Mark unread (u)" aria-label="Toggle read" onClick={() => markRead([sel], sel.read === false)}>{I.envDot}</button>
              <button className={`tbtn ${sel.starred ? 'on' : ''}`} title="Star (s)" aria-label="Star" onClick={() => star([sel])}>{sel.starred ? I.starFill : I.star}</button>
              <span style={{ width: 12 }} />
              <button className="tbtn" title="Reply (r)" aria-label="Reply" onClick={() => reply(sel)}>{I.reply}</button>
              <button className="tbtn" title="Reply all (a)" aria-label="Reply all" onClick={() => reply(sel, 'replyAll')}>{I.replyAll}</button>
              <button className="tbtn" title="Forward (f)" aria-label="Forward" onClick={() => reply(sel, 'forward')}>{I.forward}</button>
              <span style={{ width: 12 }} />
              <button className="tbtn" title="New message (c)" aria-label="New message" onClick={newMsg}>{I.compose}</button>
            </div></>)}
      </>}
    </section>

    {compose && <Compose init={compose} actionSheet={setSheet} onClose={() => { setCompose(null); setDrafts(loadDrafts()); if (folder === 'drafts') load(); }}
      onQueued={() => { setCompose(null); setDrafts(loadDrafts()); flash('Queued for Sending', `Fig will send it from ${ADDR}`); if (folder === 'drafts' || folder === 'outbox') load(); refreshCounts(); }} />}
    {showSettings && <Settings s={settings} set={set} counts={counts} actionSheet={setSheet} onClose={() => setShowSettings(false)} onSignOut={signOut}
      onEmptyTrash={async () => { await post('/api/purge', {}); refreshCounts(); if (folder === 'trash') load(); flash('Trash Emptied', 'Messages were permanently deleted.', 2000); }} />}
    {sheet && <ActionSheet sheet={sheet} onClose={() => setSheet(null)} />}
    {banner && <div className="banner" role="status" onClick={() => setBanner(null)}><img src="/apple-touch-icon.png" alt="" /><div className="tx"><b>{banner.title}</b><span>{banner.body}</span></div><small>now</small></div>}
    {undo && <div className="undo" role="status"><span>{undo.text}</span><button onClick={() => { clearTimeout(ut.current); const r = undo.revert; setUndo(null); r(); buzz(); }}>Undo</button></div>}
  </div>;
}
