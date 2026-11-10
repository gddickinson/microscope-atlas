# Cell identifier: leave-one-out accuracy

290 labelled Wikimedia Commons micrographs, 34 cell types, 34 candidate types; each image is scored with itself removed from the reference set and from the probe's training data (`scripts/eval_cell_id.py`).

| Method | Top-1 | Top-3 |
|---|---|---|
| zero-shot | 29% | 52% |
| neighbours | 23% | 50% |
| probe | 26% | 52% |
| text 0.7 + neighbours 0.3 | 29% | 56% |
| text 0.5 + probe 0.5 | 31% | 58% |
| text 0.3 + probe 0.7 | 32% | 57% |
| text 0.4 + probe 0.4 + neighbours 0.2 (used by the app) | 33% | 59% |

Chance level for top-1 is 3%.

Top-1 by cell type (text 0.4 + probe 0.4 + neighbours 0.2):

| Cell type | Correct | Images |
|---|---|---|
| adipocyte | 3 | 9 |
| amoeba | 2 | 9 |
| archaeon | 2 | 8 |
| bacterium | 3 | 8 |
| cancer-cell | 3 | 9 |
| cardiomyocyte | 3 | 9 |
| chondrocyte | 3 | 9 |
| ciliate | 2 | 9 |
| columnar-epithelium | 4 | 8 |
| cultured-cell-line | 2 | 9 |
| cyanobacterium | 2 | 8 |
| diatom | 4 | 9 |
| eosinophil | 1 | 9 |
| erythrocyte | 2 | 9 |
| fibroblast | 4 | 8 |
| glial-cell | 4 | 7 |
| guard-cell | 5 | 10 |
| hepatocyte | 5 | 9 |
| keratinocyte | 1 | 7 |
| lymphocyte | 1 | 9 |
| macrophage | 0 | 9 |
| mitotic-cell | 2 | 10 |
| neuron | 5 | 8 |
| neutrophil | 0 | 9 |
| oocyte | 5 | 7 |
| osteocyte | 3 | 8 |
| plant-cell | 0 | 9 |
| platelet | 2 | 8 |
| pollen | 6 | 9 |
| skeletal-muscle | 3 | 7 |
| smooth-muscle | 4 | 7 |
| sperm | 5 | 9 |
| squamous-epithelium | 5 | 9 |
| yeast | 1 | 9 |
