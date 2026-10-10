'use client';
import { useState } from 'react';
export default function Login() {
  const [pw, setPw] = useState(''), [err, setErr] = useState(''), [busy, setBusy] = useState(false);
  async function go(e) { e.preventDefault(); setBusy(true); setErr('');
    const r = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pw }) });
    if (r.ok) location.replace('/'); else { setErr('Incorrect password.'); setBusy(false); } }
  return <div className="login"><form className="lcard" onSubmit={go}>
    <img src="/apple-touch-icon.png" alt="" />
    <h1 className="t-large">Fig Mail</h1>
    <p>{process.env.NEXT_PUBLIC_INBOX_ADDRESS || 'Your private inbox'}</p>
    <input type="password" autoFocus placeholder="Password" value={pw} onChange={e => setPw(e.target.value)} autoComplete="current-password" />
    <button className="pbtn" disabled={busy}>{busy ? 'Signing In…' : 'Sign In'}</button>
    {err && <div className="lerr">{err}</div>}
  </form></div>;
}
