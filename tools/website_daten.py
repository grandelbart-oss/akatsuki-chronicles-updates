"""Build public website data from the roadmap and the currently published release."""
import argparse
import base64
import json
import os
import re
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import urlsplit


ROOT = Path(__file__).resolve().parent.parent
REPOSITORY = "grandelbart-oss/akatsuki-chronicles-updates"
API = f"https://api.github.com/repos/{REPOSITORY}/releases"
RELEASES = f"https://github.com/{REPOSITORY}/releases"


def fetch_json(url):
    headers = {"User-Agent": "Akatsuki-Chronicles-Website"}
    token = os.environ.get("GITHUB_TOKEN", "")
    if token and url.startswith(API):
        # Nur für die API: GitHub drosselt anonyme Abfragen zeitweise (504, 08.11.2026).
        headers["Authorization"] = f"Bearer {token}"
    request = Request(url, headers=headers)
    with urlopen(request, timeout=30) as response:
        return json.load(response)


def asset(release, name):
    matches = [item for item in release["assets"]
               if item["name"] == name and item["state"] == "uploaded"]
    if len(matches) != 1:
        raise ValueError(f"{release['tag_name']}: fehlende oder doppelte Datei {name}")
    file = matches[0]
    expected = f"{RELEASES}/download/{release['tag_name']}/{name}"
    if file["browser_download_url"] != expected or file["size"] <= 0:
        raise ValueError(f"Ungültige Downloaddaten für {name}")
    return file


def external_apk(path, base):
    """APK über 2 GB liegt nicht bei GitHub (Dateigrenze), sondern z. B. bei Google Drive."""
    if path is None or not path.exists():
        return None
    data = json.loads(path.read_text(encoding="utf-8-sig"))
    if data.get("base_id") != base:
        return None
    url = data.get("url")
    size = data.get("bytes")
    # direkter Download (08.11.2026, sam: normaler Download mit Fortschritt statt Drive-Ansicht)
    if not isinstance(url, str):
        raise ValueError("apk_extern.json: unerwartete Download-Adresse")
    parsed = urlsplit(url)
    direct = parsed.hostname == "akatsuki-download.smxn-vs-lobby.workers.dev"
    allowed_host = direct or parsed.hostname in {"drive.google.com", "drive.usercontent.google.com"}
    if (parsed.scheme != "https" or not allowed_host or parsed.username or parsed.password
            or parsed.port not in (None, 443) or parsed.fragment
            or (direct and (parsed.path != f"/{base}/AkatsukiChronicles.apk" or parsed.query))):
        raise ValueError("apk_extern.json: unerwartete Download-Adresse")
    if type(size) is not int or size <= 0:
        raise ValueError("apk_extern.json: Größe fehlt")
    digest = data.get("sha256", "")
    if direct and (not isinstance(digest, str) or not re.fullmatch(r"[0-9a-f]{64}", digest)):
        raise ValueError("apk_extern.json: SHA-256 fehlt für den Direktdownload")
    result = {"browser_download_url": url, "size": size}
    if digest:
        result["sha256"] = digest
    return result


def published_data(extern=None):
    latest = fetch_json(f"{API}/latest")
    tag = latest["tag_name"]
    if latest["draft"] or latest["prerelease"]:
        raise ValueError("Der aktuelle Release ist noch nicht freigegeben")
    manifest = fetch_json(asset(latest, "manifest.json")["browser_download_url"])
    payload = json.loads(base64.b64decode(manifest["payload"], validate=True))
    base = payload["base_id"]
    revision = payload["revision"]
    if not re.fullmatch(r"nac-android-[0-9]{8}(?:-[0-9]{6})?", base):
        raise ValueError(f"Unbekannte Android-Basis {base}")
    if type(revision) is not int or revision < 1 or tag != f"{base}-r{revision}":
        raise ValueError("Manifest und Veröffentlichung nennen verschiedene Stände")
    patch = asset(latest, "update.pck")
    if payload["bytes"] != patch["size"] or payload["url"] != patch["browser_download_url"]:
        raise ValueError("Manifest und veröffentlichtes Spielpaket stimmen nicht überein")
    basis = latest if revision == 1 else fetch_json(f"{API}/tags/{base}-r1")
    if basis["draft"] or basis["prerelease"] or basis["tag_name"] != f"{base}-r1":
        raise ValueError("Die passende Basis-APK ist noch nicht freigegeben")
    on_github = any(item["name"] == "AkatsukiChronicles.apk" for item in basis["assets"])
    apk = asset(basis, "AkatsukiChronicles.apk") if on_github else external_apk(extern, base)
    if apk is None:
        raise ValueError("Die passende Basis-APK fehlt (weder im Release noch in apk_extern.json)")
    return {
        "apkUrl": apk["browser_download_url"],
        "releaseUrl": latest["html_url"],
        "version": f"{base.removeprefix('nac-android-')}:{revision}",
        "baseId": base,
        "revision": revision,
        "apkBytes": apk["size"],
        "patchBytes": patch["size"],
        "apkExtern": not on_github,
        "apkSha256": apk.get("sha256", ""),
    }


def roadmap(path):
    rows = json.loads(path.read_text(encoding="utf-8-sig"))
    if not isinstance(rows, list) or not rows:
        raise ValueError("Die Roadmap braucht mindestens einen Eintrag")
    for row in rows:
        if not isinstance(row, dict) or set(row) != {"title", "text", "status"}:
            raise ValueError("Jeder Roadmap-Eintrag braucht genau title, text und status")
        if row["status"] not in ("Spielbar", "Im Test", "Geplant"):
            raise ValueError(f"Unbekannter Roadmap-Status {row['status']}")
        if any(not isinstance(value, str) or not value.strip() for value in row.values()):
            raise ValueError("Die Roadmap enthält einen leeren Eintrag")
    return rows


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--roadmap", type=Path, default=ROOT / "website/roadmap.json")
    parser.add_argument("--output", type=Path, default=ROOT / "website/data.js")
    args = parser.parse_args()
    rows = roadmap(args.roadmap)
    data = published_data(args.roadmap.parent / "apk_extern.json")
    data["roadmap"] = rows
    args.output.parent.mkdir(parents=True, exist_ok=True)
    pending = args.output.with_suffix(".js.tmp")
    pending.write_text("// Erzeugt mit tools/website_daten.py\nwindow.NAC_SITE = "
                       + json.dumps(data, indent=2, ensure_ascii=False) + ";\n", encoding="utf-8")
    pending.replace(args.output)
    print(f"{data['version']} · {len(rows)} Roadmap-Einträge · {args.output}")


if __name__ == "__main__":
    main()
