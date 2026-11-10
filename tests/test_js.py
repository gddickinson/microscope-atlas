"""Run the node tests for the browser modules (every tests/*.test.mjs file)."""
import shutil
import subprocess
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
JS_TESTS = sorted((ROOT / "tests").glob("*.test.mjs"))


@pytest.mark.skipif(not shutil.which("node"), reason="node not installed")
@pytest.mark.parametrize("path", JS_TESTS, ids=[p.name for p in JS_TESTS])
def test_node(path):
    r = subprocess.run(["node", str(path)], capture_output=True, text=True)
    assert r.returncode == 0, r.stderr + r.stdout
