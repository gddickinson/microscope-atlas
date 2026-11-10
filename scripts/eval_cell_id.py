"""Leave-one-out accuracy of the cell identifier (atlas/cell_id.py) on the atlas's labelled cell images.

Each image is scored with itself removed from the reference set by: the zero-shot text match, the nearest-neighbour
vote, a softmax probe trained on the other images' embeddings, and blends of these. Writes docs/cell_id_eval.md.
Needs the optional ML packages (requirements-ml.txt).
"""
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from atlas import cell_id  # noqa: E402

BLENDS = {"text 0.7 + neighbours 0.3": (0.7, 0, 0.3), "text 0.5 + probe 0.5": (0.5, 0.5, 0), "text 0.3 + probe 0.7": (0.3, 0.7, 0),
          "text 0.4 + probe 0.4 + neighbours 0.2": (0.4, 0.4, 0.2)}


def main(k=6):
    s = cell_id._load()
    refs, emb = cell_id.reference()
    ids, text = s["ids"], s["text"]
    y = np.array([ids.index(r["cell_type"]) for r in refs])
    n = len(refs)
    methods = ["zero-shot", "neighbours", "probe", *BLENDS]
    hits = {m: [0, 0] for m in methods}
    per = {}
    for i in range(n):
        e, mask = emb[i], np.arange(n) != i
        logits = s["scale"] * (text @ e)
        pt = np.exp(logits - logits.max())
        pt /= pt.sum()
        sims = emb @ e
        sims[i] = -np.inf
        pn = np.zeros(len(ids))
        for j in np.argsort(-sims)[:k]:
            pn[y[j]] += max(float(sims[j]), 0)
        pn /= pn.sum() or 1
        pp = cell_id.probe_proba(*cell_id.fit_probe(emb[mask], y[mask], len(ids)), e)
        scores = {"zero-shot": pt, "neighbours": pn, "probe": pp, **{b: a * pt + c * pp + d * pn for b, (a, c, d) in BLENDS.items()}}
        for m, sc in scores.items():
            r = np.argsort(-sc)
            hits[m][0] += r[0] == y[i]
            hits[m][1] += y[i] in r[:3]
        best = scores[cell_id.BLEND_NAME] if cell_id.BLEND_NAME in scores else pt
        d = per.setdefault(ids[y[i]], [0, 0])
        d[0] += int(np.argmax(best) == y[i])
        d[1] += 1
    lines = ["# Cell identifier: leave-one-out accuracy", "",
             f"{n} labelled Wikimedia Commons micrographs, {len(per)} cell types, {len(ids)} candidate types; each image is "
             f"scored with itself removed from the reference set and from the probe's training data (`scripts/eval_cell_id.py`).", "",
             "| Method | Top-1 | Top-3 |", "|---|---|---|"]
    lines += [f"| {m}{' (used by the app)' if m == cell_id.BLEND_NAME else ''} | {h[0] / n:.0%} | {h[1] / n:.0%} |" for m, h in hits.items()]
    lines += ["", f"Chance level for top-1 is {1 / len(ids):.0%}.", "", f"Top-1 by cell type ({cell_id.BLEND_NAME}):", "",
              "| Cell type | Correct | Images |", "|---|---|---|"]
    lines += [f"| {t} | {c} | {m} |" for t, (c, m) in sorted(per.items())]
    (ROOT / "docs" / "cell_id_eval.md").write_text("\n".join(lines) + "\n")
    print("\n".join(lines[:6 + len(methods)]))


if __name__ == "__main__":
    main()
