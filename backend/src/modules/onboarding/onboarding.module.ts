import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';
import { WelcomeVoucherService } from './welcome-voucher.service';

@Module({
  imports: [NotificationsModule],
  controllers: [OnboardingController],
  providers: [OnboardingService, WelcomeVoucherService],
})
export class OnboardingModule {}
