import {
  Body,
  Controller,
  UseGuards,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator';
import { ErrorCode } from '../../common/errors/error-code';
import { sepayWebhookResultResponseSchema } from '@stayreco/shared';
import { ApiData, ApiErrors } from '../../common/swagger/api-docs.decorators';
import { SepayTransactionDto } from './dto/sepay.dto';
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
  @ApiData(sepayWebhookResultResponseSchema)
  @ApiErrors(ErrorCode.INVALID_API_KEY)
  @Post('payments/sepay/webhook')
  @HttpCode(HttpStatus.OK)
  async receive(@Body() transaction: SepayTransactionDto) {
    const outcome = await this.webhook.handle(transaction);
    return { outcome };
  }
}
