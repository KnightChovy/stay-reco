import { Controller, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  type UploadedDocument,
  uploadedDocumentResponseSchema,
} from '@stayreco/shared';
import {
  type AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ErrorCode } from '../../common/errors/error-code';
import { HotelAccessService } from '../../common/hotel-access/hotel-access.service';
import { ApiData, ApiErrors } from '../../common/swagger/api-docs.decorators';
import { UploadedFileOf, UploadFile } from '../../common/upload/upload-file';
import { UserRole } from '../../generated/prisma/client';
import { StorageService } from '../storage/storage.service';
import { verificationFolder } from './verification-documents';

@ApiTags('verification')
@Controller('uploads')
export class UploadsController {
  constructor(
    private readonly storage: StorageService,
    private readonly access: HotelAccessService,
  ) {}

  /** Upload one verification document */
  @Roles(UserRole.HOTEL_PARTNER)
  @UploadFile('document')
  @ApiOperation({
    description:
      'Stored privately (decision D5): only the hotel owner and platform managers get a link, later, through the request. Upload each document separately and pass the returned `fileId`s when submitting.',
  })
  @ApiData(uploadedDocumentResponseSchema, HttpStatus.CREATED)
  @ApiErrors(ErrorCode.PARTNER_SUSPENDED)
  @Post('verification-documents')
  async uploadVerificationDocument(
    @CurrentUser() user: AuthUser,
    @UploadedFileOf('document') file: Buffer,
  ): Promise<UploadedDocument> {
    await this.access.assertPartnerNotSuspended(user.accountId);
    const fileId = await this.storage.uploadPrivate(
      file,
      verificationFolder(user.accountId),
    );
    return { fileId };
  }
}
