import {
  occupancyForecastQuerySchema,
  statsRangeQuerySchema,
  statsSeriesQuerySchema,
  todayStatsQuerySchema,
} from '@stayreco/shared';
import { zodDto } from '../../../common/pipes/validation';

export class StatsRangeQueryDto extends zodDto(statsRangeQuerySchema) {}
export class StatsSeriesQueryDto extends zodDto(statsSeriesQuerySchema) {}
export class OccupancyForecastQueryDto extends zodDto(
  occupancyForecastQuerySchema,
) {}
export class TodayStatsQueryDto extends zodDto(todayStatsQuerySchema) {}
