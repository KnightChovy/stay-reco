import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AccountStatus,
  Prisma,
  Role,
  VerificationTokenType,
} from '@prisma/client';
import { AuthUser } from '../../../common/decorators/current-user.decorator';
import { RequestMeta } from '../../../common/decorators/request-meta.decorator';
import { Env } from '../../../config/env';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditAction, AuditService } from '../../audit/audit.service';
import { MailService } from '../../mail/mail.service';
import {
  AcceptInvitationDto,
  ChangePasswordDto,
  InviteAccountDto,
  LoginDto,
  RegisterCustomerDto,
  RegisterPartnerDto,
  ResetPasswordDto,
} from '../dto/auth.dto';
import { PasswordService } from './password.service';
import { TokenPair, TokenService } from './token.service';
import { VerificationService } from './verification.service';

const MAX_FAILED_LOGINS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

const accountSelect = {
  id: true,
  email: true,
  phone: true,
  role: true,
  status: true,
  emailVerifiedAt: true,
  lastLoginAt: true,
  createdAt: true,
  customer: { select: { id: true, fullName: true } },
  hotelPartner: { select: { id: true, fullName: true, companyName: true } },
  hotelStaff: {
    select: { id: true, fullName: true, hotelPartnerId: true },
  },
  platformManager: { select: { id: true, fullName: true } },
  admin: { select: { id: true, fullName: true } },
} satisfies Prisma.AccountSelect;

type AccountWithProfiles = Prisma.AccountGetPayload<{
  select: typeof accountSelect;
}>;

export type AccountResponse = ReturnType<typeof toAccountResponse>;

/** Explicit field list so extra selected columns (e.g. password_hash) never leak. */
function toAccountResponse(a: AccountWithProfiles) {
  return {
    id: a.id,
    email: a.email,
    phone: a.phone,
    role: a.role,
    status: a.status,
    emailVerified: !!a.emailVerifiedAt,
    emailVerifiedAt: a.emailVerifiedAt,
    lastLoginAt: a.lastLoginAt,
    createdAt: a.createdAt,
    profile:
      a.customer ??
      a.hotelPartner ??
      a.hotelStaff ??
      a.platformManager ??
      a.admin ??
      null,
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly tokens: TokenService,
    private readonly verification: VerificationService,
    private readonly mail: MailService,
    private readonly audit: AuditService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  // ── Registration ─────────────────────────────────────────

  registerCustomer(dto: RegisterCustomerDto, meta: RequestMeta) {
    return this.register(
      dto,
      Role.CUSTOMER,
      { customer: { create: { fullName: dto.fullName } } },
      meta,
    );
  }

  registerPartner(dto: RegisterPartnerDto, meta: RequestMeta) {
    return this.register(
      dto,
      Role.HOTEL_PARTNER,
      {
        hotelPartner: {
          create: { fullName: dto.fullName, companyName: dto.companyName },
        },
      },
      meta,
    );
  }

  private async register(
    dto: { email: string; password: string },
    role: Role,
    profile: Partial<Prisma.AccountCreateInput>,
    meta: RequestMeta,
  ) {
    const passwordHash = await this.passwords.hash(dto.password);
    const account = await this.createAccountOrConflict({
      email: dto.email,
      passwordHash,
      role,
      ...profile,
    });

    await this.sendVerificationEmail(account.id, account.email);
    const tokens = await this.tokens.createSession(account, meta);
    return { account: toAccountResponse(account), tokens };
  }

  // ── Login ────────────────────────────────────────────────

  async login(
    dto: LoginDto,
    meta: RequestMeta,
  ): Promise<{ account: AccountResponse; tokens: TokenPair }> {
    const account = await this.prisma.account.findUnique({
      where: { email: dto.email },
      select: {
        ...accountSelect,
        passwordHash: true,
        lockedUntil: true,
      },
    });

    if (account?.lockedUntil && account.lockedUntil > new Date()) {
      throw new ForbiddenException(
        'Too many failed attempts. Please try again later.',
      );
    }

    const valid = await this.passwords.verify(
      account?.passwordHash,
      dto.password,
    );
    if (!account || !valid) {
      if (account) await this.recordFailedLogin(account.id, meta);
      await this.audit.log(
        AuditAction.LOGIN_FAILED,
        account?.id ?? null,
        meta,
        {
          email: dto.email,
        },
      );
      throw new UnauthorizedException('Invalid email or password');
    }

    if (account.status === AccountStatus.SUSPENDED) {
      throw new ForbiddenException('Account is suspended');
    }
    if (account.status !== AccountStatus.ACTIVE) {
      throw new UnauthorizedException('Invalid email or password');
    }

    await this.prisma.account.update({
      where: { id: account.id },
      data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() },
    });
    const tokens = await this.tokens.createSession(account, meta);
    await this.audit.log(AuditAction.LOGIN_SUCCESS, account.id, meta);

    return { account: toAccountResponse(account), tokens };
  }

  private async recordFailedLogin(accountId: string, meta: RequestMeta) {
    const { failedLoginCount } = await this.prisma.account.update({
      where: { id: accountId },
      data: { failedLoginCount: { increment: 1 } },
      select: { failedLoginCount: true },
    });
    if (failedLoginCount >= MAX_FAILED_LOGINS) {
      await this.prisma.account.update({
        where: { id: accountId },
        data: {
          failedLoginCount: 0,
          lockedUntil: new Date(Date.now() + LOCK_DURATION_MS),
        },
      });
      await this.audit.log(AuditAction.ACCOUNT_LOCKED, accountId, meta);
    }
  }

  // ── Sessions ─────────────────────────────────────────────

  refresh(refreshToken: string, meta: RequestMeta) {
    return this.tokens.rotate(refreshToken, meta);
  }

  async logout(user: AuthUser, meta: RequestMeta) {
    await this.tokens.revokeSession(user.sessionId);
    await this.audit.log(AuditAction.LOGOUT, user.accountId, meta);
  }

  async logoutAll(user: AuthUser, meta: RequestMeta) {
    await this.tokens.revokeAllSessions(user.accountId);
    await this.audit.log(AuditAction.LOGOUT_ALL, user.accountId, meta);
  }

  async listSessions(user: AuthUser) {
    const sessions = await this.prisma.authSession.findMany({
      where: {
        accountId: user.accountId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        ip: true,
        userAgent: true,
        createdAt: true,
        lastUsedAt: true,
        expiresAt: true,
      },
      orderBy: { lastUsedAt: 'desc' },
    });
    return sessions.map((s) => ({ ...s, current: s.id === user.sessionId }));
  }

  async revokeSession(user: AuthUser, sessionId: string, meta: RequestMeta) {
    const revoked = await this.tokens.revokeSession(sessionId, user.accountId);
    if (!revoked) throw new NotFoundException('Session not found');
    await this.audit.log(AuditAction.SESSION_REVOKED, user.accountId, meta, {
      sessionId,
    });
  }

  async me(accountId: string) {
    const account = await this.prisma.account.findUniqueOrThrow({
      where: { id: accountId },
      select: accountSelect,
    });
    return toAccountResponse(account);
  }

  // ── Email verification ───────────────────────────────────

  async verifyEmail(token: string, meta: RequestMeta) {
    const accountId = await this.verification.consume(
      token,
      VerificationTokenType.EMAIL_VERIFY,
    );
    await this.prisma.account.updateMany({
      where: { id: accountId, emailVerifiedAt: null },
      data: { emailVerifiedAt: new Date() },
    });
    await this.audit.log(AuditAction.EMAIL_VERIFIED, accountId, meta);
  }

  /** Silent when the email is unknown or already verified (no account enumeration). */
  async resendVerification(email: string) {
    const account = await this.prisma.account.findUnique({ where: { email } });
    if (
      !account ||
      account.emailVerifiedAt ||
      account.status !== AccountStatus.ACTIVE
    ) {
      return;
    }
    await this.sendVerificationEmail(account.id, account.email);
  }

  private async sendVerificationEmail(accountId: string, email: string) {
    const token = await this.verification.issue(
      accountId,
      VerificationTokenType.EMAIL_VERIFY,
    );
    await this.mail.send({
      to: email,
      subject: 'Verify your email',
      text: `Open this link to verify your email (valid 24 hours):\n${this.link('verify-email', token)}`,
    });
  }

  // ── Passwords ────────────────────────────────────────────

  /** Silent when the email is unknown (no account enumeration). */
  async forgotPassword(email: string) {
    const account = await this.prisma.account.findUnique({ where: { email } });
    if (!account || account.status !== AccountStatus.ACTIVE) return;

    const token = await this.verification.issue(
      account.id,
      VerificationTokenType.PASSWORD_RESET,
    );
    await this.mail.send({
      to: account.email,
      subject: 'Reset your password',
      text: `Open this link to reset your password (valid 30 minutes):\n${this.link('reset-password', token)}\n\nIf you did not request this, ignore this email.`,
    });
  }

  async resetPassword(dto: ResetPasswordDto, meta: RequestMeta) {
    const accountId = await this.verification.consume(
      dto.token,
      VerificationTokenType.PASSWORD_RESET,
    );
    const account = await this.prisma.account.findUniqueOrThrow({
      where: { id: accountId },
    });
    if (account.status !== AccountStatus.ACTIVE) {
      throw new ForbiddenException('Account is not active');
    }

    await this.prisma.account.update({
      where: { id: accountId },
      data: {
        passwordHash: await this.passwords.hash(dto.newPassword),
        // Receiving the reset email proves mailbox ownership.
        emailVerifiedAt: account.emailVerifiedAt ?? new Date(),
        failedLoginCount: 0,
        lockedUntil: null,
      },
    });
    await this.tokens.revokeAllSessions(accountId);
    await this.audit.log(AuditAction.PASSWORD_RESET, accountId, meta);
  }

  async changePassword(
    user: AuthUser,
    dto: ChangePasswordDto,
    meta: RequestMeta,
  ) {
    const account = await this.prisma.account.findUniqueOrThrow({
      where: { id: user.accountId },
    });
    const valid = await this.passwords.verify(
      account.passwordHash,
      dto.currentPassword,
    );
    if (!valid)
      throw new UnauthorizedException('Current password is incorrect');

    await this.prisma.account.update({
      where: { id: user.accountId },
      data: { passwordHash: await this.passwords.hash(dto.newPassword) },
    });
    // Keep the device that changed the password signed in.
    await this.tokens.revokeAllSessions(user.accountId, user.sessionId);
    await this.audit.log(AuditAction.PASSWORD_CHANGED, user.accountId, meta);
  }

  // ── Invitations ──────────────────────────────────────────

  async inviteStaff(user: AuthUser, dto: InviteAccountDto, meta: RequestMeta) {
    const partner = await this.prisma.hotelPartner.findUniqueOrThrow({
      where: { accountId: user.accountId },
    });

    const existing = await this.prisma.account.findUnique({
      where: { email: dto.email },
      include: { hotelStaff: true },
    });
    const canResend =
      existing?.status === AccountStatus.INVITED &&
      existing.hotelStaff?.hotelPartnerId === partner.id;
    if (existing && !canResend) {
      throw new ConflictException('Email is already registered');
    }

    const account =
      existing ??
      (await this.createAccountOrConflict({
        email: dto.email,
        role: Role.HOTEL_STAFF,
        status: AccountStatus.INVITED,
        hotelStaff: {
          create: {
            fullName: dto.fullName,
            hotelPartner: { connect: { id: partner.id } },
          },
        },
      }));

    await this.sendInvitation(account.id, account.email, 'hotel staff');
    await this.audit.log(AuditAction.ACCOUNT_INVITED, user.accountId, meta, {
      invitedAccountId: account.id,
      role: Role.HOTEL_STAFF,
    });
    return { id: account.id, email: account.email, status: account.status };
  }

  async invitePlatformManager(
    user: AuthUser,
    dto: InviteAccountDto,
    meta: RequestMeta,
  ) {
    const existing = await this.prisma.account.findUnique({
      where: { email: dto.email },
    });
    const canResend =
      existing?.status === AccountStatus.INVITED &&
      existing.role === Role.PLATFORM_MANAGER;
    if (existing && !canResend) {
      throw new ConflictException('Email is already registered');
    }

    const account =
      existing ??
      (await this.createAccountOrConflict({
        email: dto.email,
        role: Role.PLATFORM_MANAGER,
        status: AccountStatus.INVITED,
        platformManager: { create: { fullName: dto.fullName } },
      }));

    await this.sendInvitation(account.id, account.email, 'platform manager');
    await this.audit.log(AuditAction.ACCOUNT_INVITED, user.accountId, meta, {
      invitedAccountId: account.id,
      role: Role.PLATFORM_MANAGER,
    });
    return { id: account.id, email: account.email, status: account.status };
  }

  async acceptInvitation(dto: AcceptInvitationDto, meta: RequestMeta) {
    const accountId = await this.verification.consume(
      dto.token,
      VerificationTokenType.ACCOUNT_INVITE,
    );
    const { count } = await this.prisma.account.updateMany({
      where: { id: accountId, status: AccountStatus.INVITED },
      data: {
        passwordHash: await this.passwords.hash(dto.password),
        status: AccountStatus.ACTIVE,
        emailVerifiedAt: new Date(),
        lastLoginAt: new Date(),
      },
    });
    if (count === 0) throw new ConflictException('Invitation already accepted');

    const account = await this.prisma.account.findUniqueOrThrow({
      where: { id: accountId },
      select: accountSelect,
    });
    const tokens = await this.tokens.createSession(account, meta);
    await this.audit.log(AuditAction.INVITATION_ACCEPTED, accountId, meta);
    return { account: toAccountResponse(account), tokens };
  }

  private async sendInvitation(
    accountId: string,
    email: string,
    label: string,
  ) {
    const token = await this.verification.issue(
      accountId,
      VerificationTokenType.ACCOUNT_INVITE,
    );
    await this.mail.send({
      to: email,
      subject: `You are invited to StayReco as ${label}`,
      text: `Open this link to set your password (valid 72 hours):\n${this.link('accept-invitation', token)}`,
    });
  }

  // ── Helpers ──────────────────────────────────────────────

  private async createAccountOrConflict(data: Prisma.AccountCreateInput) {
    try {
      return await this.prisma.account.create({ data, select: accountSelect });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException('Email is already registered');
      }
      throw err;
    }
  }

  private link(path: string, token: string) {
    const base = this.config.get('WEB_APP_URL', { infer: true });
    return `${base.replace(/\/$/, '')}/${path}?token=${encodeURIComponent(token)}`;
  }
}
