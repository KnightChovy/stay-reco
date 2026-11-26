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
        # n_user / (n_user + 5) * n_item / (n_item + 5): an even history and an even hotel give a quarter to CF.
        self.assertEqual(weights(5, 5, False)[0], 0.25)
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

    def test_cities_picked_lead_the_list_and_the_rest_stay(self):
        # The beach hotel in Nha Trang fits the pool best, but the guest picked Đà Lạt and Hà Nội.
        hotels = hotels_frame(["ho boi ho boi ho boi", "khach san ho boi", "khach san trung tam"],
                              cities=["Nha Trang", "Đà Lạt", "Hà Nội"])
        prefs = {"roomAmenities": "pool", "preferredCities": "Đà Lạt,Hà Nội", "favouriteCity": "Đà Lạt"}
        personal = [row for row in run(NO_RATINGS, hotels, customer(prefs)) if row[0] == "guest"]
        self.assertEqual([row[1] for row in personal], ["hotel-1", "hotel-2", "hotel-0"])
        self.assertTrue(personal[2][4].startswith("Ngoài điểm đến bạn chọn."))
        self.assertFalse(personal[0][4].startswith("Ngoài"))

    def test_a_single_favourite_city_counts_as_picked(self):
        # The preferences page keeps one city, under favouriteCity only.
        hotels = hotels_frame(["ho boi ho boi", "khach san ho boi"], cities=["Nha Trang", "Đà Lạt"])
        prefs = {"roomAmenities": "pool", "favouriteCity": "Đà Lạt"}
        personal = [row[1] for row in run(NO_RATINGS, hotels, customer(prefs)) if row[0] == "guest"]
        self.assertEqual(personal, ["hotel-1", "hotel-0"])

    def test_a_regular_who_changes_preferences_sees_the_list_change(self):
        # Six rated homestays, then two hotels the guest never stayed at: a resort and a family hotel.
        texts = [f"homestay ca phe chup anh {i}" for i in range(6)] + [
            "khu nghi duong ven bien ho boi spa villa", "gia dinh tre em khu vui choi phong gia dinh"]
        hotels = hotels_frame(texts)
        ratings = pd.DataFrame([{"user_id": "guest", "item_id": f"hotel-{i}", "rating": 4.5, "timestamp": i}
                                for i in range(6)])

        def top_unvisited(styles):
            rows = run(ratings, hotels, customer({"travelStyles": styles}))
            return [row[1] for row in rows if row[0] == "guest" and row[1] in ("hotel-6", "hotel-7")][0]

        self.assertEqual(top_unvisited("resort"), "hotel-6")
        self.assertEqual(top_unvisited("family"), "hotel-7")

    def test_hotels_of_a_chosen_style_lead_and_say_so(self):
        # The kids' club is in the city picked and shares "ho boi" with the guest's amenity; the resort is elsewhere.
        hotels = hotels_frame([
            "kids club hotel gia dinh tre em khu vui choi ho boi ho boi",
            "resort and spa khu nghi duong ven bien spa villa",
            "pho co homestay ca phe chup anh",
        ], cities=["Đà Nẵng", "Hội An", "Đà Nẵng"])
        prefs = {"travelStyles": "resort", "roomAmenities": "pool", "preferredCities": "Đà Nẵng"}
        personal = [row for row in run(NO_RATINGS, hotels, customer(prefs)) if row[0] == "guest"]
        self.assertEqual(personal[0][1], "hotel-1")
        self.assertIn("phong cách nghỉ dưỡng", personal[0][4])
        # Not a resort, so its reason does not claim the style the guest chose.
        for row in personal[1:]:
            self.assertNotIn("nghỉ dưỡng", row[4])

    def test_a_hotel_liked_may_come_back_a_disliked_or_upcoming_one_not(self):
        hotels = hotels_frame(["homestay ca phe", "homestay chup anh", "homestay decor", "homestay vintage"])
        ratings = pd.DataFrame([
            {"user_id": "guest", "item_id": "hotel-0", "rating": 4.8, "timestamp": 1},   # liked
            {"user_id": "guest", "item_id": "hotel-1", "rating": 2.0, "timestamp": 2},   # disliked
        ])
        # hotel-2 is where the guest's next stay is booked.
        rows = run(ratings, hotels, customer({"travelStyles": "chill"}), {"guest": {"hotel-2"}})
        personal = {row[1]: row[4] for row in rows if row[0] == "guest"}
        self.assertEqual(set(personal), {"hotel-0", "hotel-3"})
        self.assertEqual(personal["hotel-0"], "Bạn đã ở đây và chấm 4.8★.")
        # The signed-out list is everyone's: nothing is left out of it.
        self.assertEqual(len([row for row in rows if row[0] is None]), 4)

    def test_top_k_caps_each_list(self):
        hotels = hotels_frame([f"hotel text {i}" for i in range(30)])
        rows = run(NO_RATINGS, hotels, customer({}), top_k=5)
        self.assertEqual(len([row for row in rows if row[0] == "guest"]), 5)
        self.assertEqual(len([row for row in rows if row[0] is None]), 5)

    def test_one_customer_alone_gets_the_list_they_get_with_everyone(self):
        # train.py --customer fits on everyone and scores one: the list must be the one the nightly run writes.
        hotels = hotels_frame(["resort hồ bơi spa biển", "khách sạn gia đình khu vui chơi trẻ em", "khách sạn công tác"])
        everyone = pd.concat([customer({"travelStyles": "resort"}, "a"), customer({"travelStyles": "family"}, "b")])
        scorer = Scorer(NO_RATINGS, hotels, everyone, {})
        full = [row for row in recommend(scorer, everyone, {}) if row[0] == "b"]
        alone = list(recommend(scorer, everyone[everyone["user_id"] == "b"], {}, include_public=False))
        self.assertEqual(alone, full)
        self.assertTrue(all(row[0] == "b" for row in alone))

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
