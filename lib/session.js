const enc = new TextEncoder();
async function key() {
  return crypto.subtle.importKey('raw', enc.encode(process.env.SESSION_SECRET || ''), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}
const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
export async function sign(payload) {
  const body = b64(enc.encode(JSON.stringify(payload)));
  const sig = b64(await crypto.subtle.sign('HMAC', await key(), enc.encode(body)));
  return body + '.' + sig;
}
export async function verify(token) {
  if (!token || !process.env.SESSION_SECRET) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = b64(await crypto.subtle.sign('HMAC', await key(), enc.encode(body)));
  if (expected.length !== sig.length) return null;
  let d = 0; for (let i = 0; i < sig.length; i++) d |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  if (d) return null;
  try {
    const p = JSON.parse(atob(body.replace(/-/g,'+').replace(/_/g,'/')));
    if (!p.exp || p.exp < Date.now()) return null;
    return p;
  } catch { return null; }
}
export const COOKIE = 'fig_session';
