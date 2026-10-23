import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Account } from '@stayreco/shared';
import { AuthUser } from '../../../common/decorators/current-user.decorator';
import { RequestMeta } from '../../../common/decorators/request-meta.decorator';
import { ErrorCode } from '../../../common/errors/error-code';
import { HotelAccessService } from '../../../common/hotel-access/hotel-access.service';
import { Serialized } from '../../../common/http/api-response';
import { Env } from '../../../config/env';
import {
  AccountStatus,
  Prisma,
  UserRole,
  VerificationTokenType,
} from '../../../generated/prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditAction, AuditService } from '../../audit/audit.service';
import { MailService } from '../../mail/mail.service';
import {
  AcceptInvitationDto,
  ChangePasswordDto,
  InviteAccountDto,
  InviteStaffDto,
  LoginDto,
  RegisterCustomerDto,
  RegisterPartnerDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from '../dto/auth.dto';
import { PasswordService } from './password.service';
import { TokenPair, TokenService } from './token.service';
import { VerificationService } from './verification.service';

const MAX_FAILED_LOGINS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

const accountSelect = {
  userAccountId: true,
  email: true,
  fullName: true,
  phone: true,
  avatarUrl: true,
  role: true,
  status: true,
  emailVerifiedAt: true,
  lastLoginAt: true,
  createdAt: true,
  hotelPartner: { select: { partnerName: true, status: true } },
  hotelStaff: { select: { hotelId: true, position: true } },
} satisfies Prisma.UserAccountSelect;

// Same code and message for wrong password, unknown email and inactive account (no account enumeration).
const invalidCredentials = () =>
  new UnauthorizedException({
    code: ErrorCode.AUTH_INVALID_CREDENTIALS,
    message: 'Invalid email or password',
  });

const emailTaken = () =>
  new ConflictException({
    code: ErrorCode.AUTH_EMAIL_TAKEN,
    message: 'Email is already registered',
  });

type AccountWithProfiles = Prisma.UserAccountGetPayload<{
  select: typeof accountSelect;
}>;

export type AccountResponse = ReturnType<typeof toAccountResponse>;

/** Explicit field list so extra selected columns (e.g. password_hash) never leak. */
function toAccountResponse(a: AccountWithProfiles) {
  return {
    id: a.userAccountId,
    email: a.email,
    fullName: a.fullName,
    phone: a.phone,
    avatarUrl: a.avatarUrl,
    role: a.role,
    status: a.status,
    emailVerified: !!a.emailVerifiedAt,
    emailVerifiedAt: a.emailVerifiedAt,
    lastLoginAt: a.lastLoginAt,
    createdAt: a.createdAt,
    // Role-specific data; customers, admins and platform managers have none yet.
    profile: a.hotelPartner ?? a.hotelStaff ?? null,
  };
}

// Compile-time contract: the JSON sent to clients must match the shared `Account` type used by web and mobile.
const accountContract: Account = {} as Serialized<AccountResponse>;
void accountContract;

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
    private readonly hotelAccess: HotelAccessService,
  ) {}

  // ── Registration ─────────────────────────────────────────

  registerCustomer(dto: RegisterCustomerDto, meta: RequestMeta) {
    return this.register(
      dto,
      { role: UserRole.CUSTOMER, customer: { create: {} } },
      meta,
    );
  }

  registerPartner(dto: RegisterPartnerDto, meta: RequestMeta) {
    return this.register(
      dto,
      {
        role: UserRole.HOTEL_PARTNER,
        phone: dto.phone,
        hotelPartner: {
          create: {
            partnerName: dto.companyName ?? dto.fullName,
            contactEmail: dto.email,
            contactPhone: dto.phone,
            commissionRate: this.config.get('DEFAULT_COMMISSION_RATE', {
              infer: true,
            }),
          },
        },
      },
      meta,
    );
  }

  /**
   * Creates the account as PENDING_VERIFICATION and mails a 6-digit code.
   * No tokens are issued: the account is activated and signed in by `verifyEmail`.
   */
  private async register(
    dto: { email: string; password: string; fullName: string },
    roleData: Pick<Prisma.UserAccountCreateInput, 'role'> &
      Partial<Prisma.UserAccountCreateInput>,
    meta: RequestMeta,
  ): Promise<{ account: AccountResponse }> {
    const passwordHash = await this.passwords.hash(dto.password);
    const account = await this.createAccountOrConflict({
      email: dto.email,
      fullName: dto.fullName,
      passwordHash,
      status: AccountStatus.PENDING_VERIFICATION,
      ...roleData,
    });

    await this.sendVerificationEmail(account.userAccountId, account.email);
    await this.audit.log(
      AuditAction.ACCOUNT_REGISTERED,
      account.userAccountId,
      meta,
    );
    return { account: toAccountResponse(account) };
  }

  // ── Login ────────────────────────────────────────────────

  async login(
    dto: LoginDto,
    meta: RequestMeta,
  ): Promise<{ account: AccountResponse; tokens: TokenPair }> {
    const account = await this.prisma.userAccount.findUnique({
      where: { email: dto.email },
      select: {
        ...accountSelect,
        passwordHash: true,
        lockedUntil: true,
      },
    });

    if (account?.lockedUntil && account.lockedUntil > new Date()) {
      throw new ForbiddenException({
        code: ErrorCode.AUTH_ACCOUNT_LOCKED,
        message: 'Too many failed attempts. Please try again later.',
      });
    }

    const valid = await this.passwords.verify(
      account?.passwordHash,
      dto.password,
    );
    if (!account || !valid) {
      if (account) await this.recordFailedLogin(account.userAccountId, meta);
      await this.audit.log(
        AuditAction.LOGIN_FAILED,
        account?.userAccountId ?? null,
        meta,
        { email: dto.email },
      );
      throw invalidCredentials();
    }

    if (account.status === AccountStatus.SUSPENDED) {
      throw new ForbiddenException({
        code: ErrorCode.AUTH_ACCOUNT_SUSPENDED,
        message: 'Account is suspended',
      });
    }
    if (account.status === AccountStatus.DEACTIVATED) {
      throw new ForbiddenException({
        code: ErrorCode.AUTH_ACCOUNT_DEACTIVATED,
        message: 'Account was deactivated by the hotel',
      });
    }
    // Only revealed after the correct password, so it does not leak which emails are registered.
    if (account.status === AccountStatus.PENDING_VERIFICATION) {
      throw new ForbiddenException({
        code: ErrorCode.AUTH_EMAIL_NOT_VERIFIED,
        message: 'Email is not verified. Enter the code we sent to your email.',
      });
    }
    if (account.status !== AccountStatus.ACTIVE) {
      throw invalidCredentials();
    }

    await this.prisma.userAccount.update({
      where: { userAccountId: account.userAccountId },
      data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() },
    });
    const tokens = await this.tokens.createSession(account, meta);
    await this.audit.log(
      AuditAction.LOGIN_SUCCESS,
      account.userAccountId,
      meta,
    );

    return { account: toAccountResponse(account), tokens };
  }

  private async recordFailedLogin(accountId: string, meta: RequestMeta) {
    const { failedLoginCount } = await this.prisma.userAccount.update({
      where: { userAccountId: accountId },
      data: { failedLoginCount: { increment: 1 } },
      select: { failedLoginCount: true },
    });
    if (failedLoginCount >= MAX_FAILED_LOGINS) {
      await this.prisma.userAccount.update({
        where: { userAccountId: accountId },
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
        userAccountId: user.accountId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: {
        authSessionId: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        lastUsedAt: true,
        expiresAt: true,
      },
      orderBy: { lastUsedAt: 'desc' },
    });
    return sessions.map(({ authSessionId, ipAddress, ...rest }) => ({
      id: authSessionId,
      ip: ipAddress,
      ...rest,
      current: authSessionId === user.sessionId,
    }));
  }

  async revokeSession(user: AuthUser, sessionId: string, meta: RequestMeta) {
    const revoked = await this.tokens.revokeSession(sessionId, user.accountId);
    if (!revoked) {
      throw new NotFoundException({
        code: ErrorCode.AUTH_SESSION_NOT_FOUND,
        message: 'Session not found',
      });
    }
    await this.audit.log(AuditAction.SESSION_REVOKED, user.accountId, meta, {
      sessionId,
    });
  }

  async me(accountId: string) {
    const account = await this.prisma.userAccount.findUniqueOrThrow({
      where: { userAccountId: accountId },
      select: accountSelect,
    });
    return toAccountResponse(account);
  }

  // ── Email verification ───────────────────────────────────

  /** Activates a PENDING_VERIFICATION account with the mailed code, then signs it in. */
  async verifyEmail(
    dto: VerifyEmailDto,
    meta: RequestMeta,
  ): Promise<{ account: AccountResponse; tokens: TokenPair }> {
    const pending = await this.prisma.userAccount.findUnique({
      where: { email: dto.email },
      select: { userAccountId: true, status: true },
    });
    // Unknown and already verified emails get the same answer as a wrong code (no account enumeration).
    if (pending?.status !== AccountStatus.PENDING_VERIFICATION) {
      throw new BadRequestException({
        code: ErrorCode.AUTH_OTP_INVALID,
        message: 'Incorrect code',
      });
    }

    await this.verification.verifyEmailOtp(pending.userAccountId, dto.code);
    await this.prisma.userAccount.updateMany({
      where: {
        userAccountId: pending.userAccountId,
        status: AccountStatus.PENDING_VERIFICATION,
      },
      data: { status: AccountStatus.ACTIVE, emailVerifiedAt: new Date() },
    });

    const account = await this.prisma.userAccount.findUniqueOrThrow({
      where: { userAccountId: pending.userAccountId },
      select: accountSelect,
    });
    const tokens = await this.tokens.createSession(account, meta);
    await this.audit.log(
      AuditAction.EMAIL_VERIFIED,
      account.userAccountId,
      meta,
    );
    return { account: toAccountResponse(account), tokens };
  }

  /** Mails a new code. Silent when the email is unknown or already verified (no account enumeration). */
  async resendVerification(email: string) {
    const account = await this.prisma.userAccount.findUnique({
      where: { email },
    });
    if (account?.status !== AccountStatus.PENDING_VERIFICATION) return;
    await this.sendVerificationEmail(account.userAccountId, account.email);
  }

  private async sendVerificationEmail(accountId: string, email: string) {
    const code = await this.verification.issueEmailOtp(accountId);
    const ttl = this.config.get('EMAIL_OTP_TTL_MINUTES', { infer: true });
    await this.mail.send({
      to: email,
      subject: 'Your StayReco verification code',
      text: `Your verification code is ${code}. It expires in ${ttl} minutes.\n\nIf you did not create a StayReco account, ignore this email.`,
    });
  }

  // ── Passwords ────────────────────────────────────────────

  /** Silent when the email is unknown (no account enumeration). */
  async forgotPassword(email: string) {
    const account = await this.prisma.userAccount.findUnique({
      where: { email },
    });
    if (!account || account.status !== AccountStatus.ACTIVE) return;

    const token = await this.verification.issue(
      account.userAccountId,
      VerificationTokenType.PASSWORD_RESET,
    );
    await this.mail.send({
      to: account.email,
      subject: 'Reset your password',
      text: `Open this link to reset your password (valid 15 minutes):\n${this.link('reset-password', token)}\n\nIf you did not request this, ignore this email.`,
    });
  }

  async resetPassword(dto: ResetPasswordDto, meta: RequestMeta) {
    const accountId = await this.verification.consume(
      dto.token,
      VerificationTokenType.PASSWORD_RESET,
    );
    const account = await this.prisma.userAccount.findUniqueOrThrow({
      where: { userAccountId: accountId },
    });
    if (account.status !== AccountStatus.ACTIVE) {
      throw new ForbiddenException({
        code: ErrorCode.AUTH_ACCOUNT_INACTIVE,
        message: 'Account is not active',
      });
    }

    await this.prisma.userAccount.update({
      where: { userAccountId: accountId },
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
    const account = await this.prisma.userAccount.findUniqueOrThrow({
      where: { userAccountId: user.accountId },
    });
    const valid = await this.passwords.verify(
      account.passwordHash,
      dto.currentPassword,
    );
    if (!valid) {
      throw new UnauthorizedException({
        code: ErrorCode.AUTH_WRONG_PASSWORD,
        message: 'Current password is incorrect',
      });
    }

    await this.prisma.userAccount.update({
      where: { userAccountId: user.accountId },
      data: { passwordHash: await this.passwords.hash(dto.newPassword) },
    });
    // Keep the device that changed the password signed in.
    await this.tokens.revokeAllSessions(user.accountId, user.sessionId);
    await this.audit.log(AuditAction.PASSWORD_CHANGED, user.accountId, meta);
  }

  // ── Invitations ──────────────────────────────────────────

  async inviteStaff(user: AuthUser, dto: InviteStaffDto, meta: RequestMeta) {
    // A partner's account id is also its hotel_partner id; one staff member works at one hotel.
    const hotel = await this.prisma.hotel.findFirst({
      where: { hotelId: dto.hotelId, hotelPartnerId: user.accountId },
      select: { hotelId: true },
    });
    if (!hotel) {
      throw new NotFoundException({
        code: ErrorCode.HOTEL_NOT_FOUND,
        message: 'Hotel not found',
      });
    }
    // Like every other partner write: a suspended partner keeps read access only.
    await this.hotelAccess.assertPartnerNotSuspended(user.accountId);

    const existing = await this.prisma.userAccount.findUnique({
      where: { email: dto.email },
      include: { hotelStaff: true },
    });
    const canResend =
      existing?.status === AccountStatus.INVITED &&
      existing.hotelStaff?.hotelId === hotel.hotelId;
    if (existing && !canResend) throw emailTaken();

    const account =
      existing ??
      (await this.createAccountOrConflict({
        email: dto.email,
        fullName: dto.fullName,
        role: UserRole.HOTEL_STAFF,
        status: AccountStatus.INVITED,
        hotelStaff: {
          create: {
            position: dto.position,
            hotel: { connect: { hotelId: hotel.hotelId } },
          },
        },
      }));

    await this.sendInvitation(
      account.userAccountId,
      account.email,
      'hotel staff',
    );
    await this.audit.log(AuditAction.ACCOUNT_INVITED, user.accountId, meta, {
      invitedAccountId: account.userAccountId,
      role: UserRole.HOTEL_STAFF,
    });
    return {
      id: account.userAccountId,
      email: account.email,
      status: account.status,
    };
  }

  async invitePlatformManager(
    user: AuthUser,
    dto: InviteAccountDto,
    meta: RequestMeta,
  ) {
    const existing = await this.prisma.userAccount.findUnique({
      where: { email: dto.email },
    });
    const canResend =
      existing?.status === AccountStatus.INVITED &&
      existing.role === UserRole.PLATFORM_MANAGER;
    if (existing && !canResend) throw emailTaken();

    const account =
      existing ??
      (await this.createAccountOrConflict({
        email: dto.email,
        fullName: dto.fullName,
        role: UserRole.PLATFORM_MANAGER,
        status: AccountStatus.INVITED,
        platformManager: { create: {} },
      }));

    await this.sendInvitation(
      account.userAccountId,
      account.email,
      'platform manager',
    );
    await this.audit.log(AuditAction.ACCOUNT_INVITED, user.accountId, meta, {
      invitedAccountId: account.userAccountId,
      role: UserRole.PLATFORM_MANAGER,
    });
    return {
      id: account.userAccountId,
      email: account.email,
      status: account.status,
    };
  }

  async acceptInvitation(dto: AcceptInvitationDto, meta: RequestMeta) {
    const accountId = await this.verification.consume(
      dto.token,
      VerificationTokenType.ACCOUNT_INVITE,
    );
    const { count } = await this.prisma.userAccount.updateMany({
      where: { userAccountId: accountId, status: AccountStatus.INVITED },
      data: {
        passwordHash: await this.passwords.hash(dto.password),
        status: AccountStatus.ACTIVE,
        emailVerifiedAt: new Date(),
        lastLoginAt: new Date(),
      },
    });
    if (count === 0) {
      throw new ConflictException({
        code: ErrorCode.AUTH_INVITATION_ACCEPTED,
        message: 'Invitation already accepted',
      });
    }

    const account = await this.prisma.userAccount.findUniqueOrThrow({
      where: { userAccountId: accountId },
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

  private async createAccountOrConflict(data: Prisma.UserAccountCreateInput) {
    try {
      return await this.prisma.userAccount.create({
        data,
        select: accountSelect,
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw emailTaken();
      }
      throw err;
    }
  }

  private link(path: string, token: string) {
    const base = this.config.get('WEB_APP_URL', { infer: true });
    return `${base.replace(/\/$/, '')}/${path}?token=${encodeURIComponent(token)}`;
  }
}
