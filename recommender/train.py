"""Trains the recommender on the app's data and publishes a new list for every customer.

    conda activate stayreco
    python recommender/train.py              # evaluate, then publish
    python recommender/train.py --dry-run    # evaluate only, write nothing

What a run does:
  1. reads ratings, hotels and customers from Postgres (reco_db.py);
  2. evaluates the paper's protocol on them: cold-start split, grid search on validation, full-catalogue ranking on
     test (reco_pipeline.evaluate). These are the numbers stored on `model_run`;
  3. refits on every rating with the chosen parameters and writes the top-K per customer to `recommendation`
     (reco_pipeline.recommend), plus one list with no customer for signed-out visitors;
  4. marks the run COMPLETED. The API always serves the newest completed run.

A run that fails is marked FAILED with the error, and the previous list keeps being served.
"""

import argparse
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
# The paper's modules print Vietnamese and ✓; a Windows console defaults to cp1252 and would crash on them.
sys.stdout.reconfigure(encoding="utf-8")
sys.stderr.reconfigure(encoding="utf-8")

import reco_db  # noqa: E402
import reco_pipeline as rp  # noqa: E402

ALGORITHM = "stayreco-two-sided"
VERSION = "1.0"
MIN_RATINGS = 50


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--top-k", type=int, default=20, help="recommendations stored per customer")
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--dry-run", action="store_true", help="evaluate only, write nothing")
    args = ap.parse_args()

    started = time.time()
    conn = reco_db.connect()
    ratings = reco_db.load_ratings(conn)
    hotels = reco_db.load_hotels(conn)
    customers = reco_db.load_customers(conn)
    print(f"Data: {len(ratings):,} ratings, {ratings['user_id'].nunique():,} guests who rated, "
          f"{len(customers):,} customers, {len(hotels)} bookable hotels "
          f"({len(set(hotels['item_id']) - set(ratings['item_id']))} never rated)")
    if len(ratings) < MIN_RATINGS:
        raise SystemExit(f"Only {len(ratings)} ratings: too few to train (need {MIN_RATINGS}). "
                         "Seed some with `npm run db:seed:reco` in backend/.")

    cutoff = reco_db.utc_now()
    run_id = None if args.dry_run else reco_db.start_run(
        conn, ALGORITHM, VERSION, {"seed": args.seed, "topK": args.top_k}, cutoff)
    try:
        print("Evaluating (paper protocol)...")
        params, metrics, comparison, split = rp.evaluate(ratings, hotels, customers, seed=args.seed)
        _print_comparison(comparison)

        if args.dry_run:
            print("Dry run: nothing written.")
            return

        print("Fitting on all ratings and ranking every customer...")
        rows = rp.recommend(ratings, hotels, customers, params, top_k=args.top_k, seed=args.seed)
        hyper = {
            "seed": args.seed, "topK": args.top_k, "params": params.as_dict(),
            "svdpp": rp.SVDPP, "contentK": rp.CONTENT_K, "demographicGroups": list(rp.DEMO_COLS),
            "split": {**rp.SPLIT, **split}, "comparison": comparison,
            "data": {"ratings": len(ratings), "customers": len(customers), "hotels": len(hotels)},
            "source": "stayreco-experiment (models/, utils/alpha_scheduler.py, evaluation/ranking.py)",
        }
        reco_db.finish_run(conn, run_id, metrics, hyper, rows)
        print(f"Published run {run_id}: {len(rows):,} recommendations "
              f"for {len({r['customer_id'] for r in rows}) - 1:,} customers + signed-out visitors "
              f"in {time.time() - started:.0f}s")
    except BaseException as err:
        if run_id:
            reco_db.fail_run(conn, run_id, err)
        raise
    finally:
        conn.close()


def _print_comparison(comparison):
    cols = [("rmse", "RMSE"), ("mae", "MAE"), ("precision", "P@10"), ("recall", "R@10"), ("ndcg", "NDCG@10"),
            ("new_share", "New@10"), ("coldstart_coverage", "NewCov")]
    print(f"  {'Method':45s}" + "".join(f"{label:>9s}" for _, label in cols))
    for name, m in comparison.items():
        print(f"  {name:45s}" + "".join(f"{m[key]:9.4f}" for key, _ in cols))


if __name__ == "__main__":
    main()
