import { Controller, Get, Param, Query, StreamableFile } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  actionItemListResponseSchema,
  hotelStatsBreakdownResponseSchema,
  hotelStatsOverviewResponseSchema,
  hotelStatsSeriesResponseSchema,
  hotelTodayStatsResponseSchema,
  occupancyForecastResponseSchema,
} from '@stayreco/shared';
import {
  CurrentHotelAccess,
  HotelAccessRequired,
} from '../../common/hotel-access/hotel-access.guard';
import type { HotelAccess } from '../../common/hotel-access/hotel-access.service';
import {
  ApiAccess,
  ApiData,
  ApiFile,
} from '../../common/swagger/api-docs.decorators';
import { ActionItemsService } from './action-items.service';
import { StatsExportService, XLSX_MIME } from './stats-export.service';
import {
  OccupancyForecastQueryDto,
  StatsRangeQueryDto,
  StatsSeriesQueryDto,
  TodayStatsQueryDto,
} from './dto/stats.dto';
import { StatsService } from './stats.service';

/** Partner dashboard (docs/api/partner-dashboard.md). Read-only, so it keeps working while the partner is suspended. */
@ApiTags('dashboard')
@Controller('hotels/:hotelId')
export class StatsController {
  constructor(
    private readonly stats: StatsService,
    private readonly actionItems: ActionItemsService,
    private readonly exporter: StatsExportService,
  ) {}

  @ApiOperation({
    summary: 'What the hotel should act on now',
    description:
      'At most one item per `type`, with a `count` and typed `params`, ordered by severity. The FE owns the wording and the target screen, and ignores types it does not know.',
  })
  @HotelAccessRequired('member')
  @ApiAccess(
    'The owner (also while suspended) gets every type; staff only the types of their permission groups (overdue check-outs for `FRONT_DESK`, refund requests for `REFUND`, change requests for `BOOKING`).',
  )
  @ApiData(actionItemListResponseSchema)
  @Get('action-items')
  listActionItems(@CurrentHotelAccess() access: HotelAccess) {
    return this.actionItems.list(access);
  }

  @ApiOperation({
    summary: "Today's arrivals, departures, rooms and holds",
    description:
      'The current day in Asia/Ho_Chi_Minh, live; no money. `checkedIn`, `checkedOut` and `inHouse` count the bookings checked in and out at the front desk; an early check-out counts on the booking\x27s check-out date.',
  })
  @HotelAccessRequired('member')
  @ApiData(hotelTodayStatsResponseSchema)
  @Get('stats/today')
  today(@Param('hotelId') hotelId: string, @Query() query: TodayStatsQueryDto) {
    return this.stats.today(hotelId, query);
  }

  @ApiOperation({
    summary: 'KPIs of a period compared with the previous one',
    description:
      'Performance figures by stay date, cash figures from the hotel wallet ledger, each with the same-length previous period; plus the wallet balances now. `from` and `to` together (at most 366 days), or neither for the month to date.',
  })
  @HotelAccessRequired('owner-view')
  @ApiData(hotelStatsOverviewResponseSchema)
  @Get('stats/overview')
  overview(
    @Param('hotelId') hotelId: string,
    @Query() query: StatsRangeQueryDto,
  ) {
    return this.stats.overview(hotelId, query);
  }

  @ApiOperation({
    summary: 'Revenue and occupancy over time',
    description:
      'One point per day, week (from Monday) or month, empty buckets included; the first and last may be partial. Default granularity: `day` up to 31 days, `week` up to 92, otherwise `month`.',
  })
  @HotelAccessRequired('owner-view')
  @ApiData(hotelStatsSeriesResponseSchema)
  @Get('stats/series')
  series(
    @Param('hotelId') hotelId: string,
    @Query() query: StatsSeriesQueryDto,
  ) {
    return this.stats.series(hotelId, query);
  }

  @ApiOperation({
    summary:
      'Figures of a period by room type, booking source, status and payment method',
    description:
      'Room types with the performance figures by stay date (they add up to `stats/overview`), and the bookings created in the period split by source, current status and payment method. `from` and `to` together (at most 366 days), or neither for the month to date.',
  })
  @HotelAccessRequired('owner-view')
  @ApiData(hotelStatsBreakdownResponseSchema)
  @Get('stats/breakdown')
  breakdown(
    @Param('hotelId') hotelId: string,
    @Query() query: StatsRangeQueryDto,
  ) {
    return this.stats.breakdown(hotelId, query);
  }

  @ApiOperation({
    summary: 'The dashboard of a period as an Excel file',
    description:
      'Sheets: overview with the previous period, the chart buckets, room types and booking splits, the bookings created in the period (with what the wallet recorded for each), and the wallet movements of the period with the net received. Same figures as `overview`, `series` and `breakdown`. `from` and `to` together (at most 366 days), or neither for the month to date.',
  })
  @HotelAccessRequired('owner-view')
  @ApiFile(
    XLSX_MIME,
    'The workbook, named `StayReco_<hotel>_<from>_<to>.xlsx`.',
  )
  @Get('stats/export')
  async export(
    @Param('hotelId') hotelId: string,
    @Query() query: StatsRangeQueryDto,
  ) {
    const file = await this.exporter.export(hotelId, query);
    return new StreamableFile(file.content, {
      type: XLSX_MIME,
      disposition: `attachment; filename="${file.fileName}"`,
      length: file.content.length,
    });
  }

  @ApiOperation({
    summary: 'Rooms on the books for the coming days',
    description:
      'Every day from today for `days` days (default 30): booked, held, blocked and free rooms out of the rooms not in maintenance. No money.',
  })
  @HotelAccessRequired('member')
  @ApiData(occupancyForecastResponseSchema)
  @Get('stats/occupancy-forecast')
  occupancyForecast(
    @Param('hotelId') hotelId: string,
    @Query() query: OccupancyForecastQueryDto,
  ) {
    return this.stats.forecast(hotelId, query.days);
  }
}
