"""Methods papers (scripts/content/methods_src.py) and video tutorials (scripts/content/videos_src.py):
valid technique ids, well-formed rows, and Methods coverage of every technique in data/papers.json."""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts" / "content"))
from methods_src import ALLOWED_GAPS, METHODS  # noqa: E402
from videos_src import VIDEOS  # noqa: E402

TECH_IDS = {t["id"] for t in json.loads((ROOT / "data" / "technique_index.json").read_text())}


def test_methods_rows_well_formed_and_ids_exist():
    dois = [doi.lower() for doi, *_ in METHODS]
    assert len(dois) == len(set(dois)), "duplicate DOI in METHODS"
    for doi, surname, techs, note in METHODS:
        assert re.match(r"^10\.\d{4,9}/\S+$", doi), doi
        assert surname and note, doi
        assert techs and set(techs) <= TECH_IDS, (doi, set(techs) - TECH_IDS)
    assert set(ALLOWED_GAPS) <= TECH_IDS
    assert all(isinstance(r, str) and r for r in ALLOWED_GAPS.values())


def test_video_technique_ids_exist():
    for v in VIDEOS:
        assert set(v["techniques"]) <= TECH_IDS, (v["url"], set(v["techniques"]) - TECH_IDS)


def test_video_rows_well_formed():
    for v in VIDEOS:
        assert {"title", "url", "source", "techniques", "about", "minutes"} <= set(v), v
        assert v["title"] and v["source"] and v["about"], v["url"]
        assert v["minutes"] is None or (isinstance(v["minutes"], int) and v["minutes"] > 0), v["url"]


def test_video_urls_https_and_unique():
    urls = [v["url"] for v in VIDEOS]
    assert all(u.startswith("https://") for u in urls)
    assert len(urls) == len(set(urls)), "duplicate video URL"


def test_every_technique_has_a_methods_paper_or_an_allowed_gap():
    papers = json.loads((ROOT / "data" / "papers.json").read_text())
    covered = {t for p in papers if p.get("category") == "Methods" for t in p.get("techniques", [])}
    missing = TECH_IDS - covered - set(ALLOWED_GAPS)
    assert not missing, f"techniques without a Methods paper: {sorted(missing)}"
