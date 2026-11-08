# Baiboly+ — Baiboly DIEM + Konkordansa + Diksionera (PWA offline)

Ny **projet** dia mipetraka ao amin'ny **GitHub** (repo *private*). **Firebase** dia mifandray aminy fotsiny: GitHub Actions no mampiakatra ny site ao amin'ny Firebase Hosting isaky ny `git push`, ary ny « base » (Firestore) sy ny baiko Firebase dia ao amin'ny `base/`.

```
baiboly-plus/                      ← fototry ny repo GitHub
├─ index.html  admin.html          ← ny pejy, MIARAKA (tsy anaty dossier)
├─ app.js  style.css  sw.js  manifest.webmanifest  icon-192.png  icon-512.png
├─ firebase-config.js              ← config Firebase (+ laharana MVola)
├─ firebase.json  .firebaserc      ← fifandraisana amin'ny Firebase fotsiny
├─ .github/workflows/deploy.yml    ← GitHub → Firebase (deploy automatique)
├─ base/                           ← ny base: firestore.rules + famaritana ny Firestore
├─ src/                            ← angona fototra (Baiboly, Diksionera, hevitra)
├─ tools/                          ← build.js (manamboatra free/ sy out/data/), compress_images.py
├─ docs/                           ← SETUP.md (Firebase A→Z), GITHUB.md (GitHub ↔ Firebase)
└─ package.json                    ← baiko: npm run build / deploy
   (free/ sy out/ = voaforona, tsy ao amin'ny GitHub)
```

- Malalaka: Baiboly. Mila activation tanana (Admin): Konkordansa (teny + hevitra) sy Diksionera (soratra + sary).
- Fanombohana: **docs/GITHUB.md** (repo private + deploy automatique) dia **docs/SETUP.md** (Firebase Console).
