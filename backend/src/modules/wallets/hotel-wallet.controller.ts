import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { walletTransactionResponseSchema } from '@stayreco/shared';
import { HotelAccessRequired } from '../../common/hotel-access/hotel-access.guard';
import { ApiPage } from '../../common/swagger/api-docs.decorators';
import { WalletTransactionListQueryDto } from './dto/wallet.dto';
import { HotelWalletService } from './hotel-wallet.service';

/** The hotel wallet for its owner (revenue page). Read-only, so it keeps working while the partner is suspended. */
@ApiTags('wallet')
@Controller('hotels/:hotelId/wallet')
export class HotelWalletController {
  constructor(private readonly wallet: HotelWalletService) {}

  @ApiOperation({
    summary: "The hotel wallet's movements, newest first",
    description:
      '`type` may be repeated; `from` / `to` are Vietnam dates, each optional and inclusive. `amount` is signed (+ credit, − debit); a `SETTLEMENT` is a pair of rows (pending −, available +). Balances now are in `stats/overview` (`wallet`).',
  })
  @HotelAccessRequired('owner-view')
  @ApiPage(walletTransactionResponseSchema)
  @Get('transactions')
  transactions(
    @Param('hotelId') hotelId: string,
    @Query() query: WalletTransactionListQueryDto,
  ) {
    return this.wallet.transactions(hotelId, query);
  }
}
