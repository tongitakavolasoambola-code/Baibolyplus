/* Baiboly DIEM + Diksionera + Konkordansa + Lohahevitra — PWA offline-first */
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const strip = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const DAY = 864e5, WEEK_MS = 7 * DAY;

/* ================= IndexedDB (kv) ================= */
const idb = new Promise((res, rej) => {
  const r = indexedDB.open('baiboly-plus', 1);
  r.onupgradeneeded = () => r.result.createObjectStore('kv');
  r.onsuccess = () => res(r.result);
  r.onerror = () => rej(r.error);
});
const kvGet = (k) => idb.then((d) => new Promise((res) => { const q = d.transaction('kv').objectStore('kv').get(k); q.onsuccess = () => res(q.result); q.onerror = () => res(undefined); }));
const kvSet = (k, v) => idb.then((d) => new Promise((res, rej) => { const t = d.transaction('kv', 'readwrite'); t.objectStore('kv').put(v, k); t.oncomplete = res; t.onerror = () => rej(t.error); }));

/* ================= State ================= */
const S = { tab: 'home', stack: [], konk: null, bible: null, topics: null, dico: [], dicoIdx: null, act: null, concord: null };
const toast = (m, ms = 2500) => { const t = $('#toast'); t.textContent = m; t.hidden = false; clearTimeout(toast.h); toast.h = setTimeout(() => (t.hidden = true), ms); };
// canon (1-66) -> index ao amin'ny bible.json (misy Apokrifa eo anelanelany)
const canonIdx = (n) => (n <= 39 ? n - 1 : n + 9);

/* ================= Interface : icônes, navbar, menu |||, thèmes ================= */
const ic = (p) => `<svg viewBox="0 0 24 24">${p}</svg>`;
const IC = {
  home: ic('<path d="M3 11l9-8 9 8"/><path d="M5 10v10h5v-6h4v6h5V10"/>'),
  book: ic('<path d="M4 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4z"/><path d="M20 4h-6v14h6z" transform="translate(-0 0)"/>'),
  dict: ic('<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h3"/>'),
  search: ic('<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>'),
  tag: ic('<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.2"/>'),
  info: ic('<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>'),
  menu: ic('<path d="M7 5v14M12 5v14M17 5v14"/>'),
  sync: ic('<path d="M20 11a8 8 0 0 0-14-4L4 9"/><path d="M4 4v5h5"/><path d="M4 13a8 8 0 0 0 14 4l2-2"/><path d="M20 20v-5h-5"/>'),
  back: ic('<path d="M15 5l-7 7 7 7"/>'),
  close: ic('<path d="M6 6l12 12M18 6L6 18"/>'),
  key: ic('<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3"/>'),
};
const THEMES = [['brown', 'Marron noble', '#6b3a22'], ['dark', 'Maizina', '#1a1614'], ['coral', 'Corail', '#f2705f'], ['orange', 'Orange', '#ee8419'], ['palm', 'Vert paume', '#2f7a45'], ['royal', 'Bleu royal', '#2a43b8']];
const BG = { brown: '#f4e4d8', dark: '#14110f', coral: '#fdeae4', orange: '#fff0dd', palm: '#e8efe0', royal: '#e8edf8' };
function setTheme(t) {
  document.documentElement.dataset.theme = t; try { localStorage.setItem('theme', t); } catch {}
  $('#tc').content = BG[t]; renderDrawer();
}
const curTheme = () => document.documentElement.dataset.theme || 'brown';
const NAV = [['home', 'Fandraisana', 'home'], ['bible', 'Baiboly', 'book'], ['konk', 'Konkordansa', 'search'], ['dico', 'Diksionera', 'dict'], ['about', 'Momba', 'info']];
function renderChrome() {
  $('#back').innerHTML = IC.back; $('#syncBtn').innerHTML = IC.sync; $('#menuBtn').innerHTML = IC.menu;
  const [a, b, c, d, e] = NAV, btn = ([t, l, i]) => `<button data-t="${t}">${IC[i]}<span>${l}</span></button>`;
  // ambany: 2 ankavia · bokotra afovoany (fikarohana) · 2 ankavanana
  $('#tabs').innerHTML = btn(a) + btn(b) + `<button data-t="${c[0]}" class="fab" aria-label="${c[1]}">${IC.search}</button>` + btn(d) + btn(e);
  renderDrawer();
}
function renderDrawer() {
  $('#drawer').innerHTML = `
    <div class="brand"><i>B</i><div><b>Baiboly+</b><small>DIEM · Diksionera · Konkordansa</small></div><button class="circ x" id="dx" aria-label="Akatony">${IC.close}</button></div>
    ${NAV.map(([t, l, i]) => `<button class="item ${S.tab === t ? 'on' : ''}" data-t="${t}">${IC[i]}<span>${l}</span></button>`).join('')}
    <h4>Endrika (couleur)</h4>
    <div class="swatches">${THEMES.map(([k, n, c]) => `<button class="sw ${curTheme() === k ? 'on' : ''}" data-theme="${k}" style="background:${c}" title="${n}" aria-label="${n}"></button>`).join('')}</div>
    <div class="sp"></div>
    <button class="item" id="dsync">${IC.sync}<span>Hanavao izao</span></button>
    <div class="foot">${esc(THEMES.find((x) => x[0] === curTheme())[1])}</div>`;
}
const openDrawer = () => { $('#drawer').classList.add('on'); $('#scrim').classList.add('on'); $('#drawer').setAttribute('aria-hidden', 'false'); };
const closeDrawer = () => { $('#drawer').classList.remove('on'); $('#scrim').classList.remove('on'); $('#drawer').setAttribute('aria-hidden', 'true'); };
document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-t]');
  if (t && (t.closest('#tabs') || t.closest('#drawer') || t.closest('.cats'))) { S.tab = t.dataset.t; S.stack = []; closeDrawer(); route(); return; }
  const th = e.target.closest('.sw'); if (th) return setTheme(th.dataset.theme);
  if (e.target.closest('#menuBtn')) return openDrawer();
  if (e.target.closest('#dx') || e.target.id === 'scrim') return closeDrawer();
  if (e.target.closest('#dsync')) { closeDrawer(); sync(true); }
});
let touchX = null; // glisser vers la droite pour fermer
$('#drawer').addEventListener('touchstart', (e) => (touchX = e.touches[0].clientX), { passive: true });
$('#drawer').addEventListener('touchend', (e) => { if (touchX !== null && e.changedTouches[0].clientX - touchX > 70) closeDrawer(); touchX = null; });


/* ================= Banner (fampahatsiahivana offline) ================= */
// Raha mihoatra ny 7 andro tsy nisy synchronisation: indroa isan'andro (maraina < 12h, tolakandro >= 12h)
const slotKey = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}` + (d.getHours() < 12 ? '-AM' : '-PM'); };
async function updateBanner() {
  const b = $('#banner');
  const last = await kvGet('lastSync');
  if (!last || Date.now() - last < WEEK_MS) { b.hidden = true; return; }
  const slot = slotKey();
  const closed = (await kvGet('bannerClosed')) || [];
  b.hidden = closed.includes(slot);
}
$('#bannerX').onclick = async () => {
  const slot = slotKey();
  const closed = ((await kvGet('bannerClosed')) || []).slice(-6); closed.push(slot);
  await kvSet('bannerClosed', closed); $('#banner').hidden = true;
};

/* ================= Firebase (ampiana rehefa mila fotsiny: activation + data voaaro) ================= */
const FB_SDK = 'https://www.gstatic.com/firebasejs/10.12.2/';
const loadScript = (u) => new Promise((res, rej) => { const s = document.createElement('script'); s.src = u; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
let fbReady;
function fb() {
  return (fbReady ||= (async () => {
    const cfg = window.FIREBASE_CONFIG;
    if (!cfg || /VOTRE|\.\.\./.test(cfg.apiKey || '...')) throw new Error('Firebase tsy voaomana (firebase-config.js)');
    if (!window.firebase) for (const m of ['app', 'auth', 'firestore']) await loadScript(`${FB_SDK}firebase-${m}-compat.js`);
    if (!firebase.apps.length) firebase.initializeApp(cfg);
    const a = firebase.auth();
    await new Promise((r) => { let done = false, un; un = a.onAuthStateChanged(() => { if (!done) { done = true; un && un(); r(); } }); });  // andraso ny fidirana voatahiry
    if (!a.currentUser) await a.signInAnonymously();
    return { db: firebase.firestore(), uid: a.currentUser.uid };    // uid = ID tokana an'ny finday = fototry ny activation
  })().catch((e) => { fbReady = null; throw e; }));
}
// Data voaaro ao amin'ny Firestore: collection « data », fichier iray = doc iray na maromaro (chunk)
const docId = (name, i) => name.replace(/\//g, '~') + '~' + i;
function fsReader(c) {
  const ns = {};
  return async (p) => {
    if (p === 'version.json') {
      const d = await c.db.doc('data/_version').get(); if (!d.exists) throw new Error('Mbola tsy misy data ao amin\'ny Firestore (Admin)');
      const v = d.data(), files = {}; v.files.forEach((f) => { files[f.k] = f.h; ns[f.k] = f.n; });
      return { updated: v.updated, files };
    }
    let t = '';
    for (let i = 0; i < ns[p]; i++) { const d = await c.db.doc('data/' + docId(p, i)).get(); if (!d.exists) throw new Error('Tsy hita: ' + p); t += d.data().t; }
    return JSON.parse(t);
  };
}

/* ================= Data (IndexedDB -> mémoire) ================= */
async function loadLocal() {
  // Malalaka: Baiboly · Mila activation: Konkordansa (miaraka amin'ny hevitra) + Diksionera (afenina raha tsy mavitrika)
  const on = !!(S.act && S.act.active);
  S.bible = (await kvGet('f:free/bible.json'))?.books || null;
  S.topics = on ? (await kvGet('f:lohahevitra.json')) || null : null;
  S.konk = on ? (await kvGet('f:konk.json')) || null : null;
  S.dicoIdx = on ? (await kvGet('f:dico/index.json')) || null : null;
  S.dico = [];
  for (const L of S.dicoIdx?.letters || []) S.dico.push(...((await kvGet(`f:dico/${L}.json`)) || []));
  S.concord = null;
}

/* ================= Sync ================= */
let syncing = false;
async function sync(manual = false) {
  if (syncing) return;
  if (!navigator.onLine) { if (manual) toast('Tsy misy internet'); return; }
  syncing = true; $('#syncBtn').innerHTML = '<span class="spin">' + IC.sync + '</span>';
  let changed = 0, updated = null;
  // misintona ny fichier niova ihany araka ny version.json
  const syncSet = async (getJSON, verPath, verKey) => {
    const remote = await getJSON(verPath), local = (await kvGet(verKey)) || {};
    const todo = Object.keys(remote.files).filter((k) => local[k] !== remote.files[k]);
    let n = 0;
    for (const k of todo) {
      if (todo.length > 2) toast(`Fanavaozana ${++n}/${todo.length}…`, 60000);
      await kvSet('f:' + k, await getJSON(k)); local[k] = remote.files[k]; await kvSet(verKey, local);
    }
    changed += todo.length; updated = remote.updated;
  };
  try {
    // 1) Baiboly — malalaka, ao amin'ny Firebase Hosting (tsy mila activation)
    const fetchFree = async (p) => { const r = await fetch(p + (p.includes('?') ? '&' : '?') + 't=' + Date.now(), { cache: 'no-store' }); if (!r.ok) throw new Error(p); return r.json(); };
    await syncSet(fetchFree, 'free/version.json', 'verFree');
    await kvSet('lastSync', Date.now());
    await kvSet('updated', updated);
    if (changed) await loadLocal();
    // 2) Activation + Konkordansa/Diksionera — Firebase (Auth + Firestore)
    try {
      const c = await fb(), was = !!(S.act && S.act.active);
      const a = await c.db.doc('activations/' + c.uid).get();
      S.act = { uid: c.uid, active: a.exists && a.data().active === true, at: Date.now() };
      await kvSet('act', S.act);
      if (S.act.active) await syncSet(fsReader(c), 'version.json', 'ver');
      else if (manual) toast('Mbola tsy mavitrika ny activation (Diksionera / Konkordansa)');
      if (changed || was !== S.act.active) await loadLocal();
    } catch (e) { console.warn('firebase', e); if (manual) toast('Tsy tafiditra ny activation (' + (e.message || e.code) + ')'); }
    if (changed) toast(`Voavao: ${changed} fichier`); else if (manual && S.act?.active) toast('Efa vaovao daholo');
    $('#banner').hidden = true;
    route();
  } catch (e) {
    console.warn(e); if (manual) toast('Tsy vita ny fanavaozana (' + (e.message || e.code) + ')');
  } finally { syncing = false; $('#syncBtn').innerHTML = IC.sync; updateBanner(); }
}
$('#syncBtn').onclick = () => sync(true);
addEventListener('online', () => sync());

/* ================= Navigation ================= */
const view = $('#view');
function setTitle(t, back) { $('#title').textContent = t; $('#back').hidden = !back; }
$('#back').onclick = () => { S.stack.pop(); route(); };
function route() {
  document.querySelectorAll('#tabs [data-t]').forEach((b) => b.classList.toggle('on', b.dataset.t === S.tab)); renderDrawer();
  // Malalaka: Fandraisana, Baiboly, Momba · Mila activation: Diksionera, Konkordansa
  if (S.tab === 'topic') S.tab = 'konk';
  if ((S.tab === 'dico' || S.tab === 'konk') && !(S.act && S.act.active)) return lockScreen();
  if (S.tab === 'bible' && !S.bible) return empty();
  ({ home: vHome, bible: vBible, dico: vDico, konk: vKonk, about: vAbout })[S.tab]();
  view.scrollTop = 0;
}
function empty() { setTitle('Baiboly+'); view.innerHTML = `<div class="card">Mbola tsy misy data. Ampifandraiso ny internet dia tsindrio ny <b>⟳</b>.</div>`; }
const cur = () => S.stack[S.stack.length - 1];

/* ================= Activation ================= */
async function lockScreen() {
  setTitle('Activation');
  const P = window.PAY_INFO || {};
  const req = await kvGet('reqSent');
  const code = S.act?.uid ? S.act.uid.slice(0, 8).toUpperCase() : '…';
  view.innerHTML = `
  <div class="card">
    <p><b>Mila activation</b> ny <b>Konkordansa</b> (teny sy hevitra) ary ny <b>Diksionera</b>. Malalaka foana ny Baiboly.</p>
    <ol>
      <li>Alefaso amin'ny MVola ny <b>${esc(P.amount)}</b> any amin'ny <b>${esc(P.mvola)}</b> (${esc(P.name)}).</li>
      <li>Fenoy etsy ambany ny anaranao, ny laharana nandefasanao ary ny <i>référence</i> MVola.</li>
      <li>Ny <b>Admin</b> no mijery ny fandoavana ary mampiasa ny activation <b>amin'ny tanana</b> (tsy automatique). Rehefa vita ny fanamarinana, tsindrio ny <b>Hamarino ny activation</b>.</li>
    </ol>
    <p class="mut">Kaody finday: <b id="uid" style="word-break:break-all;user-select:all">${esc(S.act?.uid || '…')}</b> <button class="chip" id="cp">Adikao</button><br>Mifamatotra amin'ity finday ity ny activation. Azonao alefa amin'ny Admin ny kaody raha tsy mandeha ny fangatahana.</p>
    <label class="field"><span>Anarana</span><input id="rn" value="${esc(req?.name || '')}" autocomplete="name"></label>
    <label class="field"><span>Laharana MVola nandefa</span><input id="rp" inputmode="tel" value="${esc(req?.phone || '')}"></label>
    <label class="field"><span>Référence MVola</span><input id="rr" value="${esc(req?.ref || '')}"></label>
    <p><button class="btn" id="send">Alefa ny fangatahana</button> <button class="btn alt" id="chk">Hamarino ny activation</button></p>
    <p class="mut" id="st">${req ? 'Fangatahana nalefa ' + new Date(req.ts).toLocaleString('fr') + '. Miandry fanamarinana.' : ''}</p>
  </div>`;
  if (!S.act?.uid && navigator.onLine) fb().then((c) => { S.act = { ...(S.act || {}), uid: c.uid }; const u = $('#uid'); if (u) u.textContent = c.uid; }).catch(() => {});
  $('#cp').onclick = async () => { try { await navigator.clipboard.writeText(S.act?.uid || ''); toast('Voadika'); } catch { toast('Tsindrio ny kaody dia adikao'); } };
  $('#send').onclick = async () => {
    const r = { name: $('#rn').value.trim(), phone: $('#rp').value.trim(), ref: $('#rr').value.trim(), ts: Date.now() };
    if (!r.name || !r.phone || !r.ref) return toast('Fenoy ny saha rehetra');
    if (!navigator.onLine) return toast('Mila internet');
    try {
      const c = await fb(); await c.db.doc('requests/' + c.uid).set({ name: r.name, phone: r.phone, ref: r.ref, ts: Date.now() });
      await kvSet('reqSent', r); S.act = { uid: c.uid, active: false }; toast('Voalefa. Miandrasa fanamarinana.'); lockScreen();
    } catch (e) { toast('Tsy lasa: ' + (e.message || e.code)); }
  };
  $('#chk').onclick = () => sync(true);
}


/* ================= Fandraisana (home) ================= */
function daySeed() { const d = new Date(); return d.getFullYear() * 400 + d.getMonth() * 31 + d.getDate(); }
function verseOfDay() {
  let s = daySeed(); const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
  for (let k = 0; k < 80; k++) {
    const bi = Math.floor(rnd() * S.bible.length); if (S.bible[bi].t === 1) continue;
    const bk = S.bible[bi], c = Math.floor(rnd() * bk.c.length), v = Math.floor(rnd() * bk.c[c].length), t = bk.c[c][v];
    if (t && t.length > 50 && t.length < 190) return { bi, c: c + 1, v: v + 1, t };
  }
  return { bi: 52, c: 3, v: 16, t: verseText(52, 3, 16) };
}
function vHome() {
  setTitle('Baiboly+');
  const vd = S.bible ? verseOfDay() : null, seed = daySeed();
  const tp = (S.topics || []).map((x, i) => [x, i]);
  const picks = tp.length ? [0, 1, 2, 3, 4, 5].map((k) => tp[(seed * 7 + k * 23) % tp.length]) : [];
  const w = S.dico.length ? S.dico[seed % S.dico.length] : null;
  view.innerHTML = `
    <p class="greet">Salama, tonga soa!</p>
    <p class="big">Ny Teny dia <em>jiro</em><br>ho an'ny tongotrao</p>
    ${vd ? `<div class="hero"><small>Teny androany</small><p>${esc(vd.t)}</p><button class="btn" data-ref="${vd.bi},${vd.c},${vd.v}">${esc(refLabel(vd.bi, vd.c, vd.v))} →</button></div>`
      : `<div class="hero"><small>Baiboly DIEM</small><p>Ampifandraiso ny internet indray mandeha hisintonana ny Baiboly (malalaka), dia azo vakiana offline.</p><button class="btn" data-go="about">Hanavao →</button></div>`}
    <h2>Sokajy</h2>
    <div class="cats">${[['bible', 'Baiboly', 'book'], ['dico', 'Diksionera', 'dict'], ['konk', 'Konkordansa', 'search']].map(([t, l, i]) => `<button class="cat" data-t="${t}"><i>${IC[i]}</i>${l}</button>`).join('')}</div>
    ${picks.length ? `<h2>Konkordansa: hevitra ho an'ianao</h2><div class="hscroll">${picks.map(([x, i]) => `<button class="tcard" data-topic="${i}"><i>${IC.tag}</i><b>${esc(x[0])}</b><small>${esc(x[1])} · ${x[3].length} andininy</small></button>`).join('')}</div>` : ''}
    ${w ? `<h2>Teny androany ao amin'ny diksionera</h2><button class="card row" style="display:block;width:100%;text-align:left;border:0" data-dw="${esc(w.id)}"><b>${esc(w.w)}</b> <span class="mut">${esc(w.g || '')}</span><br><span class="mut">${esc((w.t || '').slice(0, 110))}…</span></button>` : ''}`;
  view.onclick = (e) => {
    const g = e.target.closest('[data-go]'); if (g) { S.tab = g.dataset.go; S.stack = []; return route(); }
    const r = e.target.closest('[data-ref]'); if (r) return openRef(...r.dataset.ref.split(',').map(Number));
    const t = e.target.closest('[data-topic]'); if (t) { S.tab = 'konk'; S.stack = [{ i: +t.dataset.topic }]; return route(); }
    const d = e.target.closest('[data-dw]'); if (d) { S.tab = 'dico'; S.stack = [{ id: d.dataset.dw }]; return route(); }
  };
}

/* ================= Baiboly ================= */
function vBible() {
  const t = cur();
  if (!t) {
    setTitle('Baiboly DIEM');
    const names = ['Testamenta Taloha', 'Apokrifa', 'Testamenta Vaovao'];
    view.innerHTML = [0, 2, 1].map((g) => `<h2>${names[g]}</h2><div class="grid books">${S.bible.map((b, i) => (b.t === g ? `<button data-b="${i}">${esc(b.n)}</button>` : '')).join('')}</div>`).join('');
    view.onclick = (e) => { const b = e.target.closest('[data-b]'); if (b) { S.stack.push({ b: +b.dataset.b }); route(); } };
  } else if (t.c == null) {
    const bk = S.bible[t.b]; setTitle(bk.n, true);
    view.innerHTML = `<div class="grid">${bk.c.map((_, i) => `<button data-c="${i}">${i + 1}</button>`).join('')}</div>`;
    view.onclick = (e) => { const b = e.target.closest('[data-c]'); if (b) { S.stack.push({ b: t.b, c: +b.dataset.c }); route(); } };
  } else {
    const bk = S.bible[t.b], vs = bk.c[t.c]; setTitle(`${bk.n} ${t.c + 1}`, true);
    view.innerHTML = vs.map((x, i) => `<p class="v" id="v${i + 1}"><sup>${i + 1}</sup>${esc(x)}</p>`).join('') +
      `<p><button class="btn alt" id="prev" ${t.c ? '' : 'disabled'}>‹ Toko ${t.c}</button> <button class="btn alt" id="next" ${t.c < bk.c.length - 1 ? '' : 'disabled'}>Toko ${t.c + 2} ›</button></p>`;
    $('#prev').onclick = () => { S.stack[S.stack.length - 1] = { b: t.b, c: t.c - 1 }; route(); };
    $('#next').onclick = () => { S.stack[S.stack.length - 1] = { b: t.b, c: t.c + 1 }; route(); };
    if (t.v) { const el = $('#v' + t.v); if (el) { el.querySelector('sup').insertAdjacentHTML('afterend', ''); el.style.background = 'var(--hl)'; el.scrollIntoView({ block: 'center' }); } }
    view.onclick = null;
  }
}
const bookName = (bi) => (S.bible ? S.bible[bi].n : S.konk?.books[bi]) || '?';
const refLabel = (bi, c, v) => `${bookName(bi)} ${c}:${v}`;
const verseText = (bi, c, v) => S.bible?.[bi]?.c[c - 1]?.[v - 1] || '';
function openRef(bi, c, v) { S.tab = 'bible'; S.stack = [{ b: bi }, { b: bi, c: c - 1, v }]; route(); }

/* ================= Konkordansa ================= */
// Index avy amin'ny konk.json (refs ihany; mila activation) + soratry ny Baiboly malalaka
function buildConcord() {
  if (S.concord) return S.concord;
  const K = S.konk; if (!K) return null;
  const refs = [];
  K.shape.forEach((chs, bi) => chs.forEach((n, ci) => { for (let v = 1; v <= n; v++) refs.push([bi, ci + 1, v]); }));
  return (S.concord = { words: K.words, refs, keys: Object.keys(K.words) });
}
const concIds = (c, w) => { let p = 0; return c.words[w].slice(1).map((d) => (p += d)); };
const topicMatches = (q) => (S.topics || []).map((x, i) => [x, i]).filter(([x]) => !q || strip(x.slice(0, 3).join(' ')).includes(q));
function vKonk() {
  const t = cur();
  if (!t) {
    setTitle('Konkordansa');
    view.innerHTML = `<input class="search" id="q" placeholder="Teny na hevitra (ohatra: fitiavana, Andriamanitra)" autocomplete="off" value="${esc(S.kq || '')}"><div id="l" class="list"></div>`;
    if (!buildConcord()) { $('#l').innerHTML = '<div class="card">Mbola tsy misy data ny Konkordansa. Ampifandraiso ny internet dia tsindrio ny ⟳.</div>'; return; }
    const c = buildConcord();
    const topicRow = ([x, i]) => `<button class="row" data-i="${i}"><span>${esc(x[0])}</span><small>${esc(x[1])} · ${x[3].length}</small></button>`;
    const run = () => {
      const q = strip($('#q').value.trim());
      const tp = topicMatches(q);
      if (q.length < 2) { $('#l').innerHTML = `<div class="sec">Hevitra</div>` + tp.map(topicRow).join('') + `<p class="mut">Soraty ny teny hikarohana ao amin'ny Baiboly manontolo.</p>`; return; }
      const hit = c.keys.filter((k) => k.startsWith(q)).slice(0, 80);
      $('#l').innerHTML = (tp.length ? `<div class="sec">Hevitra</div>` + tp.slice(0, 12).map(topicRow).join('') : '') +
        `<div class="sec">Teny</div>` + (hit.map((k) => `<button class="row" data-w="${esc(k)}"><span>${esc(k)}</span><small>${c.words[k][0]}×</small></button>`).join('') || '<p class="mut">Tsy hita.</p>');
    };
    $('#q').oninput = () => { S.kq = $('#q').value; run(); }; run();
    $('#l').onclick = (e) => {
      const w = e.target.closest('[data-w]'); if (w) { S.stack.push({ w: w.dataset.w }); return route(); }
      const i = e.target.closest('[data-i]'); if (i) { S.stack.push({ i: +i.dataset.i }); route(); }
    };
  } else if (t.i != null) {
    const x = S.topics[t.i]; setTitle(x[0], true);
    view.innerHTML = `<p class="mut">${esc(x[1])} · ${esc(x[2])}</p>` + x[3].map(([n, ch, v]) => {
      const bi = canonIdx(n); return `<div class="card"><b class="ref" data-r="${bi},${ch},${v}">${esc(refLabel(bi, ch, v))}</b><br>${esc(verseText(bi, ch, v))}</div>`;
    }).join('');
    view.onclick = (e) => { const r = e.target.closest('[data-r]'); if (r) openRef(...r.dataset.r.split(',').map(Number)); };
  } else {
    const c = buildConcord(), ids = concIds(c, t.w); setTitle(t.w, true);
    const txtOn = !!S.bible;
    view.innerHTML = `<p class="mut">${c.words[t.w][0]} fisehoana · ${ids.length} andininy</p>` +
      (txtOn ? '' : `<div class="card mut">Mbola tsy voasintona ny Baiboly — ampifandraiso ny internet hisehoan'ny andininy.</div>`) +
      ids.slice(0, 300).map((id) => {
        const [bi, ch, v] = c.refs[id];
        return `<div class="card"><b class="ref" data-r="${bi},${ch},${v}">${esc(refLabel(bi, ch, v))}</b>${txtOn ? '<br>' + hl(verseText(bi, ch, v), t.w) : ''}</div>`;
      }).join('') + (ids.length > 300 ? '<p class="mut">Voalohany 300 ihany no aseho.</p>' : '');
    view.onclick = (ev) => { const r = ev.target.closest('[data-r]'); if (r) openRef(...r.dataset.r.split(',').map(Number)); };
  }
}
// manasongadina ny teny na dia misy accent aza (NFD mitovy halavany raha toa ka tsy misy ligature)
function hl(txt, w) {
  const out = []; let i = 0; const n = strip(txt);
  if (n.length !== txt.length) return esc(txt); // fiarovana raha tsy mitovy ny halavany
  for (let p; (p = n.indexOf(w, i)) >= 0; i = p + w.length) {
    const before = n[p - 1], after = n[p + w.length];
    out.push(esc(txt.slice(i, p))); out.push('<mark>' + esc(txt.slice(p, p + w.length)) + '</mark>');
  }
  return out.join('') + esc(txt.slice(i));
}

/* ================= Diksionera (sary + soratra) ================= */
const imgCache = () => caches.open('dico-img');
async function pageImage(name, { allowNet = true } = {}) {
  const c = await imgCache(), key = new Request('/__dico/' + name);
  let r = await c.match(key);
  if (!r && allowNet && navigator.onLine) {
    const fc = await fb(), d = await fc.db.doc('data/img~' + name).get();
    if (!d.exists) throw new Error('img'); r = new Response(await (await fetch(d.data().b64)).blob()); await c.put(key, r.clone());
  }
  return r ? URL.createObjectURL(await r.blob()) : null;
}
function vDico() {
  const t = cur();
  if (!t) {
    setTitle('Diksionera');
    const letters = S.dicoIdx?.letters || [];
    if (!S.dico.length) { view.innerHTML = '<div class="card">Mbola tsy misy teny ao amin\'ny diksionera. Tsindrio ny ⟳.</div>'; return; }
    view.innerHTML = `<input class="search" id="q" placeholder="Hikaroka teny…" autocomplete="off"><div class="chips" id="ch">${letters.map((L) => `<button class="chip" data-L="${L}">${L}</button>`).join('')}</div><div class="list" id="l"></div>`;
    let L = S.dicoLetter || '';
    const draw = () => {
      const q = strip($('#q').value.trim());
      let list = S.dico.filter((e) => (!L || strip(e.w)[0] === strip(L)) && (!q || strip(e.w).includes(q)));
      const total = list.length; list = list.slice(0, 150);
      $('#l').innerHTML = list.map((e) => `<button class="row" data-id="${esc(e.id)}"><span>${esc(e.w)}</span><small>${esc(e.g || '')}</small></button>`).join('') + (total > 150 ? `<p class="mut">${total} teny — ahenao ny fikarohana.</p>` : '');
      document.querySelectorAll('#ch .chip').forEach((b) => b.classList.toggle('on', b.dataset.L === L));
    };
    $('#q').oninput = draw; $('#ch').onclick = (e) => { const b = e.target.closest('[data-L]'); if (b) { L = S.dicoLetter = L === b.dataset.L ? '' : b.dataset.L; draw(); } };
    $('#l').onclick = (e) => { const b = e.target.closest('[data-id]'); if (b) { S.stack.push({ id: b.dataset.id }); route(); } };
    draw();
  } else {
    const e = S.dico.find((x) => String(x.id) === String(t.id)); setTitle(e.w, true);
    const img = e.img;
    view.innerHTML = `<div class="seg">${img ? '<button class="chip on" id="mi">Sary</button>' : ''}<button class="chip ${img ? '' : 'on'}" id="mt">Soratra</button></div><div id="body"></div>`;
    const showText = () => {
      $('#body').innerHTML = `<div class="card"><p><b>${esc(e.w)}</b> <span class="mut">${esc(e.g || '')}</span></p><p>${esc(e.t || '').replace(/\n/g, '<br>')}</p>${e.r ? `<p class="mut">${esc(Array.isArray(e.r) ? e.r.join('; ') : e.r)}</p>` : ''}</div>`;
      $('#mt')?.classList.add('on'); $('#mi')?.classList.remove('on');
    };
    const showImg = async () => {
      $('#mi').classList.add('on'); $('#mt').classList.remove('on');
      $('#body').innerHTML = '<p class="mut">Mamaky sary…</p>';
      try { const u = await pageImage(img); $('#body').innerHTML = u ? `<div class="page"><img src="${u}" alt="${esc(e.w)}"></div>` : '<div class="card">Tsy mbola voasintona ny sary — ampifandraiso ny internet. <a href="#" id="tx">Jereo ny soratra</a></div>'; $('#tx')?.addEventListener('click', (ev) => { ev.preventDefault(); showText(); }); }
      catch { $('#body').innerHTML = '<div class="card">Tsy azo ny sary. Jereo ny soratra.</div>'; showText(); }
    };
    $('#mt').onclick = showText; if (img) { $('#mi').onclick = showImg; showImg(); } else showText();
    view.onclick = null;
  }
}

/* ================= Momba / Fanamboarana ================= */
async function vAbout() {
  setTitle('Momba');
  const last = await kvGet('lastSync'), upd = await kvGet('updated');
  const fmt = (t) => (t ? new Date(t).toLocaleString('fr') : '—');
  const imgs = S.dico.filter((e) => e.img).length;
  view.innerHTML = `<div class="card">
    <p><b>Activation:</b> ${S.act?.active ? 'mavitrika ✔' : 'tsy mavitrika'}</p>
    <p><b>Synchronisation farany:</b> ${fmt(last)}<br><b>Data tamin'ny:</b> ${fmt(upd && Date.parse(upd))}</p>
    <p><button class="btn" id="s">Hanavao izao</button></p></div>
    ${imgs ? `<div class="card"><p><b>Sary diksionera</b> (${imgs})</p><div class="bar"><i id="pb"></i></div><p class="mut" id="pt">Voasintona rehefa jerena ny teny. Azonao alaina rehetra mba hampiasaina offline.</p><button class="btn alt" id="dl">Alaivo rehetra</button></div>` : ''}`;
  $('#s').onclick = () => sync(true);
  $('#dl')?.addEventListener('click', async () => {
    const names = [...new Set(S.dico.map((e) => e.img).filter(Boolean))]; let n = 0;
    for (const nm of names) { try { await pageImage(nm); } catch {} $('#pb').style.width = (++n * 100 / names.length) + '%'; $('#pt').textContent = `${n}/${names.length}`; }
    toast('Vita ny sary rehetra');
  });
  view.onclick = null;
}

/* ================= Boot ================= */
(async () => {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  renderChrome();
  S.act = (await kvGet('act')) || null;
  await loadLocal();
  route(); updateBanner();
  setInterval(updateBanner, 30 * 60 * 1000);
  sync();                                        // mijery fanavaozana isaky ny sokafana ny app (online)
  setInterval(() => sync(), 6 * 3600 * 1000);    // sy isaky ny 6 ora raha mbola misokatra
})();
