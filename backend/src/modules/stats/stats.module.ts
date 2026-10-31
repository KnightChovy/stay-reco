import { Module } from '@nestjs/common';
import { ActionItemsService } from './action-items.service';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';

@Module({
  controllers: [StatsController],
  providers: [StatsService, ActionItemsService],
})
export class StatsModule {}
