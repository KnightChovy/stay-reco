# StayReco recommender

The Python batch reads Postgres, evaluates the served formula, and publishes a new `model_run` with up to 100 ranked hotels per active customer plus one list for signed-out visitors (`recommendation`). NestJS serves the newest completed run: `GET /me/recommendations`, the assistant, and `GET /hotels?sort=recommended` for a signed-in customer, which orders the hotels that pass the search filters by this rank (hotels past the list fall back to stars, price and name). A hotel the customer booked (not `CANCELLED` or `EXPIRED`) is left out of their list, but search still shows it.

## The formula

Two-sided shrinkage (`weights.py`, `k=40`, `k_item=5`, `k_c=1`) blends SVD++, TF-IDF content and a demographic group mean (`components.py`, ported from `stayreco-experiment/models`). Below 50 ratings, the CF weight goes to content. The content query of a customer is built from their preferences: favourite city, travel styles, room amenities, preferred views and hotels liked at onboarding. A hotel whose cheapest room is more than 20% over `budgetPerNight` is ranked after the others, not removed. Each row carries one reason in Vietnamese saying which part carried it (similar guests, a hotel they rated highly, their preferences, guests of their group), marked "Khách sạn mới" for a hotel nobody has rated.

## Evaluation

Every run first evaluates the served formula with the paper's protocol, imported from `stayreco-experiment/` (`data/preprocessor.py` cold-start split: 20% of hotels hidden, 30% of guests cut to their first 0-19 stays; `evaluation/ranking.py` full-catalogue ranking, K = 10), against CF only, content only and popularity. The served method's numbers go on `model_run` (`rmse`, `mae`, `precision_at_k`, `recall_at_k`, `ndcg_at_k`, `coldstart_coverage`) and the whole comparison in `hyperparameters.comparison`. Below 50 ratings the evaluation is skipped and the list is still published.

On the seeded data (`npm run db:seed:reco`, seed 42):

| Method | RMSE | P@10 | R@10 | NDCG@10 | New@10 | New hotels shown |
|---|---|---|---|---|---|---|
| **Two-sided (served)** | **0.782** | **0.094** | **0.485** | **0.290** | 0.174 | **100%** |
| CF only (SVD++) | 0.786 | 0.076 | 0.374 | 0.252 | 0.099 | 35% |
| Content only | 0.787 | 0.090 | 0.457 | 0.274 | 0.145 | 100% |
| Popularity | 0.838 | 0.055 | 0.265 | 0.151 | 0.004 | 13% |

The weights are fixed rather than tuned on a validation split, which is simpler to serve but scores below the earlier tuned pipeline on the same data (RMSE 0.748, NDCG@10 0.348). These are numbers on generated data; they show the pipeline works end to end, not how it will do on real guests.

## Run locally or deploy

Apply the backend migrations before running the image. Build with Docker so the SVD++ extension compiles in Linux; the paper's folder is a second build context:

```sh
docker build --build-context paper=stayreco-experiment -t stayreco-recommender:local recommender
docker run --rm --env-file /etc/stayreco/recommender.env stayreco-recommender:local --dry-run
docker run --rm --env-file /etc/stayreco/recommender.env stayreco-recommender:local
```

`--dry-run` evaluates and scores without writing a run; `--top-k` changes how many hotels are stored per customer. The env file supplies `DATABASE_URL` for a PostgreSQL host reachable **from inside the container** (`host.docker.internal` for a database on the Docker host; attach the application's network if it is a service name). Install [nightly.crontab](./nightly.crontab) in the host's scheduler with the published image tag. A run on the seeded data takes about 20 s.

COPY, the metrics and the status are published in one transaction. A failed job leaves the previous snapshot available and records `FAILED`. The batch keeps the rows of the two latest completed snapshots and any older rows referenced by bookings. Before the first new snapshot, NestJS can still serve the previous algorithm's last completed run.

For a local experiment, run the base seed then `npm run db:seed:reco` in `backend/` against a dedicated database.

Run the Python tests in the image with the repository's `recommender/` directory mounted as the working directory and `/venv/bin/python -m unittest discover -s tests`. Set `RECOMMENDER_TEST_DATABASE_URL` to a migrated test database to include the transaction test.
