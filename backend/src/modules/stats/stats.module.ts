import { Module } from '@nestjs/common';
import { ActionItemsService } from './action-items.service';
import { PortfolioController } from './portfolio.controller';
import { PortfolioService } from './portfolio.service';
import { StatsExportService } from './stats-export.service';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';

@Module({
  controllers: [StatsController, PortfolioController],
  providers: [
    StatsService,
    ActionItemsService,
    StatsExportService,
    PortfolioService,
  ],
})
export class StatsModule {}
