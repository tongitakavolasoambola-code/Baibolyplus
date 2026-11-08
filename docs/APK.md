# APK (Android) — Baiboly+

APK = sarony Android amin'ny site (TWA, Bubblewrap). Mitovy amin'ny site foana ny votoatiny: rehefa deploye ny site dia vaovao ny app, tsy mila APK vaovao.

## 1. Mamorona keystore (indray mandeha, ao amin'ny findainao/PC; ARovy mandrakizay!)
    keytool -genkeypair -v -keystore android.keystore -alias baiboly -keyalg RSA -keysize 2048 -validity 10000
Mitahiry ny teny miafina. Raha very ny keystore dia tsy ho afaka manavao ny app ao amin'ny Play Store.

## 2. Secrets ao amin'ny GitHub (Settings → Secrets → Actions)
- `ANDROID_KEYSTORE_B64` = `base64 -w0 android.keystore`
- `ANDROID_KEYSTORE_PASSWORD` = ny teny miafina (mitovy ho an'ny keystore sy ny key)

## 3. Mamoaka APK
GitHub → Actions → **Build APK** → Run workflow. Rehefa vita: Artifacts → `baiboly-plus-apk` → `app-release-signed.apk` (ho an'ny fandefasana mivantana) sy `.aab` (ho an'ny Play Store).

## 4. Fitaovana fanamarinana (ho very ny bara URL)
    keytool -list -v -keystore android.keystore -alias baiboly   → alaivo ny **SHA256**
Ao amin'ny `.well-known/assetlinks.json`:
    [{"relation":["delegate_permission/common.handle_all_urls"],
      "target":{"namespace":"android_app","package_name":"mg.baibolyplus.app",
                "sha256_cert_fingerprints":["AA:BB:...SHA256_ETO"]}}]
Push → deploye. Raha tsy izany dia mbola miasa ny app fa misy bara URL ery ambony.

## Fanamarihana
- Ovay ao amin'ny `twa-manifest.json` ny `host` raha miova ny domain; ampitomboy `appVersionCode` isaky ny manao APK vaovao.
- Tsy mbola nojerena tamin'ny GitHub Actions tena izy: raha misy erreur ny job dia alefaso ahy ny log.

## Release (APK sideload ho an'ny olona)
    git tag v1.0.0 && git push --tags
→ GitHub Actions manamboatra APK ary apetraka ao amin'ny **Releases** (`Baiboly-Plus-v1.0.0.apk`). Ny olona dia misintona ny APK, mamela "Fametrahana avy amin'ny loharano tsy fantatra" ao amin'ny finday, dia mametraka azy. Ho an'ny dikan-teny manaraka: ampitomboy `appVersionCode` ao amin'ny `twa-manifest.json`, dia tag vaovao (`v1.0.1`).
Ny Releases dia tsy azon'ny olona sintonina raha **private** ny repo. Noho izany ataovy **public** ny repo: ny `.gitignore` dia efa manakana ny `src/lohahevitra.js` sy `src/dikisionera-data.js` (angona mila activation) tsy hiakatra ao. Tehirizo ireo ao amin'ny findainao ary alefaso ao amin'ny Admin (`node tools/build.js` → `out/data`). Ny Baiboly (malalaka) ihany no ao amin'ny repo.
