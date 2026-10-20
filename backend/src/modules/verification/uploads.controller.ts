import { Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { UploadedDocument } from '@stayreco/shared';
import {
  type AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UploadedFileOf, UploadFile } from '../../common/upload/upload-file';
import { UserRole } from '../../generated/prisma/client';
import { StorageService } from '../storage/storage.service';
import { verificationFolder } from './verification-documents';

@ApiTags('verification')
@Controller('uploads')
export class UploadsController {
  constructor(private readonly storage: StorageService) {}

  /** Stored privately (contract D5): only the hotel owner and platform managers get a link, later, through the request. */
  @Roles(UserRole.HOTEL_PARTNER)
  @UploadFile('document')
  @Post('verification-documents')
  async uploadVerificationDocument(
    @CurrentUser() user: AuthUser,
    @UploadedFileOf('document') file: Buffer,
  ): Promise<UploadedDocument> {
    const fileId = await this.storage.uploadPrivate(
      file,
      verificationFolder(user.accountId),
    );
    return { fileId };
  }
}
