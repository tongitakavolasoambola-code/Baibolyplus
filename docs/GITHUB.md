# Baiboly+ — GitHub ↔ Firebase (deploy automatique)

Isaky ny `git push` any amin'ny **main** → GitHub Actions manamboatra ny Baiboly ary mampiakatra ny site ao amin'ny Firebase Hosting
(`https://baiboly-20259.web.app`). Ny angona voaaro (Konkordansa, Diksionera) dia mijanona ao Firestore (Admin).

## ⚠ Zava-dehibe: repo **PRIVATE**
Ao amin'ny `src/` no misy ny Baiboly, ny Diksionera ary ny Konkordansa feno. Raha **public** ny repo dia hitan'ny rehetra ny angona
tokony ho voaaro amin'ny activation. **Safidio « Private ».** (Ny `apiKey` ao `firebase-config.js` dia kely fiarovana: azo atao public; ny
fiarovana dia ao amin'ny `base/firestore.rules`.) Aza atao ao amin'ny repo mihitsy ny fichier JSON « service account ».

## 1. Mamorona ny repo
github.com → **New repository** → anarana `baiboly-plus` → **Private** → *aza* asiana README/.gitignore → Create.

## 2. Alefa ny code (terminal ao anaty tahiry `baiboly-plus`)
    git init -b main
    git add .
    git commit -m "Baiboly+ voalohany"
    git remote add origin https://github.com/<ANARANAO>/baiboly-plus.git
    git push -u origin main
(Miandrasa kaody/token rehefa angatahana: GitHub → Settings → Developer settings → Personal access tokens → *Fine-grained*, fahazoan-dalana **Contents: Read & write** ho an'ny repo ihany.)
Raha tsy mampiasa git: amin'ny web, **Add file → Upload files**, fa tsy mety aseho ny tahiry `.github` — aleo mampiasa git, na GitHub Desktop.

## 3. Mampifandray amin'ny Firebase (indray mandeha)
1. Firebase Console → ⚙ **Project settings → Service accounts → Generate new private key** → midina ny fichier `.json`.
2. GitHub → repo → **Settings → Secrets and variables → Actions → New repository secret**
   - Name: **`FIREBASE_SERVICE_ACCOUNT`**
   - Secret: adikao ny **votoatin'ny fichier `.json` manontolo**.
3. Fafao ny fichier `.json` ao amin'ny solosainao (na tehirizo any amin'ny toerana azo antoka).

## 4. Alefa
GitHub → tab **Actions** → « Deploy Firebase » → **Run workflow** (na push vaovao). Rehefa maitso ny « hosting »: sokafy `https://baiboly-20259.web.app`.
Ny job « rules » dia mety ho mena (raha tsy mahazo alalana ny service account): tsy tokony hatahorana — apetraho ao Firebase Console → Firestore → **Rules** → ny votoatin'ny `base/firestore.rules` → **Publish**.

## 5. Isan'andro
| Inona | Ahoana |
|---|---|
| Baiboly / app / loko / lahatsoratra | ovay ny fichier → `git add . && git commit -m "…" && git push` → deploy ho azy |
| Konkordansa / hevitra / Diksionera / sary | ovay `src/…` → `node tools/build.js` → `/admin.html` « Alefa ny data » (`out/data`); dia `git push` ihany koa mba hitahiry ny `src/` |
| Rules | ovay `base/firestore.rules` → push (na Publish ao Console) |

## 6. Raha misy olana
| Hadisoana ao Actions | Vahaolana |
|---|---|
| `Input required and not supplied: firebaseServiceAccount` | Tsy noforonina ny secret `FIREBASE_SERVICE_ACCOUNT` (dingana 3) |
| `Permission denied` / `403` amin'ny Hosting | Ny service account tsy ao amin'ny tetikasa `baiboly-20259`; forony indray avy ao Project settings |
| `build.js` : `ENOENT src/…` | Tsy voapetraka ao amin'ny repo ny `src/` (jereo `.gitignore`) |
| Ny site no mbola taloha | Sokafy indroa ny app (service worker); jereo ny Actions fa maitso |
