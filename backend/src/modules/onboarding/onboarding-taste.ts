/**
 * How well a hotel fits the answers given on the first steps of onboarding, so the hotel step offers only hotels that
 * agree with them (docs/api/onboarding.md, "Hotels that fit the answers").
 *
 * There is no "style" column on a hotel, so the fit is read from what the hotel says about itself: its name, its
 * description and its amenities, against the words of each travel style. The vocabulary is the recommender's own
 * (`STYLE_WORDS` and `AMENITY_WORDS` in recommender/reco_pipeline.py), written as phrases so that "hồ bơi" does not
 * match every hotel on Hồ Xuân Hương street. Keep the two in step: a style the screen offers here is the style the
 * recommender then looks for.
 */

/** The travel styles of the preferences screen (frontend `STYLES`), with the phrases a hotel of that style uses. */
export const STYLE_PHRASES: Record<
  string,
  { label: string; phrases: string[] }
> = {
  resort: {
    label: 'Nghỉ dưỡng & thư giãn',
    phrases: [
      'nghỉ dưỡng',
      'ven biển',
      'bãi biển',
      'hướng biển',
      'hồ bơi vô cực',
      'spa',
      'villa',
      'thư giãn',
      'trăng mật',
      'yoga',
      'resort',
      'beach',
      'ocean',
      'bay retreat',
    ],
  },
  nature: {
    label: 'Thiên nhiên & sinh thái',
    phrases: [
      'nhà gỗ',
      'rừng thông',
      'sinh thái',
      'thiên nhiên',
      'trekking',
      'vườn',
      'núi',
      'bungalow',
      'lửa trại',
      'bình minh',
      'eco lodge',
      'pine hill',
      'mountain',
    ],
  },
  foodie: {
    label: 'Ẩm thực & văn hoá',
    phrases: [
      'phố cổ',
      'ẩm thực',
      'quán ăn',
      'chợ đêm',
      'văn hoá',
      'di sản',
      'di tích',
      'nấu ăn',
      'nhà cổ',
      'đường phố',
      'heritage',
      'old quarter',
      'lantern',
      'boutique',
    ],
  },
  business: {
    label: 'Công tác',
    phrases: [
      'trung tâm',
      'công tác',
      'phòng họp',
      'bàn làm việc',
      'wifi tốc độ cao',
      'doanh nhân',
      'hội nghị',
      'văn phòng',
      'business',
      'executive',
      'city tower',
      'plaza',
    ],
  },
  family: {
    label: 'Gia đình & trẻ nhỏ',
    phrases: [
      'gia đình',
      'trẻ em',
      'trẻ nhỏ',
      'khu vui chơi',
      'kids club',
      'em bé',
      'cả nhà',
      'công viên nước',
      'family',
      'kids',
      'holiday',
    ],
  },
  chill: {
    label: 'Cà phê & chụp ảnh',
    phrases: [
      'homestay',
      'cà phê',
      'chụp ảnh',
      'góc chụp',
      'decor',
      'vintage',
      'check-in',
      'sống ảo',
      'coffee',
      'studio',
      'little house',
    ],
  },
};

/** The room amenities of the preferences screen (frontend `AMENITIES`), with the phrases that say a hotel has one. */
export const AMENITY_PHRASES: Record<
  string,
  { label: string; phrases: string[] }
> = {
  pool: { label: 'Hồ bơi', phrases: ['hồ bơi', 'bể bơi'] },
  view: {
    label: 'View sông / view biển',
    phrases: [
      'view biển',
      'view sông',
      'hướng biển',
      'nhìn ra biển',
      'ban công',
    ],
  },
  breakfast: { label: 'Bữa sáng', phrases: ['bữa sáng'] },
  spa: { label: 'Spa & massage', phrases: ['spa', 'massage'] },
  quiet: { label: 'Phòng yên tĩnh', phrases: ['yên tĩnh'] },
  tub: { label: 'Bồn tắm', phrases: ['bồn tắm'] },
  shuttle: { label: 'Đưa đón sân bay', phrases: ['đưa đón sân bay'] },
  parking: {
    label: 'Chỗ đậu xe',
    phrases: ['chỗ đậu xe', 'bãi đỗ xe', 'đậu xe'],
  },
};

/** A style counts as a fit from this many of its phrases: one phrase is a hotel mentioning a pool, not a resort. */
export const STYLE_FIT_MIN_HITS = 2;
/** A style fits only with at least this share of the hits of the hotel's strongest style. */
export const STYLE_DOMINANCE = 0.75;
/** A style's phrases beyond this many add nothing, so one long description cannot outrank a better fit. */
const STYLE_HITS_CAP = 5;
/** What one matched amenity or view is worth against one style phrase. */
const EXTRA_WEIGHT = 0.75;

/** Lower case, no Vietnamese marks, đ as d, one space between words: the form every phrase is matched in. */
export function fold(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, ' ')
    .trim();
}

/** How many of the phrases occur in the folded text, each as whole words. */
export function countPhrases(folded: string, phrases: string[]): number {
  const padded = ` ${folded} `;
  return phrases.filter((p) => padded.includes(` ${fold(p)} `)).length;
}

export interface TasteAnswers {
  travelStyles: string[];
  roomAmenities: string[];
  viewIds: string[];
}

export interface HotelText {
  /** Name, description and amenity names, as one text. */
  text: string;
  /** The ids of its amenities, hotel and room types together (a view is one of them). */
  amenityIds: Set<string>;
}

export interface TasteFit {
  /** Higher is a better fit; 0 when nothing of the answers is in the hotel. */
  score: number;
  /** Whether it fits the answers enough to be offered: a chosen style when one was chosen, else an amenity or view. */
  fits: boolean;
  /** Style and amenity labels, then view names, for the card. */
  matches: string[];
}

/** How well one hotel fits the answers. `viewNames` names the views by id. */
export function tasteFit(
  hotel: HotelText,
  answers: TasteAnswers,
  viewNames: Map<string, string>,
): TasteFit {
  const folded = fold(hotel.text);
  const matches: string[] = [];
  let score = 0;
  let styleFits = 0;

  // Every hotel also mentions a second style in passing (a business hotel near the beach, a resort with a café), so
  // a style fits only when it is one of the hotel's strongest, not merely mentioned.
  const hitsOf = Object.fromEntries(
    Object.entries(STYLE_PHRASES).map(([id, s]) => [
      id,
      countPhrases(folded, s.phrases),
    ]),
  );
  const strongest = Math.max(...Object.values(hitsOf));

  for (const id of answers.travelStyles) {
    const style = STYLE_PHRASES[id];
    if (!style) continue;
    const hits = hitsOf[id];
    if (hits >= STYLE_FIT_MIN_HITS && hits >= strongest * STYLE_DOMINANCE) {
      styleFits++;
      matches.push(style.label);
      score += Math.min(hits, STYLE_HITS_CAP);
    }
  }
  let extras = 0;
  for (const id of answers.roomAmenities) {
    const amenity = AMENITY_PHRASES[id];
    if (amenity && countPhrases(folded, amenity.phrases) > 0) {
      extras++;
      matches.push(amenity.label);
    }
  }
  for (const id of answers.viewIds) {
    if (hotel.amenityIds.has(id)) {
      extras++;
      matches.push(viewNames.get(id) ?? 'Tầm nhìn');
    }
  }
  score += extras * EXTRA_WEIGHT;

  // A chosen style is the strongest answer: a hotel of none of the chosen styles is left out even if it has a pool.
  const fits = answers.travelStyles.length
    ? styleFits > 0
    : answers.roomAmenities.length || answers.viewIds.length
      ? extras > 0
      : true;
  return { score, fits, matches };
}
