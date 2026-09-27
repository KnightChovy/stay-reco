import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Role } from '@prisma/client';
import * as argon2 from 'argon2';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { MailMessage, MailService } from '../src/modules/mail/mail.service';
import { PrismaService } from '../src/prisma/prisma.service';

const PASSWORD = 'Password123';

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const outbox: MailMessage[] = [];

  const api = () => request(app.getHttpServer());

  /** Extracts the token from the last email sent to `to`. */
  const lastTokenFor = (to: string) => {
    const mail = [...outbox].reverse().find((m) => m.to === to);
    const match = mail?.text.match(/token=([^\s]+)/);
    if (!match) throw new Error(`No token mailed to ${to}`);
    return decodeURIComponent(match[1]);
  };

  const registerCustomer = async (email = 'alice@example.com') => {
    const res = await api()
      .post('/api/v1/auth/register/customer')
      .send({ email, password: PASSWORD, fullName: 'Alice' })
      .expect(201);
    return res.body as {
      account: { id: string; emailVerified: boolean };
      accessToken: string;
      refreshToken: string;
    };
  };

  const login = async (email: string, password = PASSWORD) => {
    const res = await api()
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(200);
    return res.body as { accessToken: string; refreshToken: string };
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(MailService)
      .useValue({
        send: (m: MailMessage) => {
          outbox.push(m);
          return Promise.resolve();
        },
      })
      .compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    outbox.length = 0;
    await prisma.$executeRawUnsafe(
      'TRUNCATE TABLE account, audit_log RESTART IDENTITY CASCADE',
    );
  });

  afterAll(async () => {
    await app.close();
  });

  describe('register', () => {
    it('creates a customer, returns tokens and sends a verification email', async () => {
      const body = await registerCustomer();

      expect(body.accessToken).toEqual(expect.any(String));
      expect(body.refreshToken).toEqual(expect.any(String));
      expect(body.account).toMatchObject({
        email: 'alice@example.com',
        role: 'CUSTOMER',
        emailVerified: false,
        profile: { fullName: 'Alice' },
      });
      expect(body.account).not.toHaveProperty('passwordHash');
      expect(outbox).toHaveLength(1);
    });

    it('normalizes email and rejects duplicates', async () => {
      await registerCustomer();
      await api()
        .post('/api/v1/auth/register/partner')
        .send({
          email: '  ALICE@example.com ',
          password: PASSWORD,
          fullName: 'A',
        })
        .expect(409);
    });

    it('rejects weak passwords and unknown fields', async () => {
      await api()
        .post('/api/v1/auth/register/customer')
        .send({ email: 'b@example.com', password: 'short', fullName: 'B' })
        .expect(400);
      await api()
        .post('/api/v1/auth/register/customer')
        .send({
          email: 'b@example.com',
          password: PASSWORD,
          fullName: 'B',
          role: 'ADMIN',
        })
        .expect(400);
    });
  });

  describe('login & me', () => {
    it('rejects wrong credentials with the same message', async () => {
      await registerCustomer();
      const wrongPw = await api()
        .post('/api/v1/auth/login')
        .send({ email: 'alice@example.com', password: 'Wrong12345' })
        .expect(401);
      const unknown = await api()
        .post('/api/v1/auth/login')
        .send({ email: 'nobody@example.com', password: PASSWORD })
        .expect(401);
      expect(wrongPw.body.message).toBe(unknown.body.message);
    });

    it('logs in and reads /me', async () => {
      await registerCustomer();
      const { accessToken } = await login('alice@example.com');

      const me = await api()
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      expect(me.body).toMatchObject({ email: 'alice@example.com' });

      await api().get('/api/v1/auth/me').expect(401);
      await api()
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer garbage')
        .expect(401);
    });

    it('locks the account after 5 failed attempts', async () => {
      await registerCustomer();
      for (let i = 0; i < 5; i++) {
        await api()
          .post('/api/v1/auth/login')
          .send({ email: 'alice@example.com', password: 'Wrong12345' })
          .expect(401);
      }
      await api()
        .post('/api/v1/auth/login')
        .send({ email: 'alice@example.com', password: PASSWORD })
        .expect(403);
    });
  });

  describe('email verification', () => {
    it('verifies once with the mailed token', async () => {
      const { accessToken } = await registerCustomer();
      const token = lastTokenFor('alice@example.com');

      await api().post('/api/v1/auth/verify-email').send({ token }).expect(204);
      await api().post('/api/v1/auth/verify-email').send({ token }).expect(400);

      const me = await api()
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      expect(me.body.emailVerified).toBe(true);
    });

    it('resend invalidates the previous token', async () => {
      await registerCustomer();
      const first = lastTokenFor('alice@example.com');
      await api()
        .post('/api/v1/auth/resend-verification')
        .send({ email: 'alice@example.com' })
        .expect(204);

      await api()
        .post('/api/v1/auth/verify-email')
        .send({ token: first })
        .expect(400);
      await api()
        .post('/api/v1/auth/verify-email')
        .send({ token: lastTokenFor('alice@example.com') })
        .expect(204);
    });
  });

  describe('refresh & sessions', () => {
    it('rotates refresh tokens and revokes the session on reuse', async () => {
      const { refreshToken: first } = await registerCustomer();

      const rotated = await api()
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: first })
        .expect(200);
      const second = rotated.body.refreshToken as string;
      expect(second).not.toBe(first);

      // Replaying the used token = theft → whole session revoked.
      await api()
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: first })
        .expect(401);
      await api()
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: second })
        .expect(401);
      await api()
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${rotated.body.accessToken}`)
        .expect(401);
    });

    it('logout revokes the access token immediately', async () => {
      const { accessToken, refreshToken } = await registerCustomer();

      await api()
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);
      await api()
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(401);
      await api()
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(401);
    });

    it('lists sessions and revokes another device', async () => {
      const { accessToken: a } = await registerCustomer();
      const { accessToken: b } = await login('alice@example.com');

      const list = await api()
        .get('/api/v1/auth/sessions')
        .set('Authorization', `Bearer ${a}`)
        .expect(200);
      expect(list.body).toHaveLength(2);
      const other = (list.body as { id: string; current: boolean }[]).find(
        (s) => !s.current,
      )!;

      await api()
        .delete(`/api/v1/auth/sessions/${other.id}`)
        .set('Authorization', `Bearer ${a}`)
        .expect(204);
      await api()
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${b}`)
        .expect(401);
      await api()
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${a}`)
        .expect(200);
    });

    it('web clients get the refresh token as an httpOnly cookie', async () => {
      await registerCustomer();
      const res = await api()
        .post('/api/v1/auth/login')
        .set('X-Client-Type', 'web')
        .send({ email: 'alice@example.com', password: PASSWORD })
        .expect(200);

      expect(res.body.refreshToken).toBeUndefined();
      const cookies = res.get('Set-Cookie') ?? [];
      const cookie = cookies.find((c) => c.startsWith('refresh_token='));
      expect(cookie).toContain('HttpOnly');
      expect(cookie).toContain('Path=/api/v1/auth');

      const refreshed = await api()
        .post('/api/v1/auth/refresh')
        .set('X-Client-Type', 'web')
        .set('Cookie', cookie!.split(';')[0])
        .expect(200);
      expect(refreshed.body.accessToken).toEqual(expect.any(String));
    });
  });

  describe('passwords', () => {
    it('forgot password is silent for unknown emails', async () => {
      await api()
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'nobody@example.com' })
        .expect(204);
      expect(outbox).toHaveLength(0);
    });

    it('reset password revokes all sessions', async () => {
      const { accessToken } = await registerCustomer();
      await api()
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'alice@example.com' })
        .expect(204);

      await api()
        .post('/api/v1/auth/reset-password')
        .send({
          token: lastTokenFor('alice@example.com'),
          newPassword: 'NewPass456',
        })
        .expect(204);

      await api()
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(401);
      await api()
        .post('/api/v1/auth/login')
        .send({ email: 'alice@example.com', password: PASSWORD })
        .expect(401);
      await login('alice@example.com', 'NewPass456');
    });

    it('change password keeps the current session only', async () => {
      const { accessToken: current } = await registerCustomer();
      const { accessToken: other } = await login('alice@example.com');

      await api()
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${current}`)
        .send({ currentPassword: 'Wrong12345', newPassword: 'NewPass456' })
        .expect(401);
      await api()
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${current}`)
        .send({ currentPassword: PASSWORD, newPassword: 'NewPass456' })
        .expect(204);

      await api()
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${current}`)
        .expect(200);
      await api()
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${other}`)
        .expect(401);
    });
  });

  describe('invitations', () => {
    it('partner invites staff who accepts and becomes active', async () => {
      const partner = await api()
        .post('/api/v1/auth/register/partner')
        .send({
          email: 'owner@hotel.com',
          password: PASSWORD,
          fullName: 'Owner',
          companyName: 'Hotel Co',
        })
        .expect(201);

      const { accessToken: customerToken } = await registerCustomer();
      await api()
        .post('/api/v1/auth/invitations/staff')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ email: 'staff@hotel.com', fullName: 'Staff' })
        .expect(403);

      await api()
        .post('/api/v1/auth/invitations/staff')
        .set('Authorization', `Bearer ${partner.body.accessToken}`)
        .send({ email: 'staff@hotel.com', fullName: 'Staff' })
        .expect(201);

      // Invited account cannot log in before accepting.
      await api()
        .post('/api/v1/auth/login')
        .send({ email: 'staff@hotel.com', password: PASSWORD })
        .expect(401);

      const token = lastTokenFor('staff@hotel.com');
      const accepted = await api()
        .post('/api/v1/auth/invitations/accept')
        .send({ token, password: PASSWORD })
        .expect(201);
      expect(accepted.body.account).toMatchObject({
        role: 'HOTEL_STAFF',
        status: 'ACTIVE',
        emailVerified: true,
        profile: { hotelPartnerId: partner.body.account.profile.id },
      });

      await api()
        .post('/api/v1/auth/invitations/accept')
        .send({ token, password: PASSWORD })
        .expect(400);
      await login('staff@hotel.com');
    });

    it('only admins can invite platform managers', async () => {
      await prisma.account.create({
        data: {
          email: 'admin@example.com',
          passwordHash: await argon2.hash(PASSWORD),
          role: Role.ADMIN,
          admin: { create: { fullName: 'Admin' } },
        },
      });
      const { accessToken: adminToken } = await login('admin@example.com');
      const { accessToken: customerToken } = await registerCustomer();

      await api()
        .post('/api/v1/auth/invitations/platform-manager')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ email: 'pm@example.com', fullName: 'PM' })
        .expect(403);
      await api()
        .post('/api/v1/auth/invitations/platform-manager')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'pm@example.com', fullName: 'PM' })
        .expect(201);

      await api()
        .post('/api/v1/auth/invitations/accept')
        .send({ token: lastTokenFor('pm@example.com'), password: PASSWORD })
        .expect(201);
      await login('pm@example.com');
    });
  });
});
