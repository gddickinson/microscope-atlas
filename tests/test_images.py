"""Wikimedia Commons images (data/images): licences, attribution, files and ids are all valid."""
import json
import re
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
IMAGES = ROOT / "data" / "images"
MANIFEST = IMAGES / "manifest.json"
sys.path.insert(0, str(ROOT / "scripts"))
from fetch_commons import accepted_licence  # noqa: E402

pytestmark = pytest.mark.skipif(not MANIFEST.exists(), reason="run scripts/fetch_commons.py first")


def manifest():
    return json.loads(MANIFEST.read_text())


def system_ids():
    ids = set()
    for f in (ROOT / "data" / "systems").glob("*.json"):
        ids |= {s["id"] for s in json.loads(f.read_text())}
    return ids


def test_manifest_not_empty_and_unique():
    m = manifest()
    assert len(m) >= 100
    assert len({e["file"] for e in m}) == len(m)
    assert len({e["commons_title"] for e in m}) == len(m)


def test_every_entry_has_accepted_licence_author_and_source():
    for e in manifest():
        assert accepted_licence(e["licence"], e["licence_url"]), e["commons_title"]
        assert not re.search(r"\b(nc|nd)\b", e["licence"], re.I), e["commons_title"]
        if e["licence"].lower().startswith("cc") and "cc0" not in e["licence"].lower():
            assert "creativecommons.org" in e["licence_url"], e["commons_title"]
        assert e["author"].strip(), e["commons_title"]
        assert e["source_url"].startswith("https://commons.wikimedia.org/wiki/File:"), e["commons_title"]
        assert e["kind"] in ("instrument", "micrograph")
        assert e["title"].strip() and e["caption"].strip()


def test_files_exist_with_sane_size():
    for e in manifest():
        f = IMAGES / e["file"]
        assert f.exists(), e["file"]
        assert 0 < f.stat().st_size <= 600_000, e["file"]
        assert 0 < e["width"] <= 1000 and e["height"] > 0, e["file"]


def test_system_and_technique_ids_exist():
    systems = system_ids()
    techs = {t["id"] for t in json.loads((ROOT / "data" / "technique_index.json").read_text())}
    for e in manifest():
        assert e["system"] == "" or e["system"] in systems, (e["file"], e["system"])
        assert e["techniques"], e["file"]
        assert set(e["techniques"]) <= techs, (e["file"], e["techniques"])


def test_total_size_under_limit():
    total = sum(f.stat().st_size for f in IMAGES.iterdir())
    assert total < 45 * 1024 * 1024, total


def test_no_stray_files():
    names = {e["file"] for e in manifest()} | {"manifest.json"}
    assert {f.name for f in IMAGES.iterdir()} == names
