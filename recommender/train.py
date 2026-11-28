"""Evaluate the served formula, then publish a new offline recommendation snapshot. --dry-run writes nothing.

--customer <id> (repeatable) scores only those customers, with the same formula fitted on the same data, and writes
their lists into the run the API already serves, without evaluating or touching anyone else's list: the backend runs
it when a customer finishes onboarding or changes their preferences, so the model's own list is there in seconds
rather than after the next nightly run.
"""

import argparse
import sys
from collections import Counter
from datetime import datetime, timezone

import reco_db
import reco_pipeline
from weights import K_CONTENT, K_ITEM, K_USER

ALGORITHM = "two-sided-shrinkage"
VERSION = "2.1"


def main():
    # Run by the backend with a pipe for stdout, which Windows opens as cp1252: the progress lines carry "✓".
    for stream in (sys.stdout, sys.stderr):
        stream.reconfigure(encoding="utf-8", errors="replace")
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--top-k", type=int, default=reco_pipeline.TOP_K, help="hotels stored per customer")
    parser.add_argument("--customer", action="append", default=[], metavar="ID",
                        help="score only this customer into the served run (repeatable)")
    args = parser.parse_args()
    if args.customer:
        return score_customers(args.customer, seed=args.seed, top_k=args.top_k, dry_run=args.dry_run)
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
            metrics, comparison, split, rerank = evaluation or (None, None, None, None)
            # The λ chosen on validation now; without an evaluation, the one the served run uses.
            if rerank is None:
                rerank = {"lambda": reco_db.served_rerank_lambda(conn, ALGORITHM), "grid": []}
                conn.commit()
            scorer = reco_pipeline.Scorer(ratings, hotels, customers, amenities, seed=args.seed)
            scorer.rerank_lambda = rerank["lambda"]
            print(f"Long-tail re-ranking with λ = {scorer.rerank_lambda}.", flush=True)
            # Filled while the rows are written: every customer's top 10 as the model alone ordered it.
            before = Counter()
            rows = reco_pipeline.recommend(scorer, customers, booked, top_k=args.top_k, before=before)
            if args.dry_run:
                print(f"Dry run scored {sum(1 for _ in rows):,} recommendations.", flush=True)
                return
            reco_db.finish_run(conn, run_id, ALGORITHM, rows, metrics, {
                **({"comparison": comparison, "split": split} if evaluation else {}),
                "rerank": {**rerank, "slots_before": before},
            })
        except BaseException as error:
            if run_id:
                reco_db.fail_run(conn, run_id, error)
            raise
        print(f"Published recommendation run {run_id}.", flush=True)


def score_customers(customer_ids, *, seed, top_k, dry_run):
    """The model's list for these customers now, written into the served run (see the module docstring)."""
    with reco_db.connect() as conn:
        run_id = reco_db.latest_completed_run(conn, ALGORITHM)
        conn.commit()
        if not run_id:
            print("No published run yet: the customer keeps the list ranked from their preferences.", flush=True)
            return
        conn.execute("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY")
        ratings, hotels, customers, booked, amenities = (
            reco_db.load_ratings(conn), reco_db.load_hotels(conn), reco_db.load_customers(conn),
            reco_db.load_booked(conn), reco_db.load_amenities(conn))
        conn.commit()
        # Fitted on everyone, exactly as the nightly run: the demographic groups and the CF factors need all of them.
        scorer = reco_pipeline.Scorer(ratings, hotels, customers, amenities, seed=seed)
        scorer.rerank_lambda = reco_db.served_rerank_lambda(conn, ALGORITHM)
        conn.commit()
        wanted = customers[customers["user_id"].isin(customer_ids)]
        for user in sorted(set(customer_ids) - set(wanted["user_id"])):
            print(f"Customer {user} is not an active customer; skipped.", flush=True)
        for _, one in wanted.iterrows():
            rows = [row for row in reco_pipeline.recommend(scorer, wanted[wanted["user_id"] == one["user_id"]], booked,
                                                           top_k=top_k, include_public=False)]
            if dry_run:
                print(f"Dry run scored {len(rows)} hotels for {one['user_id']}.", flush=True)
                continue
            written = reco_db.write_customer(conn, run_id, one["user_id"], rows)
            print(f"Wrote {written} hotels for {one['user_id']} into run {run_id}.", flush=True)


def _print_comparison(comparison):
    cols = [("rmse", "RMSE"), ("mae", "MAE"), ("precision", "P@10"), ("recall", "R@10"), ("ndcg", "NDCG@10"),
            ("new_share", "New@10"), ("coldstart_coverage", "NewCov")]
    print(f"  {'Method':30s}" + "".join(f"{label:>9s}" for _, label in cols), flush=True)
    for name, m in comparison.items():
        print(f"  {name:30s}" + "".join(f"{m[key]:9.4f}" for key, _ in cols), flush=True)


if __name__ == "__main__":
    main()
