import {
  Body,
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
  createPayoutSchema,
  managerPayoutListQuerySchema,
  managerPayoutResponseSchema,
  payoutListQuerySchema,
  payoutPaidSchema,
  payoutRejectSchema,
  payoutResponseSchema,
} from '@stayreco/shared';
import {
  type AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import {
  ReqMeta,
  type RequestMeta,
} from '../../common/decorators/request-meta.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ErrorCode } from '../../common/errors/error-code';
import { HotelAccessRequired } from '../../common/hotel-access/hotel-access.guard';
import { zodDto } from '../../common/pipes/validation';
import {
  ApiData,
  ApiErrors,
  ApiPage,
} from '../../common/swagger/api-docs.decorators';
import { UserRole } from '../../generated/prisma/client';
import { PayoutsService } from './payouts.service';

class CreatePayoutDto extends zodDto(createPayoutSchema) {}
class PayoutListQueryDto extends zodDto(payoutListQuerySchema) {}
class ManagerPayoutListQueryDto extends zodDto(managerPayoutListQuerySchema) {}
class PayoutPaidDto extends zodDto(payoutPaidSchema) {}
class PayoutRejectDto extends zodDto(payoutRejectSchema) {}

/** Withdrawals (UC59, UC74, BR-22): the owner asks, a platform manager pays or rejects (docs/api/partner.md, manager.md). */
@ApiTags('payouts')
@Controller()
export class PayoutsController {
  constructor(private readonly payouts: PayoutsService) {}

  @HotelAccessRequired('owner-view')
  @ApiOperation({
    summary: "The hotel's withdrawals, newest first",
    description:
      '`status` may be repeated (`PENDING`, `PAID`, `REJECTED`, `CANCELLED`). The beneficiary account is masked.',
  })
  @ApiPage(payoutResponseSchema)
  @Get('hotels/:hotelId/payouts')
  list(@Param('hotelId') hotelId: string, @Query() query: PayoutListQueryDto) {
    return this.payouts.listForHotel(hotelId, query);
  }

  @HotelAccessRequired('owner')
  @ApiOperation({
    summary: 'Ask for a withdrawal to the beneficiary account',
    description:
      'Whole dong, at most the available balance (MSG30); one pending withdrawal per hotel. The amount moves from the available to the reserved balance (a `PAYOUT` movement) until a platform manager pays it or rejects it, within 2 working days. Paid to the account of the latest approved verification request.',
  })
  @ApiData(payoutResponseSchema, HttpStatus.CREATED)
  @ApiErrors(
    ErrorCode.PAYOUT_PENDING,
    ErrorCode.PAYOUT_EXCEEDS_BALANCE,
    ErrorCode.BENEFICIARY_MISSING,
  )
  @Post('hotels/:hotelId/payouts')
  request(
    @CurrentUser() user: AuthUser,
    @Param('hotelId') hotelId: string,
    @Body() dto: CreatePayoutDto,
    @ReqMeta() meta: RequestMeta,
  ) {
    return this.payouts.request(user, hotelId, dto, meta);
  }

  @HotelAccessRequired('owner-view')
  @ApiOperation({
    summary: 'Take back a pending withdrawal',
    description:
      'Also while the partner is suspended. The amount goes back to the available balance (an `ADJUSTMENT` movement).',
  })
  @ApiData(payoutResponseSchema)
  @ApiErrors(ErrorCode.PAYOUT_NOT_FOUND, ErrorCode.PAYOUT_STATUS_CONFLICT)
  @Post('hotels/:hotelId/payouts/:payoutId/cancel')
  @HttpCode(HttpStatus.OK)
  cancel(
    @CurrentUser() user: AuthUser,
    @Param('hotelId') hotelId: string,
    @Param('payoutId') payoutId: string,
    @ReqMeta() meta: RequestMeta,
  ) {
    return this.payouts.cancel(user, hotelId, payoutId, meta);
  }

  @Roles(UserRole.PLATFORM_MANAGER)
  @ApiOperation({
    summary: 'The withdrawal queue',
    description:
      '`PENDING` by default, oldest first so the 2 working days are met; any other `status` selection is newest first. `search` matches the hotel or partner name. Accounts are masked; open one withdrawal for the full number.',
  })
  @ApiPage(managerPayoutResponseSchema)
  @Get('payouts')
  queue(@Query() query: ManagerPayoutListQueryDto) {
    return this.payouts.queue(query);
  }

  @Roles(UserRole.PLATFORM_MANAGER)
  @ApiOperation({
    summary: 'One withdrawal, with the full account number',
    description:
      'The number to transfer to. Each opening is written to the audit log (`PAYOUT_ACCOUNT_VIEWED`).',
  })
  @ApiData(managerPayoutResponseSchema)
  @ApiErrors(ErrorCode.PAYOUT_NOT_FOUND)
  @Get('payouts/:id')
  detail(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @ReqMeta() meta: RequestMeta,
  ) {
    return this.payouts.detail(user, id, meta);
  }

  @Roles(UserRole.PLATFORM_MANAGER)
  @ApiOperation({
    summary: 'Record the bank transfer of a pending withdrawal',
    description:
      'Make the transfer from the bank first, then send its reference. The reserved amount leaves the hotel wallet; the partner is notified and emailed.',
  })
  @ApiData(managerPayoutResponseSchema)
  @ApiErrors(ErrorCode.PAYOUT_NOT_FOUND, ErrorCode.PAYOUT_STATUS_CONFLICT)
  @Post('payouts/:id/paid')
  @HttpCode(HttpStatus.OK)
  markPaid(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: PayoutPaidDto,
    @ReqMeta() meta: RequestMeta,
  ) {
    return this.payouts.markPaid(user, id, dto, meta);
  }

  @Roles(UserRole.PLATFORM_MANAGER)
  @ApiOperation({
    summary: 'Reject a pending withdrawal',
    description:
      'The reason is sent to the partner; the amount goes back to the hotel’s available balance.',
  })
  @ApiData(managerPayoutResponseSchema)
  @ApiErrors(ErrorCode.PAYOUT_NOT_FOUND, ErrorCode.PAYOUT_STATUS_CONFLICT)
  @Post('payouts/:id/reject')
  @HttpCode(HttpStatus.OK)
  reject(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: PayoutRejectDto,
    @ReqMeta() meta: RequestMeta,
  ) {
    return this.payouts.reject(user, id, dto, meta);
  }
}
