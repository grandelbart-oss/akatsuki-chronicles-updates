"""Focused website tests. Fixtures describe the local R13 candidate, not a publication."""
import base64
import copy
import json
from pathlib import Path
import re
import unittest
from unittest.mock import patch

import website_daten as website

ROOT = Path(__file__).resolve().parent.parent
CONFIG = ROOT / "docs/apk_extern.json"
BASE = "nac-android-r12-content-20261123"
TAG = BASE + "-r13"
BYTES = 1201556
SHA256 = "d35ad172072b5fda8fb885f2954a09d609a9985f4678a52aaa68fc3220b07c7c"


def fixture():
    payload = {
        "schema": 1, "base_id": BASE, "engine": "4.7.2.stable.official.ed1daf0bf",
        "loader": 1, "save_schema": 2, "coop_protocol": 1, "revision": 13,
        "bytes": BYTES, "sha256": SHA256,
        "url": f"{website.RELEASES}/download/{TAG}/update.pck",
    }
    release = {
        "draft": False, "prerelease": False, "tag_name": TAG,
        "html_url": f"{website.RELEASES}/tag/{TAG}",
        "assets": [
            {"name": name, "state": "uploaded", "size": size,
             "browser_download_url": f"{website.RELEASES}/download/{TAG}/{name}"}
            for name, size in (("manifest.json", 1100), ("update.pck", BYTES))
        ],
    }
    release["assets"][1]["digest"] = "sha256:" + SHA256
    return release, payload


def envelope(payload):
    # Structural fixture only. RSA verification is a separate release/game gate.
    return {
        "payload": base64.b64encode(json.dumps(payload).encode()).decode(),
        "signature": base64.b64encode(b"test-only-signature").decode(),
    }


class WebsiteDataTests(unittest.TestCase):
    def setUp(self):
        self.base = website.full_content_data(CONFIG)
        self.release, self.payload = fixture()

    def test_foreign_r11_latest_cannot_replace_r12_installers(self):
        old = {"draft": False, "prerelease": False,
               "tag_name": "nac-android-20261110-204351-r11"}
        with patch.object(website, "fetch_json", return_value=old) as fetch:
            data = website.published_data(CONFIG)
        self.assertEqual(data, self.base)
        fetch.assert_called_once_with(website.API + "/latest")
        self.assertNotIn("gameplayUpdate", data)

    def test_r13_is_separate_and_shared_by_both_r12_platforms(self):
        with patch.object(website, "fetch_json",
                          side_effect=[self.release, envelope(self.payload)]):
            data = website.published_data(CONFIG)
        update = data.pop("gameplayUpdate")
        self.assertEqual(data, self.base)
        self.assertEqual((data["revision"], data["pcRevision"]), (12, 12))
        self.assertEqual(update["platforms"], ["apk", "pc"])
        self.assertEqual((update["bytes"], update["sha256"]), (BYTES, SHA256))
        self.assertEqual((update["baseId"], update["revision"]), (BASE, 13))
        self.assertEqual(update["url"], self.payload["url"])
        self.assertTrue(update["cumulative"])

    def test_only_platforms_on_the_matching_basis_receive_update(self):
        for key, platforms in (("pcBaseId", ["apk"]), ("baseId", ["pc"])):
            with self.subTest(key=key):
                data = copy.deepcopy(self.base)
                data[key] = "nac-android-20261110-204351"
                with patch.object(website, "fetch_json", return_value=envelope(self.payload)):
                    result = website.gameplay_update_data(data, self.release)
                self.assertEqual(result["platforms"], platforms)

    def test_invalid_matching_manifest_stops_generation(self):
        changes = [
            ("schema", 2), ("loader", True), ("save_schema", 3), ("coop_protocol", 2),
            ("revision", 14), ("revision", 13.0), ("base_id", "wrong-base"),
            ("engine", "4.7.1"), ("bytes", 0), ("bytes", BYTES + 1),
            ("bytes", 2147483648), ("bytes", float(BYTES)),
            ("sha256", "A" * 64), ("sha256", "a" * 63),
            ("url", self.payload["url"] + "?different=1"),
        ]
        for key, value in changes:
            with self.subTest(key=key, value=value):
                payload = dict(self.payload, **{key: value})
                with patch.object(website, "fetch_json", return_value=envelope(payload)):
                    with self.assertRaises(ValueError):
                        website.gameplay_update_data(self.base, self.release)

    def test_asset_mismatch_missing_duplicate_or_wrong_hash_stops_generation(self):
        cases = []
        for key, value in (("size", BYTES + 1), ("browser_download_url", "https://example.invalid/update.pck"),
                           ("digest", "sha256:" + "0" * 64)):
            item = copy.deepcopy(self.release)
            item["assets"][1][key] = value
            cases.append(item)
        missing = copy.deepcopy(self.release)
        missing["assets"].pop(1)
        cases.append(missing)
        duplicate = copy.deepcopy(self.release)
        duplicate["assets"].append(copy.deepcopy(duplicate["assets"][1]))
        cases.append(duplicate)
        wrong_page = copy.deepcopy(self.release)
        wrong_page["html_url"] += "?other=1"
        cases.append(wrong_page)
        large_manifest = copy.deepcopy(self.release)
        large_manifest["assets"][0]["size"] = 65537
        cases.append(large_manifest)
        for index, release in enumerate(cases):
            with self.subTest(case=index):
                with patch.object(website, "fetch_json", return_value=envelope(self.payload)):
                    with self.assertRaises(ValueError):
                        website.gameplay_update_data(self.base, release)

    def test_public_latest_and_newer_revision_required(self):
        for flag in ("draft", "prerelease"):
            with self.subTest(flag=flag), self.assertRaises(ValueError):
                website.gameplay_update_data(self.base, dict(self.release, **{flag: True}))
        for tag in (BASE + "-r12", "nac-android-r11-content-20261123-r13", "unrelated-v13"):
            with self.subTest(tag=tag):
                with patch.object(website, "fetch_json") as fetch:
                    self.assertIsNone(website.gameplay_update_data(
                        self.base, dict(self.release, tag_name=tag)))
                fetch.assert_not_called()

    def test_malformed_envelope_stops_generation(self):
        for value in ({}, {"payload": "!", "signature": "AA=="},
                      {"payload": "e30=", "signature": ""},
                      {"payload": "W10=", "signature": "AA=="}):
            with self.subTest(envelope=value):
                with patch.object(website, "fetch_json", return_value=value):
                    with self.assertRaises(ValueError):
                        website.gameplay_update_data(self.base, self.release)

    def test_release_routes_accept_old_and_content_tags_only(self):
        workflow = (ROOT / ".github/workflows/spielseite-main.yml").read_text(encoding="utf-8")
        powershell = (ROOT / "tools/website_aktualisieren.ps1").read_text(encoding="utf-8")
        workflow_pattern = re.search(r"if \(!/(.+)/\.test\(tag\)\)", workflow)[1]
        powershell_pattern = re.search(r"-notmatch '([^']+)'", powershell)[1]
        self.assertEqual(workflow_pattern, powershell_pattern)
        for tag in ("nac-android-20261110-204351-r11", "nac-android-20261108-r1", TAG):
            self.assertIsNotNone(re.fullmatch(workflow_pattern, tag), tag)
        for tag in (TAG + "-beta", "prefix-" + TAG, "nac-android-r0-content-20261123-r13",
                    "nac-pc-20261124-083548-r13", "unrelated-v13"):
            self.assertIsNone(re.fullmatch(workflow_pattern, tag), tag)
        self.assertIn("github.ref == 'refs/heads/main'", workflow)
        self.assertIn("ref: 'main'", workflow)


if __name__ == "__main__":
    unittest.main(verbosity=2)
