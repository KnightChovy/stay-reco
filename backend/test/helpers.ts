import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as argon2 from 'argon2';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { UserRole } from '../src/generated/prisma/client';
import { MailMessage, MailService } from '../src/modules/mail/mail.service';
import { StorageService } from '../src/modules/storage/storage.service';
import { PrismaService } from '../src/prisma/prisma.service';

export const PASSWORD = 'Password123';

/** Records what would go to Cloudinary. */
export class FakeStorage extends StorageService {
  uploads: { folder: string; private: boolean }[] = [];
  deleted: string[] = [];
  private seq = 0;

  uploadImage(_file: Buffer, folder: string) {
    this.uploads.push({ folder, private: false });
    const storageKey = `${folder}/img${++this.seq}`;
    return Promise.resolve({
      storageKey,
      url: `https://cdn.test/${storageKey}.png`,
    });
  }
  uploadPrivate(_file: Buffer, folder: string) {
    this.uploads.push({ folder, private: true });
    return Promise.resolve(`${folder}/doc${++this.seq}.pdf`);
  }
  signedUrl(storageKey: string, expiresInSeconds: number) {
    return `https://signed.test/${storageKey}?expires=${expiresInSeconds}`;
  }
  deleteImage(storageKey: string) {
    this.deleted.push(storageKey);
    return Promise.resolve();
  }
  deletePrivate(storageKey: string) {
    this.deleted.push(storageKey);
    return Promise.resolve();
  }
  clear() {
    this.uploads = [];
    this.deleted = [];
  }
}

/** Smallest byte sequences the upload check recognizes, by type. */
export const FILES = {
  png: Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex'),
  jpg: Buffer.from('ffd8ffe000104a464946', 'hex'),
  webp: Buffer.concat([
    Buffer.from('RIFF'),
    Buffer.alloc(4),
    Buffer.from('WEBPVP8 '),
  ]),
  pdf: Buffer.from('%PDF-1.4\n%test\n'),
  text: Buffer.from('not really an image'),
};

/** App with emails captured in `outbox` and Cloudinary replaced by `storage`. */
export async function createTestApp() {
  const outbox: MailMessage[] = [];
  const storage = new FakeStorage();
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(MailService)
    .useValue({
      send: (m: MailMessage) => {
        outbox.push(m);
        return Promise.resolve();
      },
    })
    .overrideProvider(StorageService)
    .useValue(storage)
    .compile();

  const app: INestApplication<App> = moduleRef.createNestApplication();
  configureApp(app);
  await app.init();
  const prisma = app.get(PrismaService);
  const api = () => request(app.getHttpServer());

  /** Removes every account and what hangs off it (hotels, rooms, sessions...). */
  const reset = async () => {
    outbox.length = 0;
    storage.clear();
    await prisma.$executeRawUnsafe(
      'TRUNCATE TABLE user_account, audit_log RESTART IDENTITY CASCADE',
    );
  };

  /** Creates an ACTIVE account directly and signs in; returns its id and access token. */
  const signIn = async (
    role: 'CUSTOMER' | 'HOTEL_PARTNER' | 'PLATFORM_MANAGER',
    email: string,
  ) => {
    const account = await prisma.userAccount.create({
      data: {
        email,
        fullName: email.split('@')[0],
        passwordHash: await argon2.hash(PASSWORD, { type: argon2.argon2id }),
        role: UserRole[role],
        emailVerifiedAt: new Date(),
        ...(role === 'CUSTOMER' && { customer: { create: {} } }),
        ...(role === 'PLATFORM_MANAGER' && { platformManager: { create: {} } }),
        ...(role === 'HOTEL_PARTNER' && {
          hotelPartner: {
            create: {
              partnerName: 'Partner Co',
              contactEmail: email,
              contactPhone: '0901234567',
              commissionRate: 8,
            },
          },
        }),
      },
    });
    return { id: account.userAccountId, token: await login(email) };
  };

  /** Creates an ACTIVE staff member of `hotelId` and signs in. */
  const signInStaff = async (
    hotelId: string,
    email: string,
    permissions: (
      'BOOKING' | 'FRONT_DESK' | 'CUSTOMER_CARE' | 'REFUND' | 'MARKETING'
    )[] = [],
  ) => {
    const account = await prisma.userAccount.create({
      data: {
        email,
        fullName: 'Staff',
        passwordHash: await argon2.hash(PASSWORD, { type: argon2.argon2id }),
        role: UserRole.HOTEL_STAFF,
        emailVerifiedAt: new Date(),
        hotelStaff: {
          create: { hotelId, position: 'Receptionist', permissions },
        },
      },
    });
    return { id: account.userAccountId, token: await login(email) };
  };

  const login = async (email: string) => {
    const res = await api()
      .post('/api/v1/auth/login')
      .send({ email, password: PASSWORD })
      .expect(200);
    return (res.body.data as { accessToken: string }).accessToken;
  };

  return { app, prisma, api, outbox, storage, reset, signIn, signInStaff };
}
