# base/ — ny « base » (Firebase Firestore + fiarovana)

Tsy misy code web ao amin'ity tahiry ity: ny fichier ilaina amin'ny **Firebase** ihany.

| Fichier | Anjara |
|---|---|
| `firestore.rules` | Fiarovana: iza no afaka mamaky/manoratra (Admin = email voasoratra ao anatiny) |

## Firestore — firafitry ny base
| Collection / doc | Votoatiny | Iza no manoratra |
|---|---|---|
| `requests/{uid}` | `name, phone, ref, ts` — fangatahana activation (uid = kaody finday) | ny finday ihany |
| `activations/{uid}` | `active, name, phone, ref, manual, at` — activation tanana | Admin ihany |
| `data/_version` | `updated, files:[{k,h,n}]` — lisitry ny fichier + hash + isan'ny tapany | Admin (avy ao `/admin.html`) |
| `data/<fichier>~<i>` | `t` — tapany (≤ 250 000 litera) amin'ny Konkordansa, hevitra, Diksionera | Admin |
| `data/img~<anarana>` | `b64` — sary diksionera (WebP) | Admin |

Vakiana ny `data/*` ihany raha `activations/{uid}.active == true` ho an'ilay finday (ary ho an'ny Admin).

## Baiboly malalaka
Tsy ao Firestore: `free/bible.json` (voaforona amin'ny `node tools/build.js`) no alefa miaraka amin'ny site.

## Baiko (ao amin'ny fototry ny repo)
    firebase deploy --only firestore:rules      # rules ihany
    firebase deploy --only hosting              # site ihany (GitHub Actions no manao izany ho azy)
    node tools/build.js                         # manamboatra free/ sy out/data/
