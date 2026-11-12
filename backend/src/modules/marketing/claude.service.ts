import Anthropic from '@anthropic-ai/sdk';
import {
  ForbiddenException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ZodObject } from 'zod';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { ErrorCode } from '../../common/errors/error-code';
import type { Env } from '../../config/env';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { costOf, startOfMonth } from './model-pricing';

/** Who the call is for and what it is for, so the spend can be attributed and capped. */
export interface CallContext {
  hotelId: string;
  hotelStaffId?: string | null;
  /** Short label stored on the usage row, e.g. "brand-voice". */
  purpose: string;
}

const disabled = () =>
  new ServiceUnavailableException({
    code: ErrorCode.AI_UNAVAILABLE,
    message: 'The AI writer is not configured',
  });

/**
 * The one place the backend talks to Claude.
 *
 * Every call goes through `ask`, which checks the hotel's remaining budget first, then records what the call cost.
 * Both halves live here rather than in each caller, so a new feature cannot forget either: phase 5 asks for costs
 * capped and every call logged, and that only holds if there is a single door.
 */
@Injectable()
export class ClaudeService {
  private readonly logger = new Logger(ClaudeService.name);
  private readonly client: Anthropic | null;
  private readonly model: string;
  private readonly monthlyBudget: number;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    const apiKey = config.get('ANTHROPIC_API_KEY', { infer: true });
    // No key means the feature is off, not that the server cannot start - as with Cloudinary.
    this.client = apiKey ? new Anthropic({ apiKey }) : null;
    this.model = config.get('ANTHROPIC_MODEL', { infer: true });
    this.monthlyBudget = config.get('AI_MONTHLY_BUDGET_USD', { infer: true });
    if (!this.client) {
      this.logger.warn('ANTHROPIC_API_KEY is not set: the AI writer is off');
    }
  }

  get available() {
    return this.client !== null;
  }

  /** What the hotel has spent this calendar month, and what is left of its cap. */
  async budget(hotelId: string, now = new Date()) {
    const { _sum } = await this.prisma.aiUsage.aggregate({
      where: { hotelId, createdAt: { gte: startOfMonth(now) } },
      _sum: { costUsd: true },
    });
    const spent = _sum.costUsd ?? new Prisma.Decimal(0);
    const limit = new Prisma.Decimal(this.monthlyBudget);
    return {
      spentUsd: spent.toNumber(),
      limitUsd: limit.toNumber(),
      remainingUsd: Math.max(limit.minus(spent).toNumber(), 0),
    };
  }

  /**
   * Asks Claude for a structured answer, and records what it cost.
   *
   * The budget is checked before the call and the usage written after it, so a hotel that is over its cap is
   * refused rather than billed. The check is not a transaction: two calls starting at once can both pass it, which
   * can overshoot by one call. That is deliberate - a cap measured in dollars a month does not need to be exact,
   * and locking the whole hotel for the length of a model call would cost more than the overshoot.
   */
  async ask<T extends ZodObject>(
    context: CallContext,
    schema: T,
    system: string,
    prompt: string,
  ): Promise<T['_zod']['output']> {
    if (!this.client) throw disabled();

    const { remainingUsd, limitUsd } = await this.budget(context.hotelId);
    if (remainingUsd <= 0) {
      throw new ForbiddenException({
        code: ErrorCode.AI_BUDGET_EXCEEDED,
        message: `This hotel has used its $${limitUsd} of AI for this month`,
      });
    }

    const response = await this.client.messages.parse({
      model: this.model,
      max_tokens: 4000,
      // The brand voice is the stable part of the prompt, so it is the half worth caching.
      system: [
        { type: 'text', text: system, cache_control: { type: 'ephemeral' } },
      ],
      messages: [{ role: 'user', content: prompt }],
      output_config: { format: zodOutputFormat(schema) },
    });

    await this.record(context, response.usage);

    if (response.stop_reason === 'refusal') {
      throw new ForbiddenException({
        code: ErrorCode.AI_REFUSED,
        message: 'The model declined to write this',
      });
    }
    if (!response.parsed_output) {
      throw new ServiceUnavailableException({
        code: ErrorCode.AI_UNAVAILABLE,
        message: 'The model did not answer in the expected shape',
      });
    }
    return response.parsed_output;
  }

  /** Writes the usage row. A failure here is logged, never thrown: the caller already has its answer. */
  private async record(
    context: CallContext,
    usage: {
      input_tokens: number;
      output_tokens: number;
      cache_read_input_tokens?: number | null;
    },
  ) {
    const tokens = {
      inputTokens: usage.input_tokens,
      outputTokens: usage.output_tokens,
      cacheReadTokens: usage.cache_read_input_tokens ?? 0,
    };
    try {
      await this.prisma.aiUsage.create({
        data: {
          hotelId: context.hotelId,
          hotelStaffId: context.hotelStaffId ?? null,
          purpose: context.purpose,
          model: this.model,
          ...tokens,
          costUsd: costOf(this.model, tokens),
        },
      });
    } catch (err) {
      this.logger.error('Failed to record AI usage', err);
    }
  }
}
