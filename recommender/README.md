# recommender

The offline job that turns guests' stays and reviews into the hotel lists the app serves (`GET /me/recommendations`, the assistant's search). It runs the method of the paper in [`../stayreco-experiment/`](../stayreco-experiment/README.md) on the app's own database: the model code is **imported from there, not copied**, so the numbers here are produced by the same code as the paper's.

```
Postgres (review, hotel, customer, customer_preference)
   │  reco_db.py: read
   ▼
reco_pipeline.py
   1. evaluate: the paper's cold-start split → grid search on validation → full-catalogue ranking on test
   2. recommend: refit on everything → score every (customer, hotel) → top-K with a reason
   │  reco_db.py: write
   ▼
Postgres (model_run, recommendation)  ──►  backend RecommendationsService  ──►  API, assistant
```

## Run

Uses the paper's conda environment (`stayreco-experiment/environment.yml`) plus a Postgres driver:

```bash
conda activate stayreco
pip install -r recommender/requirements.txt     # once: psycopg2-binary

python recommender/train.py --dry-run           # evaluate only, print the comparison, write nothing
python recommender/train.py                     # evaluate, then publish a new list for every customer
```

`DATABASE_URL` is read from the environment, else from `backend/.env`. A run takes about 15 s on the seeded data. Run it on a schedule (nightly is plenty): each run is a new `model_run`, the API serves the newest `COMPLETED` one, and the lists of all but the last three runs are deleted (except rows a booking points at).

On a fresh database there is nothing to learn from. `npm run db:seed:reco` in `backend/` generates it: 66 hotels in 10 cities (13 listed recently, with no stays), 900 guests (a fifth who never stayed, half who filled in the preferences screen) and about 4,800 reviewed stays. The ratings are generated from a hidden taste per guest and a style per hotel, so there is a real pattern to learn; see the header of `backend/prisma/seed-reco.ts`.

## The method

From the paper, unchanged:

| Part | Paper code | On the app's data |
|---|---|---|
| Collaborative filtering | `models/cf_svdpp.py`: SVD++, 50 factors, 30 epochs | review overall rating per (guest, hotel), averaged over their reviews (as in the paper) |
| Content | `models/content_based.py`: TF-IDF + item kNN on rating deviations | name, city, description, amenities and room types of each hotel |
| Demographic | `models/demographic.py`: group mean, shrunk to the hotel mean | age group, nationality, first travel style |
| Weights | `utils/alpha_scheduler.py` `compute_two_stage_alpha` | `α = n_u/(n_u+k) · m_i/(m_i+k')`, `π = n_u/(n_u+k_c)`, γ = 0 for a hotel nobody rated |
| Evaluation | `data/preprocessor.py`, `evaluation/ranking.py` | 20% of hotels hidden, 30% of guests cut to 0-19 stays, ranking over the whole catalogue |

Added here, because the app has data the paper's datasets did not:

1. **The preferences screen.** Travel styles, amenities and favourite city become a query in the content model's TF-IDF space; a guest with preferences gets `has_preferences=True` in the weight rule (π = 1). The strength (`pref_gain`) and whether to use them at all are chosen on validation with the other parameters.
2. **A budget pre-filter** on the stored list: a hotel whose cheapest room is more than 20% over the guest's budget per night is left out (Knowledge pre-filter, as in the project design). Dates and free rooms are checked at query time by the API.
3. **Reasons.** Each row says which part carried it: similar guests (CF), similarity to a hotel the guest rated highly (content), their preferences, or guests of the same age group and nationality (demographic). A hotel nobody has rated is marked as new.

## Results on the seeded data

`python recommender/train.py --dry-run`, seed 42 (test split, K = 10):

| Method | RMSE | P@10 | R@10 | NDCG@10 | New@10 | New hotels shown |
|---|---|---|---|---|---|---|
| **Two-sided + preferences** (served) | **0.748** | **0.085** | **0.569** | **0.348** | 0.379 | **100%** |
| Two-sided, paper as is | 0.757 | 0.074 | 0.492 | 0.276 | 0.305 | 97% |
| Fixed α = 0.3 | 0.770 | 0.059 | 0.380 | 0.210 | 0.134 | 93% |
| CF only (SVD++) | 0.781 | 0.054 | 0.330 | 0.209 | 0.124 | 33% |
| Content only | 0.767 | 0.065 | 0.418 | 0.219 | 0.166 | 93% |
| Popularity | 0.837 | 0.033 | 0.203 | 0.111 | 0.011 | 17% |

These are numbers on generated data, which has a pattern by construction; they show the pipeline works end to end, not how it will do on real guests. Every run stores its own comparison in `model_run.hyperparameters.comparison`, so the real numbers will be there once real reviews accumulate. `booking.recommendation_id` is set when a guest books a hotel from their list through the assistant, which is the online measure to watch.
