import * as argon2 from 'argon2';
import type { SubmitVerificationInput } from '@stayreco/shared';
import { FieldCipher } from '../src/common/crypto/field-cipher';
import {
  type PrismaClient,
  StaffPermission,
  UserRole,
} from '../src/generated/prisma/client';
import { BASE_PRICE_NAME } from '../src/modules/rooms/room.mapper';
import { toSnapshotRows } from '../src/modules/verification/verification.mapper';

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
                create: { name: BASE_PRICE_NAME, pricePerNight: rt.basePrice },
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

  console.log(
    `Demo: +${created} hotels. Sign in with password "${password}": ${MANAGER_EMAIL}, ` +
      PARTNERS.flatMap((p) => [p.email, p.staffEmail].filter(Boolean)).join(
        ', ',
      ),
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
