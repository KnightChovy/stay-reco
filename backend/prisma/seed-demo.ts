import * as argon2 from 'argon2';
import { randomUUID } from 'crypto';
import {
  BOOKING_LIMITS,
  type CancellationPolicyInput,
  daysBetween,
  type SubmitVerificationInput,
} from '@stayreco/shared';
import {
  addDays,
  fromCalendarDate,
  todayInVietnam,
  toCalendarDate,
  vietnamDateTime,
} from '../src/common/http/calendar-date';
import { FieldCipher } from '../src/common/crypto/field-cipher';
import {
  type BookingStatus,
  Prisma,
  type PrismaClient,
  StaffPermission,
  UserRole,
} from '../src/generated/prisma/client';
import { AuditAction } from '../src/modules/audit/audit.service';
import { newBookingCode } from '../src/modules/bookings/booking-code';
import { recordBookingEvent } from '../src/modules/bookings/booking-history';
import { cancellationAmounts } from '../src/modules/bookings/cancellation';
import { commissionOf } from '../src/modules/bookings/commission';
import {
  cancellationPolicyOf,
  cancellationRowsSelect,
  fromTime,
  toCancellationRows,
} from '../src/modules/hotels/hotel.mapper';
import { basePriceRow, basePriceWhere } from '../src/modules/rooms/room.mapper';
import { byRoomNumber } from '../src/modules/rooms/rooms.service';
import {
  DEFAULT_CHECK_IN_TIME,
  DEFAULT_CHECK_OUT_TIME,
  freeCancellationUntil,
} from '../src/modules/stays/offer';
import { toSnapshotRows } from '../src/modules/verification/verification.mapper';
import {
  PLATFORM_WALLET_ID,
  WalletLedger,
} from '../src/modules/wallets/wallet-ledger';

/**
 * Demo data for the search and booking work and for FE integration: three ACTIVE hotels in Đà Nẵng, Hà Nội and
 * TP.HCM (one partner and one front-desk staff member each), plus a fourth hotel waiting in the verification queue.
 * Hotel and company names are fictional on purpose: the seed attaches made-up tax codes and bank accounts to them.
 * Everything is written the way the API writes it (base price rows, encrypted account numbers, request snapshots).
 * Safe to re-run: accounts and hotels that already exist are skipped.
 */

type DemoRoomType = {
  name: string;
  description: string;
  maxOccupancy: number;
  areaSqm: number;
  basePrice: number;
  beds: [bedName: string, quantity: number][];
  amenities: string[];
  rooms: [roomNumber: string, floor: number][];
};

type DemoHotel = {
  name: string;
  description: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  starRating: number;
  phone: string;
  email: string;
  website: string;
  checkInTime: string;
  checkOutTime: string;
  amenities: string[];
  policies: Record<string, string>;
  totalRooms: number;
  roomTypes: DemoRoomType[];
  /** ACTIVE: approved INITIAL request. PENDING: request waiting in the manager queue. */
  verification: 'APPROVED' | 'PENDING';
  legalName: string;
  taxCode: string;
  accountNumber: string;
};

type DemoPartner = {
  email: string;
  fullName: string;
  company: string;
  phone: string;
  staffEmail?: string;
  hotels: DemoHotel[];
};

const POLICIES = {
  cancellation:
    'Miễn phí hủy trước 48 giờ so với ngày nhận phòng; sau thời hạn này thu 100% đêm đầu tiên.',
  children:
    'Trẻ em dưới 6 tuổi ở miễn phí khi dùng giường có sẵn; trẻ từ 6 tuổi tính như người lớn.',
  pets: 'Không nhận thú cưng.',
  smoking: 'Không hút thuốc trong phòng; có khu vực hút thuốc riêng.',
};

const PARTNERS: DemoPartner[] = [
  {
    email: 'partner.danang@stayreco.local',
    fullName: 'Lê Minh Khang',
    company: 'Sơn Trà Hospitality',
    phone: '0905123456',
    staffEmail: 'staff.danang@stayreco.local',
    hotels: [
      {
        name: 'Sơn Trà Bay Resort & Spa',
        description:
          'Khu nghỉ dưỡng ven biển trên bán đảo Sơn Trà, mỗi phòng đều nhìn ra vịnh, có bãi biển riêng, hồ bơi vô cực và spa.',
        address: 'Bãi Bắc, bán đảo Sơn Trà',
        city: 'Đà Nẵng',
        latitude: 16.118,
        longitude: 108.306,
        starRating: 5,
        phone: '0236 3938 888',
        email: 'reservations@sontrabay.demo',
        website: 'https://sontrabay.demo',
        checkInTime: '14:00',
        checkOutTime: '12:00',
        amenities: [
          'Wi-Fi miễn phí',
          'Lễ tân 24/7',
          'Chỗ đậu xe',
          'Nhà hàng',
          'Quầy bar',
          'Bữa sáng',
          'Hồ bơi',
          'Phòng gym',
          'Spa & massage',
          'Đưa đón sân bay',
        ],
        policies: POLICIES,
        totalRooms: 16,
        roomTypes: [
          {
            name: 'Deluxe Ocean View',
            description:
              'Phòng hướng biển với ban công riêng nhìn ra vịnh Sơn Trà.',
            maxOccupancy: 2,
            areaSqm: 45,
            basePrice: 4500000,
            beds: [['Giường King', 1]],
            amenities: [
              'Điều hòa',
              'TV màn hình phẳng',
              'Minibar',
              'Két sắt',
              'Ban công',
              'Máy sấy tóc',
            ],
            rooms: [
              ['201', 2],
              ['202', 2],
              ['203', 2],
              ['204', 2],
              ['205', 2],
              ['206', 2],
            ],
          },
          {
            name: 'Premier Bungalow',
            description: 'Bungalow giữa vườn nhiệt đới, có bồn tắm ngoài trời.',
            maxOccupancy: 3,
            areaSqm: 70,
            basePrice: 7800000,
            beds: [
              ['Giường King', 1],
              ['Giường đơn', 1],
            ],
            amenities: [
              'Điều hòa',
              'TV màn hình phẳng',
              'Minibar',
              'Két sắt',
              'Bồn tắm',
              'Máy sấy tóc',
            ],
            rooms: [
              ['B01', 1],
              ['B02', 1],
              ['B03', 1],
              ['B04', 1],
            ],
          },
          {
            name: 'Family Suite',
            description:
              'Căn suite hai phòng ngủ cho gia đình, phòng khách rộng.',
            maxOccupancy: 4,
            areaSqm: 95,
            basePrice: 10500000,
            beds: [
              ['Giường King', 1],
              ['Giường đơn', 2],
            ],
            amenities: [
              'Điều hòa',
              'TV màn hình phẳng',
              'Minibar',
              'Két sắt',
              'Bàn làm việc',
              'Bồn tắm',
              'Ban công',
            ],
            rooms: [
              ['301', 3],
              ['302', 3],
            ],
          },
        ],
        verification: 'APPROVED',
        legalName: 'Công ty TNHH Sơn Trà Hospitality',
        taxCode: '0401111111',
        accountNumber: '1023456789',
      },
      {
        name: 'Mỹ Khê Boutique Hotel',
        description:
          'Khách sạn boutique cách biển Mỹ Khê 200 m, đang chờ xác minh.',
        address: '120 Võ Nguyên Giáp, Sơn Trà',
        city: 'Đà Nẵng',
        latitude: 16.0607,
        longitude: 108.2468,
        starRating: 3,
        phone: '0236 3555 666',
        email: 'hello@mykheboutique.demo',
        website: 'https://mykheboutique.demo',
        checkInTime: '14:00',
        checkOutTime: '11:00',
        amenities: ['Wi-Fi miễn phí', 'Lễ tân 24/7', 'Bữa sáng', 'Giữ hành lý'],
        policies: POLICIES,
        totalRooms: 10,
        roomTypes: [
          {
            name: 'Superior Double',
            description: 'Phòng đôi gọn gàng, gần biển.',
            maxOccupancy: 2,
            areaSqm: 24,
            basePrice: 950000,
            beds: [['Giường đôi', 1]],
            amenities: ['Điều hòa', 'TV màn hình phẳng', 'Máy sấy tóc'],
            rooms: [
              ['401', 4],
              ['402', 4],
            ],
          },
        ],
        verification: 'PENDING',
        legalName: 'Công ty TNHH Sơn Trà Hospitality',
        taxCode: '0401111111',
        accountNumber: '1023456789',
      },
      {
        name: 'Bạch Đằng Riverside Hotel',
        description:
          'Khách sạn bốn sao ven sông Hàn, nhìn ra cầu Rồng, có nhà hàng tầng thượng và phòng gym 24/7.',
        address: '88 Bạch Đằng, Hải Châu',
        city: 'Đà Nẵng',
        latitude: 16.0678,
        longitude: 108.2245,
        starRating: 4,
        phone: '0236 3822 888',
        email: 'booking@bachdangriverside.demo',
        website: 'https://bachdangriverside.demo',
        checkInTime: '14:00',
        checkOutTime: '12:00',
        amenities: [
          'Wi-Fi miễn phí',
          'Lễ tân 24/7',
          'Thang máy',
          'Nhà hàng',
          'Bữa sáng',
          'Phòng gym',
          'Giặt ủi',
        ],
        policies: POLICIES,
        totalRooms: 10,
        roomTypes: [
          {
            name: 'Deluxe River View',
            description: 'Phòng hướng sông Hàn, ban công kính nhìn cầu Rồng về đêm.',
            maxOccupancy: 2,
            areaSqm: 32,
            basePrice: 1850000,
            beds: [['Giường King', 1]],
            amenities: ['Điều hòa', 'TV màn hình phẳng', 'Minibar', 'Ban công', 'Máy sấy tóc'],
            rooms: [
              ['501', 5],
              ['502', 5],
              ['503', 5],
              ['504', 5],
              ['505', 5],
              ['506', 5],
            ],
          },
          {
            name: 'Executive City Suite',
            description: 'Suite góc phố với phòng khách riêng và bàn làm việc.',
            maxOccupancy: 3,
            areaSqm: 55,
            basePrice: 2950000,
            beds: [
              ['Giường King', 1],
              ['Sofa giường', 1],
            ],
            amenities: ['Điều hòa', 'TV màn hình phẳng', 'Minibar', 'Két sắt', 'Bàn làm việc', 'Bồn tắm'],
            rooms: [
              ['601', 6],
              ['602', 6],
              ['603', 6],
              ['604', 6],
            ],
          },
        ],
        verification: 'APPROVED',
        legalName: 'Công ty TNHH Bạch Đằng Riverside',
        taxCode: '0401222222',
        accountNumber: '1023456790',
      },
      {
        name: 'An Thượng Beach House',
        description:
          'Nhà nghỉ boutique phong cách Địa Trung Hải, cách bãi biển Mỹ Khê 150 m, có sân vườn và quầy bar nhỏ.',
        address: '12 Nguyễn Văn Thoại, Ngũ Hành Sơn',
        city: 'Đà Nẵng',
        latitude: 16.0544,
        longitude: 108.2461,
        starRating: 3,
        phone: '0236 3777 555',
        email: 'stay@anthuongbeachhouse.demo',
        website: 'https://anthuongbeachhouse.demo',
        checkInTime: '14:00',
        checkOutTime: '11:00',
        amenities: ['Wi-Fi miễn phí', 'Lễ tân 24/7', 'Bữa sáng', 'Quầy bar', 'Giữ hành lý'],
        policies: POLICIES,
        totalRooms: 8,
        roomTypes: [
          {
            name: 'Garden Double',
            description: 'Phòng đôi nhìn vườn nhiệt đới, yên tĩnh và nhiều cây xanh.',
            maxOccupancy: 2,
            areaSqm: 26,
            basePrice: 1150000,
            beds: [['Giường đôi', 1]],
            amenities: ['Điều hòa', 'TV màn hình phẳng', 'Máy sấy tóc'],
            rooms: [
              ['G01', 1],
              ['G02', 1],
              ['G03', 1],
              ['G04', 1],
            ],
          },
          {
            name: 'Balcony Twin',
            description: 'Phòng hai giường đơn có ban công thoáng, phù hợp bạn bè.',
            maxOccupancy: 2,
            areaSqm: 30,
            basePrice: 1350000,
            beds: [['Giường đơn', 2]],
            amenities: ['Điều hòa', 'TV màn hình phẳng', 'Ban công', 'Máy sấy tóc'],
            rooms: [
              ['T01', 2],
              ['T02', 2],
              ['T03', 2],
              ['T04', 2],
            ],
          },
        ],
        verification: 'APPROVED',
        legalName: 'Công ty TNHH An Thượng Beach House',
        taxCode: '0401333333',
        accountNumber: '1023456791',
      },
      {
        name: 'Hàn River Loft Suites',
        description:
          'Căn hộ loft tối giản bên bờ sông Hàn, có bếp nhỏ và góc làm việc, phù hợp khách lưu trú dài ngày.',
        address: '35 Trần Hưng Đạo, Sơn Trà',
        city: 'Đà Nẵng',
        latitude: 16.0721,
        longitude: 108.2302,
        starRating: 4,
        phone: '0236 3666 444',
        email: 'hello@hanriverloft.demo',
        website: 'https://hanriverloft.demo',
        checkInTime: '15:00',
        checkOutTime: '12:00',
        amenities: ['Wi-Fi miễn phí', 'Lễ tân 24/7', 'Thang máy', 'Giặt ủi', 'Chỗ đậu xe'],
        policies: POLICIES,
        totalRooms: 6,
        roomTypes: [
          {
            name: 'Studio River Loft',
            description: 'Studio mở với cửa sổ lớn nhìn sông, có bếp nhỏ và bàn ăn.',
            maxOccupancy: 2,
            areaSqm: 38,
            basePrice: 2350000,
            beds: [['Giường Queen', 1]],
            amenities: ['Điều hòa', 'TV màn hình phẳng', 'Minibar', 'Bàn làm việc', 'Máy sấy tóc'],
            rooms: [
              ['L01', 1],
              ['L02', 1],
              ['L03', 1],
              ['L04', 1],
              ['L05', 1],
              ['L06', 1],
            ],
          },
        ],
        verification: 'APPROVED',
        legalName: 'Công ty TNHH Hàn River Loft',
        taxCode: '0401444444',
        accountNumber: '1023456792',
      },
      {
        name: 'Ngũ Hành Sơn Garden Retreat',
        description:
          'Khu nghỉ dưỡng sân vườn dưới chân núi Ngũ Hành Sơn, có hồ bơi ngoài trời và khu thiền.',
        address: '273 Huyền Trân Công Chúa, Ngũ Hành Sơn',
        city: 'Đà Nẵng',
        latitude: 16.0039,
        longitude: 108.2632,
        starRating: 5,
        phone: '0236 3999 777',
        email: 'reservations@nguhanhsongarden.demo',
        website: 'https://nguhanhsongarden.demo',
        checkInTime: '14:00',
        checkOutTime: '12:00',
        amenities: [
          'Wi-Fi miễn phí',
          'Lễ tân 24/7',
          'Chỗ đậu xe',
          'Nhà hàng',
          'Bữa sáng',
          'Hồ bơi',
          'Spa & massage',
          'Đưa đón sân bay',
        ],
        policies: POLICIES,
        totalRooms: 10,
        roomTypes: [
          {
            name: 'Garden Villa',
            description: 'Villa một phòng ngủ có hiên riêng nhìn vườn nhiệt đới.',
            maxOccupancy: 3,
            areaSqm: 65,
            basePrice: 3600000,
            beds: [['Giường King', 1]],
            amenities: ['Điều hòa', 'TV màn hình phẳng', 'Minibar', 'Bồn tắm', 'Ban công', 'Máy sấy tóc'],
            rooms: [
              ['V01', 1],
              ['V02', 1],
              ['V03', 1],
              ['V04', 1],
              ['V05', 1],
              ['V06', 1],
            ],
          },
          {
            name: 'Family Garden Suite',
            description: 'Suite gia đình hai phòng ngủ, có khu vui chơi nhỏ cho trẻ.',
            maxOccupancy: 4,
            areaSqm: 90,
            basePrice: 5200000,
            beds: [
              ['Giường King', 1],
              ['Giường tầng', 1],
            ],
            amenities: ['Điều hòa', 'TV màn hình phẳng', 'Minibar', 'Bồn tắm', 'Ban công'],
            rooms: [
              ['F01', 2],
              ['F02', 2],
              ['F03', 2],
              ['F04', 2],
            ],
          },
        ],
        verification: 'APPROVED',
        legalName: 'Công ty TNHH Ngũ Hành Sơn Garden',
        taxCode: '0401555555',
        accountNumber: '1023456793',
      },
    ],
  },
  {
    email: 'partner.hanoi@stayreco.local',
    fullName: 'Nguyễn Thu Hà',
    company: 'Hồ Gươm Heritage',
    phone: '0912345678',
    staffEmail: 'staff.hanoi@stayreco.local',
    hotels: [
      {
        name: 'Hồ Gươm Heritage Hotel',
        description:
          'Khách sạn kiến trúc Đông Dương cạnh hồ Hoàn Kiếm, đi bộ ra phố cổ và Nhà hát Lớn.',
        address: '15 Hàng Khay, Hoàn Kiếm',
        city: 'Hà Nội',
        latitude: 21.0245,
        longitude: 105.853,
        starRating: 5,
        phone: '024 3825 1234',
        email: 'stay@hoguomheritage.demo',
        website: 'https://hoguomheritage.demo',
        checkInTime: '14:00',
        checkOutTime: '12:00',
        amenities: [
          'Wi-Fi miễn phí',
          'Lễ tân 24/7',
          'Thang máy',
          'Nhà hàng',
          'Quầy bar',
          'Bữa sáng',
          'Phòng gym',
          'Spa & massage',
          'Giặt ủi',
        ],
        policies: POLICIES,
        totalRooms: 14,
        roomTypes: [
          {
            name: 'Superior City View',
            description: 'Phòng nhìn ra phố cổ, nội thất gỗ.',
            maxOccupancy: 2,
            areaSqm: 30,
            basePrice: 2600000,
            beds: [['Giường Queen', 1]],
            amenities: [
              'Điều hòa',
              'TV màn hình phẳng',
              'Minibar',
              'Két sắt',
              'Máy sấy tóc',
            ],
            rooms: [
              ['501', 5],
              ['502', 5],
              ['503', 5],
              ['504', 5],
              ['505', 5],
            ],
          },
          {
            name: 'Deluxe Lake View',
            description: 'Phòng nhìn thẳng ra hồ Hoàn Kiếm.',
            maxOccupancy: 2,
            areaSqm: 38,
            basePrice: 3900000,
            beds: [['Giường King', 1]],
            amenities: [
              'Điều hòa',
              'TV màn hình phẳng',
              'Minibar',
              'Két sắt',
              'Bồn tắm',
              'Máy sấy tóc',
            ],
            rooms: [
              ['601', 6],
              ['602', 6],
              ['603', 6],
              ['604', 6],
            ],
          },
          {
            name: 'Executive Suite',
            description:
              'Suite có phòng khách riêng và quyền vào executive lounge.',
            maxOccupancy: 3,
            areaSqm: 65,
            basePrice: 6500000,
            beds: [
              ['Giường King', 1],
              ['Sofa giường', 1],
            ],
            amenities: [
              'Điều hòa',
              'TV màn hình phẳng',
              'Minibar',
              'Két sắt',
              'Bàn làm việc',
              'Bồn tắm',
            ],
            rooms: [
              ['801', 8],
              ['802', 8],
            ],
          },
        ],
        verification: 'APPROVED',
        legalName: 'Công ty Cổ phần Hồ Gươm Heritage',
        taxCode: '0102222222',
        accountNumber: '2034567891',
      },
    ],
  },
  {
    email: 'partner.hcm@stayreco.local',
    fullName: 'Trần Quốc Bảo',
    company: 'Saigon Riverside Group',
    phone: '0903456789',
    staffEmail: 'staff.hcm@stayreco.local',
    hotels: [
      {
        name: 'Sài Gòn Riverside Grand Hotel',
        description:
          'Khách sạn bên sông Sài Gòn ở trung tâm Quận 1, quầy bar tầng thượng nhìn toàn cảnh thành phố.',
        address: '8 Tôn Đức Thắng, Quận 1',
        city: 'TP. Hồ Chí Minh',
        latitude: 10.7769,
        longitude: 106.7065,
        starRating: 5,
        phone: '028 3822 9999',
        email: 'booking@saigonriverside.demo',
        website: 'https://saigonriverside.demo',
        checkInTime: '14:00',
        checkOutTime: '12:00',
        amenities: [
          'Wi-Fi miễn phí',
          'Lễ tân 24/7',
          'Thang máy',
          'Chỗ đậu xe',
          'Nhà hàng',
          'Quầy bar',
          'Bữa sáng',
          'Hồ bơi',
          'Phòng gym',
          'Đưa đón sân bay',
        ],
        policies: POLICIES,
        totalRooms: 18,
        roomTypes: [
          {
            name: 'Deluxe River View',
            description: 'Phòng nhìn ra sông Sài Gòn và cầu Thủ Thiêm.',
            maxOccupancy: 2,
            areaSqm: 35,
            basePrice: 3200000,
            beds: [['Giường King', 1]],
            amenities: [
              'Điều hòa',
              'TV màn hình phẳng',
              'Minibar',
              'Két sắt',
              'Máy sấy tóc',
            ],
            rooms: [
              ['1001', 10],
              ['1002', 10],
              ['1003', 10],
              ['1004', 10],
              ['1005', 10],
              ['1006', 10],
            ],
          },
          {
            name: 'Premier Twin',
            description: 'Phòng hai giường đơn, phù hợp công tác.',
            maxOccupancy: 2,
            areaSqm: 35,
            basePrice: 3000000,
            beds: [['Giường đơn', 2]],
            amenities: [
              'Điều hòa',
              'TV màn hình phẳng',
              'Két sắt',
              'Bàn làm việc',
              'Máy sấy tóc',
            ],
            rooms: [
              ['1101', 11],
              ['1102', 11],
              ['1103', 11],
              ['1104', 11],
            ],
          },
          {
            name: 'Grand Suite',
            description: 'Suite góc toà nhà, cửa kính kịch trần nhìn ra sông.',
            maxOccupancy: 4,
            areaSqm: 80,
            basePrice: 8200000,
            beds: [
              ['Giường King', 1],
              ['Sofa giường', 1],
            ],
            amenities: [
              'Điều hòa',
              'TV màn hình phẳng',
              'Minibar',
              'Két sắt',
              'Bàn làm việc',
              'Bồn tắm',
            ],
            rooms: [
              ['1201', 12],
              ['1202', 12],
            ],
          },
        ],
        verification: 'APPROVED',
        legalName: 'Công ty TNHH Saigon Riverside Group',
        taxCode: '0303333333',
        accountNumber: '3045678912',
      },
    ],
  },
];

const MANAGER_EMAIL = 'pm@stayreco.local';
const REQUIRED_DOCUMENTS = [
  'BUSINESS_LICENSE',
  'FIRE_SAFETY',
  'SECURITY_CERTIFICATE',
] as const;

/** Picsum gives stable placeholder photos for a given seed word; real photos replace them later. */
const photo = (seed: string) => `https://picsum.photos/seed/${seed}/1200/800`;
const slug = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export async function seedDemo(prisma: PrismaClient) {
  const password = process.env.SEED_DEMO_PASSWORD || 'Demo@123456';
  const key = process.env.BENEFICIARY_ENCRYPTION_KEY;
  if (!key)
    throw new Error('BENEFICIARY_ENCRYPTION_KEY is required to seed demo data');
  const cipher = new FieldCipher(key);
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
  const commissionRate = Number(process.env.DEFAULT_COMMISSION_RATE ?? 8);

  const amenityId = await lookup(
    prisma.amenity.findMany({ select: { amenityId: true, name: true } }),
    'amenityId',
  );
  const bedTypeId = await lookup(
    prisma.bedType.findMany({ select: { bedTypeId: true, name: true } }),
    'bedTypeId',
  );

  const managerId = await ensureAccount(
    prisma,
    MANAGER_EMAIL,
    () => ({
      fullName: 'Platform Manager',
      role: UserRole.PLATFORM_MANAGER,
      platformManager: { create: { department: 'Kiểm duyệt đối tác' } },
    }),
    passwordHash,
  );

  let created = 0;
  for (const partner of PARTNERS) {
    const partnerId = await ensureAccount(
      prisma,
      partner.email,
      () => ({
        fullName: partner.fullName,
        phone: partner.phone,
        role: UserRole.HOTEL_PARTNER,
        hotelPartner: {
          create: {
            partnerName: partner.company,
            contactEmail: partner.email,
            contactPhone: partner.phone,
            commissionRate,
          },
        },
      }),
      passwordHash,
    );

    for (const demo of partner.hotels) {
      const exists = await prisma.hotel.findFirst({
        where: { hotelPartnerId: partnerId, name: demo.name },
        select: { hotelId: true },
      });
      if (exists) continue;

      const hotelId = await prisma.$transaction(async (tx) => {
        const hotel = await tx.hotel.create({
          data: {
            hotelPartnerId: partnerId,
            name: demo.name,
            description: demo.description,
            address: demo.address,
            city: demo.city,
            country: 'Vietnam',
            latitude: demo.latitude,
            longitude: demo.longitude,
            starRating: demo.starRating,
            phone: demo.phone,
            email: demo.email,
            website: demo.website,
            checkInTime: new Date(`1970-01-01T${demo.checkInTime}:00.000Z`),
            checkOutTime: new Date(`1970-01-01T${demo.checkOutTime}:00.000Z`),
            status:
              demo.verification === 'APPROVED'
                ? 'ACTIVE'
                : 'PENDING_VERIFICATION',
            hotelAmenities: {
              create: demo.amenities.map((name) => ({
                amenityId: amenityId(name),
              })),
            },
            hotelRoomConfig: {
              create: {
                totalRooms: demo.totalRooms,
                basePrice: demo.roomTypes[0].basePrice,
              },
            },
            hotelImages: {
              create: [1, 2, 3, 4].map((n) => ({
                imageUrl: photo(`stayreco-${slug(demo.name)}-${n}`),
                storageKey: `seed/${slug(demo.name)}-${n}`,
                isCover: n === 1,
                sortOrder: n - 1,
              })),
            },
          },
          select: { hotelId: true },
        });
        const { hotelId } = hotel;

        await tx.hotelProperties.createMany({
          data: Object.entries(demo.policies).map(([k, v]) => ({
            hotelId,
            propertyKey: `policy.${k}`,
            propertyValue: v,
          })),
        });

        for (const rt of demo.roomTypes) {
          await tx.roomType.create({
            data: {
              hotelId,
              name: rt.name,
              description: rt.description,
              maxOccupancy: rt.maxOccupancy,
              baseAreaSqm: rt.areaSqm,
              roomTypeBeds: {
                create: rt.beds.map(([bed, quantity]) => ({
                  bedTypeId: bedTypeId(bed),
                  quantity,
                })),
              },
              roomTypeAmenities: {
                create: rt.amenities.map((name) => ({
                  amenityId: amenityId(name),
                })),
              },
              prices: {
                create: basePriceRow(rt.basePrice),
              },
              roomTypeImages: {
                create: [1, 2].map((n) => ({
                  imageUrl: photo(
                    `stayreco-${slug(demo.name)}-${slug(rt.name)}-${n}`,
                  ),
                  storageKey: `seed/${slug(demo.name)}-${slug(rt.name)}-${n}`,
                  sortOrder: n - 1,
                })),
              },
              rooms: {
                create: rt.rooms.map(([roomNumber, floor]) => ({
                  roomNumber,
                  floor,
                })),
              },
            },
          });
        }

        const wizard: SubmitVerificationInput = {
          legal: {
            legalName: demo.legalName,
            taxCode: demo.taxCode,
            businessType: 'Doanh nghiệp',
            representativeName: partner.fullName,
            representativeTitle: 'Giám đốc',
            representativeIdNumber: `0791${demo.taxCode.slice(-8)}`,
            contactPhone: partner.phone,
            notificationEmail: partner.email,
          },
          beneficiary: {
            bankName: 'Vietcombank',
            accountNumber: demo.accountNumber,
            accountHolder: demo.legalName.toUpperCase(),
          },
          property: {
            tradeName: demo.name,
            propertyType:
              demo.starRating >= 5
                ? 'Khu nghỉ dưỡng / Khách sạn 5 sao'
                : 'Khách sạn',
            starRating: demo.starRating,
            physicalRooms: demo.totalRooms,
            propertyManager: partner.fullName,
            licensedAddress: `${demo.address}, ${demo.city}`,
          },
          documents: REQUIRED_DOCUMENTS.map((documentType) => ({
            documentType,
            fileId: `stayreco/verification/${partnerId}/seed-${slug(demo.name)}-${documentType.toLowerCase()}.pdf`,
          })),
          commitment: true,
        };
        const approved = demo.verification === 'APPROVED';
        const request = await tx.hotelVerificationRequest.create({
          data: {
            hotelId,
            requestType: 'INITIAL',
            status: approved ? 'APPROVED' : 'PENDING',
            ...(approved && {
              platformManagerId: managerId,
              reviewedAt: new Date(),
            }),
          },
          select: { verificationRequestId: true },
        });
        await tx.hotelProperties.createMany({
          data: toSnapshotRows(wizard, cipher).map((row) => ({
            ...row,
            hotelId,
            verificationRequestId: request.verificationRequestId,
          })),
        });
        await tx.hotelVerificationDocument.createMany({
          data: wizard.documents.map((d) => ({
            verificationRequestId: request.verificationRequestId,
            documentType: d.documentType,
            fileUrl: d.fileId,
          })),
        });
        if (approved) {
          await tx.hotelPartner.update({
            where: { hotelPartnerId: partnerId },
            data: { status: 'APPROVED' },
          });
        }
        return hotelId;
      });
      created++;

      if (partner.staffEmail && demo.verification === 'APPROVED') {
        await ensureAccount(
          prisma,
          partner.staffEmail,
          () => ({
            fullName: `Lễ tân ${demo.city}`,
            role: UserRole.HOTEL_STAFF,
            hotelStaff: {
              create: {
                hotelId,
                position: 'Lễ tân',
                permissions: [
                  StaffPermission.FRONT_DESK,
                  StaffPermission.BOOKING,
                ],
              },
            },
          }),
          passwordHash,
        );
      }
    }
  }

  await seedBookingDemo(prisma, passwordHash);
  await seedDashboardHistory(prisma, passwordHash);

  console.log(
    `Demo: +${created} hotels. Sign in with password "${password}": ${MANAGER_EMAIL}, ` +
      PARTNERS.flatMap((p) => [p.email, p.staffEmail].filter(Boolean)).join(
        ', ',
      ) +
      `, ${DEMO_CUSTOMER.email}`,
  );
}

/** Creates an ACTIVE, verified account unless the email exists; returns its id. */
async function ensureAccount(
  prisma: PrismaClient,
  email: string,
  data: () => Omit<
    Parameters<PrismaClient['userAccount']['create']>[0]['data'],
    'email'
  >,
  passwordHash: string,
): Promise<string> {
  const existing = await prisma.userAccount.findUnique({
    where: { email },
    select: { userAccountId: true },
  });
  if (existing) return existing.userAccountId;
  const account = await prisma.userAccount.create({
    data: {
      ...data(),
      email,
      passwordHash,
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
    },
    select: { userAccountId: true },
  });
  return account.userAccountId;
}

/** Name → id for catalog rows, failing loudly if the catalog seed and the demo data drift apart. */
async function lookup<K extends string>(
  rows: Promise<({ name: string } & Record<K, string>)[]>,
  key: K,
) {
  const byName = new Map((await rows).map((r) => [r.name, r[key]]));
  return (name: string) => {
    const id = byName.get(name);
    if (!id) throw new Error(`Seed catalog has no "${name}"`);
    return id;
  };
}

// ── Booking demo (search, pricing rules, bookings, refunds) ──

const DEMO_CUSTOMER = {
  email: 'customer@stayreco.local',
  fullName: 'Trần Thị Mai',
  phone: '0909123456',
};

/** Cancellation policies that differ from the default (1 day free, then 100%), by hotel name. */
const DEMO_POLICIES: Record<string, CancellationPolicyInput> = {
  'Sơn Trà Bay Resort & Spa': { freeCancellationDays: 3, feePercent: 50 },
  'Hồ Gươm Heritage Hotel': { freeCancellationDays: null, feePercent: 100 },
  'Bạch Đằng Riverside Hotel': { freeCancellationDays: 0, feePercent: 30 },
};

type DemoRule = Omit<
  Prisma.PriceUncheckedCreateInput,
  'roomTypeId' | 'validFrom' | 'validTo'
> & { validFrom?: string; validTo?: string };

/** Pricing rules, by hotel and room type name. Bookings below use other room types, so their prices are the base. */
const demoRules = (today: string): [string, string, DemoRule][] => [
  [
    'Sơn Trà Bay Resort & Spa',
    'Deluxe Ocean View',
    {
      name: 'Cuối tuần thứ Bảy',
      ruleType: 'SEASON',
      adjustmentType: 'PERCENT',
      adjustmentValue: 20,
      validFrom: today,
      validTo: addDays(today, 365),
      dayOfWeek: 'SAT',
      priority: 10,
    },
  ],
  [
    'Sơn Trà Bay Resort & Spa',
    'Premier Bungalow',
    {
      name: 'Đặt sớm 30 ngày',
      ruleType: 'EARLY_BIRD',
      adjustmentType: 'PERCENT',
      adjustmentValue: -10,
      minDaysBefore: 30,
      priority: 5,
    },
  ],
  [
    'Hồ Gươm Heritage Hotel',
    'Superior City View',
    {
      name: 'Phút chót 3 ngày',
      ruleType: 'LAST_MINUTE',
      adjustmentType: 'PERCENT',
      adjustmentValue: -15,
      maxDaysBefore: 3,
      priority: 5,
    },
  ],
  [
    'Ngũ Hành Sơn Garden Retreat',
    'Garden Villa',
    {
      name: 'Tết Đinh Mùi 2027',
      ruleType: 'SEASON',
      adjustmentType: 'SET_PRICE',
      adjustmentValue: 5500000,
      validFrom: '2027-02-03',
      validTo: '2027-02-12',
      priority: 20,
    },
  ],
];

type DemoBooking = {
  hotel: string;
  roomType: string;
  /** Days from today to check-in (negative: a past stay). */
  from: number;
  nights: number;
  /** Days before today the booking was made. */
  bookedDaysAgo: number;
  status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
  /** Cancelled by the customer: the refund was approved, is waiting, or there was nothing to refund. */
  cancel?: 'REFUND_PENDING' | 'REFUNDED' | 'NO_REFUND';
};

/** One booking per state the FE shows (confirmed, refund pending, refunded, cancelled, expired, completed). */
const DEMO_BOOKINGS: DemoBooking[] = [
  {
    hotel: 'Bạch Đằng Riverside Hotel',
    roomType: 'Deluxe River View',
    from: 20,
    nights: 2,
    bookedDaysAgo: 2,
    status: 'CONFIRMED',
  },
  {
    hotel: 'Hàn River Loft Suites',
    roomType: 'Studio River Loft',
    from: 25,
    nights: 2,
    bookedDaysAgo: 3,
    status: 'CONFIRMED',
    cancel: 'REFUND_PENDING',
  },
  {
    hotel: 'Ngũ Hành Sơn Garden Retreat',
    roomType: 'Family Garden Suite',
    from: 40,
    nights: 1,
    bookedDaysAgo: 5,
    status: 'CANCELLED',
    cancel: 'REFUNDED',
  },
  {
    hotel: 'Hồ Gươm Heritage Hotel',
    roomType: 'Deluxe Lake View',
    from: 10,
    nights: 2,
    bookedDaysAgo: 4,
    status: 'CANCELLED',
    cancel: 'NO_REFUND',
  },
  {
    hotel: 'Bạch Đằng Riverside Hotel',
    roomType: 'Executive City Suite',
    from: 15,
    nights: 1,
    bookedDaysAgo: 1,
    status: 'EXPIRED',
  },
  {
    hotel: 'Bạch Đằng Riverside Hotel',
    roomType: 'Deluxe River View',
    from: -10,
    nights: 2,
    bookedDaysAgo: 20,
    status: 'COMPLETED',
  },
];

const DAY_MS = 86_400_000;

/**
 * Pricing rules, cancellation policies and a demo customer with one booking per state, written the way the API
 * writes them: invoice statuses, BOOKED nights, hotel and customer wallet rows, and the cancel / refund history in
 * audit_log. Rules and policies are added when missing; the bookings only when the demo customer has none yet.
 */
async function seedBookingDemo(prisma: PrismaClient, passwordHash: string) {
  const today = todayInVietnam();
  const roomType = async (hotelName: string, roomTypeName: string) => {
    const rt = await prisma.roomType.findFirst({
      where: { name: roomTypeName, hotel: { name: hotelName } },
      select: {
        roomTypeId: true,
        hotelId: true,
        prices: { where: basePriceWhere, select: { pricePerNight: true } },
        rooms: { select: { roomId: true }, orderBy: { roomNumber: 'asc' } },
        hotel: {
          select: {
            checkInTime: true,
            hotelPartnerId: true,
            hotelPartner: { select: { commissionRate: true } },
            hotelProperties: cancellationRowsSelect,
          },
        },
      },
    });
    if (!rt) {
      throw new Error(
        `Demo room type "${roomTypeName}" of "${hotelName}" is missing`,
      );
    }
    return rt;
  };

  // Cancellation policies, when the hotel has none yet.
  for (const [hotelName, policy] of Object.entries(DEMO_POLICIES)) {
    const hotel = await prisma.hotel.findFirst({
      where: { name: hotelName },
      select: { hotelId: true, hotelProperties: cancellationRowsSelect },
    });
    if (!hotel || hotel.hotelProperties.length) continue;
    await prisma.hotelProperties.createMany({
      data: toCancellationRows(policy).map((row) => ({
        ...row,
        hotelId: hotel.hotelId,
      })),
    });
  }

  // Pricing rules, when the room type has none with that name.
  let rules = 0;
  for (const [hotelName, roomTypeName, rule] of demoRules(today)) {
    const rt = await roomType(hotelName, roomTypeName);
    const exists = await prisma.price.count({
      where: { roomTypeId: rt.roomTypeId, name: rule.name },
    });
    if (exists) continue;
    const { validFrom, validTo, ...fields } = rule;
    await prisma.price.create({
      data: {
        ...fields,
        roomTypeId: rt.roomTypeId,
        validFrom: validFrom ? fromCalendarDate(validFrom) : null,
        validTo: validTo ? fromCalendarDate(validTo) : null,
      },
    });
    rules++;
  }

  // The demo customer and the bookings.
  const customerId = await ensureAccount(
    prisma,
    DEMO_CUSTOMER.email,
    () => ({
      fullName: DEMO_CUSTOMER.fullName,
      phone: DEMO_CUSTOMER.phone,
      role: UserRole.CUSTOMER,
      customer: { create: {} },
    }),
    passwordHash,
  );
  const hasBookings = await prisma.booking.count({ where: { customerId } });
  const ledger = new WalletLedger();
  let bookings = 0;

  for (const demo of hasBookings ? [] : DEMO_BOOKINGS) {
    const rt = await roomType(demo.hotel, demo.roomType);
    const base = rt.prices[0].pricePerNight!;
    const checkIn = addDays(today, demo.from);
    const checkOut = addDays(checkIn, demo.nights);
    const bookedAt = new Date(Date.now() - demo.bookedDaysAgo * DAY_MS);
    const nights = Array.from({ length: demo.nights }, (_, i) =>
      addDays(checkIn, i),
    );
    const total = base.times(demo.nights);
    const policy = cancellationPolicyOf(rt.hotel.hotelProperties);
    const paid = demo.status !== 'EXPIRED';
    const cancelledAt =
      demo.status === 'CANCELLED'
        ? new Date(bookedAt.getTime() + DAY_MS)
        : null;

    await prisma.$transaction(async (tx) => {
      let code = newBookingCode(bookedAt);
      while (await tx.invoice.count({ where: { invoiceNumber: code } })) {
        code = newBookingCode(bookedAt);
      }
      const { bookingId } = await tx.booking.create({
        data: {
          customerId,
          roomTypeId: rt.roomTypeId,
          checkInDate: fromCalendarDate(checkIn),
          checkOutDate: fromCalendarDate(checkOut),
          numGuests: 2,
          numRooms: 1,
          nightlyPrices: nights.map((date) => ({
            date,
            price: base.toNumber(),
          })),
          totalAmount: total,
          status: demo.status,
          guestName: DEMO_CUSTOMER.fullName,
          contactPhone: DEMO_CUSTOMER.phone,
          arrivalTime: new Date('1970-01-01T15:00:00.000Z'),
          specialRequests: 'Phòng tầng cao nếu còn',
          freeCancelUntil: freeCancellationUntil(
            policy,
            checkIn,
            fromTime(rt.hotel.checkInTime),
            bookedAt,
          ),
          cancelFeePercent: policy.feePercent,
          commissionRate: rt.hotel.hotelPartner.commissionRate,
          cancelledAt,
          createdAt: bookedAt,
          // The timeline shows an expired hold at updatedAt: the end of the hold, not the day of the seed.
          updatedAt:
            cancelledAt ??
            new Date(bookedAt.getTime() + BOOKING_LIMITS.holdMinutes * 60_000),
        },
        select: { bookingId: true },
      });
      await tx.invoice.create({
        data: {
          bookingId,
          invoiceNumber: code,
          subtotal: total,
          taxAmount: 0,
          discountAmount: 0,
          totalAmount: total,
          paymentMethod: 'SEPAY',
          paymentStatus: !paid
            ? 'FAILED'
            : demo.cancel === 'REFUND_PENDING'
              ? 'REFUND_PENDING'
              : demo.cancel === 'REFUNDED'
                ? 'REFUNDED'
                : 'PAID',
          paidAt: paid ? new Date(bookedAt.getTime() + 5 * 60_000) : null,
          vnpayTxnRef: paid ? `seed-${code}` : null,
          createdAt: bookedAt,
        },
      });
      // Nights stay booked while the booking holds its rooms (also while a refund waits).
      if (demo.status === 'CONFIRMED' || demo.status === 'COMPLETED') {
        await tx.roomCalendars.createMany({
          data: nights.map((date) => ({
            roomId: rt.rooms[0].roomId,
            date: fromCalendarDate(date),
            bookingId,
            status: 'BOOKED' as const,
            priceOverride: base,
          })),
        });
      }
      if (!paid) return;

      const hotelWallet = await ledger.hotelWallet(tx, rt.hotelId);
      await ledger.post(tx, {
        walletId: hotelWallet.walletId,
        type: 'BOOKING_PAYMENT',
        amount: total,
        balance: 'pending',
        idempotencyKey: `sepay:seed-${code}`,
        bookingId,
        description: `Payment of ${code}`,
      });
      if (!demo.cancel) return;

      const refund =
        demo.cancel === 'NO_REFUND' ? new Prisma.Decimal(0) : total;
      await recordBookingEvent(tx, {
        action: AuditAction.BOOKING_CANCEL_REQUESTED,
        bookingId,
        actor: { role: 'CUSTOMER', accountId: customerId },
        at: new Date(bookedAt.getTime() + DAY_MS),
        value: {
          reason: 'Thay đổi lịch trình',
          paid: total.toNumber(),
          fee: total.minus(refund).toNumber(),
          refund: refund.toNumber(),
        },
      });
      if (demo.cancel !== 'REFUNDED') return;

      const customerWallet = await ledger.customerWallet(tx, customerId);
      await ledger.post(tx, {
        walletId: hotelWallet.walletId,
        type: 'REFUND',
        amount: refund.negated(),
        balance: 'pending',
        idempotencyKey: `refund:${bookingId}:hotel`,
        bookingId,
        description: `Refund of ${code}`,
      });
      await ledger.post(tx, {
        walletId: customerWallet.walletId,
        type: 'REFUND',
        amount: refund,
        balance: 'available',
        idempotencyKey: `refund:${bookingId}:customer`,
        bookingId,
        description: `Refund of ${code}`,
      });
      await recordBookingEvent(tx, {
        action: AuditAction.REFUND_APPROVED,
        bookingId,
        actor: { role: 'HOTEL_PARTNER', accountId: rt.hotel.hotelPartnerId },
        at: cancelledAt!,
        value: { refund: refund.toNumber() },
      });
    });
    bookings++;
  }

  console.log(
    `Booking demo: +${rules} pricing rules, +${bookings} bookings for ${DEMO_CUSTOMER.email}`,
  );
}

// ── Dashboard history: a few months of bookings for the partner dashboard ──

/** Hotels that get a booking history. */
const HISTORY_HOTELS = [
  'Bạch Đằng Riverside Hotel',
  'Sơn Trà Bay Resort & Spa',
  'Hồ Gươm Heritage Hotel',
];
/** Check-ins from this many days ago to this many days ahead. */
const HISTORY_PAST_DAYS = 150;
const HISTORY_AHEAD_DAYS = 45;
/** The demo hotels' rooms exist from this many days ago, before the oldest history booking. */
const ROOMS_SINCE_DAYS = 180;
/** Share of past stays whose guest never arrived. */
const NO_SHOW_SHARE = 0.03;

/** Guests of the history bookings, apart from customer@stayreco.local so its trips stay readable. */
const HISTORY_GUESTS: [email: string, fullName: string, phone: string][] = [
  ['khach.an@stayreco.local', 'Nguyễn Văn An', '0901000001'],
  ['khach.binh@stayreco.local', 'Lê Thị Bình', '0901000002'],
  ['khach.cuong@stayreco.local', 'Phạm Quốc Cường', '0901000003'],
  ['khach.dung@stayreco.local', 'Hoàng Mỹ Dung', '0901000004'],
  ['khach.hai@stayreco.local', 'Võ Thanh Hải', '0901000005'],
  ['khach.lan@stayreco.local', 'Đặng Ngọc Lan', '0901000006'],
];

const HOUR_MS = 3_600_000;

/** Small seeded generator (mulberry32): every machine seeds the same history for the same day. */
function randomOf(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let x = Math.imul(s ^ (s >>> 15), 1 | s);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4_294_967_296;
  };
}

/** Chance that a free room starts a stay on `date`: weekends and summer are busier, the future is not booked yet. */
function demandOf(date: string, today: string) {
  const weekday = fromCalendarDate(date).getUTCDay();
  const month = fromCalendarDate(date).getUTCMonth() + 1;
  let chance = 0.2;
  if (weekday === 5 || weekday === 6) chance += 0.12;
  if (month >= 6 && month <= 8) chance += 0.06;
  if (date > today) {
    chance *= Math.max(
      0.15,
      1 - (daysBetween(today, date) / HISTORY_AHEAD_DAYS) * 0.85,
    );
  }
  return chance;
}

const nightsOf = (r: number) => (r < 0.3 ? 1 : r < 0.65 ? 2 : r < 0.85 ? 3 : 4);

type Guest = { id: string; fullName: string; phone: string };

/**
 * Past and coming bookings for the dashboard charts and KPIs, written the way the API writes them (invoice, BOOKED
 * nights, wallet rows, cancel / refund history) and spread over HISTORY_GUESTS. Added only while those guests have no
 * booking. Every run also dates the demo rooms before the history and the demo ledger rows at their payment or refund.
 */
async function seedDashboardHistory(
  prisma: PrismaClient,
  passwordHash: string,
) {
  const today = todayInVietnam();
  const now = new Date();
  const hotelNames = PARTNERS.flatMap((p) => p.hotels.map((h) => h.name));

  // Rooms exist before the oldest history booking, so past days have rooms to sell. Raw SQL, because Prisma would
  // also bump `updated_at`, which the "rooms locked for long" action item falls back on.
  const roomsSince = vietnamDateTime(
    addDays(today, -ROOMS_SINCE_DAYS),
    '00:00',
  );
  await prisma.$executeRaw`
    UPDATE room r SET created_at = ${roomsSince}
    FROM room_type rt JOIN hotel h ON h.hotel_id = rt.hotel_id
    WHERE rt.room_type_id = r.room_type_id
      AND h.name = ANY(${hotelNames}) AND r.created_at > ${roomsSince}`;

  const guests: Guest[] = [];
  for (const [email, fullName, phone] of HISTORY_GUESTS) {
    const id = await ensureAccount(
      prisma,
      email,
      () => ({
        fullName,
        phone,
        role: UserRole.CUSTOMER,
        customer: { create: {} },
      }),
      passwordHash,
    );
    guests.push({ id, fullName, phone });
  }
  const hasHistory = await prisma.booking.count({
    where: { customerId: { in: guests.map((g) => g.id) } },
  });
  const created = hasHistory
    ? 0
    : await createHistory(prisma, guests, today, now);

  const customerEmails = [
    DEMO_CUSTOMER.email,
    ...HISTORY_GUESTS.map(([email]) => email),
  ];
  const operations = await runDemoOperations(
    prisma,
    hotelNames,
    customerEmails,
    now,
  );
  await alignDemoLedger(prisma, hotelNames, customerEmails);
  console.log(
    `Dashboard history: +${created} bookings in ${HISTORY_HOTELS.length} hotels, check-ins ${addDays(today, -HISTORY_PAST_DAYS)} to ${addDays(today, HISTORY_AHEAD_DAYS)}`,
  );
  console.log(
    `Hotel operations: ${operations.checkedIn} checked in, ${operations.closed} checked out or no-show, ` +
      `${operations.commissions} commissions, ${operations.settlements} settlements`,
  );
}

async function createHistory(
  prisma: PrismaClient,
  guests: Guest[],
  today: string,
  now: Date,
): Promise<number> {
  const random = randomOf(20261028);
  // Its own sequence, so adding no-shows did not change the rest of the history.
  const noShows = randomOf(20261030);
  const from = addDays(today, -HISTORY_PAST_DAYS);
  const to = addDays(today, HISTORY_AHEAD_DAYS);
  const ledger = new WalletLedger();
  const codes = new Set(
    (await prisma.invoice.findMany({ select: { invoiceNumber: true } })).map(
      (i) => i.invoiceNumber,
    ),
  );
  const customerWallets = new Map<string, string>();
  for (const g of guests) {
    const wallet = await prisma.$transaction((tx) =>
      ledger.customerWallet(tx, g.id),
    );
    customerWallets.set(g.id, wallet.walletId);
  }

  const bookings: Prisma.BookingCreateManyInput[] = [];
  const invoices: Prisma.InvoiceCreateManyInput[] = [];
  const nights: Prisma.RoomCalendarsCreateManyInput[] = [];
  const entries: Prisma.WalletTransactionCreateManyInput[] = [];
  const events: Prisma.AuditLogCreateManyInput[] = [];
  let guestIndex = 0;

  for (const hotelName of HISTORY_HOTELS) {
    const roomTypes = await prisma.roomType.findMany({
      where: { hotel: { name: hotelName } },
      orderBy: { createdAt: 'asc' },
      select: {
        roomTypeId: true,
        maxOccupancy: true,
        prices: { where: basePriceWhere, select: { pricePerNight: true } },
        rooms: {
          where: { status: { not: 'MAINTENANCE' } },
          orderBy: { roomNumber: 'asc' },
          select: { roomId: true },
        },
        hotel: {
          select: {
            hotelId: true,
            hotelPartnerId: true,
            checkInTime: true,
            hotelPartner: { select: { commissionRate: true } },
            hotelProperties: cancellationRowsSelect,
          },
        },
      },
    });
    if (!roomTypes.length) continue;
    const hotel = roomTypes[0].hotel;
    const policy = cancellationPolicyOf(hotel.hotelProperties);
    const checkInTime = fromTime(hotel.checkInTime);
    const hotelWallet = (
      await prisma.$transaction((tx) => ledger.hotelWallet(tx, hotel.hotelId))
    ).walletId;

    // Nights already taken (the other demo bookings, closures) stay taken.
    const roomIds = roomTypes.flatMap((rt) => rt.rooms.map((r) => r.roomId));
    const taken = new Set(
      (
        await prisma.roomCalendars.findMany({
          where: {
            roomId: { in: roomIds },
            date: {
              gte: fromCalendarDate(from),
              lte: fromCalendarDate(addDays(to, 4)),
            },
          },
          select: { roomId: true, date: true },
        })
      ).map((c) => `${c.roomId}|${toCalendarDate(c.date)}`),
    );
    const isFree = (roomId: string, checkIn: string, count: number) =>
      Array.from({ length: count }, (_, i) => addDays(checkIn, i)).every(
        (d) => !taken.has(`${roomId}|${d}`),
      );

    for (let date = from; date <= to; date = addDays(date, 1)) {
      const chance = demandOf(date, today);
      for (const rt of roomTypes) {
        const base = rt.prices[0]?.pricePerNight;
        if (!base) continue;
        for (const room of rt.rooms) {
          if (random() >= chance) continue;
          const count = nightsOf(random());
          if (!isFree(room.roomId, date, count)) continue;
          const held = [room.roomId];
          if (random() < 0.12) {
            const other = rt.rooms.find(
              (r) => r.roomId !== room.roomId && isFree(r.roomId, date, count),
            );
            if (other) held.push(other.roomId);
          }

          const checkIn = date;
          const checkOut = addDays(checkIn, count);
          const guest = guests[guestIndex++ % guests.length];
          const lead = Math.floor(random() ** 2 * 40);
          let createdAt = new Date(
            vietnamDateTime(addDays(checkIn, -lead), '09:00').getTime() +
              Math.floor(random() * 12 * HOUR_MS),
          );
          // Coming stays whose booking day is still ahead were booked in the last two days.
          if (createdAt > now) {
            createdAt = new Date(
              now.getTime() - Math.floor((1 + random() * 47) * HOUR_MS),
            );
          }
          const paidAt = new Date(createdAt.getTime() + 5 * 60_000);
          const total = base.times(count * held.length);
          const freeCancelUntil = freeCancellationUntil(
            policy,
            checkIn,
            checkInTime,
            createdAt,
          );
          let code = newBookingCode(createdAt);
          while (codes.has(code)) code = newBookingCode(createdAt);
          codes.add(code);
          const bookingId = randomUUID();

          // Cancelled before the check-in time, never after it (BR-09).
          const checkInAt = vietnamDateTime(
            checkIn,
            checkInTime ?? DEFAULT_CHECK_IN_TIME,
          );
          const cancelBefore = Math.min(now.getTime(), checkInAt.getTime());
          // Stays that ended before today are completed, a few never arrived; guests in house and today's departures
          // are checked in by runDemoOperations, from the confirmed bookings.
          const past = checkOut < today;
          const cancelled =
            random() < (past ? 0.07 : 0.06) &&
            cancelBefore - paidAt.getTime() > HOUR_MS;

          let status: 'COMPLETED' | 'NO_SHOW' | 'CONFIRMED' | 'CANCELLED' = past
            ? noShows() < NO_SHOW_SHARE
              ? 'NO_SHOW'
              : 'COMPLETED'
            : 'CONFIRMED';
          let paymentStatus: 'PAID' | 'REFUNDED' | 'PARTIALLY_REFUNDED' =
            'PAID';
          let cancelledAt: Date | null = null;

          if (cancelled) {
            const requestAt = new Date(
              paidAt.getTime() +
                Math.floor(
                  random() * (cancelBefore - paidAt.getTime() - HOUR_MS),
                ),
            );
            const { fee, refund } = cancellationAmounts(
              {
                freeCancelUntil,
                cancelFeePercent: new Prisma.Decimal(policy.feePercent),
              },
              total,
              requestAt,
            );
            status = 'CANCELLED';
            events.push({
              action: AuditAction.BOOKING_CANCEL_REQUESTED,
              customerId: guest.id,
              entityType: 'booking',
              entityId: bookingId,
              newValue: JSON.stringify({
                reason: 'Thay đổi lịch trình',
                paid: total.toNumber(),
                fee: fee.toNumber(),
                refund: refund.toNumber(),
              }),
              createdAt: requestAt,
            });
            if (refund.isZero()) {
              cancelledAt = requestAt;
            } else {
              // The partner approved within a few hours.
              cancelledAt = new Date(
                Math.min(requestAt.getTime() + 6 * HOUR_MS, now.getTime()),
              );
              paymentStatus = fee.isZero() ? 'REFUNDED' : 'PARTIALLY_REFUNDED';
              entries.push(
                {
                  walletId: hotelWallet,
                  bookingId,
                  type: 'REFUND',
                  amount: refund.negated(),
                  balanceAfter: 0,
                  idempotencyKey: `refund:${bookingId}:hotel`,
                  description: `Refund of ${code}`,
                  createdAt: cancelledAt,
                },
                {
                  walletId: customerWallets.get(guest.id)!,
                  bookingId,
                  type: 'REFUND',
                  amount: refund,
                  balanceAfter: 0,
                  idempotencyKey: `refund:${bookingId}:customer`,
                  description: `Refund of ${code}`,
                  createdAt: cancelledAt,
                },
              );
              events.push({
                action: AuditAction.REFUND_APPROVED,
                hotelPartnerId: hotel.hotelPartnerId,
                entityType: 'booking',
                entityId: bookingId,
                newValue: JSON.stringify({ refund: refund.toNumber() }),
                createdAt: cancelledAt,
              });
            }
          } else {
            for (const roomId of held) {
              for (let i = 0; i < count; i++) {
                const night = addDays(checkIn, i);
                taken.add(`${roomId}|${night}`);
                nights.push({
                  roomId,
                  date: fromCalendarDate(night),
                  bookingId,
                  status: 'BOOKED',
                  priceOverride: base,
                });
              }
            }
          }

          bookings.push({
            bookingId,
            customerId: guest.id,
            roomTypeId: rt.roomTypeId,
            checkInDate: fromCalendarDate(checkIn),
            checkOutDate: fromCalendarDate(checkOut),
            numGuests: Math.min(2, rt.maxOccupancy) * held.length,
            numRooms: held.length,
            nightlyPrices: Array.from({ length: count }, (_, i) => ({
              date: addDays(checkIn, i),
              price: base.toNumber(),
            })),
            totalAmount: total,
            status,
            guestName: guest.fullName,
            contactPhone: guest.phone,
            freeCancelUntil,
            cancelFeePercent: policy.feePercent,
            commissionRate: hotel.hotelPartner.commissionRate,
            cancelledAt,
            createdAt,
            updatedAt: cancelledAt ?? paidAt,
          });
          invoices.push({
            bookingId,
            invoiceNumber: code,
            subtotal: total,
            taxAmount: 0,
            discountAmount: 0,
            totalAmount: total,
            paymentMethod: 'SEPAY',
            paymentStatus,
            paidAt,
            vnpayTxnRef: `seed-${code}`,
            createdAt,
          });
          entries.push({
            walletId: hotelWallet,
            bookingId,
            type: 'BOOKING_PAYMENT',
            amount: total,
            balanceAfter: 0,
            idempotencyKey: `sepay:seed-${code}`,
            description: `Payment of ${code}`,
            createdAt: paidAt,
          });
        }
      }
    }
  }

  // One transaction: a failed run leaves no half history behind.
  await prisma.$transaction(
    async (tx) => {
      const chunks = <T>(rows: T[]) =>
        Array.from({ length: Math.ceil(rows.length / 1000) }, (_, i) =>
          rows.slice(i * 1000, (i + 1) * 1000),
        );
      for (const data of chunks(bookings))
        await tx.booking.createMany({ data });
      for (const data of chunks(invoices))
        await tx.invoice.createMany({ data });
      for (const data of chunks(nights))
        await tx.roomCalendars.createMany({ data });
      for (const data of chunks(entries)) {
        await tx.walletTransaction.createMany({ data });
      }
      for (const data of chunks(events)) await tx.auditLog.createMany({ data });
    },
    { timeout: 120_000 },
  );
  return bookings.length;
}

/**
 * The ledger rows of the demo bookings are dated at the payment or the refund approval (the ledger stamps them with
 * the seed time), then the running `balance_after` and the balances of the demo wallets and of the platform wallet are
 * recomputed from their rows (money-rules §5): a hotel wallet's rows move its pending balance, except the available
 * leg of a settlement; customer and platform wallets only have an available balance. Wallets with payouts, top-ups
 * or adjustments are left alone.
 */
async function alignDemoLedger(
  prisma: PrismaClient,
  hotelNames: string[],
  customerEmails: string[],
) {
  await prisma.$executeRaw`
    UPDATE wallet_transaction wt SET created_at = i.paid_at
    FROM invoice i
    WHERE wt.idempotency_key = 'sepay:seed-' || i.invoice_number
      AND i.paid_at IS NOT NULL AND wt.created_at <> i.paid_at`;
  await prisma.$executeRaw`
    UPDATE wallet_transaction wt SET created_at = b.cancelled_at
    FROM booking b JOIN user_account u ON u.user_account_id = b.customer_id
    WHERE u.email = ANY(${customerEmails})
      AND wt.idempotency_key IN ('refund:' || b.booking_id || ':hotel', 'refund:' || b.booking_id || ':customer')
      AND b.cancelled_at IS NOT NULL AND wt.created_at <> b.cancelled_at`;

  const wallets = await prisma.$queryRaw<{ wallet_id: string }[]>`
    SELECT w.wallet_id FROM wallet w
    LEFT JOIN hotel h ON h.hotel_id = w.hotel_id
    LEFT JOIN user_account u ON u.user_account_id = w.customer_id
    WHERE (h.name = ANY(${hotelNames}) OR u.email = ANY(${customerEmails}) OR w.wallet_id = ${PLATFORM_WALLET_ID}::uuid)
      AND NOT EXISTS (
        SELECT 1 FROM wallet_transaction x
        WHERE x.wallet_id = w.wallet_id AND x.type IN ('PAYOUT', 'TOPUP', 'ADJUSTMENT')
      )`;
  const ids = wallets.map((w) => w.wallet_id);
  if (!ids.length) return;
  await prisma.$executeRaw`
    UPDATE wallet_transaction wt SET balance_after = s.running
    FROM (
      SELECT wallet_transaction_id,
        sum(amount) OVER (PARTITION BY wallet_id ORDER BY created_at, wallet_transaction_id) AS running
      FROM wallet_transaction WHERE wallet_id = ANY(${ids}::uuid[])
    ) s
    WHERE wt.wallet_transaction_id = s.wallet_transaction_id`;
  await prisma.$executeRaw`
    UPDATE wallet w SET balance_pending = t.pending, balance_available = t.available
    FROM (
      SELECT x.wallet_id,
        coalesce(sum(x.amount) FILTER (WHERE x.pending), 0) AS pending,
        coalesce(sum(x.amount) FILTER (WHERE NOT x.pending), 0) AS available
      FROM (
        SELECT wt.wallet_id, wt.amount,
          ow.owner_type = 'HOTEL'
            AND NOT (wt.type = 'SETTLEMENT' AND wt.idempotency_key LIKE '%:available') AS pending
        FROM wallet_transaction wt JOIN wallet ow ON ow.wallet_id = wt.wallet_id
      ) x
      GROUP BY x.wallet_id
    ) t
    WHERE t.wallet_id = w.wallet_id AND w.wallet_id = ANY(${ids}::uuid[])`;
}

const operationsSelect = {
  bookingId: true,
  status: true,
  checkInDate: true,
  checkOutDate: true,
  arrivalTime: true,
  totalAmount: true,
  commissionRate: true,
  cancelledAt: true,
  invoice: {
    select: { invoiceNumber: true, paymentStatus: true, paidAt: true },
  },
  roomType: {
    select: {
      hotel: {
        select: {
          hotelPartnerId: true,
          checkInTime: true,
          checkOutTime: true,
        },
      },
    },
  },
  roomCalendars: {
    select: { room: { select: { roomId: true, roomNumber: true } } },
  },
  walletTransactions: {
    select: { walletId: true, type: true, amount: true, createdAt: true },
  },
} satisfies Prisma.BookingSelect;

/**
 * What the front desk and the jobs would have done to the demo bookings by now (hotel operations): confirmed stays
 * that have started are checked in (rooms OCCUPIED), finished ones checked out (a few never arrived), each with its
 * history, commission and, after the holding period, settlement; cancelled bookings that left the hotel a fee are
 * settled too. Runs on every seed, so a database seeded earlier and the days passed since are brought up to date;
 * each step only touches the bookings that still need it, and only bookings of the demo customers.
 */
async function runDemoOperations(
  prisma: PrismaClient,
  hotelNames: string[],
  customerEmails: string[],
  now: Date,
) {
  const today = todayInVietnam(now);
  const holdMs = Number(process.env.WALLET_HOLD_DAYS || 1) * DAY_MS;
  const rows = await prisma.booking.findMany({
    where: {
      roomType: { hotel: { name: { in: hotelNames } } },
      customer: { userAccount: { email: { in: customerEmails } } },
      status: {
        in: ['CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'NO_SHOW', 'CANCELLED'],
      },
    },
    select: operationsSelect,
  });
  const recorded = await prisma.auditLog.findMany({
    where: {
      entityType: 'booking',
      entityId: { in: rows.map((b) => b.bookingId) },
      action: {
        in: [
          AuditAction.BOOKING_CHECKED_IN,
          AuditAction.BOOKING_CHECKED_OUT,
          AuditAction.BOOKING_NO_SHOW,
        ],
      },
    },
    select: { entityId: true, action: true },
  });
  const has = new Set(recorded.map((r) => `${r.entityId}|${r.action}`));

  const statuses = new Map<
    string,
    { from: BookingStatus; to: 'CHECKED_IN' | 'COMPLETED' | 'NO_SHOW' }
  >();
  const events: Prisma.AuditLogCreateManyInput[] = [];
  const entries: Prisma.WalletTransactionCreateManyInput[] = [];
  const counts = { checkedIn: 0, closed: 0, commissions: 0, settlements: 0 };

  for (const b of rows) {
    const checkIn = toCalendarDate(b.checkInDate);
    const checkOut = toCalendarDate(b.checkOutDate);
    const hotel = b.roomType.hotel;
    const paid = b.invoice?.paymentStatus === 'PAID';
    let status = b.status;

    // A confirmed stay that has started: checked in, or over (a few never arrived; the job marks no-shows).
    if (status === 'CONFIRMED' && paid && checkIn < today) {
      status =
        checkOut >= today
          ? 'CHECKED_IN'
          : parseInt(b.bookingId.slice(0, 8), 16) % 100 < NO_SHOW_SHARE * 100
            ? 'NO_SHOW'
            : 'COMPLETED';
    }
    if (status === 'CHECKED_IN' && checkOut < today) status = 'COMPLETED';
    if (status !== b.status) {
      statuses.set(b.bookingId, {
        from: b.status,
        to: status as 'CHECKED_IN' | 'COMPLETED' | 'NO_SHOW',
      });
    }

    const actor = { hotelPartnerId: hotel.hotelPartnerId };
    const event = (
      action: AuditAction,
      at: Date,
      value: Record<string, unknown>,
      by: object = actor,
    ) => {
      if (has.has(`${b.bookingId}|${action}`)) return;
      events.push({
        action,
        ...by,
        entityType: 'booking',
        entityId: b.bookingId,
        newValue: JSON.stringify(value),
        createdAt: at,
      });
    };

    // Check-in at the arrival time (or the hotel's check-in time), never before the payment.
    if (status === 'CHECKED_IN' || status === 'COMPLETED') {
      const rooms = [
        ...new Map(
          b.roomCalendars.map((c) => [
            c.room.roomId,
            { id: c.room.roomId, roomNumber: c.room.roomNumber },
          ]),
        ).values(),
      ].sort((x, y) => byRoomNumber(x.roomNumber, y.roomNumber));
      const arrival = vietnamDateTime(
        checkIn,
        fromTime(b.arrivalTime) ??
          fromTime(hotel.checkInTime) ??
          DEFAULT_CHECK_IN_TIME,
      );
      const afterPayment = (b.invoice?.paidAt?.getTime() ?? 0) + HOUR_MS / 2;
      if (!has.has(`${b.bookingId}|${AuditAction.BOOKING_CHECKED_IN}`)) {
        counts.checkedIn++;
      }
      event(
        AuditAction.BOOKING_CHECKED_IN,
        new Date(Math.max(arrival.getTime(), afterPayment)),
        { rooms },
      );
    }

    // Check-out at 11:00, a no-show at the check-out time; both charge the commission then.
    const closedAt =
      status === 'COMPLETED'
        ? vietnamDateTime(checkOut, '11:00')
        : status === 'NO_SHOW'
          ? vietnamDateTime(
              checkOut,
              fromTime(hotel.checkOutTime) ?? DEFAULT_CHECK_OUT_TIME,
            )
          : null;
    const payment = b.walletTransactions.find(
      (t) => t.type === 'BOOKING_PAYMENT',
    );
    let commissionAt = b.walletTransactions.find(
      (t) => t.type === 'COMMISSION',
    )?.createdAt;
    if (closedAt && payment) {
      const commission = commissionOf(b.totalAmount, b.commissionRate);
      const action =
        status === 'COMPLETED'
          ? AuditAction.BOOKING_CHECKED_OUT
          : AuditAction.BOOKING_NO_SHOW;
      if (!has.has(`${b.bookingId}|${action}`)) counts.closed++;
      event(
        action,
        closedAt,
        { commission: commission.toNumber(), releasedNights: [] },
        status === 'COMPLETED' ? actor : {},
      );
      if (!commissionAt) {
        const code = b.invoice!.invoiceNumber;
        entries.push(
          {
            walletId: payment.walletId,
            bookingId: b.bookingId,
            type: 'COMMISSION',
            amount: commission.negated(),
            balanceAfter: 0,
            idempotencyKey: `commission:${b.bookingId}:hotel`,
            description: `Commission on ${code}`,
            createdAt: closedAt,
          },
          {
            walletId: PLATFORM_WALLET_ID,
            bookingId: b.bookingId,
            type: 'COMMISSION',
            amount: commission,
            balanceAfter: 0,
            idempotencyKey: `commission:${b.bookingId}:platform`,
            description: `Commission on ${code}`,
            createdAt: closedAt,
          },
        );
        commissionAt = closedAt;
        counts.commissions++;
      }
    }

    // Settlement after the holding period: from the commission, or from a cancellation that left the hotel money.
    const settledFrom =
      status === 'CANCELLED'
        ? b.invoice?.paymentStatus === 'PAID' ||
          b.invoice?.paymentStatus === 'PARTIALLY_REFUNDED'
          ? b.cancelledAt
          : null
        : commissionAt;
    const settleAt = settledFrom && new Date(settledFrom.getTime() + holdMs);
    const settled = b.walletTransactions.some((t) => t.type === 'SETTLEMENT');
    if (payment && settleAt && settleAt <= now && !settled) {
      // What the booking left in the hotel wallet: payment, refunds, and the commission written above if any.
      const hotelRows = [
        ...b.walletTransactions,
        ...entries.filter((e) => e.bookingId === b.bookingId),
      ].filter((t) => t.walletId === payment.walletId);
      const net = hotelRows.reduce(
        (sum, t) => sum.plus(t.amount as Prisma.Decimal),
        new Prisma.Decimal(0),
      );
      if (net.gt(0)) {
        const description = `Settlement of ${b.invoice!.invoiceNumber}`;
        entries.push(
          {
            walletId: payment.walletId,
            bookingId: b.bookingId,
            type: 'SETTLEMENT',
            amount: net.negated(),
            balanceAfter: 0,
            idempotencyKey: `settlement:${b.bookingId}:pending`,
            description,
            createdAt: settleAt,
          },
          {
            walletId: payment.walletId,
            bookingId: b.bookingId,
            type: 'SETTLEMENT',
            amount: net,
            balanceAfter: 0,
            idempotencyKey: `settlement:${b.bookingId}:available`,
            description,
            createdAt: settleAt,
          },
        );
        counts.settlements++;
      }
    }
  }

  await prisma.$transaction(
    async (tx) => {
      // Only from the status read above: a booking the running server changed meanwhile (the no-show job, the front
      // desk) keeps the server's status, and gets none of the rows written for it here.
      const changed = new Set<string>();
      const moves = new Map<string, string[]>();
      for (const [id, { from, to }] of statuses) {
        moves.set(`${from}>${to}`, [...(moves.get(`${from}>${to}`) ?? []), id]);
      }
      for (const [move, ids] of moves) {
        const [from, to] = move.split('>') as [BookingStatus, BookingStatus];
        const updated = await tx.booking.updateManyAndReturn({
          where: { bookingId: { in: ids }, status: from },
          data: { status: to },
          select: { bookingId: true },
        });
        for (const u of updated) changed.add(u.bookingId);
      }
      const skipped = (row: {
        entityId?: string | null;
        bookingId?: string | null;
      }) => {
        const id = row.entityId ?? row.bookingId;
        return !!id && statuses.has(id) && !changed.has(id);
      };
      const newEvents = events.filter((e) => !skipped(e));
      const newEntries = entries.filter((e) => !skipped(e));
      if (newEvents.length) await tx.auditLog.createMany({ data: newEvents });
      // The server's jobs may have written the same commission or settlement meanwhile: same key, same amount.
      if (newEntries.length) {
        await tx.walletTransaction.createMany({
          data: newEntries,
          skipDuplicates: true,
        });
      }
      // Rooms with a guest in house are OCCUPIED; those whose guest has left are free again (locked rooms untouched).
      await tx.$executeRaw`
        UPDATE room r SET status = CASE WHEN EXISTS (
          SELECT 1 FROM room_calendars c JOIN booking b ON b.booking_id = c.booking_id
          WHERE c.room_id = r.room_id AND b.status = 'CHECKED_IN'
        ) THEN 'OCCUPIED'::room_status ELSE 'AVAILABLE'::room_status END
        FROM room_type rt JOIN hotel h ON h.hotel_id = rt.hotel_id
        WHERE rt.room_type_id = r.room_type_id AND h.name = ANY(${hotelNames})
          AND r.status IN ('AVAILABLE', 'OCCUPIED')`;
    },
    { timeout: 120_000 },
  );
  return counts;
}
