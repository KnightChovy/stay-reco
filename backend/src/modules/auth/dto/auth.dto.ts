import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
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
    // The Swagger plugin cannot see through this composite decorator, so describe the rule explicitly.
    ApiProperty({
      minLength: 8,
      maxLength: 128,
      description: 'At least one letter and one number',
    })(target, key);
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

  /** Contact phone of the partner, e.g. 0901234567 or +84901234567. */
  @Transform(trim)
  @Matches(/^\+?\d{9,15}$/, { message: 'phone must be a valid phone number' })
  phone!: string;
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

export class InviteStaffDto extends InviteAccountDto {
  /** Hotel the staff member works at; must belong to the inviting partner. */
  @IsUUID()
  hotelId!: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  position!: string;
}

export class AcceptInvitationDto extends TokenDto {
  @IsStrongPassword()
  password!: string;
}
