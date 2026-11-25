import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import * as argon2 from 'argon2';
import { randomUUID } from 'crypto';
import {
  addDays,
  fromCalendarDate,
  todayInVietnam,
  vietnamDateTime,
} from '../src/common/http/calendar-date';
import {
  Gender,
  Prisma,
  PrismaClient,
  UserRole,
} from '../src/generated/prisma/client';
import { newBookingCode } from '../src/modules/bookings/booking-code';
import { toCancellationRows } from '../src/modules/hotels/hotel.mapper';
import { weightedAverage } from '../src/modules/reviews/rating';
import { basePriceRow } from '../src/modules/rooms/room.mapper';

/**
 * Training data for the recommender (`recommender/`), generated rather than collected: the platform has no guests yet.
 *
 * What makes it worth training on is that the ratings are not random. Every hotel has a style (the six travel styles of
 * the preferences screen) and every guest a hidden taste over the same styles, a budget and a favourite city. Guests
 * mostly stay where their taste and budget lead them, and rate a stay from how well the hotel matches that taste, plus
 * the hotel's own quality, the guest's own leniency and noise. So there is a pattern for collaborative filtering to
 * find, descriptions that carry the style for the content model, and demographic groups that differ in what they like.
 *
 * About a fifth of the hotels are listed recently and have no stays at all, and a fifth of the guests have never
 * stayed: the two cold starts the two-sided rule of the paper (stayreco-experiment/) is built for.
 *
 * Accounts are `reco.*@stayreco.local` with the demo password. Bookings are COMPLETED stays with an invoice and a
 * review; no wallet rows are written, so these hotels' payout figures are not meaningful.
 *
 * Run: `npm run db:seed:reco`. Skipped when its first partner already exists; deterministic for a given day.
 */

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const STYLES = [
  'resort',
  'nature',
  'foodie',
  'business',
  'family',
  'chill',
] as const;
type Style = (typeof STYLES)[number];

const HOTELS_PER_STYLE = 11;
const CUSTOMERS = 900;
/** Share of hotels listed recently, with no stay yet. */
const NEW_HOTEL_SHARE = 0.2;
/** Share of guests who have never stayed. */
const COLD_GUEST_SHARE = 0.2;
/** Share of guests who filled in the preferences screen. */
const PREFERENCE_SHARE = 0.5;
const HISTORY_DAYS = 700;

type City = {
  name: string;
  lat: number;
  lng: number;
  areas: string[];
  /** Words a description of a hotel here would use. */
  flavour: string;
};

const CITIES: Record<string, City> = {
  'Đà Nẵng': {
    name: 'Đà Nẵng',
    lat: 16.06,
    lng: 108.22,
    areas: ['biển Mỹ Khê', 'bán đảo Sơn Trà', 'quận Hải Châu', 'bờ sông Hàn'],
    flavour: 'gần cầu Rồng, bãi biển Mỹ Khê và chợ Hàn',
  },
  'Hà Nội': {
    name: 'Hà Nội',
    lat: 21.03,
    lng: 105.85,
    areas: ['phố cổ Hoàn Kiếm', 'hồ Tây', 'quận Ba Đình', 'quận Cầu Giấy'],
    flavour: 'gần hồ Hoàn Kiếm, phố cổ và nhà hát lớn',
  },
  'TP. Hồ Chí Minh': {
    name: 'TP. Hồ Chí Minh',
    lat: 10.78,
    lng: 106.7,
    areas: ['Quận 1', 'chợ Bến Thành', 'Thảo Điền', 'Quận 3'],
    flavour: 'gần phố đi bộ Nguyễn Huệ, chợ Bến Thành và nhà thờ Đức Bà',
  },
  'Nha Trang': {
    name: 'Nha Trang',
    lat: 12.24,
    lng: 109.19,
    areas: ['đường Trần Phú', 'Bãi Dài', 'Hòn Tre'],
    flavour: 'nhìn ra vịnh Nha Trang, gần tháp Bà Ponagar',
  },
  'Đà Lạt': {
    name: 'Đà Lạt',
    lat: 11.94,
    lng: 108.44,
    areas: ['hồ Xuân Hương', 'đồi thông Trại Mát', 'thung lũng Tình Yêu'],
    flavour: 'khí hậu mát lạnh quanh năm, giữa đồi thông và vườn hoa',
  },
  'Phú Quốc': {
    name: 'Phú Quốc',
    lat: 10.22,
    lng: 103.96,
    areas: ['Bãi Trường', 'Bãi Sao', 'Dương Đông'],
    flavour: 'trên đảo ngọc, cát trắng và hoàng hôn trên biển',
  },
  'Hội An': {
    name: 'Hội An',
    lat: 15.88,
    lng: 108.33,
    areas: ['phố cổ Hội An', 'biển An Bàng', 'làng rau Trà Quế'],
    flavour: 'gần phố cổ đèn lồng, chùa Cầu và sông Hoài',
  },
  Huế: {
    name: 'Huế',
    lat: 16.46,
    lng: 107.59,
    areas: ['bờ sông Hương', 'gần Đại Nội', 'đồi Vọng Cảnh'],
    flavour: 'bên sông Hương, gần Đại Nội và lăng tẩm triều Nguyễn',
  },
  'Sa Pa': {
    name: 'Sa Pa',
    lat: 22.34,
    lng: 103.84,
    areas: ['thung lũng Mường Hoa', 'thị trấn Sa Pa', 'bản Cát Cát'],
    flavour: 'giữa ruộng bậc thang, nhìn ra dãy Hoàng Liên Sơn',
  },
  'Vũng Tàu': {
    name: 'Vũng Tàu',
    lat: 10.35,
    lng: 107.08,
    areas: ['Bãi Sau', 'Bãi Trước', 'Long Cung'],
    flavour: 'cách TP.HCM hai giờ, gần tượng Chúa Kitô và ngọn hải đăng',
  },
};

type RoomTemplate = {
  name: string;
  description: string;
  maxOccupancy: number;
  areaSqm: number;
  /** Multiplier on the hotel's base price. */
  priceFactor: number;
  beds: [bedName: string, quantity: number][];
  amenities: string[];
};

type StyleProfile = {
  cities: string[];
  stars: [min: number, max: number];
  /** Cheapest room per night, VND, at the lowest and the highest star. */
  price: [min: number, max: number];
  names: string[];
  amenities: string[];
  /** Sentences a description of this kind of hotel draws from. */
  phrases: string[];
  rooms: RoomTemplate[];
  /** What guests of this style are like. */
  guest: { ages: [number, number]; budget: number; party: [number, number] };
  roomAmenities: string[];
};

const ROOM_BASICS = ['Điều hòa', 'TV màn hình phẳng', 'Máy sấy tóc'];

const PROFILES: Record<Style, StyleProfile> = {
  resort: {
    cities: ['Đà Nẵng', 'Nha Trang', 'Phú Quốc', 'Hội An', 'Vũng Tàu'],
    stars: [4, 5],
    price: [2_500_000, 7_500_000],
    names: ['Resort & Spa', 'Beach Resort', 'Ocean Villas', 'Bay Retreat'],
    amenities: [
      'Hồ bơi',
      'Spa & massage',
      'Nhà hàng',
      'Quầy bar',
      'Bữa sáng',
      'Đưa đón sân bay',
      'Phòng gym',
    ],
    phrases: [
      'Khu nghỉ dưỡng ven biển với bãi biển riêng và hồ bơi vô cực nhìn ra biển.',
      'Spa trị liệu, yoga buổi sáng và quầy bar trên cát để thư giãn trọn vẹn.',
      'Villa có hồ bơi riêng, ban công hướng biển, không gian yên tĩnh và sang trọng.',
      'Thích hợp nghỉ dưỡng, tuần trăng mật và những kỳ nghỉ dài ngày bên biển.',
    ],
    rooms: [
      {
        name: 'Deluxe Ocean View',
        description: 'Phòng hướng biển có ban công riêng.',
        maxOccupancy: 2,
        areaSqm: 42,
        priceFactor: 1,
        beds: [['Giường King', 1]],
        amenities: [...ROOM_BASICS, 'Minibar', 'Ban công', 'Két sắt'],
      },
      {
        name: 'Pool Villa',
        description: 'Villa có hồ bơi riêng và bồn tắm ngoài trời.',
        maxOccupancy: 3,
        areaSqm: 90,
        priceFactor: 2.2,
        beds: [
          ['Giường King', 1],
          ['Giường đơn', 1],
        ],
        amenities: [...ROOM_BASICS, 'Minibar', 'Bồn tắm', 'Ban công'],
      },
    ],
    guest: { ages: [26, 50], budget: 5_000_000, party: [2, 2] },
    roomAmenities: ['pool', 'view', 'spa', 'tub', 'shuttle'],
  },
  nature: {
    cities: ['Đà Lạt', 'Sa Pa', 'Huế', 'Phú Quốc', 'Hội An'],
    stars: [3, 4],
    price: [900_000, 2_600_000],
    names: [
      'Eco Lodge',
      'Pine Hill Lodge',
      'Garden Bungalow',
      'Mountain Retreat',
    ],
    amenities: ['Bữa sáng', 'Nhà hàng', 'Chỗ đậu xe', 'Giữ hành lý'],
    phrases: [
      'Nhà gỗ giữa rừng thông, có lò sưởi và vườn rau hữu cơ.',
      'Khu du lịch sinh thái yên tĩnh, có đường mòn trekking và ngắm bình minh trên núi.',
      'Bungalow mái lá giữa vườn cây, sáng nghe chim hót, tối đốt lửa trại.',
      'Dành cho người yêu thiên nhiên muốn tránh xa phố thị ồn ào.',
    ],
    rooms: [
      {
        name: 'Garden Bungalow',
        description: 'Bungalow gỗ nhìn ra vườn và đồi thông.',
        maxOccupancy: 2,
        areaSqm: 30,
        priceFactor: 1,
        beds: [['Giường Queen', 1]],
        amenities: ['Máy sấy tóc', 'Ban công'],
      },
      {
        name: 'Family Wooden House',
        description: 'Nhà gỗ hai tầng có gác xép.',
        maxOccupancy: 4,
        areaSqm: 55,
        priceFactor: 1.7,
        beds: [
          ['Giường Queen', 1],
          ['Giường đơn', 2],
        ],
        amenities: ['Máy sấy tóc', 'Ban công', 'Bồn tắm'],
      },
    ],
    guest: { ages: [22, 45], budget: 1_800_000, party: [1, 3] },
    roomAmenities: ['view', 'quiet', 'breakfast', 'parking'],
  },
  foodie: {
    cities: ['Hà Nội', 'Hội An', 'Huế', 'TP. Hồ Chí Minh'],
    stars: [2, 4],
    price: [600_000, 1_900_000],
    names: [
      'Heritage Inn',
      'Old Quarter Hotel',
      'Boutique House',
      'Lantern Hotel',
    ],
    amenities: ['Bữa sáng', 'Lễ tân 24/7', 'Giữ hành lý', 'Giặt ủi'],
    phrases: [
      'Khách sạn nhỏ ngay khu phố cổ, đi bộ vài phút tới chợ đêm và các quán ăn đường phố nổi tiếng.',
      'Có lớp học nấu ăn món địa phương và tour ẩm thực buổi tối cùng hướng dẫn viên.',
      'Kiến trúc nhà cổ, gần di tích lịch sử, bảo tàng và các con phố văn hoá.',
      'Lễ tân sẵn lòng chỉ những quán phở, bún, cà phê trứng ngon nhất quanh đây.',
    ],
    rooms: [
      {
        name: 'Superior Double',
        description: 'Phòng đôi ấm cúng nhìn ra phố cổ.',
        maxOccupancy: 2,
        areaSqm: 22,
        priceFactor: 1,
        beds: [['Giường đôi', 1]],
        amenities: [...ROOM_BASICS],
      },
      {
        name: 'Heritage Suite',
        description: 'Suite trang trí đồ gỗ cổ, có ban công.',
        maxOccupancy: 3,
        areaSqm: 35,
        priceFactor: 1.6,
        beds: [
          ['Giường Queen', 1],
          ['Giường đơn', 1],
        ],
        amenities: [...ROOM_BASICS, 'Ban công', 'Minibar'],
      },
    ],
    guest: { ages: [20, 40], budget: 1_400_000, party: [1, 2] },
    roomAmenities: ['breakfast', 'quiet'],
  },
  business: {
    cities: ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng'],
    stars: [4, 5],
    price: [1_500_000, 4_200_000],
    names: ['Business Hotel', 'Central Plaza', 'City Tower', 'Executive Hotel'],
    amenities: [
      'Wi-Fi miễn phí',
      'Lễ tân 24/7',
      'Phòng gym',
      'Nhà hàng',
      'Dịch vụ phòng',
      'Giặt ủi',
      'Thang máy',
      'Đưa đón sân bay',
    ],
    phrases: [
      'Khách sạn trung tâm thành phố, gần văn phòng, ngân hàng và trung tâm hội nghị.',
      'Phòng họp, bàn làm việc rộng và wifi tốc độ cao cho khách công tác.',
      'Làm thủ tục nhanh, xe đưa đón sân bay và giặt ủi lấy ngay trong ngày.',
      'Executive lounge phục vụ bữa sáng sớm và cà phê suốt ngày cho doanh nhân.',
    ],
    rooms: [
      {
        name: 'Executive King',
        description: 'Phòng có bàn làm việc lớn và ghế công thái học.',
        maxOccupancy: 2,
        areaSqm: 32,
        priceFactor: 1,
        beds: [['Giường King', 1]],
        amenities: [...ROOM_BASICS, 'Bàn làm việc', 'Két sắt', 'Minibar'],
      },
      {
        name: 'Business Suite',
        description: 'Suite có phòng khách riêng để tiếp khách.',
        maxOccupancy: 2,
        areaSqm: 55,
        priceFactor: 1.8,
        beds: [['Giường King', 1]],
        amenities: [...ROOM_BASICS, 'Bàn làm việc', 'Két sắt', 'Bồn tắm'],
      },
    ],
    guest: { ages: [27, 55], budget: 3_000_000, party: [1, 1] },
    roomAmenities: ['quiet', 'breakfast', 'shuttle', 'parking'],
  },
  family: {
    cities: ['Nha Trang', 'Đà Nẵng', 'Vũng Tàu', 'Phú Quốc'],
    stars: [3, 5],
    price: [1_400_000, 4_800_000],
    names: [
      'Family Resort',
      'Kids Club Hotel',
      'Family Suites',
      'Holiday Hotel',
    ],
    amenities: [
      'Hồ bơi',
      'Khu vui chơi trẻ em',
      'Nhà hàng',
      'Bữa sáng',
      'Chỗ đậu xe',
      'Thang máy',
    ],
    phrases: [
      'Phòng gia đình rộng, căn hộ hai phòng ngủ có bếp nhỏ cho cả nhà.',
      'Hồ bơi trẻ em, khu vui chơi trong nhà và kids club có người trông.',
      'Gần công viên nước và khu vui chơi, thực đơn riêng cho bé.',
      'An toàn cho trẻ nhỏ, có cũi em bé và ghế ăn dặm theo yêu cầu.',
    ],
    rooms: [
      {
        name: 'Family Room',
        description: 'Phòng gia đình một giường lớn và hai giường đơn.',
        maxOccupancy: 4,
        areaSqm: 45,
        priceFactor: 1,
        beds: [
          ['Giường Queen', 1],
          ['Giường đơn', 2],
        ],
        amenities: [...ROOM_BASICS, 'Minibar', 'Két sắt'],
      },
      {
        name: 'Two-Bedroom Apartment',
        description: 'Căn hộ hai phòng ngủ có bếp và phòng khách.',
        maxOccupancy: 6,
        areaSqm: 80,
        priceFactor: 1.7,
        beds: [
          ['Giường King', 1],
          ['Giường đơn', 2],
          ['Sofa giường', 1],
        ],
        amenities: [...ROOM_BASICS, 'Ban công', 'Bồn tắm'],
      },
    ],
    guest: { ages: [30, 48], budget: 3_200_000, party: [3, 5] },
    roomAmenities: ['pool', 'breakfast', 'parking'],
  },
  chill: {
    cities: ['Đà Lạt', 'Hội An', 'Hà Nội', 'TP. Hồ Chí Minh', 'Sa Pa'],
    stars: [2, 3],
    price: [450_000, 1_300_000],
    names: ['Homestay', 'Coffee House', 'Studio Stay', 'Little House'],
    amenities: ['Wi-Fi miễn phí', 'Giữ hành lý', 'Không hút thuốc'],
    phrases: [
      'Homestay thiết kế tối giản, nhiều góc chụp ảnh đẹp và ban công đầy hoa.',
      'Quán cà phê ngay tầng trệt, bánh ngọt nhà làm và nhạc acoustic cuối tuần.',
      'Phòng decor theo phong cách vintage, ánh sáng tự nhiên, rất hợp để sống ảo.',
      'Chủ nhà trẻ, thân thiện, hay giới thiệu quán xá và điểm check-in mới.',
    ],
    rooms: [
      {
        name: 'Cozy Double',
        description: 'Phòng đôi nhỏ xinh có cửa sổ lớn.',
        maxOccupancy: 2,
        areaSqm: 18,
        priceFactor: 1,
        beds: [['Giường đôi', 1]],
        amenities: ['Điều hòa', 'Máy sấy tóc'],
      },
      {
        name: 'Attic Studio',
        description: 'Gác mái có cửa sổ trời và góc đọc sách.',
        maxOccupancy: 3,
        areaSqm: 28,
        priceFactor: 1.4,
        beds: [
          ['Giường Queen', 1],
          ['Sofa giường', 1],
        ],
        amenities: ['Điều hòa', 'Máy sấy tóc', 'Ban công'],
      },
    ],
    guest: { ages: [19, 32], budget: 1_000_000, party: [1, 2] },
    roomAmenities: ['view', 'quiet'],
  },
};

/** Share of guests whose main style is each one. */
const STYLE_SHARE: Record<Style, number> = {
  resort: 0.22,
  nature: 0.14,
  foodie: 0.16,
  business: 0.15,
  family: 0.18,
  chill: 0.15,
};

const NATIONALITIES: [string, number][] = [
  ['Việt Nam', 0.78],
  ['Hàn Quốc', 0.07],
  ['Nhật Bản', 0.04],
  ['Mỹ', 0.04],
  ['Úc', 0.03],
  ['Pháp', 0.04],
];

const FAMILY_NAMES = [
  'Nguyễn',
  'Trần',
  'Lê',
  'Phạm',
  'Hoàng',
  'Huỳnh',
  'Phan',
  'Vũ',
  'Võ',
  'Đặng',
  'Bùi',
  'Đỗ',
  'Hồ',
  'Ngô',
  'Dương',
];
const MIDDLE_NAMES = [
  'Văn',
  'Thị',
  'Minh',
  'Ngọc',
  'Quốc',
  'Thanh',
  'Gia',
  'Hữu',
  'Bảo',
  'Khánh',
];
const GIVEN_NAMES = [
  'An',
  'Bình',
  'Chi',
  'Dũng',
  'Giang',
  'Hà',
  'Hải',
  'Hạnh',
  'Hiếu',
  'Hoa',
  'Huy',
  'Khoa',
  'Lan',
  'Linh',
  'Long',
  'Mai',
  'Nam',
  'Nhi',
  'Phúc',
  'Quân',
  'Sơn',
  'Tâm',
  'Thảo',
  'Trang',
  'Tú',
  'Vy',
  'Yến',
];

const CRITERIA_EFFECT: Record<string, Partial<Record<Style, number>>> = {
  // A guest of each style is harder or easier on some criteria: a business guest notices the location, a family the
  // cleanliness, a resort guest the quiet. These give the sub-ratings a shape beyond "the overall, plus noise".
  'Vị trí': { business: 0.3, foodie: 0.3, nature: -0.2 },
  'Vệ sinh & Tiện nghi phòng': { family: -0.2, resort: -0.1 },
  'Độ yên tĩnh': { resort: 0.2, nature: 0.3, foodie: -0.3 },
  'Giá trị tương xứng chi phí': { chill: 0.2, resort: -0.3 },
  'Thái độ phục vụ': {},
};

const REVIEW_TEXT: [min: number, titles: string[], bodies: string[]][] = [
  [
    4.5,
    ['Tuyệt vời', 'Sẽ quay lại', 'Rất đáng tiền'],
    [
      'Mọi thứ đều vượt mong đợi, nhân viên chu đáo, phòng sạch và đẹp.',
      'Kỳ nghỉ hoàn hảo, đúng kiểu chỗ mình thích. Chắc chắn quay lại.',
    ],
  ],
  [
    3.5,
    ['Hài lòng', 'Ổn', 'Khá tốt'],
    [
      'Phòng ổn, vị trí thuận tiện, vài chi tiết nhỏ có thể tốt hơn.',
      'Trải nghiệm tốt so với giá, nhân viên thân thiện.',
    ],
  ],
  [
    2.5,
    ['Tạm được', 'Chưa như kỳ vọng'],
    [
      'Không đúng phong cách mình tìm, nhưng cơ bản vẫn ổn.',
      'Phòng hơi khác ảnh, dịch vụ ở mức trung bình.',
    ],
  ],
  [
    0,
    ['Không phù hợp', 'Thất vọng'],
    [
      'Không hợp với nhu cầu của mình, giá chưa tương xứng.',
      'Ồn và không như mô tả, khó giới thiệu cho bạn bè.',
    ],
  ],
];

// ── Randomness ──────────────────────────────────────────────

/** mulberry32: the same seed gives the same data on every machine. */
function randomOf(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let x = Math.imul(s ^ (s >>> 15), 1 | s);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4_294_967_296;
  };
}
const random = randomOf(20261123);
const pick = <T>(items: readonly T[]) =>
  items[Math.floor(random() * items.length)];
const between = (min: number, max: number) =>
  min + Math.floor(random() * (max - min + 1));
/** Standard normal (Box-Muller). */
const normal = (sd = 1) =>
  Math.sqrt(-2 * Math.log(1 - random())) *
  Math.cos(2 * Math.PI * random()) *
  sd;
const weighted = <T>(entries: [T, number][]) => {
  let r = random() * entries.reduce((n, [, w]) => n + w, 0);
  for (const [value, w] of entries) {
    r -= w;
    if (r <= 0) return value;
  }
  return entries[entries.length - 1][0];
};
const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));
const roundTo = (v: number, step: number) => Math.round(v / step) * step;

// ── Generation ──────────────────────────────────────────────

type GenHotel = {
  id: string;
  name: string;
  city: City;
  style: Style;
  /** Hidden: how much of each style the hotel has. */
  styleMix: Record<Style, number>;
  stars: number;
  basePrice: number;
  /** Hidden: how good it is, whatever the guest's taste. */
  quality: number;
  /** Hidden, per criterion. */
  criterionQuality: Record<string, number>;
  isNew: boolean;
  rooms: {
    roomTypeId: string;
    maxOccupancy: number;
    price: number;
    roomIds: string[];
  }[];
};

type GenGuest = {
  id: string;
  fullName: string;
  phone: string;
  style: Style;
  taste: Record<Style, number>;
  budget: number;
  favouriteCity: string;
  leniency: number;
  party: number;
};

function makeHotels(): Omit<GenHotel, 'id' | 'rooms'>[] {
  const hotels: Omit<GenHotel, 'id' | 'rooms'>[] = [];
  const used = new Set<string>();
  for (const style of STYLES) {
    const p = PROFILES[style];
    for (let i = 0; i < HOTELS_PER_STYLE; i++) {
      const city = CITIES[p.cities[i % p.cities.length]];
      const area = pick(city.areas);
      let name = '';
      for (let tries = 0; !name || used.has(name); tries++) {
        const place = area
          .replace(
            /^(biển|bán đảo|quận|bờ sông|phố cổ|đường|gần|đồi thông|thung lũng|bản|thị trấn|làng rau|đồi)\s+/i,
            '',
          )
          .replace(/^\p{Ll}/u, (c) => c.toUpperCase());
        name = `${place} ${pick(p.names)}${tries > 2 ? ` ${tries}` : ''}`;
      }
      used.add(name);
      const second = pick(STYLES.filter((s) => s !== style));
      const styleMix = Object.fromEntries(
        STYLES.map((s) => [s, s === style ? 1 : s === second ? 0.35 : 0]),
      ) as Record<Style, number>;
      const stars = between(p.stars[0], p.stars[1]);
      const starShare =
        p.stars[1] === p.stars[0]
          ? 0.5
          : (stars - p.stars[0]) / (p.stars[1] - p.stars[0]);
      const basePrice = roundTo(
        (p.price[0] + (p.price[1] - p.price[0]) * starShare) *
          (0.85 + random() * 0.3),
        50_000,
      );
      hotels.push({
        name,
        city,
        style,
        styleMix,
        stars,
        basePrice,
        quality: normal(0.35),
        criterionQuality: Object.fromEntries(
          Object.keys(CRITERIA_EFFECT).map((c) => [c, normal(0.25)]),
        ),
        isNew: false,
      });
    }
  }
  // New listings: spread over the styles so every taste has some.
  const order = hotels.map((_, i) => i).sort(() => random() - 0.5);
  for (const i of order.slice(0, Math.round(hotels.length * NEW_HOTEL_SHARE))) {
    hotels[i].isNew = true;
  }
  return hotels;
}

function describe(h: Omit<GenHotel, 'id' | 'rooms'>, area: string) {
  const p = PROFILES[h.style];
  const phrases = [...p.phrases].sort(() => random() - 0.5).slice(0, 3);
  const second = STYLES.find((s) => s !== h.style && h.styleMix[s] > 0);
  const extra = second ? pick(PROFILES[second].phrases) : '';
  return [
    `${h.name} là ${h.stars >= 4 ? 'khách sạn' : 'chỗ nghỉ'} ${h.stars} sao tại ${area}, ${h.city.name}, ${h.city.flavour}.`,
    ...phrases,
    extra,
  ]
    .filter(Boolean)
    .join(' ');
}

function makeGuest(index: number): Omit<GenGuest, 'id'> & {
  email: string;
  gender: Gender;
  dateOfBirth: Date;
  nationality: string;
} {
  const style = weighted(STYLES.map((s) => [s, STYLE_SHARE[s]]));
  const p = PROFILES[style];
  const taste = Object.fromEntries(STYLES.map((s) => [s, 0])) as Record<
    Style,
    number
  >;
  taste[style] = 1;
  if (random() < 0.6) taste[pick(STYLES.filter((s) => s !== style))] = 0.5;
  const gender = random() < 0.5 ? Gender.MALE : Gender.FEMALE;
  const middle =
    gender === Gender.FEMALE
      ? pick(['Thị', 'Ngọc', 'Thanh', 'Khánh', 'Bảo'])
      : pick(MIDDLE_NAMES.filter((m) => m !== 'Thị'));
  const fullName = `${pick(FAMILY_NAMES)} ${middle} ${pick(GIVEN_NAMES)}`;
  const age = between(p.guest.ages[0], p.guest.ages[1]);
  const year = new Date().getFullYear() - age;
  const n = String(index + 1).padStart(3, '0');
  return {
    email: `reco.kh${n}@stayreco.local`,
    fullName,
    phone: `09${String(10_000_000 + index * 7919).slice(-8)}`,
    style,
    taste,
    budget: roundTo(p.guest.budget * Math.exp(normal(0.3)), 100_000),
    favouriteCity: pick(p.cities),
    leniency: normal(0.3),
    party: between(p.guest.party[0], p.guest.party[1]),
    gender,
    dateOfBirth: new Date(Date.UTC(year, between(0, 11), between(1, 28))),
    nationality: weighted(NATIONALITIES),
  };
}

/** How well a hotel fits a guest's taste, 0 (nothing in common) to about 1.35. */
const affinity = (g: Omit<GenGuest, 'id'>, h: GenHotel) =>
  STYLES.reduce((n, s) => n + g.taste[s] * h.styleMix[s], 0);

/** The rating the guest gives after a stay, before it is split into the five criteria. */
function overallFor(g: Omit<GenGuest, 'id'>, h: GenHotel) {
  const pricePenalty =
    h.basePrice > g.budget * 1.3
      ? -0.5
      : h.basePrice < g.budget * 0.4
        ? -0.15
        : 0;
  return (
    2.9 +
    1.4 * affinity(g, h) +
    h.quality +
    g.leniency +
    pricePenalty +
    normal(0.45)
  );
}

/** How likely the guest is to pick this hotel for a trip. */
const choiceWeight = (g: Omit<GenGuest, 'id'>, h: GenHotel) =>
  Math.exp(2.2 * affinity(g, h)) *
  (h.city.name === g.favouriteCity ? 2.5 : 1) *
  (h.basePrice <= g.budget * 1.5 ? 1 : 0.3) *
  Math.exp(h.quality);

/** Number of past stays: a fifth never stayed, the rest a long tail (many 1–5, a few 20+). */
function staysOf() {
  if (random() < COLD_GUEST_SHARE) return 0;
  return Math.min(30, 1 + Math.floor(-Math.log(1 - random()) * 6));
}

/** One of the budget buckets of the preferences screen. */
const budgetBucket = (budget: number) =>
  [1_000_000, 2_000_000, 4_000_000, 8_000_000].find((b) => budget <= b) ?? null;

// ── Writing ─────────────────────────────────────────────────

async function main() {
  const firstPartner = 'reco.partner01@stayreco.local';
  if (await prisma.userAccount.findUnique({ where: { email: firstPartner } })) {
    console.log(`Reco data: already there (${firstPartner}), skipped`);
    return;
  }

  const password = process.env.SEED_DEMO_PASSWORD || 'Demo@123456';
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
  const commissionRate = Number(process.env.DEFAULT_COMMISSION_RATE ?? 8);
  const today = todayInVietnam();
  const now = new Date();

  const amenityId = await nameMap(
    prisma.amenity.findMany({ select: { amenityId: true, name: true } }),
    'amenityId',
  );
  const bedTypeId = await nameMap(
    prisma.bedType.findMany({ select: { bedTypeId: true, name: true } }),
    'bedTypeId',
  );
  const criteria = await prisma.ratingCriterion.findMany({
    select: { ratingCriterionId: true, name: true, weight: true },
  });
  if (criteria.length === 0)
    throw new Error('Run the base seed first: no rating criteria');

  // Hotels: one partner per six hotels, created two years ago, or a few weeks ago for the new ones.
  const specs = makeHotels();
  const hotels: GenHotel[] = [];
  const longAgo = vietnamDateTime(addDays(today, -HISTORY_DAYS - 30), '09:00');
  for (let i = 0; i < specs.length; i += 6) {
    const n = String(i / 6 + 1).padStart(2, '0');
    const email = `reco.partner${n}@stayreco.local`;
    const partner = await prisma.userAccount.create({
      data: {
        email,
        passwordHash,
        fullName: `Đối tác gợi ý ${n}`,
        phone: `0280000${n}00`,
        role: UserRole.HOTEL_PARTNER,
        status: 'ACTIVE',
        emailVerifiedAt: now,
        hotelPartner: {
          create: {
            partnerName: `StayReco Partner ${n}`,
            contactEmail: email,
            contactPhone: `0280000${n}00`,
            commissionRate,
            status: 'APPROVED',
          },
        },
      },
      select: { userAccountId: true },
    });

    for (const spec of specs.slice(i, i + 6)) {
      const area = pick(spec.city.areas);
      const createdAt = spec.isNew
        ? vietnamDateTime(addDays(today, -between(5, 40)), '09:00')
        : longAgo;
      const p = PROFILES[spec.style];
      const slug = spec.name
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/đ/gi, 'd')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      const hotel = await prisma.hotel.create({
        data: {
          hotelPartnerId: partner.userAccountId,
          name: spec.name,
          description: describe(spec, area),
          address: `${between(1, 250)} ${area}`,
          city: spec.city.name,
          country: 'Vietnam',
          latitude: spec.city.lat + normal(0.02),
          longitude: spec.city.lng + normal(0.02),
          starRating: spec.stars,
          phone: `0${between(200, 299)} ${between(1000, 9999)} ${between(100, 999)}`,
          email: `booking@${slug}.demo`,
          checkInTime: new Date('1970-01-01T14:00:00.000Z'),
          checkOutTime: new Date('1970-01-01T12:00:00.000Z'),
          status: 'ACTIVE',
          createdAt,
          hotelAmenities: {
            create: p.amenities.map((a) => ({ amenityId: amenityId(a) })),
          },
          hotelRoomConfig: {
            create: { totalRooms: 10, basePrice: spec.basePrice },
          },
          hotelImages: {
            create: [1, 2, 3].map((k) => ({
              imageUrl: `https://picsum.photos/seed/reco-${slug}-${k}/1200/800`,
              storageKey: `seed/reco-${slug}-${k}`,
              isCover: k === 1,
              sortOrder: k - 1,
            })),
          },
          hotelProperties: {
            create: toCancellationRows({
              freeCancellationDays: 2,
              feePercent: 50,
            }),
          },
          verificationRequests: {
            create: {
              requestType: 'INITIAL',
              status: 'APPROVED',
              reviewedAt: createdAt,
            },
          },
        },
        select: { hotelId: true },
      });

      const rooms: GenHotel['rooms'] = [];
      for (const [t, rt] of p.rooms.entries()) {
        const price = roundTo(spec.basePrice * rt.priceFactor, 50_000);
        const created = await prisma.roomType.create({
          data: {
            hotelId: hotel.hotelId,
            name: rt.name,
            description: rt.description,
            maxOccupancy: rt.maxOccupancy,
            baseAreaSqm: rt.areaSqm,
            createdAt,
            roomTypeBeds: {
              create: rt.beds.map(([bed, quantity]) => ({
                bedTypeId: bedTypeId(bed),
                quantity,
              })),
            },
            roomTypeAmenities: {
              create: rt.amenities.map((a) => ({ amenityId: amenityId(a) })),
            },
            prices: { create: basePriceRow(price) },
            rooms: {
              create: Array.from({ length: 5 }, (_, r) => ({
                roomNumber: `${t + 1}0${r + 1}`,
                floor: t + 1,
                createdAt,
              })),
            },
          },
          select: {
            roomTypeId: true,
            rooms: { select: { roomId: true }, orderBy: { roomNumber: 'asc' } },
          },
        });
        rooms.push({
          roomTypeId: created.roomTypeId,
          maxOccupancy: rt.maxOccupancy,
          price,
          roomIds: created.rooms.map((r) => r.roomId),
        });
      }
      hotels.push({ ...spec, id: hotel.hotelId, rooms });
    }
  }

  // Guests, with the demographics the demographic model groups on and, for half of them, the preferences screen.
  const guests: GenGuest[] = [];
  const preferenceRows: Prisma.CustomerPreferenceCreateManyInput[] = [];
  for (let i = 0; i < CUSTOMERS; i++) {
    const g = makeGuest(i);
    const account = await prisma.userAccount.create({
      data: {
        email: g.email,
        passwordHash,
        fullName: g.fullName,
        phone: g.phone,
        role: UserRole.CUSTOMER,
        status: 'ACTIVE',
        emailVerifiedAt: now,
        createdAt: longAgo,
        customer: {
          create: {
            gender: g.gender,
            dateOfBirth: g.dateOfBirth,
            nationality: g.nationality,
          },
        },
      },
      select: { userAccountId: true },
    });
    const guest: GenGuest = { ...g, id: account.userAccountId };
    guests.push(guest);

    if (random() < PREFERENCE_SHARE) {
      const styles = STYLES.filter((s) => g.taste[s] > 0).sort(
        (a, b) => g.taste[b] - g.taste[a],
      );
      const bucket = budgetBucket(g.budget);
      const prefs: Record<string, string | null> = {
        travelStyles: styles.join(','),
        roomAmenities: PROFILES[g.style].roomAmenities
          .filter(() => random() < 0.6)
          .join(','),
        favouriteCity: g.favouriteCity,
        budgetPerNight: bucket ? String(bucket) : null,
      };
      for (const [preferenceKey, preferenceValue] of Object.entries(prefs)) {
        if (preferenceValue) {
          preferenceRows.push({
            customerId: guest.id,
            preferenceKey,
            preferenceValue,
          });
        }
      }
    }
  }
  await prisma.customerPreference.createMany({ data: preferenceRows });

  // Past stays: completed bookings, each with its invoice, booked nights, review and per-criterion scores.
  const bookings: Prisma.BookingCreateManyInput[] = [];
  const items: Prisma.BookingItemCreateManyInput[] = [];
  const invoices: Prisma.InvoiceCreateManyInput[] = [];
  const nights: Prisma.RoomCalendarsCreateManyInput[] = [];
  const reviews: Prisma.ReviewCreateManyInput[] = [];
  const scores: Prisma.UserItemRatingCreateManyInput[] = [];
  const taken = new Set<string>();
  const codes = new Set(
    (await prisma.invoice.findMany({ select: { invoiceNumber: true } })).map(
      ({ invoiceNumber }) => invoiceNumber,
    ),
  );
  const established = hotels.filter((h) => !h.isNew);
  const totalWeight = criteria.reduce((n, c) => n + Number(c.weight), 0);

  for (const g of guests) {
    const wanted = staysOf();
    const candidates = established.map((h) => ({ h, w: choiceWeight(g, h) }));
    for (let s = 0; s < wanted && candidates.length; s++) {
      const { h } = candidates.splice(
        candidates.indexOf(
          weighted(candidates.map((c) => [c, c.w] as [typeof c, number])),
        ),
        1,
      )[0];
      const roomType =
        h.rooms.find((r) => r.maxOccupancy >= g.party) ??
        h.rooms[h.rooms.length - 1];
      const count = between(1, 3);
      let checkIn = '';
      let roomId = '';
      for (let tries = 0; tries < 20 && !roomId; tries++) {
        checkIn = addDays(today, -between(15, HISTORY_DAYS));
        roomId =
          roomType.roomIds.find((id) =>
            Array.from({ length: count }, (_, k) => addDays(checkIn, k)).every(
              (d) => !taken.has(`${id}|${d}`),
            ),
          ) ?? '';
      }
      if (!roomId) continue;
      const checkOut = addDays(checkIn, count);
      const createdAt = vietnamDateTime(
        addDays(checkIn, -between(3, 40)),
        '10:00',
      );
      const reviewedAt = vietnamDateTime(
        addDays(checkOut, between(0, 3)),
        '20:00',
      );
      const total = new Prisma.Decimal(roomType.price * count);
      const bookingId = randomUUID();
      let code = newBookingCode(createdAt);
      while (codes.has(code)) code = newBookingCode(createdAt);
      codes.add(code);

      bookings.push({
        bookingId,
        customerId: g.id,
        hotelId: h.id,
        checkInDate: fromCalendarDate(checkIn),
        checkOutDate: fromCalendarDate(checkOut),
        numGuests: Math.min(g.party, roomType.maxOccupancy),
        totalAmount: total,
        status: 'COMPLETED',
        guestName: g.fullName,
        contactPhone: g.phone,
        freeCancelUntil: vietnamDateTime(addDays(checkIn, -2), '14:00'),
        cancelFeePercent: 50,
        commissionRate,
        createdAt,
        updatedAt: vietnamDateTime(checkOut, '12:00'),
      });
      items.push({
        bookingId,
        roomTypeId: roomType.roomTypeId,
        numRooms: 1,
        nightlyPrices: Array.from({ length: count }, (_, k) => ({
          date: addDays(checkIn, k),
          price: roomType.price,
        })),
        subtotal: total,
      });
      invoices.push({
        bookingId,
        invoiceNumber: code,
        subtotal: total,
        taxAmount: 0,
        discountAmount: 0,
        totalAmount: total,
        paymentMethod: 'SEPAY',
        paymentStatus: 'PAID',
        paidAt: new Date(createdAt.getTime() + 5 * 60_000),
        vnpayTxnRef: `seed-reco-${code}`,
        createdAt,
      });
      for (let k = 0; k < count; k++) {
        const night = addDays(checkIn, k);
        taken.add(`${roomId}|${night}`);
        nights.push({
          roomId,
          date: fromCalendarDate(night),
          bookingId,
          status: 'BOOKED',
          priceOverride: roomType.price,
        });
      }

      const base = overallFor(g, h);
      const sub = criteria.map((c) => ({
        c,
        score: clamp(
          Math.round(
            base +
              (h.criterionQuality[c.name] ?? 0) -
              (CRITERIA_EFFECT[c.name]?.[g.style] ?? 0) +
              normal(0.35),
          ),
          1,
          5,
        ),
      }));
      const overall = weightedAverage(
        sub.map(({ c, score }) => ({
          score,
          weight: Number(c.weight) / totalWeight,
        })),
      );
      const [, titles, bodies] = REVIEW_TEXT.find(([min]) => overall >= min)!;
      const reviewId = randomUUID();
      reviews.push({
        reviewId,
        customerId: g.id,
        hotelId: h.id,
        bookingId,
        overallRating: overall,
        title: pick(titles),
        content: pick(bodies),
        createdAt: reviewedAt,
        updatedAt: reviewedAt,
      });
      for (const { c, score } of sub) {
        scores.push({
          customerId: g.id,
          hotelId: h.id,
          ratingCriterionId: c.ratingCriterionId,
          reviewId,
          score,
          createdAt: reviewedAt,
        });
      }
    }
  }

  await prisma.$transaction(
    async (tx) => {
      const chunks = <T>(rows: T[]) =>
        Array.from({ length: Math.ceil(rows.length / 1000) }, (_, i) =>
          rows.slice(i * 1000, (i + 1) * 1000),
        );
      for (const data of chunks(bookings))
        await tx.booking.createMany({ data });
      for (const data of chunks(items))
        await tx.bookingItem.createMany({ data });
      for (const data of chunks(invoices))
        await tx.invoice.createMany({ data });
      for (const data of chunks(nights))
        await tx.roomCalendars.createMany({ data });
      for (const data of chunks(reviews)) await tx.review.createMany({ data });
      for (const data of chunks(scores))
        await tx.userItemRating.createMany({ data });
    },
    { timeout: 300_000 },
  );

  const cold = guests.length - new Set(bookings.map((b) => b.customerId)).size;
  console.log(
    `Reco data: ${hotels.length} hotels (${hotels.filter((h) => h.isNew).length} new, no stays), ` +
      `${guests.length} guests (${cold} never stayed, ${new Set(preferenceRows.map((r) => r.customerId)).size} with preferences), ` +
      `${reviews.length} reviewed stays. Password "${password}", e.g. reco.kh001@stayreco.local`,
  );
}

/** Name → id for catalog rows, failing loudly if the catalog seed and this file drift apart. */
async function nameMap<K extends string>(
  rows: Promise<({ name: string } & Record<K, string>)[]>,
  key: K,
) {
  const map = new Map((await rows).map((r) => [r.name, r[key]]));
  return (name: string) => {
    const id = map.get(name);
    if (!id)
      throw new Error(`Catalog has no "${name}": run the base seed first`);
    return id;
  };
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
