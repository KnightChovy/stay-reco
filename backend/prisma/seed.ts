import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import * as argon2 from 'argon2';
import { PrismaClient, UserRole } from '../src/generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
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
