import { Controller, Get, Param, Query, StreamableFile } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  commissionListQuerySchema,
  commissionRowResponseSchema,
  hotelRevenueDetailResponseSchema,
  hotelRevenueListQuerySchema,
  hotelRevenueRowResponseSchema,
  platformCashflowResponseSchema,
  platformExportQuerySchema,
  platformRangeQuerySchema,
  platformRevenueQuerySchema,
  platformRevenueResponseSchema,
  walletTransactionListQuerySchema,
  walletTransactionResponseSchema,
} from '@stayreco/shared';
import { Roles } from '../../common/decorators/roles.decorator';
import { ErrorCode } from '../../common/errors/error-code';
import { zodDto } from '../../common/pipes/validation';
import {
  ApiData,
  ApiErrors,
  ApiFile,
  ApiPage,
} from '../../common/swagger/api-docs.decorators';
import { UserRole } from '../../generated/prisma/client';
import { XLSX_MIME } from '../stats/stats-export.service';
import { PlatformExportService } from './platform-export.service';
import { PlatformLedgerService } from './platform-ledger.service';
import { PlatformStatsService } from './platform-stats.service';

class PlatformRangeQueryDto extends zodDto(platformRangeQuerySchema) {}
class PlatformRevenueQueryDto extends zodDto(platformRevenueQuerySchema) {}
class HotelRevenueListQueryDto extends zodDto(hotelRevenueListQuerySchema) {}
class CommissionListQueryDto extends zodDto(commissionListQuerySchema) {}
class PlatformExportQueryDto extends zodDto(platformExportQuerySchema) {}
class WalletTransactionListQueryDto extends zodDto(
  walletTransactionListQuerySchema,
) {}

const PERIOD =
  '`from` and `to` together (at most 366 days), or neither for the last 30 days up to today.';

/** The platform manager's money figures (UC75, UC76, SRS 3.15; docs/api/manager.md, "Platform figures"). */
@ApiTags('platform')
@Roles(UserRole.PLATFORM_MANAGER)
@Controller('platform')
export class PlatformController {
  constructor(
    private readonly stats: PlatformStatsService,
    private readonly ledger: PlatformLedgerService,
    private readonly exporter: PlatformExportService,
  ) {}

  @ApiOperation({
    summary: 'Platform revenue of a period compared with the previous one',
    description: `GMV, discounts, points, refunds, commission, platform debits and revenue, bookings; a chart by day, week or month and every region. ${PERIOD}`,
  })
  @ApiData(platformRevenueResponseSchema)
  @Get('stats/revenue')
  revenue(@Query() query: PlatformRevenueQueryDto) {
    return this.stats.revenue(query);
  }

  @ApiOperation({
    summary: 'Every hotel past the draft stage over a period',
    description: `The drill-down of the revenue screen. \`search\` matches the hotel or the partner name (Vietnamese marks ignored). ${PERIOD}`,
  })
  @ApiPage(hotelRevenueRowResponseSchema)
  @Get('stats/revenue/hotels')
  hotels(@Query() query: HotelRevenueListQueryDto) {
    return this.stats.hotels(query);
  }

  @ApiOperation({
    summary: 'One hotel: bookings, money, wallet and withdrawals',
    description: `Figures of the period against the previous one, the wallet balances now, withdrawals paid in the period and waiting now. ${PERIOD}`,
  })
  @ApiData(hotelRevenueDetailResponseSchema)
  @ApiErrors(ErrorCode.HOTEL_NOT_FOUND)
  @Get('hotels/:hotelId/revenue')
  hotel(
    @Param('hotelId') hotelId: string,
    @Query() query: PlatformRangeQueryDto,
  ) {
    return this.stats.hotel(hotelId, query);
  }

  @ApiOperation({
    summary: "One hotel's wallet movements, newest first",
    description:
      'The same ledger the owner reads at `GET /hotels/:hotelId/wallet/transactions`.',
  })
  @ApiPage(walletTransactionResponseSchema)
  @ApiErrors(ErrorCode.HOTEL_NOT_FOUND)
  @Get('hotels/:hotelId/wallet/transactions')
  transactions(
    @Param('hotelId') hotelId: string,
    @Query() query: WalletTransactionListQueryDto,
  ) {
    return this.ledger.hotelTransactions(hotelId, query);
  }

  @ApiOperation({
    summary: 'Commission per booking, by check-out date',
    description: `\`CHARGED\` at check-out or no-show, \`EXPECTED\` while the stay is confirmed or under way (total × rate fixed at booking). No refund adjustment: commission is only charged after the stay. \`search\` matches the booking code. ${PERIOD}`,
  })
  @ApiPage(commissionRowResponseSchema)
  @Get('commissions')
  commissions(@Query() query: CommissionListQueryDto) {
    return this.stats.commissions(query);
  }

  @ApiOperation({
    summary: 'Cash flow of a period and the reconciliation of the wallets',
    description: `Where the SePay money of the bookings paid in the period is now, from the wallet ledger (refunded, commission, settled, still held), unmatched transfers, withdrawals paid; and the bank expected against the sum of every wallet, now. ${PERIOD}`,
  })
  @ApiData(platformCashflowResponseSchema)
  @Get('cashflow')
  cashflow(@Query() query: PlatformRangeQueryDto) {
    return this.stats.cashflow(query);
  }

  @ApiOperation({
    summary: 'A report of the period as an Excel file',
    description: `\`report\`: \`revenue\` (overview, series, regions, hotels), \`commissions\` (every booking of the period) or \`cashflow\` (the split and the unmatched transfers). ${PERIOD}`,
  })
  @ApiFile(
    XLSX_MIME,
    'The workbook, named `StayReco_<report>_<from>_<to>.xlsx`.',
  )
  @Get('stats/export')
  async export(@Query() query: PlatformExportQueryDto) {
    const file = await this.exporter.export(query);
    return new StreamableFile(file.content, {
      type: XLSX_MIME,
      disposition: `attachment; filename="${file.fileName}"`,
      length: file.content.length,
    });
  }
}
