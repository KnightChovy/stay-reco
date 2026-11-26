import { countPhrases, fold, hotelStyles, tasteFit } from './onboarding-taste';

const noViews = new Map<string, string>();
const hotel = (text: string, amenityIds: string[] = []) => ({
  text,
  amenityIds: new Set(amenityIds),
});
const answers = (
  travelStyles: string[],
  roomAmenities: string[] = [],
  viewIds: string[] = [],
) => ({ travelStyles, roomAmenities, viewIds });

describe('onboarding taste fit', () => {
  it('folds Vietnamese marks so "văn hoá" and "Văn Hóa" are the same words', () => {
    expect(fold('Phố cổ, Văn Hóa & Đặc sản!')).toBe('pho co van hoa dac san');
    expect(
      countPhrases(fold('Gần phố cổ và văn hóa'), ['văn hoá', 'phố cổ']),
    ).toBe(2);
  });

  it('matches whole words only, so "Hồ Xuân Hương" is not a pool', () => {
    expect(countPhrases(fold('Hồ Xuân Hương Homestay'), ['hồ bơi'])).toBe(0);
  });

  it('fits a hotel to its own style, not to a style it mentions in passing', () => {
    const business = hotel(
      'Hàn Executive Hotel. Khách sạn trung tâm, phòng họp, bàn làm việc, wifi tốc độ cao, gần bãi biển và spa.',
    );
    expect(tasteFit(business, answers(['business']), noViews)).toMatchObject({
      fits: true,
      matches: ['Công tác'],
    });
    expect(tasteFit(business, answers(['resort']), noViews).fits).toBe(false);
  });

  it('needs two phrases of a style: one mention is not a style', () => {
    expect(
      tasteFit(hotel('Có hồ bơi vô cực.'), answers(['resort']), noViews).fits,
    ).toBe(false);
  });

  it('adds the amenities and views picked to the score and the labels', () => {
    const resort = hotel(
      'Sơn Trà Resort & Spa. Khu nghỉ dưỡng ven biển, hồ bơi, thư giãn.',
      ['view-1'],
    );
    const fit = tasteFit(
      resort,
      answers(['resort'], ['pool'], ['view-1']),
      new Map([['view-1', 'Hướng biển']]),
    );
    const bare = tasteFit(resort, answers(['resort']), noViews);
    expect(fit.matches).toEqual([
      'Nghỉ dưỡng & thư giãn',
      'Hồ bơi',
      'Hướng biển',
    ]);
    expect(fit.score).toBeGreaterThan(bare.score);
  });

  it('with no style, an amenity or view decides; with nothing picked, everything fits', () => {
    const plain = hotel('Khách sạn có bữa sáng.');
    expect(tasteFit(plain, answers([], ['pool']), noViews).fits).toBe(false);
    expect(tasteFit(plain, answers([], ['breakfast']), noViews).fits).toBe(
      true,
    );
    expect(tasteFit(plain, answers([]), noViews)).toEqual({
      score: 0,
      fits: true,
      matches: [],
      styles: [],
    });
  });
});

describe('hotel styles (the badges on a card)', () => {
  it('reads the styles a hotel is, strongest first, and none from a text that says too little', () => {
    expect(
      hotelStyles(
        'Sơn Trà Resort & Spa: khu nghỉ dưỡng ven biển, bãi biển riêng, hồ bơi vô cực, spa và villa.',
      ),
    ).toEqual(['resort']);
    expect(
      hotelStyles(
        'Family Resort: phòng gia đình, kids club, khu vui chơi trẻ em, bãi biển riêng và hồ bơi vô cực.',
      ),
    ).toEqual(['family']); // 6 family phrases against 3 resort ones: under 75%, it is a family hotel
    expect(hotelStyles('Khách sạn Bạch Đằng, 20 phòng.')).toEqual([]);
  });

  it('does not call a business hotel a resort for mentioning the beach once', () => {
    expect(
      hotelStyles(
        'Executive Hotel ở trung tâm: phòng họp, bàn làm việc, wifi tốc độ cao, gần bãi biển.',
      ),
    ).toEqual(['business']);
  });
});
