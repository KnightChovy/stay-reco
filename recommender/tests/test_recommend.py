import unittest

import numpy as np
import pandas as pd

from reco_pipeline import Scorer, evaluate, recommend
from weights import weights


def hotels_frame(texts, prices=None, cities=None):
    n = len(texts)
    return pd.DataFrame({
        "item_id": [f"hotel-{i}" for i in range(n)],
        "name": [f"Hotel {i}" for i in range(n)],
        "city": cities or ["Đà Nẵng"] * n,
        "text": texts,
        "min_price": prices or [1_000_000] * n,
    })


def customer(prefs, user="guest"):
    return pd.DataFrame([{"user_id": user, "age_group": None, "gender": None, "country": None,
                          "preferences": prefs}])


NO_RATINGS = pd.DataFrame(columns=["user_id", "item_id", "rating", "timestamp"])


def run(ratings, hotels, customers, booked=None, amenities=None, top_k=100):
    scorer = Scorer(ratings, hotels, customers, amenities or {})
    return list(recommend(scorer, customers, booked or {}, top_k=top_k))


class RecommenderTest(unittest.TestCase):
    def test_weights(self):
        self.assertEqual(weights(0, 5, False), (0, 0, 1))
        self.assertEqual(weights(0, 5, True), (0, 1, 0))
        self.assertEqual(weights(40, 0, False), (0, 1, 0))
        self.assertEqual(weights(40, 5, False)[0], 0.25)
        self.assertEqual(weights(40, 5, True, use_cf=False), (0, 1, 0))
        for has_prefs in (True, False):
            components = np.array(weights(3, np.array([0, 1, 10]), has_prefs))
            self.assertTrue((components >= 0).all())
            np.testing.assert_allclose(components.sum(axis=0), 1)

    def test_publish_candidates_with_no_ratings(self):
        hotels = hotels_frame(["beach sea view", *(["city business"] * 24)])
        customers = customer({"preferredViews": "sea"})
        rows = run(NO_RATINGS, hotels, customers, {"guest": {"hotel-2"}}, {"sea": "sea view"})
        personal = [row for row in rows if row[0] == "guest"]
        self.assertEqual(len(personal), 24)
        self.assertEqual(len([row for row in rows if row[0] is None]), 25)
        self.assertEqual(personal[0][1], "hotel-0")
        self.assertNotIn("hotel-2", {row[1] for row in personal})
        self.assertTrue(all(1 <= row[2] <= 5 for row in rows))

    def test_travel_styles_steer_the_content_score(self):
        hotels = hotels_frame(["pho co am thuc quan an cho dem", "khu nghi duong ven bien ho boi spa villa"])
        rows = run(NO_RATINGS, hotels, customer({"travelStyles": "resort"}))
        personal = [row for row in rows if row[0] == "guest"]
        self.assertEqual(personal[0][1], "hotel-1")
        self.assertIn("phong cách nghỉ dưỡng", personal[0][4])

    def test_over_budget_hotels_come_last_but_stay_listed(self):
        # hotel-1 matches the pool better, but costs far more than the budget.
        hotels = hotels_frame(["khach san trung tam", "ho boi ho boi"], prices=[1_000_000, 9_000_000])
        no_budget = [row[1] for row in run(NO_RATINGS, hotels, customer({"roomAmenities": "pool"}))
                     if row[0] == "guest"]
        self.assertEqual(no_budget, ["hotel-1", "hotel-0"])
        prefs = {"roomAmenities": "pool", "budgetPerNight": "2000000"}
        personal = [row for row in run(NO_RATINGS, hotels, customer(prefs)) if row[0] == "guest"]
        self.assertEqual([row[1] for row in personal], ["hotel-0", "hotel-1"])

    def test_top_k_caps_each_list(self):
        hotels = hotels_frame([f"hotel text {i}" for i in range(30)])
        rows = run(NO_RATINGS, hotels, customer({}), top_k=5)
        self.assertEqual(len([row for row in rows if row[0] == "guest"]), 5)
        self.assertEqual(len([row for row in rows if row[0] is None]), 5)

    def test_evaluate_measures_the_served_formula_against_baselines(self):
        rng = np.random.RandomState(0)
        hotels = hotels_frame([f"{'bien' if i % 2 else 'nui'} hotel {i}" for i in range(20)])
        users = [f"u{i}" for i in range(60)]
        ratings = pd.DataFrame([
            {"user_id": u, "item_id": f"hotel-{i}", "rating": float(5 if (int(u[1:]) + i) % 2 else 2),
             "timestamp": int(rng.randint(1, 10_000))}
            for u in users for i in rng.choice(20, 8, replace=False)
        ])
        customers = pd.concat([customer({}, u) for u in users], ignore_index=True)
        metrics, comparison, split = evaluate(ratings, hotels, customers, {}, log=lambda *_: None)
        self.assertIn("StayReco two-sided (served)", comparison)
        self.assertIn("Popularity", comparison)
        self.assertEqual(metrics["k"], 10)
        for key in ("rmse", "precision", "recall", "ndcg"):
            self.assertTrue(np.isfinite(metrics[key]), key)
        self.assertGreater(split["test"], 0)

    def test_evaluate_skips_with_too_few_ratings(self):
        hotels = hotels_frame(["a", "b"])
        self.assertIsNone(evaluate(NO_RATINGS, hotels, customer({}), {}, log=lambda *_: None))


if __name__ == "__main__":
    unittest.main()
