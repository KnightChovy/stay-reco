// Dữ liệu mẫu cho các màn chưa có backend: inbox, chat, cảnh báo, marketing (phase 5).
import type { ComponentProps } from 'react';
import type { Chip } from '@/components/ui/chip';

export type Tone = NonNullable<ComponentProps<typeof Chip>['tone']>;

export type Conversation = {
  id: string; guestName: string; avatar: string; channel: 'Booking.com' | 'Agoda' | 'Direct Chat' | 'Zalo';
  roomNum: string; lastMessage: string; time: string; unreadCount: number;
  sentiment: 'bức xúc' | 'bình thường' | 'hài lòng'; status: 'Chờ phản hồi' | 'Đang xử lý' | 'Đã giải quyết'; isEscalated?: boolean;
};

export const conversations: Conversation[] = [
  { id: 'conv-1', guestName: 'Phạm Minh Hoàng', avatar: 'MH', channel: 'Direct Chat', roomNum: 'Phòng P.402', lastMessage: 'Điều hòa phòng 402 bị kêu rất to từ 12h đêm, đề nghị nhân viên kỹ thuật sang xem ngay!', time: '10:15', unreadCount: 2, sentiment: 'bức xúc', status: 'Chờ phản hồi', isEscalated: true },
  { id: 'conv-2', guestName: 'Nguyễn Hương Giang', avatar: 'HG', channel: 'Booking.com', roomNum: 'Phòng P.608', lastMessage: 'Chào lễ tân, cho mình hỏi khách sạn có hỗ trợ set up bánh sinh nhật trong phòng không?', time: '09:40', unreadCount: 0, sentiment: 'hài lòng', status: 'Đang xử lý' },
  { id: 'conv-3', guestName: 'David Miller', avatar: 'DM', channel: 'Agoda', roomNum: 'Phòng P.305', lastMessage: 'Hi, can I request extra 2 towels and late check-out at 1 PM tomorrow?', time: '08:20', unreadCount: 0, sentiment: 'bình thường', status: 'Đã giải quyết' },
  { id: 'conv-4', guestName: 'Trần Kim Ngân', avatar: 'KN', channel: 'Zalo', roomNum: 'Chưa check-in', lastMessage: 'Mình đặt xe đưa đón sân bay Đà Nẵng về khách sạn lúc 14:30 chiều nay nhé.', time: 'Hôm qua', unreadCount: 0, sentiment: 'bình thường', status: 'Đã giải quyết' },
];

export type InboxFilter = 'all' | 'complaint' | 'direct' | 'ota';
export const inboxMatches: Record<InboxFilter, (c: Conversation) => boolean> = {
  all: () => true,
  complaint: (c) => c.sentiment === 'bức xúc' || !!c.isEscalated,
  ota: (c) => c.channel === 'Booking.com' || c.channel === 'Agoda',
  direct: (c) => c.channel === 'Direct Chat' || c.channel === 'Zalo',
};

export const staffReply =
  'Chào anh Hoàng, Lễ tân đã nhận được phản hồi và rất tiếc vì sự cố này. Em đang kiểm tra ngay với bộ phận kỹ thuật ạ.';
export const aiSuggestedResponse =
  'Chào anh Hoàng, StayReco xin lỗi chân thành về sự cố điều hòa tại P.402 làm ảnh hưởng giấc ngủ của anh. Lễ tân đã cử Kỹ thuật viên Nguyễn Văn Bình mang quạt êm sang hỗ trợ kiểm tra ngay lập tức. Khách sạn xin gửi tặng anh 1 Voucher trải nghiệm Spa / Ăn sáng bồi thường ạ!';

export type Priority = 'khẩn cấp' | 'cao' | 'bình thường';
export type IncidentAlert = {
  id: string; roomNum: string; guestName: string; title: string; category: 'Kỹ thuật' | 'Buồng phòng' | 'Dịch vụ' | 'Thanh toán';
  priority: Priority; description: string; aiSuggestedFix: string; assignedDept: string; status: 'Đang xử lý' | 'Đã giải quyết' | 'Mới'; timeAgo: string;
};

export const alerts: IncidentAlert[] = [
  { id: 'ALT-101', roomNum: 'P.402', guestName: 'Phạm Minh Hoàng', title: 'Hỏng máy điều hòa - Kêu to gây khó ngủ', category: 'Kỹ thuật', priority: 'khẩn cấp', description: 'Khách gọi phản ánh điều hòa phát tiếng động rung mạnh lúc 02:00 sáng.', aiSuggestedFix: 'Điều nhân viên kỹ thuật Nguyễn Văn Bình mang quạt êm sang hỗ trợ tạm thời, sau đó sắp xếp chuyển sang phòng P.406 cùng hạng.', assignedDept: 'Bộ phận Kỹ thuật', status: 'Đang xử lý', timeAgo: '15 phút trước' },
  { id: 'ALT-102', roomNum: 'P.602', guestName: 'Trần Thị B', title: 'Cảnh báo quá giờ Check-out 2 tiếng', category: 'Thanh toán', priority: 'cao', description: 'Khách chưa xuống quầy làm thủ tục checkout dù đã 14:00. Đã phát sinh phí late checkout.', aiSuggestedFix: 'Lễ tân liên lạc điện thoại phòng P.602 để xác nhận thời gian trả phòng hoặc gia hạn lưu trú.', assignedDept: 'Lễ tân & Thu ngân', status: 'Mới', timeAgo: '45 phút trước' },
  { id: 'ALT-103', roomNum: 'P.508', guestName: 'Lê Văn Tùng', title: 'Yêu cầu bổ sung 2 bộ nệm phụ (Extra bed)', category: 'Buồng phòng', priority: 'bình thường', description: 'Khách đi kèm trẻ nhỏ cần kê thêm nệm trước 18:00.', aiSuggestedFix: 'Chuyển phiếu công tác cho Buồng phòng tầng 5 hoàn tất trước ca tối.', assignedDept: 'Buồng phòng', status: 'Đã giải quyết', timeAgo: '2 giờ trước' },
];

export type Platform = 'Facebook' | 'Instagram' | 'Email' | 'Zalo';
export const contents: {
  id: string; title: string; previewText: string; coverImage: string; platform: Platform; aiScore: number;
  status: 'Bản nháp' | 'Đã duyệt' | 'Đã xuất bản'; updatedAt: string; targetAudience: string;
}[] = [
  { id: 'cnt-1', title: 'Ưu Đãi Mùa Thu — Đặt Phòng Deluxe Ocean King Tặng Voucher Spa 300K', previewText: '🍂 Thưởng thức cảnh bình minh sông Hàn ngoạn mục ngay từ ban công phòng Deluxe Ocean King! Đặt phòng tuần này nhận ngay Voucher Spa & Buffet hữu cơ...', coverImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80', platform: 'Facebook', aiScore: 95, status: 'Đã duyệt', updatedAt: 'Hôm nay 10:00', targetAudience: 'Khách gia đình & Cặp đôi' },
  { id: 'cnt-2', title: 'Story Visual: Trải nghiệm Buffet Sáng Hữu Cơ tại An Nhiên Riverside', previewText: 'Bắt đầu ngày mới đầy năng lượng với nguyên liệu rau củ sạch trồng tại trang trại hữu cơ riêng. Đặt ngay qua StayReco để nhận thêm VIP Lounge...', coverImage: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80', platform: 'Instagram', aiScore: 91, status: 'Bản nháp', updatedAt: '13/10/2026', targetAudience: 'Gen Z & Khách du lịch trẻ' },
  { id: 'cnt-3', title: 'Email Newsletter: Tri Ân Hội Viên VIP Gold — Đặc Quyền Late Check-out 14:00', previewText: 'Kính gửi quý khách VIP, cảm ơn bạn đã đồng hành cùng StayReco. Khách sạn trân trọng gửi tặng ưu đãi Nâng hạng phòng miễn phí...', coverImage: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80', platform: 'Email', aiScore: 88, status: 'Đã xuất bản', updatedAt: '12/10/2026', targetAudience: 'Hội viên VIP Gold' },
];

export const tones = ['Sang trọng & Cuốn hút', 'Thân thiện & Trẻ trung', 'Khuyến mãi & Thúc đẩy booking'];
export const promoOffers = ['Giảm 15% + Miễn phí Spa 300K', 'Voucher Spa 300K', 'Late Check-out 14:00'];
export const draftTitle = 'Ưu Đãi Mùa Thu — Đặt Phòng Deluxe Ocean King Tặng Voucher Spa 300K';
export const draftBody = `🍂 Thưởng thức cảnh bình minh sông Hàn ngoạn mục ngay từ ban công phòng Deluxe Ocean King!
Đặt phòng tuần này qua hệ thống StayReco để nhận ngay gói ưu đãi độc quyền:
✨ Tặng Voucher Spa thư giãn trị giá 300.000 VNĐ
✨ Buffet sáng hữu cơ cao cấp phục vụ tại nhà hàng Riverside
✨ Hỗ trợ Check-in sớm linh hoạt theo tình trạng phòng
📍 An Nhiên Riverside Hotel — 128 Bạch Đằng, Đà Nẵng
👉 Đặt ngay để giữ giá tốt nhất!`;
export const aiPolish = {
  short: '🌊 Nghỉ dưỡng sang trọng tại An Nhiên Riverside! Đặt Deluxe Ocean King tuần này nhận ngay Voucher Spa 300K & Buffet sáng hữu cơ. Đặt phòng ngay trên StayReco!',
  engaging: '✨ Bạn đã sẵn sàng cho chuyến đi Đà Nẵng hoàn hảo? Phòng Deluxe Ocean King hướng sông Hàn thơ mộng đang chờ bạn! Tặng kèm Voucher Spa 300K & Buffet sáng cao cấp khi đặt phòng hôm nay!',
  emoji: `🍂 ✨ 🌿 NGHỈ DƯỠNG MÙA THU TẠI AN NHIÊN RIVERSIDE! 🏨 🌊
🎁 Đặt Deluxe Ocean King tặng ngay Voucher Spa 300.000đ & Buffet hữu cơ!
👉 Đặt ngay qua StayReco! #StayReco #AnNhienRiverside #DaNangTrip #LuxuriousStay`,
};

export const channels = [
  { name: 'Facebook Fanpage', sub: '15.2k Theo dõi • Tự động đăng ON', letter: 'F', color: '#1877f2' },
  { name: 'Instagram', sub: '8.4k Theo dõi • Story & Reels', letter: 'I', color: '#c13584' },
  { name: 'Zalo OA', sub: 'Gửi ZNS CSKH tự động', letter: 'Z', color: '#0068ff' },
  { name: 'Email', sub: 'SendGrid / StayReco Mailer', letter: 'E', color: '#42474e' },
];

export const scheduledPosts: { id: string; title: string; channel: Platform; scheduledTime: string; status: 'Chờ đăng' | 'Đã đăng thành công' | 'Bản nháp'; author: string }[] = [
  { id: 'sch-1', title: 'Ưu Đãi Mùa Thu — Đặt Phòng Deluxe Ocean King Tặng Voucher Spa 300K', channel: 'Facebook', scheduledTime: '20/10/2026 18:00', status: 'Chờ đăng', author: 'Nguyễn Hương Ly' },
  { id: 'sch-2', title: 'Story Visual: Trải nghiệm Buffet Sáng Hữu Cơ tại An Nhiên Riverside', channel: 'Instagram', scheduledTime: '21/10/2026 09:00', status: 'Chờ đăng', author: 'AI Marketing' },
  { id: 'sch-3', title: 'Email Tri Ân Hội Viên VIP Gold — Tặng Voucher Late Check-out 14:00', channel: 'Email', scheduledTime: '15/10/2026 10:00', status: 'Đã đăng thành công', author: 'Nguyễn Hương Ly' },
];

export const marketingKpis = { revenue: 145000000, bookings: 302, cvr: '3.4%', clicks: '8,530', roi: '4.8x' };
export const aiRecommendation =
  'Các bài viết định dạng Story Visual (Instagram) kèm góc nhìn sông Hàn có tỷ lệ tương tác cao vượt trội +38% so với bài viết thông thường.';
export const topPosts = [
  { rank: 1, title: 'Ưu Đãi Mùa Thu — Đặt Phòng Deluxe Ocean King Tặng Voucher Spa 300K', platform: 'Facebook', clicks: '4,520', bookings: 142, revenue: 71000000, roi: '5.2x' },
  { rank: 2, title: 'Story Visual: Trải nghiệm Buffet Sáng Hữu Cơ tại An Nhiên Riverside', platform: 'Instagram', clicks: '2,890', bookings: 98, revenue: 49000000, roi: '4.5x' },
  { rank: 3, title: 'Email Newsletter: Tri Ân Hội Viên VIP Gold — Late Check-out 14:00', platform: 'Email', clicks: '1,120', bookings: 62, revenue: 25000000, roi: '4.1x' },
];
