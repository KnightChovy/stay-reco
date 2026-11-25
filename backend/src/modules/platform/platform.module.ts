import { Module } from '@nestjs/common';
import { ComplianceController } from './compliance.controller';
import { ComplianceService } from './compliance.service';
import { PlatformExportService } from './platform-export.service';
import { PlatformLedgerService } from './platform-ledger.service';
import { PlatformOpsService } from './platform-ops.service';
import { PlatformStatsService } from './platform-stats.service';
import { PlatformController } from './platform.controller';

@Module({
  controllers: [PlatformController, ComplianceController],
  providers: [
    PlatformStatsService,
    PlatformLedgerService,
    PlatformExportService,
    PlatformOpsService,
    ComplianceService,
  ],
  exports: [PlatformStatsService],
})
export class PlatformModule {}
