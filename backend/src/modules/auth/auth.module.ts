import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './services/auth.service';
import { PasswordService } from './services/password.service';
import { TokenService } from './services/token.service';
import { VerificationService } from './services/verification.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, PasswordService, TokenService, VerificationService],
})
export class AuthModule {}
