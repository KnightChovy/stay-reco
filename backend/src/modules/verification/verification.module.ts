import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { VerificationMailer } from './verification-mailer';
import { VerificationController } from './verification.controller';
import { VerificationService } from './verification.service';

@Module({
  controllers: [UploadsController, VerificationController],
  providers: [VerificationService, VerificationMailer],
})
export class VerificationModule {}
