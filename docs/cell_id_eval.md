# Cell identifier: leave-one-out accuracy

97 labelled Wikimedia Commons micrographs, 33 cell types, 34 candidate types; each image is scored with itself removed from the reference set (`scripts/eval_cell_id.py`).

| Method | Top-1 | Top-3 |
|---|---|---|
| zero-shot | 32% | 55% |
| neighbours | 25% | 42% |
| blend | 32% | 56% |

Chance level for top-1 is 3%. With only 2-4 images per type the neighbour vote is weak; accuracy should rise as the image database grows.

Blend top-1 by cell type:

| Cell type | Correct | Images |
|---|---|---|
| adipocyte | 0 | 3 |
| amoeba | 0 | 3 |
| bacterium | 3 | 3 |
| cancer-cell | 2 | 3 |
| cardiomyocyte | 1 | 3 |
| chondrocyte | 2 | 3 |
| ciliate | 0 | 3 |
| columnar-epithelium | 2 | 3 |
| cultured-cell-line | 0 | 3 |
| cyanobacterium | 0 | 2 |
| diatom | 1 | 3 |
| eosinophil | 0 | 3 |
| erythrocyte | 1 | 3 |
| fibroblast | 2 | 3 |
| glial-cell | 2 | 3 |
| guard-cell | 1 | 3 |
| hepatocyte | 0 | 3 |
| keratinocyte | 0 | 3 |
| lymphocyte | 0 | 3 |
| macrophage | 0 | 3 |
| mitotic-cell | 0 | 4 |
| neuron | 2 | 3 |
| neutrophil | 1 | 3 |
| oocyte | 3 | 3 |
| osteocyte | 1 | 3 |
| plant-cell | 0 | 3 |
| platelet | 0 | 3 |
| pollen | 1 | 3 |
| skeletal-muscle | 0 | 2 |
| smooth-muscle | 1 | 2 |
| sperm | 2 | 3 |
| squamous-epithelium | 2 | 3 |
| yeast | 1 | 3 |
