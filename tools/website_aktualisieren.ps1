# Aktualisiert ausschließlich die Website aus dem freigegebenen main-Stand.
# Erstellt/publiziert keine APK, keinen Patch und keinen Release.
[CmdletBinding()]
param()
$ErrorActionPreference='Stop'
& gh auth status
if($LASTEXITCODE -ne 0){throw 'Gespeicherte GitHub-Anmeldung fehlt; keine neue Anmeldung automatisch starten.'}
$repo='grandelbart-oss/akatsuki-chronicles-updates'
$info=(& gh api "repos/$repo/releases/latest"|Out-String)|ConvertFrom-Json
if($LASTEXITCODE -ne 0 -or $info.draft -or $info.prerelease -or $info.tag_name -notmatch '^nac-android-[0-9]{8}(?:-[0-9]{6})?-r[1-9][0-9]*$'){throw 'Kein passender tatsächlich öffentlicher Latest-Release.'}
Write-Output ('Website aus main aktualisieren; veröffentlichter Stand bleibt '+$info.tag_name)
& gh workflow run spielseite-main.yml --repo $repo --ref main
if($LASTEXITCODE -ne 0){throw 'Website-Lauf nicht gestartet; Release/Dateien wurden nicht verändert.'}
Write-Output 'Lauf angefordert. Erst nach erfolgreicher Bereitstellung und Live-Versionsabgleich als fertig melden.'
