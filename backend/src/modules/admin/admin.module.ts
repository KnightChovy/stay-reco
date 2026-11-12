import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { AccountMailer } from './account-mailer';
import { AdminAccountsService } from './admin-accounts.service';
import { AdminStatsService } from './admin-stats.service';
import { AdminController } from './admin.controller';
import { AuditLogsService } from './audit-logs.service';

@Module({
  imports: [NotificationsModule],
  controllers: [AdminController],
  providers: [
    AdminAccountsService,
    AdminStatsService,
    AuditLogsService,
    AccountMailer,
  ],
})
export class AdminModule {}
