import { BadRequestException, Injectable } from '@nestjs/common';
import { VerificationTokenType } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { generateToken, hashToken } from '../crypto.util';

const TTL_MS: Record<VerificationTokenType, number> = {
  EMAIL_VERIFY: 24 * 60 * 60 * 1000,
  PASSWORD_RESET: 30 * 60 * 1000,
  ACCOUNT_INVITE: 72 * 60 * 60 * 1000,
};

@Injectable()
export class VerificationService {
  constructor(private readonly prisma: PrismaService) {}

  /** Creates a one-time token and invalidates older unused ones of the same type. */
  async issue(accountId: string, type: VerificationTokenType): Promise<string> {
    const token = generateToken();
    await this.prisma.$transaction([
      this.prisma.verificationToken.updateMany({
        where: { accountId, type, usedAt: null },
        data: { usedAt: new Date() },
      }),
      this.prisma.verificationToken.create({
        data: {
          accountId,
          type,
          tokenHash: hashToken(token),
          expiresAt: new Date(Date.now() + TTL_MS[type]),
        },
      }),
    ]);
    return token;
  }

  /** Marks the token used and returns its account id. Throws if invalid/expired/used. */
  async consume(token: string, type: VerificationTokenType): Promise<string> {
    const record = await this.prisma.verificationToken.findUnique({
      where: { tokenHash: hashToken(token) },
    });
    if (!record || record.type !== type || record.expiresAt <= new Date()) {
      throw new BadRequestException('Invalid or expired token');
    }

    const { count } = await this.prisma.verificationToken.updateMany({
      where: { id: record.id, usedAt: null },
      data: { usedAt: new Date() },
    });
    if (count === 0) throw new BadRequestException('Invalid or expired token');

    return record.accountId;
  }
}
