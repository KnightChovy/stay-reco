import { Injectable } from '@nestjs/common';
import type { Preferences, UpdatePreferencesInput } from '@stayreco/shared';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * The key-value preferences of `customer_preference`: what a customer likes, kept for the screens that ask and for
 * the recommender of [phase 5] to read. The backend does not interpret the keys, so a new preference needs no
 * migration and no backend change; the FE and the recommender agree on their names.
 */
@Injectable()
export class PreferencesService {
  constructor(private readonly prisma: PrismaService) {}

  async get(customerId: string): Promise<Preferences> {
    const rows = await this.prisma.customerPreference.findMany({
      where: { customerId },
      orderBy: { preferenceKey: 'asc' },
    });
    return {
      preferences: Object.fromEntries(
        rows.map((r) => [r.preferenceKey, r.preferenceValue]),
      ),
    };
  }

  /**
   * Writes the keys it is given, removes the ones set to null and leaves the rest alone, so a screen can save the
   * one field it owns without reading the others first. One transaction, so a half-written set cannot be read.
   */
  async update(
    customerId: string,
    input: UpdatePreferencesInput,
  ): Promise<Preferences> {
    const entries = Object.entries(input.preferences);
    await this.prisma.$transaction(async (tx) => {
      const removed = entries
        .filter(([, value]) => value === null)
        .map(([key]) => key);
      if (removed.length) {
        await tx.customerPreference.deleteMany({
          where: { customerId, preferenceKey: { in: removed } },
        });
      }
      for (const [key, value] of entries) {
        if (value === null) continue;
        // `customer_preference` has no unique key on (customer, key), so the write is a delete-then-insert.
        await tx.customerPreference.deleteMany({
          where: { customerId, preferenceKey: key },
        });
        await tx.customerPreference.create({
          data: { customerId, preferenceKey: key, preferenceValue: value },
        });
      }
    });
    return this.get(customerId);
  }
}
