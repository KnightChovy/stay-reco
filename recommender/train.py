"""Evaluate the served formula, then publish a new offline recommendation snapshot. --dry-run writes nothing."""

import argparse
from datetime import datetime, timezone

import reco_db
import reco_pipeline
from weights import K_CONTENT, K_ITEM, K_USER

ALGORITHM = "two-sided-shrinkage"
VERSION = "2.1"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--top-k", type=int, default=reco_pipeline.TOP_K, help="hotels stored per customer")
    args = parser.parse_args()
    with reco_db.connect() as conn:
        if not args.dry_run:
            with conn.cursor() as cur:
                cur.execute("SELECT pg_try_advisory_lock(hashtext(%s)::bigint)", (ALGORITHM,))
                if not cur.fetchone()[0]:
                    print("A recommendation job is already running.", flush=True)
                    return
        cutoff = datetime.now(timezone.utc)
        run_id = None if args.dry_run else reco_db.start_run(
            conn, ALGORITHM, VERSION,
            {"k": K_USER, "k_item": K_ITEM, "k_c": K_CONTENT, "seed": args.seed, "topK": args.top_k,
             "min_ratings": reco_pipeline.MIN_RATINGS, "budgetSlack": reco_pipeline.BUDGET_SLACK},
            cutoff,
        )
        try:
            conn.execute("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY")
            ratings, hotels, customers, booked, amenities = (
                reco_db.load_ratings(conn), reco_db.load_hotels(conn), reco_db.load_customers(conn),
                reco_db.load_booked(conn), reco_db.load_amenities(conn))
            conn.commit()
            print(f"Data: {len(ratings):,} ratings, {len(customers):,} customers, {len(hotels)} bookable hotels",
                  flush=True)

            evaluation = reco_pipeline.evaluate(ratings, hotels, customers, amenities, seed=args.seed)
            if evaluation:
                _print_comparison(evaluation[1])
            scorer = reco_pipeline.Scorer(ratings, hotels, customers, amenities, seed=args.seed)
            rows = reco_pipeline.recommend(scorer, customers, booked, top_k=args.top_k)
            if args.dry_run:
                print(f"Dry run scored {sum(1 for _ in rows):,} recommendations.", flush=True)
                return
            metrics, comparison, split = evaluation or (None, None, None)
            reco_db.finish_run(conn, run_id, ALGORITHM, rows, metrics,
                               {"comparison": comparison, "split": split} if evaluation else None)
        except BaseException as error:
            if run_id:
                reco_db.fail_run(conn, run_id, error)
            raise
        print(f"Published recommendation run {run_id}.", flush=True)


def _print_comparison(comparison):
    cols = [("rmse", "RMSE"), ("mae", "MAE"), ("precision", "P@10"), ("recall", "R@10"), ("ndcg", "NDCG@10"),
            ("new_share", "New@10"), ("coldstart_coverage", "NewCov")]
    print(f"  {'Method':30s}" + "".join(f"{label:>9s}" for _, label in cols), flush=True)
    for name, m in comparison.items():
        print(f"  {name:30s}" + "".join(f"{m[key]:9.4f}" for key, _ in cols), flush=True)


if __name__ == "__main__":
    main()
