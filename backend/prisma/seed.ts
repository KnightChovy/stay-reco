import { PrismaClient, Role } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error('SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are required');
  }

  const existing = await prisma.account.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin ${email} already exists, skipping`);
    return;
  }

  await prisma.account.create({
    data: {
      email,
      passwordHash: await argon2.hash(password, { type: argon2.argon2id }),
      role: Role.ADMIN,
      emailVerifiedAt: new Date(),
      admin: { create: { fullName: 'System Admin' } },
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
