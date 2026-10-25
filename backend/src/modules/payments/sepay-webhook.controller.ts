import {
  Body,
  Controller,
  UseGuards,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiBody, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator';
import { ErrorCode } from '../../common/errors/error-code';
import { sepayWebhookResultResponseSchema } from '@stayreco/shared';
import { ApiData, ApiErrors } from '../../common/swagger/api-docs.decorators';
import { SepayApiKeyGuard } from './sepay-api-key.guard';
import { SepayWebhookService } from './sepay-webhook.service';

@ApiTags('payments')
@Public()
@SkipThrottle()
@UseGuards(SepayApiKeyGuard)
@Controller()
export class SepayWebhookController {
  constructor(private readonly webhook: SepayWebhookService) {}

  @ApiOperation({
    summary: 'SePay webhook: one bank transaction on the platform account',
    description:
      'Called by SePay, not by clients. An incoming transfer whose content holds a booking code and exactly its amount confirms the booking; any other transfer is kept in the audit log for manual handling. Answers `{ success: true }` for every notification with a valid API key, so SePay does not resend it.',
  })
  @ApiHeader({
    name: 'Authorization',
    required: true,
    description:
      '`Apikey <SEPAY_WEBHOOK_API_KEY>`, as configured in the SePay dashboard.',
  })
  @ApiBody({
    description:
      'What SePay posts (docs.sepay.vn, "Tích hợp WebHooks"). Read leniently: text fields may be null or numbers, `id` a number or a string, `transferType` in any case.',
    schema: {
      type: 'object',
      required: ['id', 'transferType', 'transferAmount'],
      example: {
        id: 92704,
        gateway: 'Vietcombank',
        transactionDate: '2024-07-02 11:08:33',
        accountNumber: '1017588888',
        subAccount: '',
        code: null,
        content: 'SR-261025-0842 chuyen tien',
        transferType: 'in',
        description: 'NGUYEN VAN A chuyen tien',
        transferAmount: 2000000,
        accumulated: 105000000,
        referenceCode: 'FT24012345678',
      },
    },
  })
  @ApiData(sepayWebhookResultResponseSchema)
  @ApiErrors(ErrorCode.INVALID_API_KEY)
  @Post('payments/sepay/webhook')
  @HttpCode(HttpStatus.OK)
  // The body is checked by the service, not the global pipe, so a refused payload can be logged and kept.
  async receive(@Body() body: unknown) {
    const transaction = await this.webhook.parse(body);
    const outcome = await this.webhook.handle(transaction);
    return { outcome };
  }
}
