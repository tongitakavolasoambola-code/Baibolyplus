# Baiboly+ — Fametrahana FIREBASE ihany (A à Z)

Firebase ihany no ampiasaina (plan **Spark**, maimaim-poana, tsy mila karatra banky):
| | Serivisy Firebase |
|---|---|
| App + pejy Admin + Baiboly malalaka | **Hosting** |
| Kaody finday + login Admin | **Authentication** (Anonymous + Email/Password) |
| Fangatahana, activation, ary data voaaro (Konkordansa, hevitra, Diksionera, sary) | **Firestore** |

**Firafitra (tsy misy tahiry `public/` intsony):** `index.html` sy `admin.html` ary ny fichier web rehetra dia **miaraka** ao amin'ny fototra.
`src/`, `out/`, `tools/` dia **tsy alefa** amin'ny Hosting (voasoratra ao amin'ny `firebase.json`).

---
## A. Amin'ny Firebase Console (≈10 min)
1. https://console.firebase.google.com → **Create a project** → anarana `baiboly-plus` → Google Analytics **OFF** → Create.
2. **Build → Authentication → Get started → Sign-in method**:
   - **Anonymous** → Enable → Save
   - **Email/Password** → Enable → Save
   - Tab **Users → Add user**: email Admin + teny miafina (tehirizo).
3. **Build → Firestore Database → Create database** → toerana akaiky (ohatra `eur3` na `asia-southeast1`) → mode **Production** → Enable.
4. **Project settings (⚙) → General → Your apps → ikony Web `</>`** → anarana `baiboly-plus-web` → **Register app** (aza alaina ny « Firebase Hosting » eto) → hita ny `firebaseConfig`.
   **Io no « URL / config adika »**: adikao ny `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId` → apetraho ao **`firebase-config.js`** (ary ao koa ny laharana MVola sy ny vola).
5. **Build → Hosting → Get started** (tsindrio Next hatramin'ny farany).
6. Ao amin'ny **`base/firestore.rules`**: soloy ny `ADMIN_EMAIL` amin'ny email Admin (mitovy tanteraka amin'ny ao amin'ny dingana 2).
7. **Project settings → General → Project ID** → apetraho ao **`.firebaserc`** (soloy `VOTRE-PROJET-FIREBASE`).

## B. Alefa (≈5 min) — terminal ao anaty tahiry `baiboly-plus`
    npm install -g firebase-tools
    firebase login
    node tools/build.js
    firebase deploy --only hosting,firestore:rules

Rehefa vita: `Hosting URL: https://<project-id>.web.app` → **io ny adiresy** (azo jerena ihany koa ao Firebase Console → Hosting).
App = `https://<project-id>.web.app/` · Admin = `https://<project-id>.web.app/admin.html`

**Fanamarinana fiarovana:** sokafy `https://<project-id>.web.app/out/data/konk.json` sy `/src/dikisionera-data.js` → tsy maintsy **404**.

## C. Fampiakarana ny data voaaro (Admin)
1. `/admin.html` → midira amin'ny email/teny miafina Admin.
2. **3. Alefa ny data** → fidio ny tahiry **`out/data`** → « Alefa ny data » (voatapaka ho tapany ao Firestore; `version.json` no farany → doc `data/_version`).
3. Raha misy sary: **4** → ahena ho WebP (1200 px) sy alefa; ampio `"img":"A-001.webp"` amin'ny teny, avereno `node tools/build.js`, alefaso indray ny `out/data`.

## D. Fampiasana
- Mpampiasa: Baiboly malalaka avy hatrany. Konkordansa/Diksionera → pejy activation → MVola → fangatahana (na mandefa ny **kaody finday** aminao).
- Admin (tanana, tsy automatique): **1. Fangatahana** → jereo ny MVola → « Efa nojerena — Mampiasa » (na **1b** amin'ny kaody).
- Mpampiasa: tsindrio ⟳ → mivoha ny Konkordansa/Diksionera; mandeha offline aorian'izay.
- Mandrapisolo finday: Admin → **2. Mavitrika** → « Foano ».

## E. Fanavaozana isanandro
| Inona | Ahoana |
|---|---|
| Konkordansa / hevitra / Diksionera / sary | ovay `src/…` → `node tools/build.js` → Admin « Alefa ny data » (tsy mila deploy) |
| Baiboly | `node tools/build.js` → `firebase deploy --only hosting` |
| MVola / vola / config | ovay `firebase-config.js` → `firebase deploy --only hosting` |

## F. Fetra (Spark)
- Firestore: 1 GiB, 50 000 famakiana/andro, 20 000 fanoratana/andro: ampy be (data ≈ 3 MB = ≈ 40 doc; ny finday dia manana ny niova ihany).
- Raha fafana ny « site data » ao amin'ny navigateur dia very ny kaody finday → mila activation vaovao.

## G. Lisitra fanamarinana
- [ ] Authentication: Anonymous + Email/Password ON · Admin user noforonina
- [ ] Firestore noforonina (Production) · `ADMIN_EMAIL` nosoloina ao `base/firestore.rules`
- [ ] `firebase-config.js` feno · `.firebaserc` feno
- [ ] `firebase deploy --only hosting,firestore:rules` vita · `/out/data/konk.json` = 404
- [ ] Admin: `out/data` nampiakatra
- [ ] Fitsapana finday: Baiboly mandeha · Konkordansa mangataka activation · Admin mampiasa → mivoha · mode avion mbola mandeha

## H. Raha misy olana
| Hadisoana | Vahaolana |
|---|---|
| « Firebase tsy voaomana » | `firebase-config.js` mbola misy `VOTRE`/`...`; fenoy ary `firebase deploy --only hosting` |
| `auth/admin-restricted-operation` / anonymous tsy mandeha | Authentication → Sign-in method → **Anonymous** Enable |
| Admin: `auth/invalid-credential` | Users: forony ny kaonty Admin na hamarino ny teny miafina |
| `permission-denied` rehefa mampiakatra | `ADMIN_EMAIL` ao `base/firestore.rules` tsy mitovy amin'ny email fidirana → avereno `firebase deploy --only firestore:rules` |
| `permission-denied` ao amin'ny finday aorian'ny activation | tsindrio ⟳; hamarino fa mitovy ny kaody ao Admin « Mavitrika » |
| Mbola taloha ny app | akatony tanteraka dia sokafy indroa (aza mamafa « site data ») |
