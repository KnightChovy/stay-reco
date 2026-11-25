from datetime import datetime, timezone
import os
import unittest
from uuid import uuid4

import psycopg

from reco_db import fail_run, finish_run, start_run


@unittest.skipUnless(os.getenv("RECOMMENDER_TEST_DATABASE_URL"), "requires a migrated PostgreSQL test DB")
class SnapshotTest(unittest.TestCase):
    def test_failed_copy_preserves_preceding_run(self):
        algorithm = "two-sided-shrinkage"
        with psycopg.connect(os.environ["RECOMMENDER_TEST_DATABASE_URL"]) as conn:
            conn.execute("CREATE TEMP TABLE model_run (LIKE public.model_run INCLUDING DEFAULTS)")
            conn.execute("CREATE TEMP TABLE recommendation (LIKE public.recommendation INCLUDING DEFAULTS)")
            conn.execute("CREATE TEMP TABLE booking (LIKE public.booking INCLUDING DEFAULTS)")
            now = datetime.now(timezone.utc)
            prior = start_run(conn, algorithm, "test", {}, now)
            recommendation = (uuid4(), uuid4(), 4.5, 1, "Test")
            finish_run(conn, prior, algorithm, [recommendation])
            failed = start_run(conn, algorithm, "test", {}, now)

            def fail_after_first_row():
                yield recommendation
                raise ValueError("injected copy failure")

            try:
                finish_run(conn, failed, algorithm, fail_after_first_row())
            except ValueError as error:
                fail_run(conn, failed, error)
            else:
                self.fail("COPY should have failed")

            states = dict(conn.execute("SELECT model_run_id::text, status FROM model_run").fetchall())
            self.assertEqual(states, {prior: "COMPLETED", failed: "FAILED"})
            self.assertEqual(conn.execute(
                "SELECT model_run_id::text FROM recommendation"
            ).fetchall(), [(prior,)])
