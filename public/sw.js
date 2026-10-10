/* Fig Mail service worker: offline shell + last-seen mail. */
const V = 'figmail-v4';
const STATIC = V + '-static', DATA = V + '-data', PAGES = V + '-pages';
self.addEventListener('install', e => { e.waitUntil(caches.open(STATIC).then(c => c.addAll(['/manifest.webmanifest', '/icon.svg', '/apple-touch-icon.png', '/icon-192.png']).catch(() => {}))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => !k.startsWith(V)).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('message', e => { if (e.data === 'clear') e.waitUntil(caches.keys().then(ks => Promise.all(ks.map(k => caches.delete(k))))); });
const offlineJSON = () => new Response(JSON.stringify({ error: 'offline', offline: true }), { status: 503, headers: { 'Content-Type': 'application/json' } });
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  if (url.pathname.startsWith('/api/')) {
    if (!/^\/api\/(messages|thread|counts|outbox)$/.test(url.pathname)) return;
    e.respondWith(fetch(req).then(res => { if (res.ok) { const c = res.clone(); caches.open(DATA).then(x => x.put(req, c)); } return res; })
      .catch(() => caches.match(req).then(r => { if (!r) return offlineJSON(); const h = new Headers(r.headers); h.set('X-Fig-Offline', '1'); return r.blob().then(b => new Response(b, { status: 200, headers: h })); })));
    return;
  }
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(res => { if (res.ok && !res.redirected) { const c = res.clone(); caches.open(PAGES).then(x => x.put(url.pathname, c)); } return res; })
      .catch(() => caches.match(url.pathname).then(r => r || caches.match('/')).then(r => r || new Response('<meta name=viewport content="width=device-width"><body style="font:17px -apple-system;padding:40px;text-align:center">Fig Mail is offline.</body>', { headers: { 'Content-Type': 'text/html' } }))));
    return;
  }
  if (url.pathname.startsWith('/_next/static/') || /\.(png|svg|webmanifest|css|js|woff2?)$/.test(url.pathname)) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => { if (res.ok) { const c = res.clone(); caches.open(STATIC).then(x => x.put(req, c)); } return res; })));
  }
});
