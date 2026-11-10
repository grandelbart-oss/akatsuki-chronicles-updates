# Naruto: Akatsuki Chronicles – Testversionen

[Spielseite mit Download, Roadmap und Bug Report](https://grandelbart-oss.github.io/akatsuki-chronicles-updates/)

Öffentlicher Downloadbereich für die Android-Testfassung.

## Installation

**[Aktuelle AkatsukiChronicles.apk direkt herunterladen](https://akatsuki-download.smxn-vs-lobby.workers.dev/nac-android-20261110-204351/AkatsukiChronicles.apk)** · 2.227.446.051 Bytes (2,23 GB), Android 7 oder neuer und ARM64. Die vollständige APK vom 10.11.2026 wird direkt über Cloudflare ausgeliefert. Warte auf den vollständigen Download, tippe die APK danach in „Dateien/Downloads“ an und installiere sie (ggf. Installation aus dieser Quelle erlauben). Wer seine Spielstände behalten will, installiert die neue APK über die alte (nicht vorher deinstallieren).

SHA-256 der Basis-APK: `5ad521d12f06d8badf95f65756267dedbea5368abeca2a6f5e1b49c9c0ade1df`. Die [vorherige Basis vom 08.11.2026](https://akatsuki-download.smxn-vs-lobby.workers.dev/nac-android-20261108-113924/AkatsukiChronicles.apk) bleibt erhalten.

1. Die APK einmal über die vorhandene App installieren. **Vorher nicht deinstallieren**, damit Spielstände erhalten bleiben.
2. Die App starten und im Hauptmenü kurz auf die Update-Prüfung warten.
3. Ein angebotenes Update herunterladen. Anschließend die App vollständig beenden und neu öffnen.

Die aktuelle Basis-App gehört zu **20261110-204351**; die aktuelle Revision und Paketgröße stehen auf der [Spielseite](https://akatsuki-chronicles.de/). Zwischenversionen müssen nicht einzeln installiert werden. Spätere Downloads richten sich nach den tatsächlich geänderten Dateien.

Für Android die **APK** wählen. `update.pck` und `manifest.json` verwendet die App; sie werden nicht separat installiert. Ein GitHub-Konto ist für die Downloads nicht erforderlich.

## Spätere Änderungen

Passende Spieländerungen kommen über die Update-Funktion. Benötigt eine Änderung eine neue technische Grundlage, bietet die App den Wechsel auf eine neue Basis-App an. Die jeweils passende APK wird hier verlinkt.

Bei fehlender Verbindung bleibt der installierte Stand spielbar. Ein fehlgeschlagener Download ersetzt kein funktionierendes Paket. Vor einer Paketübernahme werden die vorhandenen JSON-Spielstände und Einstellungen lokal gesichert.

## Prüfstand

Für die vollständige Basis vom 10.11.2026 wurden die aktuellen Änderungen gezielt geprüft. Paketstruktur, sämtliche ZIP-Dateiinhalte, Android-Paketsignatur und der Bezug zur Bauquelle wurden kontrolliert. Die aus genau dieser APK gewonnenen Spieldaten starteten in einer gepackten Windows-Release-Laufzeit; die Aktivierung signierter Updates bis zum echten Hauptmenü und die Übernahme eines älteren Testspielstands wurden geprüft. Der vollständige Cloudflare-Download einschließlich Fortsetzen und Dateiprüfsumme wurde mit der gelieferten APK verglichen.

**Der Test auf einem physischen Android-Gerät steht noch aus.** Dies ist keine vollständige Spielabnahme; dokumentierte Inhalts- und Prüfhinweise bleiben in Bearbeitung. Bei einer Fehlermeldung bitte den Stand aus dem Hauptmenü und den Ablauf nennen.

[Alle veröffentlichten Versionen](https://github.com/grandelbart-oss/akatsuki-chronicles-updates/releases)
