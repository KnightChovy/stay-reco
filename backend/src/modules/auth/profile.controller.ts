import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { accountResponseSchema } from '@stayreco/shared';
import {
  type AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import {
  ReqMeta,
  type RequestMeta,
} from '../../common/decorators/request-meta.decorator';
import { ApiData } from '../../common/swagger/api-docs.decorators';
import { UploadedFileOf, UploadFile } from '../../common/upload/upload-file';
import { UpdateProfileDto } from './dto/auth.dto';
import { ProfileService } from './services/profile.service';

/** The signed-in account's own profile, for every role. */
@ApiTags('auth')
@Controller('me')
export class ProfileController {
  constructor(private readonly profile: ProfileService) {}

  @ApiOperation({
    summary: 'Edit my profile',
    description:
      'Send only the fields to change; `null` clears one. `fullName` and `phone` for every role; `companyName` (the partner name) for HOTEL_PARTNER; `dateOfBirth`, `gender`, `nationality` for CUSTOMER. A field of another role, or a partner clearing `phone`, returns `VALIDATION_ERROR`. For a partner, the phone is also the contact phone. Returns the updated account.',
  })
  @ApiData(accountResponseSchema)
  @Patch('profile')
  update(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateProfileDto,
    @ReqMeta() meta: RequestMeta,
  ) {
    return this.profile.update(user, dto, meta);
  }

  @UploadFile('image')
  @ApiOperation({
    summary: 'Upload my avatar',
    description:
      'Replaces the current avatar; the old file is deleted. Returns the updated account with the new `avatarUrl`.',
  })
  @ApiData(accountResponseSchema)
  @Post('avatar')
  @HttpCode(HttpStatus.OK)
  uploadAvatar(
    @CurrentUser() user: AuthUser,
    @UploadedFileOf('image') file: Buffer,
    @ReqMeta() meta: RequestMeta,
  ) {
    return this.profile.uploadAvatar(user, file, meta);
  }

  @ApiOperation({
    summary: 'Remove my avatar',
    description: '`avatarUrl` becomes null. Also 204 when there is no avatar.',
  })
  @Delete('avatar')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeAvatar(@CurrentUser() user: AuthUser, @ReqMeta() meta: RequestMeta) {
    return this.profile.removeAvatar(user, meta);
  }
}
