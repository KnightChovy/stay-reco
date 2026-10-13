import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

const normalizeEmail = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;
const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

function IsStrongPassword(): PropertyDecorator {
  return (target, key) => {
    IsString()(target, key);
    MinLength(8)(target, key);
    MaxLength(128)(target, key);
    Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
      message: 'password must contain at least one letter and one number',
    })(target, key);
  };
}

class EmailDto {
  @Transform(normalizeEmail)
  @IsEmail()
  @MaxLength(254)
  email!: string;
}

export class RegisterCustomerDto extends EmailDto {
  @IsStrongPassword()
  password!: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  fullName!: string;
}

export class RegisterPartnerDto extends RegisterCustomerDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(200)
  companyName?: string;
}

export class LoginDto extends EmailDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  password!: string;
}

export class RefreshDto {
  /** Mobile sends it in the body; web uses the httpOnly cookie. */
  @IsOptional()
  @IsString()
  refreshToken?: string;
}

export class TokenDto {
  @IsString()
  @IsNotEmpty()
  token!: string;
}

export class ResendVerificationDto extends EmailDto {}

export class ForgotPasswordDto extends EmailDto {}

export class ResetPasswordDto extends TokenDto {
  @IsStrongPassword()
  newPassword!: string;
}

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  currentPassword!: string;

  @IsStrongPassword()
  newPassword!: string;
}

export class InviteAccountDto extends EmailDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  fullName!: string;
}

export class AcceptInvitationDto extends TokenDto {
  @IsStrongPassword()
  password!: string;
}
