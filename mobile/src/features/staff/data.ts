// Dữ liệu mẫu chép từ frontend/src/app/(actors)/staff/*: web cũng đang dùng mock cho các màn này.
// shortcut: toàn bộ là dữ liệu tĩnh, thay bằng API front-desk/hotel-bookings khi web nối backend.
import type { ComponentProps } from 'react';
import type { Chip } from '@/components/ui/chip';

export type Tone = NonNullable<ComponentProps<typeof Chip>['tone']>;

export const shift = { label: 'Ca Sáng • 20/10/2026', handover: 'Bàn giao ca: 14:00' };

export const dashboardStats = {
  checkIn: { total: 14, done: 4, waiting: 10 },
  checkOut: { total: 12, done: 9, waiting: 3 },
  occupancy: { used: 32, total: 36, percent: 88, cleanFree: 4 },
  messages: { total: 3, note: '2 tin hỏi view tầng cao · 1 đổi lịch' },
};

export const urgentTasks = [
  { id: 'SR-261020-0842', title: 'Nguyễn Minh Anh · Elite Bạc', sub: 'Deluxe River View (#608) · 14:00', tag: 'Khách trao đổi qua AI Concierge', tone: 'secondary' as Tone, icon: 'smart_toy' as const },
  { id: 'SR-261020-0791', title: 'Trần Văn Hoàng', sub: 'Superior Garden (#204) · 13:00', tag: 'Trả phòng muộn', tone: 'warning' as Tone, icon: 'schedule' as const },
  { id: 'SR-261020-0791', title: 'Cần xác nhận xe', sub: 'Chuyến bay VN128 hạ cánh 15:30', tag: 'Đưa đón', tone: 'primary' as Tone, icon: 'directions_car' as const },
];

export const checkInGuests = [
  { id: 'SR-261020-0842', channel: 'StayReco App', name: 'Nguyễn Minh Anh', initials: 'NA', tier: 'Elite Bạc', roomType: 'Deluxe River View', pkg: 'Gói linh hoạt ăn sáng Buffet', arrivalTime: '14:00', roomNum: 'P.608 (Tầng 6)', roomStatus: 'Sạch & Kiểm duyệt', paymentStatus: 'Đã thanh toán VNPay', amount: '2.250.000 ₫' },
  { id: 'SR-261020-0850', channel: 'Booking.com', name: 'Trần Thanh Lan', initials: 'TL', tier: 'Khách thông thường', roomType: 'Superior Garden Twin', pkg: 'Tiêu chuẩn không hoàn tiền', arrivalTime: '12:30', roomNum: 'Chưa gán phòng', roomStatus: 'Ưu tiên tầng 2 hoặc 3', paymentStatus: 'Thu tại quầy', amount: '1.680.000 ₫' },
  { id: 'SR-261020-0855', channel: 'StayReco VIP', name: 'Đỗ Quốc Khánh', initials: 'DK', tier: 'Elite Kim Cương', roomType: 'Executive Riverside Suite', pkg: 'Bao gồm trà chiều & Spa 60p', arrivalTime: '11:15 (Sớm)', roomNum: 'P.802 (Tầng 8)', roomStatus: 'Welcome card đặt bàn', paymentStatus: 'Thẻ tín dụng doanh nghiệp', amount: '4.850.000 ₫' },
  { id: 'SR-261020-0862', channel: 'Agoda', name: 'Vũ Hoàng Long', initials: 'VL', tier: 'Thành viên mới', roomType: 'Deluxe City Corner', pkg: 'Không gồm bữa sáng', arrivalTime: '14:30', roomNum: 'P.405 (Tầng 4)', roomStatus: 'Đang làm phòng', paymentStatus: 'Chờ cọc 500k', amount: '1.950.000 ₫' },
  { id: 'SR-261020-0870', channel: 'Lễ tân Walk-in', name: 'Phạm Thị Mai', initials: 'PM', tier: 'Elite Vàng', roomType: 'Family Connecting Suite', pkg: 'Bao gồm ăn sáng 4 người', arrivalTime: '15:00', roomNum: 'P.501-502', roomStatus: 'Đã mở cửa thông', paymentStatus: 'Chuyển khoản Vietcombank', amount: '3.800.000 ₫' },
];

export const roomStatus = [
  { label: 'Sẵn sàng', count: 18, color: '#2e7d55' },
  { label: 'Có khách', count: 12, color: '#234e70' },
  { label: 'Đang dọn', count: 4, color: '#e0a43a' },
  { label: 'Bảo trì', count: 2, color: '#ba1a1a' },
];

export const departments = [
  { name: 'Tổ Buồng phòng', sub: 'Giám sát: Cô Hoa (Ca 1)', ext: 'Ext: 102' },
  { name: 'Bếp & Nhà hàng Sen Vàng', sub: 'Bếp trưởng: Bùi Anh Tuấn', ext: 'Ext: 105' },
  { name: 'Hỗ trợ kỹ thuật StayReco', sub: 'Kênh ưu tiên 24/7', ext: '1900 6868' },
];

export type BookingAction = 'checkin' | 'assign' | 'welcome' | 'service' | 'checkout';
export type BookingFilter = 'all' | 'pending' | 'arriving' | 'staying' | 'completed' | 'cancelled';

export const bookingFilters: { key: BookingFilter; label: string; count: number }[] = [
  { key: 'all', label: 'Tất cả', count: 48 },
  { key: 'pending', label: 'Chờ xác nhận', count: 2 },
  { key: 'arriving', label: 'Sắp đến hôm nay', count: 14 },
  { key: 'staying', label: 'Đang lưu trú', count: 12 },
  { key: 'completed', label: 'Đã hoàn tất', count: 18 },
  { key: 'cancelled', label: 'Đã hủy & Hoàn tiền', count: 2 },
];

export const bookings: {
  id: string; time: string; channel: string; guestName: string; initials: string; phone: string; tier: string;
  roomType: string; pkg: string; stayDates: string; roomNum: string; roomNote: string; amount: string;
  paymentStatus: string; status: string; tone: Tone; action: BookingAction;
}[] = [
  { id: 'SR-261020-0842', time: 'Đặt lúc 08:32 sáng', channel: 'StayReco App', guestName: 'Nguyễn Minh Anh', initials: 'NM', phone: '0905 *** 882', tier: 'Elite Bạc', roomType: 'Deluxe River View', pkg: 'Gói linh hoạt ăn sáng Buffet', stayDates: '20/10 → 22/10/2026', roomNum: 'P.608 (Tầng 6)', roomNote: 'Sạch & Kiểm duyệt', amount: '2.250.000 ₫', paymentStatus: 'Đã thanh toán VNPay', status: 'Sẵn sàng Check-in', tone: 'tertiary', action: 'checkin' },
  { id: 'SR-261020-0841', time: 'Đặt lúc 08:15 sáng', channel: 'Booking.com', guestName: 'Trần Quốc Bảo', initials: 'TB', phone: '0912 *** 450', tier: 'Khách thông thường', roomType: 'Superior Garden View', pkg: '2 người lớn • Giường đôi King', stayDates: '20/10 → 21/10/2026', roomNum: 'Chưa gán phòng', roomNote: 'Ưu tiên tầng 2 hoặc 3', amount: '980.000 ₫', paymentStatus: 'Đã thanh toán (Thẻ)', status: 'Đã xác nhận', tone: 'primary', action: 'assign' },
  { id: 'SR-261020-0839', time: 'Đặt lúc 07:45 sáng', channel: 'StayReco VIP', guestName: 'Lê Thị Mai Hoa', initials: 'LH', phone: '0938 *** 999', tier: 'Elite Kim Cương', roomType: 'Riverside Suite Ban Công Lớn', pkg: '2 lớn, 1 trẻ em • Kèm ăn sáng', stayDates: '20/10 → 23/10/2026', roomNum: 'P.501 (Tầng 5)', roomNote: 'Sẵn sàng đón khách', amount: '5.550.000 ₫', paymentStatus: 'Đã thanh toán (Napas)', status: 'Sẵn sàng đón khách', tone: 'tertiary', action: 'welcome' },
  { id: 'SR-261020-0835', time: 'Nhận phòng hôm qua', channel: 'Agoda', guestName: 'David Miller', initials: 'DM', phone: 'david.m@global.com', tier: 'Quốc tế', roomType: 'Deluxe River View', pkg: '1 khách • Yêu cầu tầng cao', stayDates: '19/10 → 21/10/2026', roomNum: 'P.604 (Tầng 6)', roomNote: 'Đang ở ngày thứ 2/2', amount: '2.500.000 ₫', paymentStatus: 'Visa Quốc tế', status: 'Đang lưu trú', tone: 'secondary', action: 'service' },
  { id: 'SR-261020-0820', time: 'Đến hạn trả phòng', channel: 'Hotline', guestName: 'Hoàng Trọng Nghĩa', initials: 'HN', phone: '0977 *** 219', tier: 'Elite Vàng', roomType: 'Deluxe River View', pkg: '2 người lớn', stayDates: '18/10 → 20/10/2026', roomNum: 'P.602 (Tầng 6)', roomNote: 'Hết hạn ca này (12:00)', amount: '2.250.000 ₫', paymentStatus: 'Đã quyết toán phòng', status: 'Chờ Check-out', tone: 'warning', action: 'checkout' },
];

// Lọc theo trạng thái trên dữ liệu mẫu (web chỉ đổi tab, chưa lọc).
export const bookingMatches: Record<BookingFilter, (a: BookingAction) => boolean> = {
  all: () => true,
  pending: () => false,
  arriving: (a) => a === 'checkin' || a === 'assign' || a === 'welcome',
  staying: (a) => a === 'service' || a === 'checkout',
  completed: () => false,
  cancelled: () => false,
};

export const checkInRooms = [
  { id: 'P.608', floor: 'Tầng 6', type: 'Deluxe Ocean King', status: 'Sẵn sàng (Đã dọn dẹp)', ready: true, score: '98% trùng hợp' },
  { id: 'P.610', floor: 'Tầng 6', type: 'Deluxe Ocean King', status: 'Sẵn sàng (Đã dọn dẹp)', ready: true },
  { id: 'P.702', floor: 'Tầng 7', type: 'Deluxe Ocean King', status: 'Đang kiểm tra chất lượng', ready: false },
  { id: 'P.504', floor: 'Tầng 5', type: 'Deluxe Ocean Twin', status: 'Sẵn sàng (Đã dọn dẹp)', ready: true },
];

export const checkInDeposit = 1000000;

export const extraCharges = [
  { id: 1, name: 'Nước khoáng Evian 500ml (Minibar)', qty: 1, price: 75000 },
  { id: 2, name: 'Phí Trả phòng Muộn (Late Checkout +2h)', qty: 1, price: 300000 },
  { id: 3, name: 'Dịch vụ giặt ủi áo sơ mi', qty: 1, price: 150000 },
];

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

export type RefundStatus = 'Chờ thẩm định' | 'Đã duyệt hoàn tiền' | 'Từ chối';
export type RefundRequest = {
  id: string; bookingId: string; guestName: string; roomType: string; totalPaid: number; requestedRefund: number;
  reason: string; policyComplianceScore: number; systemRecommendation: string; status: RefundStatus; createdAt: string;
};

export const refundRequests: RefundRequest[] = [
  { id: 'RF-901', bookingId: 'BK-8840', guestName: 'Trần Đức Nam', roomType: 'Executive Suite Ocean View', totalPaid: 5000000, requestedRefund: 4000000, reason: 'Hủy chuyến do hoãn chuyến bay (Có xác nhận từ hãng)', policyComplianceScore: 92, systemRecommendation: 'Hoàn 80% (Trừ 20% phí)', status: 'Chờ thẩm định', createdAt: '14/10/2026 09:30' },
  { id: 'RF-902', bookingId: 'BK-8835', guestName: 'Lê Mỹ Duyên', roomType: 'Deluxe Ocean King', totalPaid: 3200000, requestedRefund: 3200000, reason: 'Bão lớn tại miền Trung - Lý do bất khả kháng', policyComplianceScore: 100, systemRecommendation: 'Duyệt 100%', status: 'Đã duyệt hoàn tiền', createdAt: '13/10/2026 15:45' },
  { id: 'RF-903', bookingId: 'BK-8829', guestName: 'Vũ Hoàng Bách', roomType: 'Superior Garden Twin', totalPaid: 1800000, requestedRefund: 1800000, reason: 'Thay đổi kế hoạch cá nhân trước 12h check-in', policyComplianceScore: 40, systemRecommendation: 'Không hợp lệ', status: 'Chờ thẩm định', createdAt: '14/10/2026 08:15' },
];

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
