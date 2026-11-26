import unittest

from styles import hotel_styles, style_hits, words


class StylesTest(unittest.TestCase):
    """The same cases as backend/src/modules/onboarding/onboarding-taste.spec.ts: both must read a hotel alike."""

    def test_words_drop_marks_and_punctuation(self):
        self.assertEqual(words("Phố cổ, Văn Hóa & Đặc sản!"), "pho co van hoa dac san")

    def test_whole_words_only(self):
        # "Hồ Xuân Hương" is a lake street, not a pool, and "bãi biển" is not in "bãi biển riêng tư" by accident.
        self.assertEqual(style_hits("Hồ Xuân Hương Homestay")["resort"], 0)

    def test_a_style_mentioned_in_passing_is_not_the_hotel_style(self):
        business = ("Hàn Executive Hotel. Khách sạn trung tâm, phòng họp, bàn làm việc, wifi tốc độ cao, "
                    "gần bãi biển và spa.")
        self.assertEqual(hotel_styles(business), {"business"})

    def test_one_phrase_is_not_a_style(self):
        self.assertEqual(hotel_styles("Có hồ bơi vô cực."), set())

    def test_a_hotel_can_be_two_styles(self):
        both = "Family Resort: khu nghỉ dưỡng ven biển, gia đình, trẻ em, khu vui chơi, villa"
        self.assertEqual(hotel_styles(both), {"resort", "family"})


if __name__ == "__main__":
    unittest.main()
