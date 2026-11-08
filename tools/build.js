#!/usr/bin/env node
/*
 * build.js — manamboatra ny data ho an'ny app (out/data/*) avy amin'ny fichiers ao src/
 *
 * MALALAKA (tsy mila activation) -> free/   (alefa amin'ny Firebase Hosting miaraka amin'ny index.html)
 *   src/baiboly_diem.json      -> free/bible.json
 *   free/version.json
 * MILA ACTIVATION -> out/data/        (alefa ao amin'ny Firestore, collection 'data', amin'ny Admin; TSY alefa amin'ny Hosting)
 *   src/baiboly_diem.json      -> konk.json   (Konkordansa: refs ihany)
 *   src/lohahevitra.js         -> lohahevitra.json  (hevitra ao amin'ny Konkordansa)
 *   src/dikisionera-data.js    -> dico/<LITERA>.json + dico/index.json
 *   version.json               -> hash isaky ny fichier (ny app dia misintona ireo hafa ihany)
 *
 * Fampiasana:  node tools/build.js
 * Isaky ny manova data ianao dia averina atao; ny litera niova ihany no hiova hash.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const OUT = path.join(ROOT, 'out', 'data');
fs.rmSync(OUT, { recursive: true, force: true });
const PUB = ROOT;   // fichiers web (index.html, admin.html…) ao amin'ny fototra; ny Baiboly malalaka ao amin'ny free/
fs.rmSync(path.join(PUB, 'free'), { recursive: true, force: true });
fs.mkdirSync(path.join(PUB, 'free'), { recursive: true });
fs.mkdirSync(path.join(OUT, 'dico'), { recursive: true });

const files = {}, freeFiles = {};
function emit(rel, obj) {
  const txt = JSON.stringify(obj);
  fs.writeFileSync(path.join(rel.startsWith('free/') ? PUB : OUT, rel), txt);
  (rel.startsWith('free/') ? freeFiles : files)[rel] = crypto.createHash('sha1').update(txt).digest('hex').slice(0, 10);
  return txt.length;
}

/* ---------- Baiboly DIEM ---------- */
{
  const raw = JSON.parse(fs.readFileSync(path.join(SRC, 'baiboly_diem.json'), 'utf8'));
  const T = { 'Testamenta Taloha': 0, 'Apokrifa': 1, 'Testamenta Vaovao': 2 };
  const books = raw.map((b) => ({
    n: b.boky,
    t: T[b.testamenta] ?? 0,
    // c[toko-1] = [andininy1, andininy2, ...]  (voalamina araka ny laharan'ny andininy)
    c: b.toko.map((tk) => tk.andininy.map((a) => a.text)),
  }));
  const size = emit('free/bible.json', { books });
  console.log('bible.json', (size / 1e6).toFixed(2), 'MB,', books.length, 'boky');
}


/* ---------- Konkordansa (mila activation: refs ihany, tsy misy soratra) ---------- */
{
  const raw = JSON.parse(fs.readFileSync(path.join(SRC, 'baiboly_diem.json'), 'utf8'));
  const strip = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const words = {}; let id = 0;
  raw.forEach((b) => b.toko.forEach((t) => t.andininy.forEach((a) => {
    const seen = new Set();
    for (const w of strip(a.text).split(/[^a-z0-9]+/)) {
      if (w.length < 2) continue;
      const e = words[w] || (words[w] = [0, []]);
      e[0]++; if (!seen.has(w)) { seen.add(w); e[1].push(id); }
    }
    id++;
  })));
  // id andininy mitombo -> tehirizina ho delta (maivana kokoa)
  const out = {};
  for (const w of Object.keys(words).sort()) {
    const [n, ids] = words[w]; let prev = 0;
    out[w] = [n, ...ids.map((x) => { const d = x - prev; prev = x; return d; })];
  }
  const books = raw.map((b) => b.boky);
  const shape = raw.map((b) => b.toko.map((t) => t.andininy.length)); // isan'ny toko: isan'ny andininy
  const size = emit('konk.json', { books, shape, words: out });
  console.log('konk.json', (size / 1e6).toFixed(2), 'MB,', Object.keys(out).length, 'teny');
}

/* ---------- Lohahevitra (index ara-tontolo iainana) ---------- */
{
  const lp = path.join(SRC, 'lohahevitra.js');
  if (!fs.existsSync(lp)) {
    console.log('! src/lohahevitra.js tsy hita (ara-dalàna ao amin\'ny GitHub public) — lohahevitra.json tsy voaforona.');
  } else {
    global.window = {};
    require(lp);
    const L = window.LOHAHEVITRA;
    // [mg, fr, en, [[boky(1-66), toko, andininy], ...]]  — boky 1-66 = canon, ovaina ao amin'ny app
    emit('lohahevitra.json', L);
    console.log('lohahevitra.json', L.length, 'lohahevitra');
  }
}

/* ---------- Diksionera ---------- */
{
  const p = path.join(SRC, 'dikisionera-data.js');
  if (!fs.existsSync(p)) {
    console.log('! src/dikisionera-data.js tsy hita — apetraho ao amin\'ny src/ dia avereno.');
    emit('dico/index.json', { letters: [], total: 0 });
  } else {
    global.window = {};
    new Function('window', fs.readFileSync(p, 'utf8'))(global.window);
    const D = window.DIKISIONERA || [];
    const strip = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
    const by = {};
    for (const e of D) {
      const L = (strip(String(e.w || '?')).trim()[0] || '?').toUpperCase();
      (by[L] = by[L] || []).push(e);
    }
    const letters = Object.keys(by).sort((a, b) => a.localeCompare(b, 'mg'));
    for (const L of letters) emit(`dico/${L}.json`, by[L]);
    emit('dico/index.json', { letters, total: D.length });
    console.log('dico:', D.length, 'teny,', letters.join(' '));
  }
}

/* ---------- version.json (alefa farany) ---------- */
const now = new Date().toISOString();
fs.writeFileSync(path.join(PUB, 'free', 'version.json'), JSON.stringify({ updated: now, files: freeFiles }));
fs.writeFileSync(path.join(OUT, 'version.json'), JSON.stringify({ updated: now, files }));
// kopia mivelatra (tsy misy tahiry) ho an'ny finday: dico/A.json -> dico~A.json
const PH = path.join(ROOT, 'out', 'phone'); fs.mkdirSync(PH, { recursive: true });
(function cp(d, pre) { for (const e of fs.readdirSync(d, { withFileTypes: true })) {
  if (e.isDirectory()) cp(path.join(d, e.name), pre + e.name + '~');
  else fs.copyFileSync(path.join(d, e.name), path.join(PH, pre + e.name)); } })(OUT, '');
console.log('version.json vita — malalaka (Baiboly):', Object.keys(freeFiles).length, '· mila activation:', Object.keys(files).length);
