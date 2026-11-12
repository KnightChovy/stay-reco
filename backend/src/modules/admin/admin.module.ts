import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { AccountMailer } from './account-mailer';
import { AdminAccountsService } from './admin-accounts.service';
import { AdminPaymentsController } from './admin-payments.controller';
import { AdminPaymentsService } from './admin-payments.service';
import { AdminStatsService } from './admin-stats.service';
import { AdminController } from './admin.controller';
import { AuditLogsService } from './audit-logs.service';

@Module({
  imports: [NotificationsModule],
  controllers: [AdminController, AdminPaymentsController],
  providers: [
    AdminAccountsService,
    AdminStatsService,
    AuditLogsService,
    AccountMailer,
    AdminPaymentsService,
  ],
})
export class AdminModule {}
