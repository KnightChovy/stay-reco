import type { IconName } from '@/components/ui/icon';

/**
 * Danh sách sở thích dùng chung cho /account/preferences và onboarding lần đầu, cùng id với
 * frontend/src/features/account/lib/preference-options.ts. Id là thứ được lưu (`travelStyles`, `roomAmenities`, ngăn
 * bằng dấu phẩy) và recommender đọc: không bao giờ đổi tên.
 */
export const STYLES: { id: string; title: string; icon: IconName; desc: string }[] = [
  { id: 'resort', title: 'Nghỉ dưỡng & thư giãn', icon: 'beach_access', desc: 'Khu nghỉ dưỡng yên tĩnh, view biển hoặc sông' },
  { id: 'nature', title: 'Thiên nhiên & sinh thái', icon: 'forest', desc: 'Nhà gỗ trong rừng thông, khu du lịch sinh thái' },
  { id: 'foodie', title: 'Ẩm thực & văn hoá', icon: 'restaurant', desc: 'Khách sạn nhỏ gần phố cổ và quán ăn ngon' },
  { id: 'business', title: 'Công tác', icon: 'work', desc: 'Khách sạn trung tâm, có bàn làm việc' },
  { id: 'family', title: 'Gia đình & trẻ nhỏ', icon: 'group', desc: 'Phòng rộng, hồ bơi và khu vui chơi' },
  { id: 'chill', title: 'Cà phê & chụp ảnh', icon: 'local_cafe', desc: 'Homestay (nhà dân) thiết kế đẹp, nhiều góc chụp' },
];

export const AMENITIES = [
  { id: 'pool', label: 'Hồ bơi' },
  { id: 'view', label: 'View sông / view biển' },
  { id: 'breakfast', label: 'Bữa sáng bao gồm' },
  { id: 'spa', label: 'Spa & massage' },
  { id: 'quiet', label: 'Phòng yên tĩnh, tầng cao' },
  { id: 'tub', label: 'Bồn tắm' },
  { id: 'shuttle', label: 'Đưa đón sân bay' },
  { id: 'parking', label: 'Chỗ đậu xe' },
];

export const BUDGETS = [
  { id: '', label: 'Không giới hạn' },
  { id: '1000000', label: 'Dưới 1 triệu' },
  { id: '2000000', label: 'Dưới 2 triệu' },
  { id: '4000000', label: 'Dưới 4 triệu' },
  { id: '8000000', label: 'Dưới 8 triệu' },
];

/** Key màn /account/preferences sở hữu trong `customer_preference`; danh sách lưu ngăn bằng dấu phẩy. */
export const PREF_KEYS = {
  styles: 'travelStyles',
  amenities: 'roomAmenities',
  city: 'favouriteCity',
  budget: 'budgetPerNight',
} as const;

export const splitList = (value: string | undefined) => (value ? value.split(',').filter(Boolean) : []);

export const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((item) => item !== id) : [...list, id]);
