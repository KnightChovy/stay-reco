import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import * as argon2 from 'argon2';
import { PrismaClient, UserRole } from '../src/generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

/** Icons are lucide-react names, as used by the web app. */
const AMENITIES = [
  { category: 'Chung', name: 'Wi-Fi miễn phí', icon: 'wifi' },
  { category: 'Chung', name: 'Lễ tân 24/7', icon: 'concierge-bell' },
  { category: 'Chung', name: 'Thang máy', icon: 'arrow-up-down' },
  { category: 'Chung', name: 'Chỗ đậu xe', icon: 'square-parking' },
  { category: 'Chung', name: 'Không hút thuốc', icon: 'cigarette-off' },
  { category: 'Ẩm thực', name: 'Nhà hàng', icon: 'utensils' },
  { category: 'Ẩm thực', name: 'Quầy bar', icon: 'wine' },
  { category: 'Ẩm thực', name: 'Bữa sáng', icon: 'coffee' },
  { category: 'Ẩm thực', name: 'Dịch vụ phòng', icon: 'bell-ring' },
  { category: 'Thư giãn', name: 'Hồ bơi', icon: 'waves' },
  { category: 'Thư giãn', name: 'Phòng gym', icon: 'dumbbell' },
  { category: 'Thư giãn', name: 'Spa & massage', icon: 'flower-2' },
  { category: 'Thư giãn', name: 'Khu vui chơi trẻ em', icon: 'baby' },
  { category: 'Dịch vụ', name: 'Đưa đón sân bay', icon: 'plane' },
  { category: 'Dịch vụ', name: 'Giặt ủi', icon: 'shirt' },
  { category: 'Dịch vụ', name: 'Giữ hành lý', icon: 'luggage' },
  { category: 'Phòng', name: 'Điều hòa', icon: 'air-vent' },
  { category: 'Phòng', name: 'TV màn hình phẳng', icon: 'tv' },
  { category: 'Phòng', name: 'Minibar', icon: 'refrigerator' },
  { category: 'Phòng', name: 'Két sắt', icon: 'lock-keyhole' },
  { category: 'Phòng', name: 'Bàn làm việc', icon: 'laptop' },
  { category: 'Phòng', name: 'Ban công', icon: 'door-open' },
  { category: 'Phòng', name: 'Bồn tắm', icon: 'bath' },
  { category: 'Phòng', name: 'Máy sấy tóc', icon: 'wind' },
];

const BED_TYPES = [
  { name: 'Giường đơn', description: 'Rộng 1m–1m2', capacity: 1 },
  { name: 'Giường đôi', description: 'Rộng 1m4', capacity: 2 },
  { name: 'Giường Queen', description: 'Rộng 1m6', capacity: 2 },
  { name: 'Giường King', description: 'Rộng 1m8–2m', capacity: 2 },
  { name: 'Giường tầng', description: 'Hai giường đơn xếp tầng', capacity: 2 },
  { name: 'Sofa giường', description: 'Sofa kéo thành giường', capacity: 1 },
];

/** Catalog tables have no unique name, so insert only the names that are missing (safe to re-run). */
async function seedCatalog() {
  const amenityNames = new Set(
    (await prisma.amenity.findMany({ select: { name: true } })).map(
      (a) => a.name,
    ),
  );
  const amenities = AMENITIES.filter((a) => !amenityNames.has(a.name));
  await prisma.amenity.createMany({ data: amenities });

  const bedNames = new Set(
    (await prisma.bedType.findMany({ select: { name: true } })).map(
      (b) => b.name,
    ),
  );
  const bedTypes = BED_TYPES.filter((b) => !bedNames.has(b.name));
  await prisma.bedType.createMany({ data: bedTypes });

  console.log(
    `Catalog: +${amenities.length} amenities, +${bedTypes.length} bed types`,
  );
}

async function main() {
  await seedCatalog();

  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error('SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are required');
  }

  const existing = await prisma.userAccount.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin ${email} already exists, skipping`);
    return;
  }

  await prisma.userAccount.create({
    data: {
      email,
      fullName: 'System Admin',
      passwordHash: await argon2.hash(password, { type: argon2.argon2id }),
      role: UserRole.ADMIN,
      emailVerifiedAt: new Date(),
      admin: { create: {} },
    },
  });
  console.log(`Created admin ${email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
