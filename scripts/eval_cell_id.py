"""Leave-one-out accuracy of the cell identifier (atlas/cell_id.py) on the atlas's labelled cell images.

For each image: zero-shot text match alone, nearest-neighbour vote alone (the image itself held out), and the blend
the app uses. Writes docs/cell_id_eval.md. Needs the optional ML packages (requirements-ml.txt).
"""
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from atlas import cell_id  # noqa: E402


def main(k=6):
    s = cell_id._load()
    refs, emb = cell_id.reference()
    ids, text = s["ids"], s["text"]
    truth = [r["cell_type"] for r in refs]
    hits = {m: [0, 0] for m in ("zero-shot", "neighbours", "blend")}
    per = {}
    for i, e in enumerate(emb):
        logits = s["scale"] * (text @ e)
        p = np.exp(logits - logits.max())
        p /= p.sum()
        sims = emb @ e
        sims[i] = -np.inf  # leave this image out
        votes = {}
        for j in np.argsort(-sims)[:k]:
            votes[truth[j]] = votes.get(truth[j], 0) + max(float(sims[j]), 0)
        tot = sum(votes.values()) or 1
        scores = {
            "zero-shot": {c: float(p[n]) for n, c in enumerate(ids)},
            "neighbours": {c: votes.get(c, 0) / tot for c in ids},
            "blend": {c: cell_id.W_TEXT * float(p[n]) + (1 - cell_id.W_TEXT) * votes.get(c, 0) / tot for n, c in enumerate(ids)},
        }
        for m, sc in scores.items():
            rank = sorted(sc, key=sc.get, reverse=True)
            hits[m][0] += rank[0] == truth[i]
            hits[m][1] += truth[i] in rank[:3]
        blend_top = max(scores["blend"], key=scores["blend"].get)
        d = per.setdefault(truth[i], [0, 0])
        d[0] += blend_top == truth[i]
        d[1] += 1
    n = len(refs)
    lines = ["# Cell identifier: leave-one-out accuracy", "",
             f"{n} labelled Wikimedia Commons micrographs, {len(per)} cell types, {len(ids)} candidate types; "
             f"each image is scored with itself removed from the reference set (`scripts/eval_cell_id.py`).", "",
             "| Method | Top-1 | Top-3 |", "|---|---|---|"]
    lines += [f"| {m} | {h[0] / n:.0%} | {h[1] / n:.0%} |" for m, h in hits.items()]
    lines += ["", f"Chance level for top-1 is {1 / len(ids):.0%}. With only 2-4 images per type the neighbour vote is "
              "weak; accuracy should rise as the image database grows.", "", "Blend top-1 by cell type:", "",
              "| Cell type | Correct | Images |", "|---|---|---|"]
    lines += [f"| {t} | {c} | {m} |" for t, (c, m) in sorted(per.items())]
    (ROOT / "docs" / "cell_id_eval.md").write_text("\n".join(lines) + "\n")
    print("\n".join(lines[:9]))


if __name__ == "__main__":
    main()
