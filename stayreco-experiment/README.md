# StayReco — Two-Sided Shrinkage Weights for Hybrid Recommendation

Experiment code for the recommender of **StayReco**, a hotel booking platform built as a capstone project (FA26SE056, FPT University, Ho Chi Minh City), and for the paper:

> **Two-Sided Shrinkage Weights for Hybrid Recommendation under Continuous Cold Start.**
> D. H. Phuc, N. B. Khiem, N. M. Tan, P. T. Phat, N. K. T. Ngan, N. N. Lam.
> Source: [`paper/lncs/main.tex`](paper/lncs/main.tex) (Springer LNCS format).

A new booking platform has cold start on both sides at once: travellers arrive with no history, and partner hotels are listed before anyone has rated them. A weighted hybrid of collaborative filtering (CF), content-based and demographic predictors can cover both cases, but only if the mixing weights depend on the evidence available on **both** axes. This repository implements such a rule and evaluates it against eleven baselines on two datasets.

## The rule in one line

```
α = n_u/(n_u + k) · m_i/(m_i + k')       collaborative weight: product of a user-side and an item-side shrinkage factor
π = n_u/(n_u + k_c)                       splits the rest between content and demographic
β = (1 − α)·π,   γ = (1 − α)·(1 − π)      and γ = 0 when the item has no ratings (m_i = 0)

score = α·CF + β·Content + γ·Demographic
```

`n_u` is the number of items the user rated in training, `m_i` the number of users who rated the item. Because the collaborative weight is a **product**, a hotel nobody has rated gets `α = 0` however active the user is, and is then scored by content alone. A rule that adapts to the user only (as in Melville et al. 2002, Do et al. 2020) keeps handing collaborative weight to items the CF model has never seen.

Implementation: [`utils/alpha_scheduler.py`](utils/alpha_scheduler.py) (`compute_two_stage_alpha`) and [`models/paper_baselines.py`](models/paper_baselines.py) (`stayreco_two_stage`).

## Main results

Mean over 10 random splits, full-catalogue ranking. `New@10` is the share of top-10 slots filled by items with no training ratings. All numbers below come from `results/comparison_ablation_ml.csv` and `results/comparison_ablation_ta.csv`.

| Method | MovieLens 100K RMSE | MovieLens New@10 | TripAdvisor RMSE | TripAdvisor New@10 |
|---|---|---|---|---|
| CF only (SVD++) | 1.0306 | 0.0000 | 0.9200 | 0.0000 |
| Content only | 1.0215 | 0.0016 | 0.9175 | 0.0008 |
| Fixed α = 0.3 | 1.0161 | 0.0000 | **0.9104** | 0.0000 |
| Tarek et al. 2022 | 1.0206 | 0.0000 | 0.9135 | 0.0000 |
| Do et al. 2020 | 1.0192 | 0.0000 | 0.9125 | 0.0000 |
| OHWSF (Muhammad et al. 2025) | 1.0305 | 0.0000 | 0.9163 | 0.0000 |
| SL-ARec (Çakır et al. 2026) | 1.0155 | 0.0031 | 0.9109 | 0.0001 |
| **Two-sided rule** | **1.0148** | **0.0118** | 0.9151 | **0.0024** |

**Ablation** — same rule, only the form of α changed, each variant re-tuned:

| Variant | MovieLens New@10 | TripAdvisor New@10 |
|---|---|---|
| α = t_user · t_item (the rule) | **0.0118** | **0.0024** |
| α = t_user (user side only) | 0.0074 | 0.0000 |
| α = (t_user + t_item) / 2 | 0.0075 | 0.0000 |
| product, without the γ = 0 rule | 0.0011 | 0.0001 |

What this shows:

- On both datasets the rule is the only configuration that puts unrated items in the top-10 at a non-negligible rate. Nine of the eleven baselines never do. The gap is significant against every baseline (Wilcoxon signed-rank, 10/10 seeds, p = 0.002).
- Both design choices are needed: dropping the item side or replacing the product by a mean removes new hotels from the lists entirely on TripAdvisor; dropping the γ = 0 rule cuts the rate by an order of magnitude.
- On rating error the datasets disagree. The rule has the lowest RMSE on MovieLens but not on TripAdvisor, where every hybrid lies within 0.006 RMSE. The cause is measured: the errors of the CF and content components are correlated at 0.975, so the mixing ratio barely changes the prediction. See Section 6.5 of the paper.

## Setup

```bash
conda env create -f environment.yml
conda activate stayreco          # required, see note
pytest tests/ -q                 # run before any experiment
```

> **Activate the environment before running anything.** Calling `envs\stayreco\python.exe` directly on Windows crashes numpy on dense matrix products, because the MKL DLLs in `Library/bin` are only put on the DLL search path when the environment is activated. The process dies without a traceback (exception `0xc06d007f`). If you cannot activate, use `conda run -n stayreco python ...`.

Versions are pinned on purpose. `scikit-surprise 1.1.4` needs `numpy < 2`; do not upgrade numpy, and do not install `pyarrow` ≥ 16 into this environment (it requires numpy 2 and, when downgraded, makes `import pandas` followed by `import scipy.stats` segfault). `requirements.txt` lists the same versions for reference.

## Data

### MovieLens 100K

Downloaded automatically by Surprise on first use (`Dataset.load_builtin("ml-100k")`) into `~/.surprise_data`. Nothing to prepare.

### TripAdvisor (Mrázová & Behún, ITAT 2023)

3.1 million reviews of 3,260 U.S. hotels, released by the authors of [*Graph Neural Networks for Hotel Recommendation and Quality Assessment*](https://ceur-ws.org/Vol-3498/paper8.pdf) for academic research.

1. Download the three files from the [v1.0 release of `elkablo/gnn-social-tripadvisor`](https://github.com/elkablo/gnn-social-tripadvisor/releases/tag/v1.0) into `data/tripadvisor_raw/` and check them:

   ```
   da741b8b3433aa80fc135912b5d7cdce4b79dfa18b04a7b1e32c56e6c3368c15  authors.json.gz
   b205357a12ed61891ee53df96f3ff822087a04aeeadcb0df0fb3c35da1c464e7  hotels.json.gz
   a09191f41184625dacdd44a901fd8e91894fee880c31c95f00a51f9dced7b495  reviews.json.gz
   ```

2. Build the dataset used in the paper (users with at least 5 rated reviews → 382,279 ratings, 50,009 users, 3,131 hotels):

   ```bash
   python data/prep_tripadvisor.py --min-reviews=5     # writes data/tripadvisor/{ratings,items,users}.csv
   ```

3. Optional: the 12-core subset used by the ITAT paper (76,692 reviews / 1,287 hotels / 4,404 authors, matched exactly):

   ```bash
   python data/prep_tripadvisor_m12.py                 # writes data/tripadvisor_m12/
   ```

### HotelRec (optional)

[HotelRec](https://github.com/Diego999/HotelRec) (Antognini & Faltings, LREC 2020; 50 million reviews, academic use only) is not used in the paper because it has no user profile, so the demographic component and the γ = 0 rule cannot be tested on it. Scripts to build its 20-core subset without unpacking the 50 GB file are included:

```bash
python -I data/scan_hotelrec.py   <Full_HotelRec.zip> <work_dir>
python -I data/core20_hotelrec.py <work_dir> 20
python -I data/extract_hotelrec.py <Full_HotelRec.zip> <work_dir> <out_dir> 20
```

These reproduce Table 1 of the HotelRec paper exactly (20-core: 72,603 users, 38,903 items, 2,222,373 interactions), which requires two conditions the paper does not state: dropping the placeholder authors `/undefined` (1,193,017 reviews) and `null` (23,889), and filtering iteratively to a fixed point (34 rounds). Five hotels are listed under two URLs each, so the number of distinct hotels is 38,898.

## Reproducing the paper

```bash
# MovieLens 100K, 10 seeds (about 40 minutes)
python run_experiment.py 1 2 3 4 5 6 7 8 9 10 --tag=ablation_ml

# TripAdvisor, 10 seeds, ranking metrics on 2,000 sampled users per seed (about 7.5 hours)
python run_experiment.py 1 2 3 4 5 6 7 8 9 10 --dataset=tripadvisor --max-eval-users=2000 --tag=ablation_ta

# Paired comparison and Wilcoxon test over seeds, against the paper's method
REF="--ref=★ StayReco (2 tang + gamma=0 hotel moi)"
python analyze_seeds.py _ablation_ta "$REF"                 # on RMSE
python analyze_seeds.py _ablation_ta newitem@10 "$REF"      # on New@10

# Figures of the paper
python paper/lncs/fig_alpha_two_sided.py
python paper/lncs/fig_newitem_ablation.py
```

Method names in the result files are the internal labels: the paper's rule is `★ StayReco (2 tang + gamma=0 hotel moi)` ("2 tang" = two-stage), and the ablation variants start with `★ Ablation:`. Without `--ref`, `analyze_seeds.py` compares against `★ StayReco (α tuned)`, an earlier variant.

[`experiments/run_ablation_chain.sh`](experiments/run_ablation_chain.sh) runs both datasets back to back. Run them one after the other, not in parallel: running other heavy jobs at the same time made a TripAdvisor seed three times slower.

Every run writes `results/run_meta_<tag>.json` with the git commit, whether the working tree was dirty, the effective configuration and the library versions.

### Command-line options of `run_experiment.py`

| Option | Meaning | Default |
|---|---|---|
| `1 2 3 ...` | seeds; each seed is a different random split | `42` |
| `--dataset=` | `movielens` or `tripadvisor` | `movielens` |
| `--tag=` | suffix of the result files, so runs do not overwrite each other | none |
| `--cold-item=` | share of items whose ratings are all held out (new items) | `0.20` |
| `--cold-user=` | share of users whose history is truncated to 0–19 ratings | `0.30` |
| `--test-ratio=` | share of the remaining users' ratings held out | `0.20` |
| `--max-eval-users=` | sample this many test users for ranking metrics (`0` = all) | `0` |
| `--data-dir=` | alternative folder for the TripAdvisor CSVs | `data/tripadvisor` |

## Evaluation protocol

- **Cold start is simulated** per seed: 20% of items lose all their ratings (so `m_i = 0` in training), 30% of users keep only their first 0–19 ratings in chronological order, and the rest contribute 20% of their ratings to the held-out split, which is halved into validation and test. A temporal split was not used because the TripAdvisor corpus has almost no hotels receiving their first review in its final year, so there would be nothing to measure new-item exposure on.
- **Every method is tuned the same way**: grid search on the validation split, selected by RMSE. The test split is never used for tuning (Ferrari Dacrema et al., RecSys 2019).
- **Ranking is over the full catalogue** of items the user has not rated, not over a sampled candidate set (Krichene & Rendle, KDD 2020). A sampled set inflates every method and never contains an unrated item, so it cannot measure item-side cold start. See [`evaluation/ranking.py`](evaluation/ranking.py).
- **Significance**: two-sided Wilcoxon signed-rank test over the ten per-seed values. With ten seeds the smallest attainable p is 0.002.
- **Two families of metrics answer different questions**: RMSE and MAE measure rating accuracy on test pairs; P@K, R@K, NDCG@K, Cov@K and New@K measure the ranked list. A higher New@K is not better on its own; read it together with NDCG.

## Compared methods

- **Single components**: Popularity, CF only (SVD++), Content only (TF-IDF), Demographic only
- **Fixed-weight hybrids** over the same three components: α ∈ {0.3, 0.5, 0.7}, remainder split 70/30 between content and demographic
- **Published hybrids, re-implemented in this harness**:
  - Tarek et al. 2022, *A Hybrid Hotel Recommendation Using Collaborative, Content Based and Knowledge Based Approach*, LNNS (Springer)
  - Do, Le & Yoon 2020, *Dynamic Weighted Hybrid Recommender Systems*, ICACT
  - Muhammad et al. 2025, *OHWSF using SVD and SVD++ for Addressing Data Sparsity*, IJAIN 11(3)
  - Çakır et al. 2026, *SL-ARec*, PeerJ Computer Science 12, e3856
- **The two-sided rule** and its ablation variants (user side only, mean of the two factors, product without the γ = 0 rule, product with a wider `k'` grid)

The published methods are **adaptations, not reproductions**: each original uses its own dataset, split and metric, so their published numbers are not comparable with ours. Every change needed to run them here is documented in the docstrings of [`models/paper_baselines.py`](models/paper_baselines.py).

## Repository layout

```
stayreco-experiment/
├── run_experiment.py          main experiment: train, tune, score, rank, write results
├── analyze_seeds.py           paired per-seed comparison + Wilcoxon test
├── compare_svd_svdpp.py       SVD vs SVD++ per cold-start group, from saved score tables
├── config.py                  defaults (the values actually used are in run_meta_<tag>.json)
├── data/
│   ├── loader.py              MovieLens and TripAdvisor loaders
│   ├── preprocessor.py        cold-start simulation, validation split, group assignment
│   ├── prep_tripadvisor.py    raw TripAdvisor JSON → ratings/items/users CSV
│   ├── prep_tripadvisor_m12.py  12-core subset matching the ITAT paper
│   ├── prep_aspects.py        per-aspect sub-ratings (exploratory)
│   └── scan_hotelrec.py, core20_hotelrec.py, extract_hotelrec.py   HotelRec 20-core
├── models/
│   ├── cf_svdpp.py            SVD++ and SVD (Surprise)
│   ├── cf_itemknn.py          item–item CF (used by Tarek et al.)
│   ├── lightgcn.py            LightGCN (used by SL-ARec)
│   ├── content_based.py       TF-IDF profile + cosine, on a shrunk bias baseline
│   ├── demographic.py         group mean per item, shrunk to the item mean
│   ├── popularity.py          shrunk item mean
│   ├── knowledge.py           business-rule pre-filter (not evaluated: no price/availability data)
│   ├── hybrid.py              weighted combination
│   └── paper_baselines.py     published baselines, the two-sided rule and its ablations
├── utils/
│   ├── alpha_scheduler.py     weight schedules, including compute_two_stage_alpha
│   ├── tuning.py              grid search on validation
│   ├── batch.py               vectorised scoring
│   └── manifest.py            writes run_meta_<tag>.json
├── evaluation/
│   ├── metrics.py             RMSE, MAE
│   └── ranking.py             P/R/NDCG/Cov/New@K over the full catalogue
├── experiments/
│   ├── gate_aspect.py         does per-aspect information add anything? (it does not)
│   ├── gate_location.py       does hotel/user region add anything? (it does not)
│   ├── gate_location_hotelrec.py   same test on HotelRec
│   └── run_ablation_chain.sh  runs the two paper experiments in sequence
├── paper/lncs/                paper source and figure scripts
├── tests/                     pytest suite for the weight schedules, batching and metrics
└── results/                   CSV, PNG and run_meta_<tag>.json per run
```

## Result files

| File | Content |
|---|---|
| `run_meta_<tag>.json` | provenance: commit, dirty flag, effective configuration, library versions |
| `comparison_<tag>.csv` | overall metrics, one row per (method, seed) |
| `comparison_by_group_<tag>.csv` | metrics per cold-start group |
| `chosen_params_<tag>.csv` | parameters selected by the validation grid search |
| `score_table_sample_seed<s>_<tag>.csv` | component scores for a sample of test pairs |
| `score_table_seed<s>_<tag>.csv` | component scores for every test pair (git-ignored, regenerated by a run) |
| `comparison_<tag>.png`, `sensitivity_alpha_<tag>.png` | plots per group and sensitivity of validation RMSE |

## Side findings

These are not part of the paper's claim but are documented because they cost time to establish.

- **Side information adds little on this hotel corpus.** A one-way variance decomposition of TripAdvisor ratings attributes 28.0% to the user, 12.7% to the hotel and under 1% to hotel region, trip type or reviewer region. Per-aspect sub-ratings and location were each tested on top of a shrunk hotel mean ([`experiments/`](experiments/)); neither improved it on any seed. On TripAdvisor, *Demographic only* is worse than *Popularity*.
- **Reproducing the ITAT 2023 GNN.** In the authors' documented environment (PyTorch 1.13, PyG 2.3), the published review-rating pipeline stops at the first epoch: `create_torch_data.py` builds a 13-column label (all seven rating columns plus missing-value flags) while the decoder returns one value per edge. Keeping only the overall rating, as the thesis describes, makes it run. Two other changes were needed only because a newer PyTorch was used and are not errors in the authors' code.
- **Reproducing HotelRec Table 1** needs the two undocumented conditions listed in the HotelRec section above.

## Limitations

- MovieLens is a film benchmark and TripAdvisor contains review ratings, not booking logs. Neither has price or availability, so the knowledge-based pre-filter is not part of any reported number.
- Cold start is simulated by random hold-out; a hotel held out at random is not a hotel listed last.
- New@10 counts whether unrated items appear in the top-10, not whether they are the ones the user would have preferred among new items.
- On TripAdvisor the ranking metrics use 2,000 sampled users per seed and are small (≈ 0.003); differences between methods there are not significant.
- The three constants are re-selected on each split; a deployed system would fix them once.

## Acknowledgements

TripAdvisor corpus: I. Mrázová and M. Behún, Charles University. HotelRec: D. Antognini and B. Faltings, EPFL. Both datasets are restricted to academic research.
