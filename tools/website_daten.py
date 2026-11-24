"""Build website data from fixed installers and compatible published game updates."""
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


def full_content_data(extern):
    """Explicit installer/content delivery, independent of cumulative game updates."""
    if extern is None or not extern.exists():
        return None
    data = json.loads(extern.read_text(encoding="utf-8-sig"))
    delivery = data.get("delivery")
    if delivery is None:
        return None
    if delivery != "full_content":
        raise ValueError("apk_extern.json: unbekannte Auslieferungsart")
    base = data.get("base_id", "")
    match = re.fullmatch(r"nac-android-r([1-9][0-9]*)-content-([0-9]{8})", base)
    revision = data.get("revision")
    if not match or type(revision) is not int or revision != int(match[1]):
        raise ValueError("apk_extern.json: Android-Basis und Revision passen nicht zusammen")

    def direct_object(record, key, require_hash=True):
        if not isinstance(record, dict):
            raise ValueError("apk_extern.json: Downloadmetadaten fehlen")
        expected = "https://akatsuki-download.smxn-vs-lobby.workers.dev/" + key
        if record.get("url") != expected:
            raise ValueError("apk_extern.json: unerwartete versionierte Download-Adresse")
        size = record.get("bytes")
        if type(size) is not int or not 0 < size <= 9007199254740991:
            raise ValueError("apk_extern.json: ungültige Downloadgröße")
        if require_hash and not re.fullmatch(r"[0-9a-f]{64}", str(record.get("sha256", ""))):
            raise ValueError("apk_extern.json: SHA-256 fehlt")
        return record

    apk = direct_object(data, f"{base}/AkatsukiChronicles.apk")
    content = direct_object(data.get("content"),
        f"nac-content-r{revision}-{match[2]}/akatsuki-r{revision}-full.pck")
    pc = data.get("pc", {})
    pc_base = pc.get("base_id", "") if isinstance(pc, dict) else ""
    pc_revision = pc.get("revision") if isinstance(pc, dict) else None
    if type(pc_revision) is not int or pc_revision < 1:
        raise ValueError("apk_extern.json: PC-Stand fehlt")
    pc_delivery = pc.get("delivery", "legacy")
    if pc_delivery == "bundled_content":
        content_base = re.fullmatch(r"nac-android-r([1-9][0-9]*)-content-([0-9]{8})", pc_base)
        if not content_base or pc_revision < int(content_base[1]):
            raise ValueError("apk_extern.json: ungültige PC-Inhaltsbasis")
        pc_key = pc.get("key", "")
        if not re.fullmatch(r"nac-pc-[0-9]{8}-[0-9]{6}/AkatsukiChronicles_PC\.zip", pc_key):
            raise ValueError("apk_extern.json: ungültiger PC-Paketkey")
        pc = direct_object(pc, pc_key)
        pc_release_url = pc.get("release_url")
        if pc_release_url != "#pc-installation":
            raise ValueError("apk_extern.json: PC-Installationslink fehlt")
    elif pc_delivery == "legacy":
        if not re.fullmatch(r"nac-android-[0-9]{8}(?:-[0-9]{6})?", pc_base):
            raise ValueError("apk_extern.json: PC-Stand fehlt")
        pc_key = pc_base.replace("nac-android-", "nac-pc-", 1) + "/AkatsukiChronicles_PC.zip"
        pc = direct_object(pc, pc_key, require_hash=False)
        pc_release_url = f"{RELEASES}/tag/{pc_base}-r{pc_revision}"
    else:
        raise ValueError("apk_extern.json: unbekannte PC-Auslieferungsart")
    return {
        "apkUrl": apk["url"],
        "releaseUrl": "#installation",
        "version": f"{base.removeprefix('nac-android-')}:{revision}",
        "baseId": base,
        "revision": revision,
        "apkBytes": apk["bytes"],
        "patchBytes": 0,
        "apkExtern": True,
        "apkSha256": apk["sha256"],
        "delivery": "full_content",
        "contentUrl": content["url"],
        "contentBytes": content["bytes"],
        "contentSha256": content["sha256"],
        "pcUrl": pc["url"],
        "pcBaseId": pc_base,
        "pcRevision": pc_revision,
        "pcBytes": pc["bytes"],
        "pcSha256": pc.get("sha256", ""),
        "pcDelivery": pc_delivery,
        "pcReleaseUrl": pc_release_url,
    }


def gameplay_update_data(configured, latest):
    """Describe a compatible patch without changing installer metadata.

    GitHub release/asset metadata is checked here. The release gate and game
    verify the RSA signature; the website never installs executable data.
    """
    if latest.get("draft") or latest.get("prerelease"):
        raise ValueError("Der aktuelle Release ist noch nicht freigegeben")
    tag = latest.get("tag_name", "")
    match = re.fullmatch(
        r"(nac-android-r[1-9][0-9]*-content-[0-9]{8})-r([1-9][0-9]*)", tag)
    if not match:
        return None
    base, revision = match[1], int(match[2])
    platforms = [
        platform for platform, base_key, revision_key in (
            ("apk", "baseId", "revision"), ("pc", "pcBaseId", "pcRevision"))
        if configured.get(base_key) == base and revision > configured[revision_key]
    ]
    if not platforms:
        return None
    release_url = f"{RELEASES}/tag/{tag}"
    if latest.get("html_url") != release_url:
        raise ValueError("Spielupdate: unerwartete Release-Adresse")
    manifest_asset = asset(latest, "manifest.json")
    if type(manifest_asset["size"]) is not int or manifest_asset["size"] > 65536:
        raise ValueError("Spielupdate: Manifest ist zu groß")
    envelope = fetch_json(manifest_asset["browser_download_url"])
    try:
        raw = base64.b64decode(envelope["payload"], validate=True)
        signature = base64.b64decode(envelope["signature"], validate=True)
        if not raw or len(raw) > 65536 or not signature or len(signature) > 8192:
            raise ValueError("Ungültige Manifest-Hülle")
        payload = json.loads(raw)
    except (KeyError, TypeError, ValueError) as exc:
        raise ValueError("Spielupdate: ungültige Manifest-Hülle") from exc
    if not isinstance(payload, dict):
        raise ValueError("Spielupdate: ungültige Manifestdaten")
    for key, value in (("schema", 1), ("loader", 1), ("save_schema", 2),
                       ("coop_protocol", 1), ("revision", revision)):
        if type(payload.get(key)) is not int or payload[key] != value:
            raise ValueError(f"Spielupdate: inkompatibles Feld {key}")
    if (payload.get("base_id") != base
            or payload.get("engine") != "4.7.2.stable.official.ed1daf0bf"):
        raise ValueError("Spielupdate: falsche Inhaltsbasis oder Engine")
    size, digest = payload.get("bytes"), payload.get("sha256")
    if type(size) is not int or not 0 < size < 2147483648:
        raise ValueError("Spielupdate: ungültige Paketgröße")
    if not isinstance(digest, str) or not re.fullmatch(r"[0-9a-f]{64}", digest):
        raise ValueError("Spielupdate: ungültige SHA-256")
    patch = asset(latest, "update.pck")
    if (type(patch["size"]) is not int or size != patch["size"]
            or payload.get("url") != patch["browser_download_url"]):
        raise ValueError("Spielupdate: Manifest und veröffentlichtes Paket stimmen nicht überein")
    if patch.get("digest") not in (None, "", "sha256:" + digest):
        raise ValueError("Spielupdate: GitHub und Manifest nennen verschiedene Prüfsummen")
    return {
        "baseId": base,
        "revision": revision,
        "bytes": size,
        "sha256": digest,
        "url": patch["browser_download_url"],
        "releaseUrl": release_url,
        "platforms": platforms,
        "cumulative": True,
    }


def published_data(extern=None):
    configured = full_content_data(extern)
    if configured is not None:
        update = gameplay_update_data(configured, fetch_json(f"{API}/latest"))
        if update is not None:
            configured["gameplayUpdate"] = update
        return configured
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
    pending.write_bytes(("// Erzeugt mit tools/website_daten.py\nwindow.NAC_SITE = "
                         + json.dumps(data, indent=2, ensure_ascii=False) + ";\n").encode("utf-8"))
    pending.replace(args.output)
    print(f"{data['version']} · {len(rows)} Roadmap-Einträge · {args.output}")


if __name__ == "__main__":
    main()
