"""Reading the training data from the app's Postgres, and writing the results back.

The recommender never talks to the backend: it reads the same tables the API writes, and writes the two tables the
API reads (`model_run`, `recommendation`). The schema is owned by Prisma (backend/prisma/schema.prisma); nothing here
creates or alters a table.
"""

import json
import os
import re
import unicodedata
from datetime import date
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

import pandas as pd
import psycopg

REPO = Path(__file__).resolve().parent.parent


def database_url():
    """DATABASE_URL from the environment, else from backend/.env, without Prisma's `?schema=` suffix."""
    url = os.environ.get("DATABASE_URL")
    env_file = REPO / "backend" / ".env"
    if not url and env_file.exists():
        for line in env_file.read_text(encoding="utf-8").splitlines():
            m = re.match(r"\s*DATABASE_URL\s*=\s*\"?([^\"#]+)\"?", line)
            if m:
                url = m.group(1).strip()
    if not url:
        raise SystemExit("DATABASE_URL is not set (environment or backend/.env)")
    parts = urlsplit(url)
    query = urlencode([(key, value) for key, value in parse_qsl(parts.query, keep_blank_values=True)
                       if key != "schema"])
    return urlunsplit(parts._replace(query=query))


def connect():
    return psycopg.connect(database_url())


def fold(text):
    """Lowercase without Vietnamese accents, so 'Đà Lạt', 'da lat' and 'DA LAT' compare equal."""
    text = unicodedata.normalize("NFD", text or "").replace("đ", "d").replace("Đ", "D")
    return "".join(c for c in text if unicodedata.category(c) != "Mn").lower().strip()


def _frame(conn, sql, params=None):
    with conn.cursor() as cur:
        cur.execute(sql, params)
        cols = [c.name for c in cur.description]
        return pd.DataFrame(cur.fetchall(), columns=cols)


def load_ratings(conn):
    """One rating per (guest, hotel): the average overall rating of their visible reviews, as in the paper.

    The overall rating is the weighted average of the five criteria (BR-12). The timestamp is that of the latest review;
    the paper's cold-start split keeps each simulated new guest's earliest stays.
    """
    df = _frame(conn, """
        SELECT r.customer_id::text AS user_id, r.hotel_id::text AS item_id,
               AVG(r.overall_rating)::float AS rating,
               EXTRACT(EPOCH FROM MAX(r.created_at))::bigint AS timestamp
        FROM review r
        WHERE r.is_visible
        GROUP BY r.customer_id, r.hotel_id
        ORDER BY r.customer_id, r.hotel_id
    """)
    return df


def load_hotels(conn):
    """Every bookable hotel (BR-01: ACTIVE, partner not suspended) with the text the content model reads.

    The text is what a guest would read about the hotel: name, city, description, hotel amenities and room types.
    Hotels nobody has rated are included; that is the point of the content model.
    """
    df = _frame(conn, """
        SELECT h.hotel_id::text AS item_id, h.name, h.city, h.star_rating,
               COALESCE(h.description, '') AS description,
               COALESCE((SELECT string_agg(a.name, ', ') FROM hotel_amenity ha
                         JOIN amenity a ON a.amenity_id = ha.amenity_id
                         WHERE ha.hotel_id = h.hotel_id), '') AS amenities,
               COALESCE((SELECT string_agg(rt.name || ' ' || COALESCE(rt.description, ''), '. ')
                         FROM room_type rt WHERE rt.hotel_id = h.hotel_id), '') AS rooms,
               COALESCE((SELECT string_agg(DISTINCT a.name, ', ') FROM room_type rt
                         JOIN room_type_amenity rta ON rta.room_type_id = rt.room_type_id
                         JOIN amenity a ON a.amenity_id = rta.amenity_id
                         WHERE rt.hotel_id = h.hotel_id), '') AS room_amenities,
               (SELECT MIN(p.price_per_night)::float FROM room_type rt
                  JOIN price p ON p.room_type_id = rt.room_type_id
                 WHERE rt.hotel_id = h.hotel_id AND p.room_id IS NULL AND p.rule_type = 'BASE'
                   AND p.is_active) AS min_price
        FROM hotel h JOIN hotel_partner hp ON hp.hotel_partner_id = h.hotel_partner_id
        WHERE h.status = 'ACTIVE' AND hp.status <> 'SUSPENDED'
        ORDER BY h.hotel_id
    """)
    stars = df["star_rating"].map(lambda value: "" if pd.isna(value) else f"sao{int(value)}")
    df["text"] = (
        "hotel " + df["name"] + " " + df["city"] + " " + stars + " " + df["description"]
        + " " + df["amenities"] + " " + df["rooms"] + " " + df["room_amenities"]
    ).map(fold)
    return df


def _age_group(dob, today):
    if dob is None or pd.isna(dob):
        return None
    age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
    return "<25" if age < 25 else "25-34" if age < 35 else "35-44" if age < 45 else "45+"


def load_customers(conn):
    """Active customers with their demographic fields and content preferences."""
    df = _frame(conn, """
        SELECT c.customer_id::text AS user_id, c.date_of_birth, c.nationality, c.gender::text AS gender
        FROM customer c JOIN user_account u ON u.user_account_id = c.customer_id
        WHERE u.status = 'ACTIVE'
        ORDER BY c.customer_id
    """)
    prefs = _frame(conn, """
        SELECT customer_id::text AS user_id, preference_key, preference_value
        FROM customer_preference
        WHERE preference_key IN ('likedHotels', 'favouriteCity', 'preferredCities', 'roomAmenities',
                                 'preferredViews', 'travelStyles', 'budgetPerNight')
    """)
    by_user = {u: dict(zip(g["preference_key"], g["preference_value"])) for u, g in prefs.groupby("user_id")}

    today = date.today()
    df["age_group"] = [_age_group(d, today) for d in df["date_of_birth"]]
    df["country"] = df["nationality"].fillna("").map(lambda s: fold(s) or None)
    df["preferences"] = df["user_id"].map(lambda u: by_user.get(u, {}))
    return df.drop(columns=["date_of_birth", "nationality"])


# ── Writing ─────────────────────────────────────────────────

def start_run(conn, algorithm, version, hyperparameters, cutoff):
    with conn.cursor() as cur:
        cur.execute("""
            INSERT INTO model_run (algorithm, version, hyperparameters, train_cutoff_at, status, started_at)
            VALUES (%s, %s, %s, %s, 'RUNNING', now()) RETURNING model_run_id::text
        """, (algorithm, version, json.dumps(hyperparameters), cutoff))
        run_id = cur.fetchone()[0]
    conn.commit()
    return run_id


def fail_run(conn, run_id, error):
    conn.rollback()
    with conn.cursor() as cur:
        cur.execute("""
            UPDATE model_run SET status = 'FAILED', finished_at = now(),
                   hyperparameters = COALESCE(hyperparameters, '{}'::jsonb) || %s::jsonb
            WHERE model_run_id = %s
        """, (json.dumps({"error": str(error)[:2000]}), run_id))
    conn.commit()


def finish_run(conn, run_id, algorithm, rows, metrics=None, hyperparameters=None):
    """Publish rows, the evaluation and the status together; retain two completed snapshots.

    `metrics` are the offline evaluation of the served formula (reco_pipeline.evaluate), None when there were too few
    ratings to evaluate. `hyperparameters` is merged into what start_run stored, with the comparison to the baselines.
    """
    def num(key):
        value = (metrics or {}).get(key)
        return None if value is None or value != value else round(float(value), 4)

    with conn.cursor() as cur:
        with cur.copy("""
            COPY recommendation (model_run_id, customer_id, hotel_id, score, rank, reason, explanation)
            FROM STDIN
        """) as copy:
            for row in rows:
                copy.write_row((run_id, *row[:5], _explanation(row)))
        cur.execute("""
            UPDATE model_run SET status = 'COMPLETED', finished_at = now(),
                   rmse = %s, mae = %s, k = %s, relevance_threshold = %s,
                   precision_at_k = %s, recall_at_k = %s, ndcg_at_k = %s, coldstart_coverage = %s,
                   hyperparameters = COALESCE(hyperparameters, '{}'::jsonb) || %s::jsonb
            WHERE model_run_id = %s
        """, (num("rmse"), num("mae"), (metrics or {}).get("k"), (metrics or {}).get("threshold"),
              num("precision"), num("recall"), num("ndcg"), num("coldstart_coverage"),
              json.dumps(hyperparameters or {}, default=_json_default), run_id))
        cur.execute("""
            WITH obsolete AS (
                SELECT r.recommendation_id
                FROM recommendation r JOIN model_run m USING (model_run_id)
                WHERE m.algorithm = %s AND m.status = 'COMPLETED'
                  AND m.model_run_id NOT IN (
                      SELECT model_run_id FROM model_run WHERE algorithm = %s AND status = 'COMPLETED'
                      ORDER BY started_at DESC, model_run_id DESC LIMIT 2)
                  AND NOT EXISTS (SELECT 1 FROM booking b WHERE b.recommendation_id = r.recommendation_id)
                FOR UPDATE OF r SKIP LOCKED
            )
            DELETE FROM recommendation r USING obsolete
            WHERE r.recommendation_id = obsolete.recommendation_id
        """, (algorithm, algorithm))
    conn.commit()


def served_rerank_lambda(conn, algorithm):
    """The long-tail λ (longtail.py) the served run was re-ranked with; 0 before any run chose one."""
    with conn.cursor() as cur:
        cur.execute("""
            SELECT hyperparameters #>> '{rerank,lambda}' FROM model_run
            WHERE algorithm = %s AND status = 'COMPLETED' AND finished_at IS NOT NULL
            ORDER BY started_at DESC, model_run_id DESC LIMIT 1
        """, (algorithm,))
        row = cur.fetchone()
    return float(row[0]) if row and row[0] is not None else 0.0


def latest_completed_run(conn, algorithm):
    """The run the API serves (RecommendationsService.latestRun): the newest COMPLETED one, or None."""
    with conn.cursor() as cur:
        cur.execute("""
            SELECT model_run_id::text FROM model_run
            WHERE algorithm = %s AND status = 'COMPLETED' AND finished_at IS NOT NULL
            ORDER BY started_at DESC, model_run_id DESC LIMIT 1
        """, (algorithm,))
        row = cur.fetchone()
    return row[0] if row else None


def write_customer(conn, run_id, customer_id, rows):
    """Replace one customer's list inside a published run, leaving everyone else's alone (train.py --customer).

    Upserted on (run, customer, hotel) so a booking already pointing at a row keeps it. A hotel that has dropped out of
    the list is deleted, unless a booking points at it: that one is kept with no rank, after the rest.
    """
    rows = list(rows)
    with conn.cursor() as cur:
        cur.executemany("""
            INSERT INTO recommendation (model_run_id, customer_id, hotel_id, score, rank, reason, explanation)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (model_run_id, customer_id, hotel_id)
            DO UPDATE SET score = EXCLUDED.score, rank = EXCLUDED.rank, reason = EXCLUDED.reason,
                          explanation = EXCLUDED.explanation
        """, [(run_id, *row[:5], _explanation(row)) for row in rows])
        kept = [row[1] for row in rows]
        cur.execute("""
            DELETE FROM recommendation r
            WHERE r.model_run_id = %s AND r.customer_id = %s AND NOT (r.hotel_id = ANY(%s::uuid[]))
              AND NOT EXISTS (SELECT 1 FROM booking b WHERE b.recommendation_id = r.recommendation_id)
        """, (run_id, customer_id, kept))
        cur.execute("""
            UPDATE recommendation SET rank = NULL
            WHERE model_run_id = %s AND customer_id = %s AND NOT (hotel_id = ANY(%s::uuid[]))
        """, (run_id, customer_id, kept))
    conn.commit()
    return len(rows)


def _explanation(row):
    """The sixth field of a recommendation row as JSON text; rows from before it existed have none."""
    return json.dumps(row[5], ensure_ascii=False, default=_json_default) if len(row) > 5 and row[5] else None


def _json_default(value):
    """numpy numbers in the comparison; NaN (nothing to measure) as null."""
    value = float(value)
    return None if value != value else value


def load_booked(conn):
    """Hotels each customer has a stay coming up or under way at: suggesting the place they are about to sleep in
    helps nobody. Stays that are over are not here; a hotel the guest liked may be suggested again (recommend)."""
    with conn.cursor() as cur:
        cur.execute("""
            SELECT DISTINCT customer_id::text, hotel_id::text FROM booking
            WHERE status IN ('PENDING', 'CONFIRMED', 'CHECKED_IN')
        """)
        booked = {}
        for customer, hotel in cur:
            booked.setdefault(customer, set()).add(hotel)
    return booked


def load_amenities(conn):
    with conn.cursor() as cur:
        cur.execute("SELECT amenity_id::text, name FROM amenity")
        return dict(cur.fetchall())
