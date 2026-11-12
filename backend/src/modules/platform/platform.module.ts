import { Module } from '@nestjs/common';
import { PlatformExportService } from './platform-export.service';
import { PlatformLedgerService } from './platform-ledger.service';
import { PlatformStatsService } from './platform-stats.service';
import { PlatformController } from './platform.controller';

@Module({
  controllers: [PlatformController],
  providers: [
    PlatformStatsService,
    PlatformLedgerService,
    PlatformExportService,
  ],
  exports: [PlatformStatsService],
})
export class PlatformModule {}
