import { Injectable } from '@nestjs/common';
import type {
  BrandVoice,
  LearnBrandVoiceInput,
  UpdateBrandVoiceInput,
} from '@stayreco/shared';
import { z } from 'zod';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from './ai.service';

/** `ai_config` keys this service owns. Free-form elsewhere, fixed here so the writer knows what to read. */
const KEYS = {
  summary: 'brand_voice_summary',
  audience: 'brand_audience',
  highlights: 'brand_highlights',
  forbidden: 'brand_forbidden_words',
} as const;

/** What the model gives back when it reads a hotel's existing posts. */
const learnedVoiceSchema = z.object({
  summary: z
    .string()
    .describe(
      'Two or three sentences describing the voice: how it addresses the reader, how formal, how long its sentences run.',
    ),
  audience: z.string().describe('Who these posts seem to be written for.'),
  highlights: z
    .string()
    .describe('The things this hotel keeps selling, comma separated.'),
});

const LEARN_SYSTEM = `You read a hotel's own marketing posts and describe the voice they are written in, so that later posts can match it.

Describe only what is actually there. Do not flatter the writing, do not suggest improvements, and do not invent facts about the hotel that the posts do not show. Write your answer in the same language as the posts.`;

/**
 * The hotel's brand voice (decision M1). Rather than ask an owner to describe their own tone - which few can do, and
 * fewer do consistently - they paste a handful of posts they are happy with and the model writes the description.
 * That description is then part of every later prompt, which is what keeps a chain hotel's posts from reading like a
 * homestay's.
 *
 * It is stored in `ai_config`, the key-value table the schema already had, so adding a field needs no migration.
 */
@Injectable()
export class BrandVoiceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
  ) {}

  async get(hotelId: string): Promise<BrandVoice> {
    const partnerId = await this.partnerOf(hotelId);
    const rows = await this.prisma.aiConfig.findMany({
      where: { hotelPartnerId: partnerId, isActive: true },
    });
    const value = (key: string) =>
      rows.find((r) => r.configKey === key)?.configValue ?? null;
    return {
      summary: value(KEYS.summary),
      audience: value(KEYS.audience),
      highlights: value(KEYS.highlights),
      forbiddenWords: value(KEYS.forbidden),
      updatedAt:
        rows
          .map((r) => r.updatedAt)
          .sort((a, b) => b.getTime() - a.getTime())[0]
          ?.toISOString() ?? null,
    };
  }

  /** Writes the fields given and leaves the rest alone, so one screen can own one field. */
  async update(
    hotelId: string,
    input: UpdateBrandVoiceInput,
  ): Promise<BrandVoice> {
    const partnerId = await this.partnerOf(hotelId);
    const pairs: [string, string | null | undefined][] = [
      [KEYS.summary, input.summary],
      [KEYS.audience, input.audience],
      [KEYS.highlights, input.highlights],
      [KEYS.forbidden, input.forbiddenWords],
    ];
    await this.prisma.$transaction(async (tx) => {
      for (const [key, value] of pairs) {
        if (value === undefined) continue;
        await tx.aiConfig.deleteMany({
          where: { hotelPartnerId: partnerId, configKey: key },
        });
        if (value === null) continue;
        await tx.aiConfig.create({
          data: {
            hotelPartnerId: partnerId,
            configKey: key,
            configValue: value,
            description: 'Brand voice for the AI marketing writer',
          },
        });
      }
    });
    return this.get(hotelId);
  }

  /** Reads the posts the hotel pasted in and saves the voice the model finds in them. */
  async learn(
    user: AuthUser,
    hotelId: string,
    input: LearnBrandVoiceInput,
  ): Promise<BrandVoice> {
    const samples = input.samples
      .map((s, i) => `--- Post ${i + 1} ---\n${s}`)
      .join('\n\n');
    const learned = await this.ai.ask(
      {
        hotelId,
        // Null when the caller is the owning partner: only staff have a row to attribute the cost to.
        hotelStaffId: await this.staffIdOf(user, hotelId),
        purpose: 'brand-voice',
      },
      learnedVoiceSchema,
      LEARN_SYSTEM,
      `Here are posts this hotel has published. Describe the voice they share.\n\n${samples}`,
    );
    return this.update(hotelId, learned);
  }

  /**
   * The brand voice as a block of prompt text, for the writer to put in its system prompt. A hotel that has not set
   * one up gets a short neutral brief rather than nothing, so the writer still works on day one.
   */
  async promptFor(hotelId: string): Promise<string> {
    const voice = await this.get(hotelId);
    const hotel = await this.prisma.hotel.findUniqueOrThrow({
      where: { hotelId },
      select: { name: true, city: true },
    });
    const lines = [`Hotel: ${hotel.name}, ${hotel.city}.`];
    if (voice.summary) lines.push(`Voice: ${voice.summary}`);
    if (voice.audience) lines.push(`Audience: ${voice.audience}`);
    if (voice.highlights) lines.push(`Keeps selling: ${voice.highlights}`);
    if (voice.forbiddenWords) {
      lines.push(`Never use these words: ${voice.forbiddenWords}`);
    }
    if (!voice.summary) {
      lines.push(
        'Voice: no brand voice has been set up yet, so write warmly and plainly, and avoid superlatives.',
      );
    }
    return lines.join('\n');
  }

  /** The staff row of the caller at this hotel, or null when the caller is the owner. */
  private async staffIdOf(user: AuthUser, hotelId: string) {
    const staff = await this.prisma.hotelStaff.findFirst({
      where: { hotelStaffId: user.accountId, hotelId },
      select: { hotelStaffId: true },
    });
    return staff?.hotelStaffId ?? null;
  }

  /** `ai_config` hangs off the partner, not the hotel, so a chain shares one voice across its hotels. */
  private async partnerOf(hotelId: string): Promise<string> {
    const hotel = await this.prisma.hotel.findUniqueOrThrow({
      where: { hotelId },
      select: { hotelPartnerId: true },
    });
    return hotel.hotelPartnerId;
  }
}
