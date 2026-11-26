# StayReco recommender

The Python batch reads Postgres, evaluates the served formula, and publishes a new `model_run` with up to 100 ranked hotels per active customer plus one list for signed-out visitors (`recommendation`). NestJS serves the newest completed run: `GET /me/recommendations`, the assistant, and `GET /hotels?sort=recommended` for a signed-in customer, which orders the hotels that pass the search filters by this rank (hotels past the list fall back to stars, price and name). A hotel where the customer has a stay coming up or under way (`PENDING`, `CONFIRMED`, `CHECKED_IN`) is left out of their list, and so is one they rated below 3; a hotel they stayed at and liked may come back, with "Bạn đã ở đây và chấm 4.7★". Search shows every hotel anyway.

## The formula

Two-sided shrinkage (`weights.py`, `k=5`, `k_item=5`, `k_c=3`: the values the paper's grid search picked on this data, fixed rather than re-tuned on every run) blends SVD++, TF-IDF content and a demographic group mean (`components.py`, ported from `stayreco-experiment/models`). Below 50 ratings, the CF weight goes to content. The content query of a customer is built from their preferences: cities, travel styles, room amenities, preferred views and hotels liked at onboarding. A guest with no stays gets it in full; a guest with n rated stays still gets `PREF_GAIN · 3/(n+3)` of it (0.5), so changing preferences changes the list for regulars too.

The list is then ordered, removing nothing: hotels within the budget (cheapest room at most 20% over `budgetPerNight`) first, among them those of a travel style the customer chose, among those the ones in the cities they picked (`preferredCities`, else `favouriteCity`), and the score last. A hotel's styles are read from its own text by `styles.py`, the same phrases and rule as the onboarding hotel step (`backend/src/modules/onboarding/onboarding-taste.ts`): at least two phrases of the style, and at least 75% of its strongest style, so a business hotel that mentions the beach is not a resort. Keep the two files in step. Each row carries one reason in Vietnamese saying which part carried it (their own stay, similar guests, a hotel they rated highly, their preferences, guests of their group), marked "Khách sạn mới" for a hotel nobody has rated and "Ngoài điểm đến bạn chọn" for one outside the cities picked. A preference reason names a style only when the hotel is of that style.

## Evaluation

Every run first evaluates the served formula with the paper's protocol, imported from `stayreco-experiment/` (`data/preprocessor.py` cold-start split: 20% of hotels hidden, 30% of guests cut to their first 0-19 stays; `evaluation/ranking.py` full-catalogue ranking, K = 10), against CF only, content only and popularity. The served method's numbers go on `model_run` (`rmse`, `mae`, `precision_at_k`, `recall_at_k`, `ndcg_at_k`, `coldstart_coverage`) and the whole comparison in `hyperparameters.comparison`. Below 50 ratings the evaluation is skipped and the list is still published.

On the seeded data (`npm run db:seed:reco`, seed 42, measured 2026-11-26):

| Method | RMSE | P@10 | R@10 | NDCG@10 | New@10 | New hotels shown |
|---|---|---|---|---|---|---|
| **Two-sided (served)** | **0.766** | **0.091** | **0.473** | **0.264** | **0.279** | **97%** |
| Two-sided before 2026-11-26 (`k=40`, `k_c=1`, no preferences for regulars) | 0.778 | 0.080 | 0.400 | 0.213 | 0.178 | 97% |
| CF only (SVD++) | 0.789 | 0.060 | 0.282 | 0.188 | 0.090 | 23% |
| Content only | 0.778 | 0.075 | 0.374 | 0.203 | 0.147 | 87% |
| Popularity | 0.843 | 0.036 | 0.175 | 0.099 | 0.006 | 10% |

The ordering by budget, style and city does not change these figures: the protocol scores pairs, not the published order. `PREF_GAIN` 1.0 scores higher on this split (NDCG@10 0.279) but was not chosen on it, which would tune on the test set; 0.5 is the value the tuned pipeline of 2026-11-23 picked on validation. These are numbers on generated data; they show the pipeline works end to end, not how it will do on real guests.

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
