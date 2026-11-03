import { BadRequestException, Injectable } from '@nestjs/common';
import type { UpdateProfileInput } from '@stayreco/shared';
import type { AuthUser } from '../../../common/decorators/current-user.decorator';
import type { RequestMeta } from '../../../common/decorators/request-meta.decorator';
import { lockAccount } from '../../../common/db/locks';
import { ErrorCode } from '../../../common/errors/error-code';
import { fromCalendarDate } from '../../../common/http/calendar-date';
import { UserRole } from '../../../generated/prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditAction, AuditService } from '../../audit/audit.service';
import { StorageService } from '../../storage/storage.service';
import { type AccountResponse, AuthService } from './auth.service';

/** Fields that belong to one role's profile table; the others are on `user_account`. */
const ROLE_FIELDS = {
  companyName: UserRole.HOTEL_PARTNER,
  dateOfBirth: UserRole.CUSTOMER,
  gender: UserRole.CUSTOMER,
  nationality: UserRole.CUSTOMER,
} satisfies Partial<Record<keyof UpdateProfileInput, UserRole>>;

const validation = (details: { field: string; message: string }[]) =>
  new BadRequestException({
    code: ErrorCode.VALIDATION_ERROR,
    message: 'Validation failed',
    details,
  });

const hasValue = (data: object) =>
  Object.values(data).some((v) => v !== undefined);

/** Avatars of one account; only files under it are ever deleted. */
const avatarFolder = (accountId: string) => `stayreco/avatars/${accountId}`;

/** The signed-in account edits its own profile and avatar, for every role. */
@Injectable()
export class ProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly audit: AuditService,
    private readonly auth: AuthService,
  ) {}

  /** A partner's phone is also its contact phone, so both change together and it cannot be cleared. */
  async update(
    user: AuthUser,
    input: UpdateProfileInput,
    meta: RequestMeta,
  ): Promise<AccountResponse> {
    const otherRole = Object.keys(input).filter(
      (field) =>
        field in ROLE_FIELDS &&
        ROLE_FIELDS[field as keyof typeof ROLE_FIELDS] !== user.role,
    );
    if (otherRole.length) {
      throw validation(
        otherRole.map((field) => ({
          field,
          message: `${field} is not allowed for this account`,
        })),
      );
    }
    if (user.role === UserRole.HOTEL_PARTNER && input.phone === null) {
      throw validation([
        { field: 'phone', message: 'a partner account needs a phone number' },
      ]);
    }

    const partner = {
      partnerName: input.companyName,
      contactPhone: input.phone ?? undefined,
    };
    const customer = {
      dateOfBirth: input.dateOfBirth && fromCalendarDate(input.dateOfBirth),
      gender: input.gender,
      nationality: input.nationality,
    };
    await this.prisma.userAccount.update({
      where: { userAccountId: user.accountId },
      data: {
        fullName: input.fullName,
        phone: input.phone,
        ...(user.role === UserRole.HOTEL_PARTNER &&
          hasValue(partner) && { hotelPartner: { update: partner } }),
        ...(user.role === UserRole.CUSTOMER &&
          hasValue(customer) && { customer: { update: customer } }),
      },
    });
    await this.audit.log(AuditAction.PROFILE_UPDATED, user.accountId, meta, {
      fields: Object.keys(input),
    });
    return this.auth.me(user.accountId);
  }

  /** Replaces the avatar; the previous file is deleted once the new URL is saved. */
  async uploadAvatar(
    user: AuthUser,
    file: Buffer,
    meta: RequestMeta,
  ): Promise<AccountResponse> {
    const { storageKey, url } = await this.storage.uploadImage(
      file,
      avatarFolder(user.accountId),
    );
    let previous: string | null;
    try {
      previous = await this.replaceAvatarUrl(user.accountId, url);
    } catch (err) {
      // Do not leave an orphan file on Cloudinary when the URL could not be saved.
      await this.storage.deleteImage(storageKey);
      throw err;
    }
    await this.deleteAvatarFile(user.accountId, previous);
    await this.audit.log(AuditAction.PROFILE_UPDATED, user.accountId, meta, {
      fields: ['avatarUrl'],
    });
    return this.auth.me(user.accountId);
  }

  /** Back to no avatar; does nothing when there is none. */
  async removeAvatar(user: AuthUser, meta: RequestMeta): Promise<void> {
    const previous = await this.replaceAvatarUrl(user.accountId, null);
    if (!previous) return;
    await this.deleteAvatarFile(user.accountId, previous);
    await this.audit.log(AuditAction.PROFILE_UPDATED, user.accountId, meta, {
      fields: ['avatarUrl'],
    });
  }

  /** Saves `url` and returns the previous one. The row lock keeps two uploads from both keeping the same old file. */
  private replaceAvatarUrl(accountId: string, url: string | null) {
    return this.prisma.$transaction(async (tx) => {
      await lockAccount(tx, accountId);
      const { avatarUrl } = await tx.userAccount.findUniqueOrThrow({
        where: { userAccountId: accountId },
        select: { avatarUrl: true },
      });
      await tx.userAccount.update({
        where: { userAccountId: accountId },
        data: { avatarUrl: url },
      });
      return avatarUrl;
    });
  }

  /** Only files uploaded here: an avatar URL from elsewhere (seed data) is left alone. */
  private async deleteAvatarFile(accountId: string, url: string | null) {
    const key = url && this.storage.imageKeyFromUrl(url);
    if (key?.startsWith(`${avatarFolder(accountId)}/`)) {
      await this.storage.deleteImage(key);
    }
  }
}
