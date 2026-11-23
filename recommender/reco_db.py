"""Reading the training data from the app's Postgres, and writing the results back.

The recommender never talks to the backend: it reads the same tables the API writes, and writes the two tables the
API reads (`model_run`, `recommendation`). The schema is owned by Prisma (backend/prisma/schema.prisma); nothing here
creates or alters a table.
"""

import json
import os
import re
import unicodedata
from datetime import date, datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd
import psycopg2
import psycopg2.extras

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
    return re.sub(r"[?&]schema=[^&]*", "", url)


def connect():
    return psycopg2.connect(database_url())


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

    The overall rating is the weighted average of the five criteria (BR-12). A guest who stayed several times is
    represented by the mean of those reviews; the timestamp is that of the latest one (used by the time-based split).
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
               (SELECT MIN(p.price_per_night)::float FROM room_type rt
                  JOIN price p ON p.room_type_id = rt.room_type_id
                 WHERE rt.hotel_id = h.hotel_id AND p.room_id IS NULL AND p.rule_type = 'BASE'
                   AND p.is_active) AS min_price
        FROM hotel h JOIN hotel_partner hp ON hp.hotel_partner_id = h.hotel_partner_id
        WHERE h.status = 'ACTIVE' AND hp.status <> 'SUSPENDED'
        ORDER BY h.hotel_id
    """)
    df["text"] = (df["name"] + ". " + df["city"] + ". " + df["description"] + " Tiện nghi: "
                  + df["amenities"] + ". Phòng: " + df["rooms"])
    return df


def _age_group(dob, today):
    if dob is None or pd.isna(dob):
        return "unknown"
    age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
    return "<25" if age < 25 else "25-34" if age < 35 else "35-44" if age < 45 else "45+"


def load_customers(conn):
    """Every customer, with the demographic groups and the preferences screen (docs/api/customer-wallet.md).

    Demographic groups follow the paper (age group, country, trip type), with the first travel style standing in for
    the trip type. Missing values are a group of their own ('unknown'), so a guest who filled nothing in still lands
    in a group.
    """
    df = _frame(conn, """
        SELECT c.customer_id::text AS user_id, c.date_of_birth, c.nationality
        FROM customer c JOIN user_account u ON u.user_account_id = c.customer_id
        WHERE u.status = 'ACTIVE'
        ORDER BY c.customer_id
    """)
    prefs = _frame(conn, """
        SELECT customer_id::text AS user_id, preference_key, preference_value
        FROM customer_preference
        WHERE preference_key IN ('travelStyles', 'roomAmenities', 'favouriteCity', 'budgetPerNight')
    """)
    by_user = {u: dict(zip(g["preference_key"], g["preference_value"])) for u, g in prefs.groupby("user_id")}

    today = date.today()
    df["age_group"] = [_age_group(d, today) for d in df["date_of_birth"]]
    df["country"] = df["nationality"].fillna("unknown").map(lambda s: fold(s) or "unknown")
    df["preferences"] = df["user_id"].map(lambda u: by_user.get(u, {}))
    df["trip_type"] = df["preferences"].map(
        lambda p: (p.get("travelStyles") or "unknown").split(",")[0] or "unknown")
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


def finish_run(conn, run_id, metrics, hyperparameters, rows, keep_runs=3):
    """Writes the recommendations and marks the run COMPLETED in one transaction.

    The API serves the newest COMPLETED run, so readers switch from the old list to the new one at the commit, never
    seeing half of it. Recommendations of all but the last `keep_runs` completed runs are deleted, except rows a
    booking points at (booking.recommendation_id), which are the evidence of a conversion.
    """
    def num(key):
        v = metrics.get(key)
        return None if v is None or (isinstance(v, float) and np.isnan(v)) else round(float(v), 4)

    with conn.cursor() as cur:
        psycopg2.extras.execute_values(cur, """
            INSERT INTO recommendation (customer_id, hotel_id, model_run_id, score, rank, reason)
            VALUES %s
        """, [(r["customer_id"], r["hotel_id"], run_id, round(float(r["score"]), 3), r["rank"], r["reason"])
              for r in rows], page_size=2000)
        cur.execute("""
            UPDATE model_run SET status = 'COMPLETED', finished_at = now(),
                   rmse = %s, mae = %s, k = %s, relevance_threshold = %s,
                   precision_at_k = %s, recall_at_k = %s, ndcg_at_k = %s, coldstart_coverage = %s,
                   hyperparameters = %s
            WHERE model_run_id = %s
        """, (num("rmse"), num("mae"), metrics.get("k"), metrics.get("threshold"),
              num("precision"), num("recall"), num("ndcg"), num("coldstart_coverage"),
              json.dumps(hyperparameters, default=_json_default), run_id))
        cur.execute("""
            DELETE FROM recommendation r
            WHERE r.model_run_id NOT IN (
                    SELECT model_run_id FROM model_run WHERE status = 'COMPLETED'
                    ORDER BY finished_at DESC LIMIT %s)
              AND NOT EXISTS (SELECT 1 FROM booking b WHERE b.recommendation_id = r.recommendation_id)
        """, (keep_runs,))
    conn.commit()


def _json_default(v):
    if isinstance(v, (np.integer,)):
        return int(v)
    if isinstance(v, (np.floating,)):
        return None if np.isnan(v) else float(v)
    if isinstance(v, (datetime, date)):
        return v.isoformat()
    raise TypeError(type(v))


def utc_now():
    return datetime.now(timezone.utc)
