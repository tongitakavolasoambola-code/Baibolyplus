/* Service worker — mitahiry ny "shell" an'ny app mba hosokafana offline.
   Ny data (Baiboly, Diksionera...) dia ao IndexedDB; ny sary diksionera ao 'dico-img'. */
const SHELL = 'shell-v6';
const ASSETS = ['./', './index.html', './app.js', './style.css', './firebase-config.js', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== SHELL && k !== 'dico-img' && k !== 'sdk').map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  // Firebase SDK (gstatic): cache mandritra ny fampiasana online voalohany
  if (u.hostname === 'www.gstatic.com') {
    e.respondWith(
      caches.open('sdk').then(async (c) => {
        const hit = await c.match(e.request);
        if (hit) return hit;
        const res = await fetch(e.request);
        c.put(e.request, res.clone());
        return res;
      })
    );
    return;
  }
  if (u.origin !== location.origin) return; // Firebase API: tsy tafiditra
  if (u.pathname.includes('/free/')) return;  // data Baiboly lehibe: ao IndexedDB, tsy ao cache shell
  // Network aloha (mba hiseho avy hatrany ny fanovana), cache ho an'ny offline
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' }).then((res) => {
      if (res.ok) { const cp = res.clone(); caches.open(SHELL).then((c) => c.put(e.request, cp)); }
      return res;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cs) => (cs[0] ? cs[0].focus() : self.clients.openWindow('./'))));
});
