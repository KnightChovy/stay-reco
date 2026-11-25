import { Briefcase, Coffee, Palmtree, Trees, Users, Utensils } from "lucide-react";

/**
 * The frontend's own preference lists, shared by /account/preferences and first-login onboarding. Their ids are what
 * both save (`travelStyles`, `roomAmenities`, comma-separated) and what the recommender reads: never rename one.
 */
export const STYLES = [
  { id: "resort", title: "Nghỉ dưỡng & thư giãn", icon: Palmtree, desc: "Khu nghỉ dưỡng yên tĩnh, view biển hoặc sông" },
  { id: "nature", title: "Thiên nhiên & sinh thái", icon: Trees, desc: "Nhà gỗ trong rừng thông, khu du lịch sinh thái" },
  { id: "foodie", title: "Ẩm thực & văn hoá", icon: Utensils, desc: "Khách sạn nhỏ gần phố cổ và quán ăn ngon" },
  { id: "business", title: "Công tác", icon: Briefcase, desc: "Khách sạn trung tâm, có bàn làm việc" },
  { id: "family", title: "Gia đình & trẻ nhỏ", icon: Users, desc: "Phòng rộng, hồ bơi và khu vui chơi" },
  { id: "chill", title: "Cà phê & chụp ảnh", icon: Coffee, desc: "Homestay (nhà dân) thiết kế đẹp, nhiều góc chụp" },
];

export const AMENITIES = [
  { id: "pool", label: "Hồ bơi" },
  { id: "view", label: "View sông / view biển" },
  { id: "breakfast", label: "Bữa sáng bao gồm" },
  { id: "spa", label: "Spa & massage" },
  { id: "quiet", label: "Phòng yên tĩnh, tầng cao" },
  { id: "tub", label: "Bồn tắm" },
  { id: "shuttle", label: "Đưa đón sân bay" },
  { id: "parking", label: "Chỗ đậu xe" },
];

export const BUDGETS = [
  { id: "", label: "Không giới hạn" },
  { id: "1000000", label: "Dưới 1 triệu" },
  { id: "2000000", label: "Dưới 2 triệu" },
  { id: "4000000", label: "Dưới 4 triệu" },
  { id: "8000000", label: "Dưới 8 triệu" },
];

