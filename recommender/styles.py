"""Which travel styles a hotel is, read from what it says about itself.

There is no style column on a hotel, so the style is read from its name, description, amenities and room types: a
hotel is of a style when it uses at least two of that style's phrases and that style is among its strongest (at least
75% of the phrases of its strongest style). A business hotel that mentions the beach once is not a resort.

KEEP IN STEP with backend/src/modules/onboarding/onboarding-taste.ts (`STYLE_PHRASES`, `STYLE_FIT_MIN_HITS`,
`STYLE_DOMINANCE`): the onboarding screen offers hotels by these same rules, and a hotel it offers as a resort must be
a resort here too. Change both files together.
"""

import re

from reco_db import fold

STYLE_PHRASES = {
    "resort": ["nghỉ dưỡng", "ven biển", "bãi biển", "hướng biển", "hồ bơi vô cực", "spa", "villa", "thư giãn",
               "trăng mật", "yoga", "resort", "beach", "ocean", "bay retreat"],
    "nature": ["nhà gỗ", "rừng thông", "sinh thái", "thiên nhiên", "trekking", "vườn", "núi", "bungalow", "lửa trại",
               "bình minh", "eco lodge", "pine hill", "mountain"],
    "foodie": ["phố cổ", "ẩm thực", "quán ăn", "chợ đêm", "văn hoá", "di sản", "di tích", "nấu ăn", "nhà cổ",
               "đường phố", "heritage", "old quarter", "lantern", "boutique"],
    "business": ["trung tâm", "công tác", "phòng họp", "bàn làm việc", "wifi tốc độ cao", "doanh nhân", "hội nghị",
                 "văn phòng", "business", "executive", "city tower", "plaza"],
    "family": ["gia đình", "trẻ em", "trẻ nhỏ", "khu vui chơi", "kids club", "em bé", "cả nhà", "công viên nước",
               "family", "kids", "holiday"],
    "chill": ["homestay", "cà phê", "chụp ảnh", "góc chụp", "decor", "vintage", "check-in", "sống ảo", "coffee",
              "studio", "little house"],
}
STYLE_FIT_MIN_HITS = 2
STYLE_DOMINANCE = 0.75


def words(text):
    """Folded, with anything but letters, digits and hyphens as one space: the form phrases are matched in."""
    return re.sub(r"[^a-z0-9-]+", " ", fold(text)).strip()


_PHRASES = {style: [f" {words(p)} " for p in phrases] for style, phrases in STYLE_PHRASES.items()}


def style_hits(text):
    """How many of each style's phrases the text uses, each as whole words."""
    padded = f" {words(text)} "
    return {style: sum(p in padded for p in phrases) for style, phrases in _PHRASES.items()}


def hotel_styles(text):
    """The styles the hotel is: enough phrases, and close to its strongest style."""
    hits = style_hits(text)
    strongest = max(hits.values(), default=0)
    return {s for s, n in hits.items() if n >= STYLE_FIT_MIN_HITS and n >= strongest * STYLE_DOMINANCE}
