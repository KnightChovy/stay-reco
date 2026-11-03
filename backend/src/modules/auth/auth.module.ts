import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { ProfileController } from './profile.controller';
import { AuthService } from './services/auth.service';
import { PasswordService } from './services/password.service';
import { ProfileService } from './services/profile.service';
import { TokenService } from './services/token.service';
import { VerificationService } from './services/verification.service';

@Module({
  controllers: [AuthController, ProfileController],
  providers: [
    AuthService,
    PasswordService,
    ProfileService,
    TokenService,
    VerificationService,
  ],
})
export class AuthModule {}
