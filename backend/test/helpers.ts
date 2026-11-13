import { ForbiddenException, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as argon2 from 'argon2';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { UserRole } from '../src/generated/prisma/client';
import { BookingMailer } from '../src/modules/bookings/booking-mailer';
import { MailMessage, MailService } from '../src/modules/mail/mail.service';
import { PayoutMailer } from '../src/modules/payouts/payout-mailer';
import { AccountMailer } from '../src/modules/admin/account-mailer';
import { AiService } from '../src/modules/marketing/ai.service';
import { PublisherRegistry } from '../src/modules/marketing/publishers/publisher.registry';
import {
  publishFailed,
  type PublishablePost,
  type PublishTarget,
} from '../src/modules/marketing/publishers/social-publisher';
import { StorageService } from '../src/modules/storage/storage.service';
import { PLATFORM_WALLET_ID } from '../src/modules/wallets/wallet-ledger';
import { PrismaService } from '../src/prisma/prisma.service';

export const PASSWORD = 'Password123';

/** Records what would go to Cloudinary. */
export class FakeStorage extends StorageService {
  uploads: { folder: string; private: boolean }[] = [];
  deleted: string[] = [];
  private seq = 0;

  /** What the next upload reports as its size; a test sets it to try a shape the rules refuse. */
  nextSize = { width: 1600, height: 1200 };

  uploadImage(_file: Buffer, folder: string) {
    this.uploads.push({ folder, private: false });
    const storageKey = `${folder}/img${++this.seq}`;
    return Promise.resolve({
      storageKey,
      url: `https://cdn.test/${storageKey}.png`,
      ...this.nextSize,
    });
  }
  uploadPrivate(_file: Buffer, folder: string) {
    this.uploads.push({ folder, private: true });
    return Promise.resolve(`${folder}/doc${++this.seq}.pdf`);
  }
  signedUrl(storageKey: string, expiresInSeconds: number) {
    return `https://signed.test/${storageKey}?expires=${expiresInSeconds}`;
  }
  imageKeyFromUrl(url: string) {
    const match = /^https:\/\/cdn\.test\/(.+)\.png$/.exec(url);
    return match ? match[1] : null;
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
    this.nextSize = { width: 1600, height: 1200 };
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

/**
 * Stands in for the model. Tests set `answer` to whatever the real call would have returned and read `calls` to
 * check what was asked; `budgetLeft` lets a test put a hotel over its cap without spending anything.
 */
export class FakeAi {
  calls: { purpose: string; system: string; prompt: string }[] = [];
  answer: unknown = {
    summary: 'Ấm áp, xưng "mình", câu ngắn.',
    audience: 'Gia đình trẻ đi nghỉ cuối tuần',
    highlights: 'hướng biển, bữa sáng, gần chợ đêm',
  };
  budgetLeft = 5;
  available = true;

  budget() {
    return Promise.resolve({
      spentUsd: 5 - this.budgetLeft,
      limitUsd: 5,
      remainingUsd: this.budgetLeft,
    });
  }

  ask(
    context: { purpose: string },
    _schema: unknown,
    system: string,
    prompt: string,
  ) {
    if (this.budgetLeft <= 0) {
      return Promise.reject(
        new ForbiddenException({
          code: 'AI_BUDGET_EXCEEDED',
          message: 'This hotel has used its $5 of AI for this month',
        }),
      );
    }
    this.calls.push({ purpose: context.purpose, system, prompt });
    return Promise.resolve(this.answer);
  }

  clear() {
    this.calls = [];
    this.budgetLeft = 5;
  }
}

/**
 * Stands in for every social platform. Tests read `posts` to see what would have gone out, set `failWith` to make
 * the platform refuse, and set `metricsAnswer` to whatever the insights call would have returned.
 */
export class FakePublisherRegistry {
  posts: (PublishablePost & { platform: string; accountName: string })[] = [];
  metricsCalls = 0;
  nextPostId = 'post_1';
  /** When set, the platform refuses with this message instead of accepting the post. */
  failWith: string | null = null;
  metricsAnswer = { views: 120, likes: 9, shares: 2, comments: 3 };

  for(platform: string) {
    return {
      platform,
      publish: (target: PublishTarget, post: PublishablePost) => {
        if (this.failWith) {
          return Promise.reject(publishFailed(platform, this.failWith));
        }
        this.posts.push({
          ...post,
          platform,
          accountName: target.accountName,
        });
        return Promise.resolve(this.nextPostId);
      },
      metrics: () => {
        this.metricsCalls++;
        return Promise.resolve(this.metricsAnswer);
      },
    };
  }

  clear() {
    this.posts = [];
    this.metricsCalls = 0;
    this.nextPostId = 'post_1';
    this.failWith = null;
  }
}

/** App with emails captured in `outbox` and Cloudinary replaced by `storage`. */
export async function createTestApp() {
  const outbox: MailMessage[] = [];
  const storage = new FakeStorage();
  const ai = new FakeAi();
  const publisher = new FakePublisherRegistry();
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
    .overrideProvider(AiService)
    .useValue(ai)
    .overrideProvider(PublisherRegistry)
    .useValue(publisher)
    .compile();

  const app: INestApplication<App> = moduleRef.createNestApplication();
  configureApp(app);
  await app.init();
  const prisma = app.get(PrismaService);
  const api = () => request(app.getHttpServer());

  /** Removes every account and what hangs off it (hotels, rooms, sessions...). */
  const reset = async () => {
    // Emails and notifications of the previous test still being written would hit the accounts removed below.
    await app.get(BookingMailer).idle();
    await app.get(PayoutMailer).idle();
    await app.get(AccountMailer).idle();
    outbox.length = 0;
    storage.clear();
    ai.clear();
    publisher.clear();
    await prisma.$executeRawUnsafe(
      'TRUNCATE TABLE user_account, audit_log RESTART IDENTITY CASCADE',
    );
    // The cascade empties `wallet`; the platform wallet comes from a migration, so it is put back here.
    await prisma.wallet.create({
      data: { walletId: PLATFORM_WALLET_ID, ownerType: 'PLATFORM' },
    });
  };

  /** Creates an ACTIVE account directly and signs in; returns its id and access token. */
  const signIn = async (
    role: 'CUSTOMER' | 'HOTEL_PARTNER' | 'PLATFORM_MANAGER' | 'ADMIN',
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
        ...(role === 'ADMIN' && { admin: { create: {} } }),
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

  return {
    app,
    prisma,
    api,
    outbox,
    storage,
    ai,
    publisher,
    reset,
    signIn,
    signInStaff,
  };
}
