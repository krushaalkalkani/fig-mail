'use client';
import { useState } from 'react';
import { I, ME, ADDR, copyText, buzz } from '../lib/ui';

function Seg({ value, opts, onChange, label }) {
  return <div className="seg" role="radiogroup" aria-label={label}>{opts.map(([v, l]) =>
    <button key={v} role="radio" aria-checked={value === v} className={value === v ? 'on' : ''} onClick={() => onChange(v)}>{l}</button>)}</div>;
}
function Toggle({ on, onChange, label }) {
  return <button className="cell" role="switch" aria-checked={on} onClick={() => onChange(!on)}><span className="lb">{label}</span><span className={`switch ${on ? 'on' : ''}`} /></button>;
}

export default function Settings({ s, set, onClose, onSignOut, onEmptyTrash, counts, actionSheet }) {
  const [out, setOut] = useState(false), [copied, setCopied] = useState(false);
  const close = () => { setOut(true); setTimeout(onClose, 300); };
  const copy = async () => { if (await copyText(ME)) { buzz(); setCopied(true); setTimeout(() => setCopied(false), 1600); } };
  return <>
    <div className={`dim ${out ? 'out' : ''}`} onClick={close} />
    <div className={`sheet grouped small ${out ? 'out' : ''}`} role="dialog" aria-modal="true" aria-label="Settings">
      <div className="chrome"><div className="grab" />
        <div className="sheetbar"><span /><span className="ttl">Settings</span><button className="nbtn b" onClick={close}>Done</button></div></div>
      <div className="scroll" style={{ paddingBottom: 'calc(24px + var(--sb))' }}>
        <div className="ghead">Account</div>
        <div className="group"><div className="cell" style={{ padding: '10px 16px', gap: 12 }}>
          <img src="/apple-touch-icon.png" alt="" width="44" height="44" style={{ borderRadius: 10 }} />
          <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 600 }}>Fig Mail</div>
            <button className="addr" onClick={copy} style={{ marginTop: 6 }} aria-label="Copy address">{copied ? I.check : I.copy}<span>{copied ? 'Copied' : ADDR}</span></button></div></div></div>

        <div className="ghead">Appearance</div>
        <div className="group"><div className="cell" style={{ padding: '8px 16px' }}><div style={{ flex: 1 }}>
          <Seg label="Theme" value={s.theme} onChange={v => set({ theme: v })} opts={[['system', 'Automatic'], ['light', 'Light'], ['dark', 'Dark']]} /></div></div>
          <Toggle label="Group by Sender" on={s.groupBySender} onChange={v => set({ groupBySender: v })} />
          <Toggle label="Load Remote Images" on={s.loadImages} onChange={v => set({ loadImages: v })} /></div>
        <div className="gfoot">Remote images can reveal when you open a message. When off, tap “Load Images” per message.</div>

        <div className="ghead">Checking for Mail</div>
        <div className="group"><div className="cell" style={{ padding: '8px 16px' }}><div style={{ flex: 1 }}>
          <Seg label="Refresh interval" value={s.refresh} onChange={v => set({ refresh: v })} opts={[[5, '5s'], [15, '15s'], [60, '1m'], [0, 'Manual']]} /></div></div></div>
        <div className="gfoot">Fig Mail only checks while it’s open and visible.</div>

        <div className="ghead">Swipe Left</div>
        <div className="group"><div className="cell" style={{ padding: '8px 16px' }}><div style={{ flex: 1 }}>
          <Seg label="Swipe left action" value={s.swipeLeft} onChange={v => set({ swipeLeft: v })} opts={[['archive', 'Archive'], ['trash', 'Trash']]} /></div></div></div>
        <div className="gfoot">Swipe right toggles read / unread.</div>

        <div className="ghead">Storage</div>
        <div className="group">
          <button className="cell danger plain" disabled={!counts.trash} style={{ opacity: counts.trash ? 1 : .4 }} onClick={() => actionSheet({ title: 'Permanently delete all messages in Trash?', items: [{ label: `Empty Trash (${counts.trash || 0})`, red: true, run: onEmptyTrash }] })}><span className="lb">Empty Trash</span></button>
          <button className="cell danger plain" onClick={() => actionSheet({ items: [{ label: 'Sign Out', red: true, run: onSignOut }] })}><span className="lb">Sign Out</span></button>
        </div>

        <div className="ghead desk-only" style={{ display: 'block' }}>Keyboard Shortcuts</div>
        <div className="group desk-only" style={{ flexDirection: 'column' }}>
          {[['j / k', 'Next / previous'], ['Enter', 'Open'], ['e', 'Archive'], ['#', 'Trash'], ['s', 'Star'], ['u', 'Read / unread'], ['r', 'Reply'], ['a', 'Reply all'], ['f', 'Forward'], ['c', 'Compose'], ['/', 'Search'], ['x', 'Select'], ['Esc', 'Close']].map(([k, l]) =>
            <div className="cell plain" key={k}><span className="lb">{l}</span><kbd>{k}</kbd></div>)}
        </div>
        <p className="foot t-foot" style={{ textAlign: 'center', color: 'var(--label2)', margin: '0 32px' }}>Fig Mail · mirror of {ADDR}<br />Synced by Fig</p>
      </div>
    </div>
  </>;
}

export function ActionSheet({ sheet, onClose }) {
  const [out, setOut] = useState(false);
  const done = fn => { setOut(true); setTimeout(() => { onClose(); fn?.(); }, 200); };
  return <>
    <div className={`dim ${out ? 'out' : ''}`} style={{ zIndex: 49 }} onClick={() => done()} />
    <div className="actsheet" role="menu" style={out ? { transform: 'translateY(120%)', transition: 'transform .25s var(--ease)' } : undefined}>
      <div className="grp">{sheet.title && <div className="t">{sheet.title}</div>}
        {sheet.items.map((it, i) => <button key={i} role="menuitem" className={it.red ? 'red' : ''} onClick={() => done(it.run)}>{it.label}</button>)}</div>
      <button className="cancel" onClick={() => done()}>Cancel</button>
    </div>
  </>;
}
