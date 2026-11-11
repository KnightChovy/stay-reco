import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  customerWalletResponseSchema,
  walletTransactionResponseSchema,
} from '@stayreco/shared';
import {
  type AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ErrorCode } from '../../common/errors/error-code';
import {
  ApiData,
  ApiErrors,
  ApiPage,
} from '../../common/swagger/api-docs.decorators';
import { UserRole } from '../../generated/prisma/client';
import { CustomerWalletService } from './customer-wallet.service';
import { WalletTransactionListQueryDto } from './dto/wallet.dto';
import { WalletPaymentService } from './wallet-payment.service';

/** The customer's own wallet: filled by refunds, spent on a whole booking (money-rules §5). */
@ApiTags('wallet')
@Controller()
export class CustomerWalletController {
  constructor(
    private readonly wallet: CustomerWalletService,
    private readonly payment: WalletPaymentService,
  ) {}

  @ApiOperation({
    summary: 'My wallet balance',
    description:
      'A customer who has never been refunded reads 0 rather than an error. `balanceAvailable` is what a booking can be paid from; `balancePending` is always 0 for a customer today.',
  })
  @ApiData(customerWalletResponseSchema)
  @Roles(UserRole.CUSTOMER)
  @Get('me/wallet')
  balance(@CurrentUser() user: AuthUser) {
    return this.wallet.balance(user.accountId);
  }

  @ApiOperation({
    summary: 'My wallet movements, newest first',
    description:
      '`type` may be repeated; `from` / `to` are Vietnam dates, each optional and inclusive. `amount` is signed: a refund credits it, paying for a booking debits it.',
  })
  @ApiPage(walletTransactionResponseSchema)
  @Roles(UserRole.CUSTOMER)
  @Get('me/wallet/transactions')
  transactions(
    @CurrentUser() user: AuthUser,
    @Query() query: WalletTransactionListQueryDto,
  ) {
    return this.wallet.transactions(user.accountId, query);
  }

  @ApiOperation({
    summary: 'Pay a booking from my wallet',
    description:
      'All or nothing: the balance must cover the **whole** booking, otherwise `WALLET_INSUFFICIENT` answers with the balance and the total and the customer pays by transfer instead. The booking is confirmed at once, with no transfer and no 15-minute wait, and the confirmation email is sent as usual. Only a booking still waiting for payment; any other status answers `BOOKING_STATUS_CONFLICT`.',
  })
  @ApiErrors(
    ErrorCode.BOOKING_NOT_FOUND,
    ErrorCode.BOOKING_STATUS_CONFLICT,
    ErrorCode.WALLET_INSUFFICIENT,
  )
  @Roles(UserRole.CUSTOMER)
  @Post('bookings/:id/pay-with-wallet')
  @HttpCode(HttpStatus.NO_CONTENT)
  pay(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.payment.pay(user.accountId, id);
  }
}
