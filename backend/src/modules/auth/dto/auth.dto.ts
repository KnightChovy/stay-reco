import {
  acceptInvitationSchema,
  changePasswordSchema,
  emailBodySchema,
  inviteAccountSchema,
  inviteStaffSchema,
  loginSchema,
  refreshSchema,
  registerCustomerSchema,
  registerPartnerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '@stayreco/shared';
import { zodDto } from '../../../common/pipes/validation';

// Rules live in packages/shared so web and mobile validate forms exactly like the API.
export class RegisterCustomerDto extends zodDto(registerCustomerSchema) {}
export class RegisterPartnerDto extends zodDto(registerPartnerSchema) {}
export class LoginDto extends zodDto(loginSchema) {}
export class RefreshDto extends zodDto(refreshSchema) {}
export class VerifyEmailDto extends zodDto(verifyEmailSchema) {}
export class ResendVerificationDto extends zodDto(emailBodySchema) {}
export class ForgotPasswordDto extends zodDto(emailBodySchema) {}
export class ResetPasswordDto extends zodDto(resetPasswordSchema) {}
export class ChangePasswordDto extends zodDto(changePasswordSchema) {}
export class InviteAccountDto extends zodDto(inviteAccountSchema) {}
export class InviteStaffDto extends zodDto(inviteStaffSchema) {}
export class AcceptInvitationDto extends zodDto(acceptInvitationSchema) {}
