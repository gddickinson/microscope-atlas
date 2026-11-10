"""Data integrity: every file passes the schema validator, and key counts hold."""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
import validate_data  # noqa: E402


def test_validator_clean():
    assert validate_data.check() == []


def test_every_technique_has_a_page_and_a_diagram_or_family_default():
    techs = json.loads((ROOT / "data" / "technique_index.json").read_text())
    assert len(techs) >= 51


def test_fluorophores_have_peaks():
    rows = json.loads((ROOT / "data" / "fluorophores.json").read_text())
    assert len(rows) > 500
    assert all(r["ex"] and r["em"] for r in rows)
    egfp = next(r for r in rows if r["name"] == "EGFP")
    assert 485 <= egfp["ex"] <= 490 and 505 <= egfp["em"] <= 510


def test_simulation_ids_have_code():
    sims = json.loads((ROOT / "data" / "content" / "simulations.json").read_text())
    code = "".join(p.read_text() for p in (ROOT / "atlas" / "web" / "static").glob("sim_*.js"))
    for s in sims:
        assert f"function {s['id']}(" in code, s["id"]
