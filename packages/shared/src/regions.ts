/**
 * Regions of Vietnam for the platform figures (decision M7): derived from a hotel's `city`, no column. The list holds
 * the provinces and centrally run cities under their current (2025) and former names, and the usual tourist towns
 * hotels give as their city. Anything else is `OTHER`.
 */
export const REGIONS = ['NORTH', 'CENTRAL', 'SOUTH', 'OTHER'] as const;
export type Region = (typeof REGIONS)[number];

const PLACES: Record<Exclude<Region, 'OTHER'>, string[]> = {
  NORTH: [
    'Hà Nội',
    'Hải Phòng',
    'Quảng Ninh',
    'Bắc Ninh',
    'Bắc Giang',
    'Hải Dương',
    'Hưng Yên',
    'Thái Bình',
    'Nam Định',
    'Ninh Bình',
    'Hà Nam',
    'Vĩnh Phúc',
    'Phú Thọ',
    'Thái Nguyên',
    'Bắc Kạn',
    'Cao Bằng',
    'Lạng Sơn',
    'Tuyên Quang',
    'Hà Giang',
    'Lào Cai',
    'Yên Bái',
    'Lai Châu',
    'Điện Biên',
    'Sơn La',
    'Hòa Bình',
    'Hoà Bình',
    'Sa Pa',
    'Sapa',
    'Hạ Long',
    'Cát Bà',
    'Tam Đảo',
    'Mộc Châu',
    'Tràng An',
  ],
  CENTRAL: [
    'Thanh Hóa',
    'Thanh Hoá',
    'Nghệ An',
    'Hà Tĩnh',
    'Quảng Bình',
    'Quảng Trị',
    'Thừa Thiên Huế',
    'Huế',
    'Đà Nẵng',
    'Quảng Nam',
    'Quảng Ngãi',
    'Bình Định',
    'Phú Yên',
    'Khánh Hòa',
    'Khánh Hoà',
    'Ninh Thuận',
    'Bình Thuận',
    'Kon Tum',
    'Gia Lai',
    'Đắk Lắk',
    'Đắk Nông',
    'Lâm Đồng',
    'Đà Lạt',
    'Nha Trang',
    'Cam Ranh',
    'Hội An',
    'Quy Nhơn',
    'Tuy Hòa',
    'Phan Thiết',
    'Mũi Né',
    'Phan Rang',
    'Buôn Ma Thuột',
    'Pleiku',
    'Phong Nha',
    'Sầm Sơn',
    'Cửa Lò',
    'Vinh',
    'Đồng Hới',
    'Lý Sơn',
  ],
  SOUTH: [
    'Hồ Chí Minh',
    'TP Hồ Chí Minh',
    'Sài Gòn',
    'Bình Dương',
    'Đồng Nai',
    'Bà Rịa - Vũng Tàu',
    'Bà Rịa Vũng Tàu',
    'Tây Ninh',
    'Bình Phước',
    'Long An',
    'Tiền Giang',
    'Bến Tre',
    'Trà Vinh',
    'Vĩnh Long',
    'Đồng Tháp',
    'An Giang',
    'Kiên Giang',
    'Cần Thơ',
    'Hậu Giang',
    'Sóc Trăng',
    'Bạc Liêu',
    'Cà Mau',
    'Vũng Tàu',
    'Phú Quốc',
    'Côn Đảo',
    'Hà Tiên',
    'Châu Đốc',
    'Rạch Giá',
    'Mỹ Tho',
    'Cần Giờ',
  ],
};

/** Lowercase, no Vietnamese marks, no "TP." / "Thành phố" / "Tỉnh" prefix, single spaces. */
export function placeKey(name: string): string {
  return name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[.,\-–]/g, ' ')
    .replace(/^\s*(thanh pho|tp|tinh)\s+/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const REGION_OF = new Map<string, Region>(
  (Object.entries(PLACES) as [Region, string[]][]).flatMap(([region, names]) =>
    names.map((n) => [placeKey(n), region] as const),
  ),
);

/** The region of a hotel's city; `OTHER` when the city is not in the list. */
export const regionOf = (city: string): Region => REGION_OF.get(placeKey(city)) ?? 'OTHER';
