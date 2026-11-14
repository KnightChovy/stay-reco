// Dữ liệu mẫu cho các màn chưa có backend: inbox, chat, cảnh báo.
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
