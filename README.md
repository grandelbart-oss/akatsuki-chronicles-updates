# Naruto: Akatsuki Chronicles – Testversionen

[Spielseite mit Download, Roadmap und Bugreport](https://akatsuki-chronicles.de/)

## Android · R12

**[AkatsukiChronicles.apk herunterladen](https://akatsuki-download.smxn-vs-lobby.workers.dev/nac-android-r12-content-20261123/AkatsukiChronicles.apk)** · **72,67 MB** (72.671.825 Bytes), Android 7 oder neuer und ARM64.

1. Lade die APK vollständig herunter. Tippe sie in „Dateien/Downloads“ an und installiere sie; falls nötig, erlaube die Installation aus dieser Quelle.
2. Öffne die App. Beim ersten Start lädt sie automatisch **4,62 GB Spieldaten** (4.622.261.492 Bytes). Verwende dafür möglichst WLAN. Der Download lässt sich pausieren und fortsetzen.
3. Nach dem vollständigen Download und der Dateiprüfung startet das Spiel. Danach kannst du auch offline spielen.

Die Bilder behalten ihre bisherige Auflösung und Qualität. Die kleine APK enthält den Start und den Downloader; die vollständigen Spieldaten werden einmal separat geladen.

Installiere die neue APK über eine vorhandene App und deinstalliere sie vorher nicht. Die Übernahme älterer Spielstände ist noch nicht auf einem physischen Android-Gerät geprüft; ein neuer Spielstart kann nötig sein. Weitere passende Updates werden im Hauptmenü angeboten.

SHA-256 der APK: `5a33ce90cabf37b89e289eedb7d424003b0a72306ece5c2daf127574eabf4222`.

Die bisherigen Basis-Downloads vom [10.11.2026](https://akatsuki-download.smxn-vs-lobby.workers.dev/nac-android-20261110-204351/AkatsukiChronicles.apk) und [08.11.2026](https://akatsuki-download.smxn-vs-lobby.workers.dev/nac-android-20261108-113924/AkatsukiChronicles.apk) bleiben erhalten. Ein GitHub-Konto ist für den Download nicht erforderlich. Spieldaten und Manifest werden von der App verwaltet und nicht von Hand installiert.

## PC · R12

**[Vollständige Windows-Fassung herunterladen](https://akatsuki-download.smxn-vs-lobby.workers.dev/nac-pc-20261124-083548/AkatsukiChronicles_PC.zip)** · **4,67 GB** (4.669.611.259 Bytes), Windows 10/11 mit 64 Bit.

Entpacke die ZIP vollständig in einen neuen Ordner und starte `AkatsukiChronicles.exe`. Lass die enthaltenen Dateien zusammen. Die vollständigen R12-Spieldaten liegen bereits bei; ein zusätzlicher Spieldownload ist nicht erforderlich. Bei jedem Start wird die beigefügte Inhaltsdatei geprüft. Die Prüfung kann etwas dauern; danach ist das Spiel auch offline nutzbar. Bildauflösung, Texturen und Mipmaps bleiben erhalten.

[PC-Installationshinweise auf der Website](https://akatsuki-chronicles.de/?platform=pc#pc-installation)

SHA-256 der ZIP: `1a3685653dfc9b4094314feefc95c7d7e9acff1b3e5da28a45a838228ff0b328`.

Frühere PC-Downloads bleiben erreichbar: [10.11.2026](https://akatsuki-download.smxn-vs-lobby.workers.dev/nac-pc-20261110-204351/AkatsukiChronicles_PC.zip) und [16.11.2026](https://akatsuki-download.smxn-vs-lobby.workers.dev/nac-pc-20261116-152839/AkatsukiChronicles_PC.zip). Die alten Releases bleiben verfügbar. Spielupdates für die neue R12-Inhaltsbasis sind mit älteren Basisinstallationen nicht kompatibel; dafür zuerst die oben verlinkte R12-Fassung installieren.

## Spielupdates für die R12-Basis

Die Website zeigt ein passendes veröffentlichtes Spielupdate zusätzlich zum Basisstand an. Die APK, die PC-ZIP und die vollständigen Spieldaten bleiben R12. Ein kumulatives Update wird im Hauptmenü mit „Update laden“ geladen; danach das Spiel vollständig schließen und neu starten. Android und PC mit derselben R12-Inhaltsbasis verwenden denselben Patch. Die Website nennt dessen tatsächliche Größe und verlinkt die zugehörigen Versionshinweise.

## Bisherige lokale Prüfungen der Android-R12-Auslieferung

APK-Struktur und Signatur sowie der vollständige Inhalt wurden lokal geprüft. Die Downloadprüfungen decken Erstdownload, Pause/Fortsetzen, abweichende Serverantworten, ungültige Signaturen und Prüfsummen sowie einen echten fortgesetzten Transfer jenseits von 4 GiB ab. Der vollständige Spielinhalt wurde bis zum Hauptmenü geladen und anhand tatsächlicher Texturen geprüft. Auch der Start mit bereits geprüften Daten ohne erneuten Download wurde kontrolliert.

**Der Test auf einem physischen Android-Gerät steht noch aus.** Die lokale Prüfung ist keine vollständige Spielabnahme. Bei einer Fehlermeldung bitte die Plattform, den Stand aus dem Hauptmenü und den Ablauf nennen.

## Website-Daten

`docs/apk_extern.json` führt die festen Android- und PC-Basisdownloads sowie den automatischen Inhaltsdownload. `tools/website_daten.py` erhält deren Revisionen, Adressen, Größen und Prüfsummen unverändert. Zusätzlich liest es GitHub Latest: Nur ein öffentliches, zur jeweiligen Basis passendes kumulatives Update wird als getrenntes `gameplayUpdate` ausgegeben. Ein Release für eine andere Basis ändert die Installer nicht und wird ihnen nicht als Update zugeordnet.

Der Generator prüft Release-Tag, Basis, Engine, Schema, Asset-Adresse, Größe und SHA-256-Felder auf Konsistenz. Die kryptografische Manifestprüfung erfolgt im Freigabeschritt und in den Spielen. Fehlende oder widersprüchliche Metadaten eines passenden Updates stoppen den Website-Neubau.

Lokale Prüfungen ohne Veröffentlichung:

```text
python tools/test_website_daten.py
node tools/test_website_ui.cjs
node --check docs/ui.js
git diff --check
```

Website-Daten aus tatsächlich veröffentlichten Releases erzeugen:

```text
python tools/website_daten.py --roadmap docs/roadmap.json --output docs/data.js
```

Der Workflow für Release-Ereignisse fordert weiterhin ausschließlich einen separaten Website-Lauf auf `main` an; er stellt keine Website aus einem Release-Tag bereit.

[Alle bisherigen Veröffentlichungen](https://github.com/grandelbart-oss/akatsuki-chronicles-updates/releases)
