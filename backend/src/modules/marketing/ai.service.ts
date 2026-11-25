import {
  type Content,
  FinishReason,
  type FunctionDeclaration,
  type GenerateContentResponse,
  GoogleGenAI,
  Modality,
} from '@google/genai';
import {
  ForbiddenException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ZodObject } from 'zod';
import { ErrorCode } from '../../common/errors/error-code';
import type { Env } from '../../config/env';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  costOf,
  type GeminiUsageMetadata,
  startOfMonth,
  tokensOf,
} from './model-pricing';
import { geminiResponseSchema } from './response-schema';

/**
 * Who the call is for and what it is for, so the spend can be attributed and capped. A call is billed either to a
 * hotel (marketing, capped per hotel) or to a customer (the assistant chat, capped per customer), never to both.
 */
export type CallContext = (
  | { hotelId: string; customerId?: undefined }
  | { customerId: string; hotelId?: undefined }
) & {
  hotelStaffId?: string | null;
  /** Short label stored on the usage row, e.g. "brand-voice". */
  purpose: string;
};

/** One turn of a tool-using conversation: the model either answers in text or asks for tools to be run. */
export interface ChatRequest {
  system: string;
  contents: Content[];
  tools: FunctionDeclaration[];
}

/** Longest answer we will pay for. A social post is a few hundred tokens; a blog article the top of this. */
const MAX_OUTPUT_TOKENS = 4000;

/**
 * The ways a call can end in the model declining, rather than answering.
 *
 * All of them are one error to the caller: a staff member who asked for a post about a discount does not need to
 * know which filter stopped it, only that this brief will not be written and the next one might be.
 */
const REFUSALS: readonly FinishReason[] = [
  FinishReason.SAFETY,
  FinishReason.PROHIBITED_CONTENT,
  FinishReason.BLOCKLIST,
  FinishReason.SPII,
  FinishReason.RECITATION,
  FinishReason.IMAGE_SAFETY,
];

const disabled = () =>
  new ServiceUnavailableException({
    code: ErrorCode.AI_UNAVAILABLE,
    message: 'The AI writer is not configured',
  });

const unusable = (message: string) =>
  new ServiceUnavailableException({ code: ErrorCode.AI_UNAVAILABLE, message });

/**
 * The one place the backend talks to the model (Gemini).
 *
 * Every call goes through `ask`, which checks the hotel's remaining budget first, then records what the call cost.
 * Both halves live here rather than in each caller, so a new feature cannot forget either: phase 5 asks for costs
 * capped and every call logged, and that only holds if there is a single door.
 *
 * The model is reached through one method and one provider interface on purpose. Swapping Gemini for another model
 * is this file; it was Claude until the team moved, and nothing outside this file changed.
 */
@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly client: GoogleGenAI | null;
  private readonly model: string;
  private readonly imageModel: string;
  private readonly monthlyBudget: number;
  private readonly assistantBudget: number;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    const apiKey = config.get('GEMINI_API_KEY', { infer: true });
    // No key means the feature is off, not that the server cannot start - as with Cloudinary.
    this.client = apiKey ? new GoogleGenAI({ apiKey }) : null;
    this.model = config.get('GEMINI_MODEL', { infer: true });
    this.imageModel = config.get('GEMINI_IMAGE_MODEL', { infer: true });
    this.monthlyBudget = config.get('AI_MONTHLY_BUDGET_USD', { infer: true });
    this.assistantBudget = config.get('AI_ASSISTANT_MONTHLY_BUDGET_USD', {
      infer: true,
    });
    if (!this.client) {
      this.logger.warn('GEMINI_API_KEY is not set: the AI writer is off');
    }
  }

  get available() {
    return this.client !== null;
  }

  /** What the hotel has spent this calendar month, and what is left of its cap. */
  budget(hotelId: string, now = new Date()) {
    return this.spend({ hotelId }, this.monthlyBudget, now);
  }

  /** What a customer's assistant chat has spent this calendar month, and what is left of its cap. */
  customerBudget(customerId: string, now = new Date()) {
    return this.spend({ customerId }, this.assistantBudget, now);
  }

  private async spend(
    owner: { hotelId: string } | { customerId: string },
    limitUsd: number,
    now: Date,
  ) {
    const { _sum } = await this.prisma.aiUsage.aggregate({
      where: { ...owner, createdAt: { gte: startOfMonth(now) } },
      _sum: { costUsd: true },
    });
    const spent = _sum.costUsd ?? new Prisma.Decimal(0);
    const limit = new Prisma.Decimal(limitUsd);
    return {
      spentUsd: spent.toNumber(),
      limitUsd: limit.toNumber(),
      remainingUsd: Math.max(limit.minus(spent).toNumber(), 0),
    };
  }

  /**
   * Asks the model for a structured answer, and records what it cost.
   *
   * The budget is checked before the call and the usage written after it, so a hotel that is over its cap is
   * refused rather than billed. The check is not a transaction: two calls starting at once can both pass it, which
   * can overshoot by one call. That is deliberate - a cap measured in dollars a month does not need to be exact,
   * and locking the whole hotel for the length of a model call would cost more than the overshoot.
   *
   * The answer is parsed back through `schema` even though the model was given that schema to follow. Structured
   * output is a strong request, not a guarantee, and the shape the rest of the code relies on is cheap to check.
   */
  async ask<T extends ZodObject>(
    context: CallContext,
    schema: T,
    system: string,
    prompt: string,
  ): Promise<T['_zod']['output']> {
    if (!this.client) throw disabled();
    await this.assertBudget(context);

    const response = await this.client.models.generateContent({
      model: this.model,
      contents: prompt,
      config: {
        // The brand voice is the stable half of the prompt, which is why it is the half sent as the instruction.
        systemInstruction: system,
        responseMimeType: 'application/json',
        responseJsonSchema: geminiResponseSchema(schema),
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        // Thinking is billed at the output rate and buys nothing here: the hard part of writing a caption in a
        // given voice is the voice, not the reasoning. Off, a draft costs a fraction of a cent.
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    // Recorded before anything is thrown: a call that was refused or came back unusable was still paid for.
    await this.record(context, this.model, response.usageMetadata);

    const finish = this.assertAnswered(response);
    if (finish === FinishReason.MAX_TOKENS) {
      throw unusable('The model ran out of room before finishing');
    }

    const text = response.text;
    if (!text) throw unusable('The model returned nothing');

    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      throw unusable('The model did not answer in JSON');
    }
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      this.logger.warn(`Model answer off-schema: ${parsed.error.message}`);
      throw unusable('The model did not answer in the expected shape');
    }
    return parsed.data;
  }

  /**
   * Asks the image model for one picture, and records what it cost (A4).
   *
   * The same door as `ask`: the budget is checked first and the call recorded whatever comes back, so a picture is
   * capped with the words, in the same monthly dollars. An image costs far more than a caption, which is why the
   * price list carries the image model separately.
   */
  async image(context: CallContext, prompt: string): Promise<Buffer> {
    if (!this.client) throw disabled();
    await this.assertBudget(context);

    const response = await this.client.models.generateContent({
      model: this.imageModel,
      contents: prompt,
      config: {
        responseModalities: [Modality.IMAGE],
        // Square crops cleanly to every feed, Instagram's included.
        imageConfig: { aspectRatio: '1:1' },
      },
    });
    await this.record(context, this.imageModel, response.usageMetadata);
    this.assertAnswered(response);

    const data = response.candidates?.[0]?.content?.parts?.find(
      (p) => p.inlineData?.data,
    )?.inlineData?.data;
    if (!data) throw unusable('The model returned no picture');
    return Buffer.from(data, 'base64');
  }

  /**
   * One turn of a conversation that may call tools (the customer assistant).
   *
   * Same door as `ask`: the budget is checked first and the call recorded whatever comes back. The caller runs the
   * tools the model asks for (`response.functionCalls`) and calls again with their results appended to `contents`;
   * keeping that loop outside this file keeps the tools, which read customer data, out of the model plumbing.
   */
  async chat(
    context: CallContext,
    request: ChatRequest,
  ): Promise<GenerateContentResponse> {
    if (!this.client) throw disabled();
    await this.assertBudget(context);

    const response = await this.client.models.generateContent({
      model: this.model,
      contents: request.contents,
      config: {
        systemInstruction: request.system,
        // No tools on the last round of a loop: the model has to answer with what it has.
        ...(request.tools.length && {
          tools: [{ functionDeclarations: request.tools }],
        }),
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        // Choosing a tool and reading its result is shallow reasoning; thinking would bill every turn at the output
        // rate for little gain.
        thinkingConfig: { thinkingBudget: 0 },
      },
    });
    await this.record(context, this.model, response.usageMetadata);

    const finish = this.assertAnswered(response);
    if (finish === FinishReason.MAX_TOKENS) {
      throw unusable('The model ran out of room before finishing');
    }
    return response;
  }

  /** Refuses a hotel or a customer over its monthly cap before anything is spent. */
  private async assertBudget(context: CallContext) {
    const { remainingUsd, limitUsd } =
      context.customerId !== undefined
        ? await this.customerBudget(context.customerId)
        : await this.budget(context.hotelId);
    if (remainingUsd <= 0) {
      throw new ForbiddenException({
        code: ErrorCode.AI_BUDGET_EXCEEDED,
        message:
          context.customerId !== undefined
            ? `You have used this month's $${limitUsd} of assistant chat`
            : `This hotel has used its $${limitUsd} of AI for this month`,
      });
    }
  }

  /**
   * Throws when the model declined. A prompt can be stopped before the model sees it, or the answer stopped on its
   * way out; both are a refusal. Returns the finish reason for the checks that are not.
   */
  private assertAnswered(response: GenerateContentResponse) {
    const finish = response.candidates?.[0]?.finishReason;
    if (
      response.promptFeedback?.blockReason ??
      (finish && REFUSALS.includes(finish))
    ) {
      throw new ForbiddenException({
        code: ErrorCode.AI_REFUSED,
        message: 'The model declined to do this',
      });
    }
    return finish;
  }

  /** Writes the usage row. A failure here is logged, never thrown: the caller already has its answer. */
  private async record(
    context: CallContext,
    model: string,
    usage: GeminiUsageMetadata | undefined,
  ) {
    const tokens = tokensOf(usage);
    try {
      const data: Prisma.AiUsageUncheckedCreateInput = {
        hotelId: context.hotelId ?? null,
        customerId: context.customerId ?? null,
        hotelStaffId: context.hotelStaffId ?? null,
        purpose: context.purpose,
        model,
        ...tokens,
        costUsd: costOf(model, tokens),
      };
      await this.prisma.aiUsage.create({ data });
    } catch (err) {
      this.logger.error('Failed to record AI usage', err);
    }
  }
}
