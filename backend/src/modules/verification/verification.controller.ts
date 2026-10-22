import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  submitVerificationSchema,
  verificationDecisionSchema,
  verificationFileLinkResponseSchema,
  verificationListQuerySchema,
  verificationRequestResponseSchema,
  verificationRequestSummaryResponseSchema,
  z,
} from '@stayreco/shared';
import {
  type AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import {
  ReqMeta,
  type RequestMeta,
} from '../../common/decorators/request-meta.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ErrorCode } from '../../common/errors/error-code';
import { HotelAccessRequired } from '../../common/hotel-access/hotel-access.guard';
import { zodDto } from '../../common/pipes/validation';
import {
  ApiAccess,
  ApiData,
  ApiErrors,
  ApiPage,
} from '../../common/swagger/api-docs.decorators';
import { UserRole } from '../../generated/prisma/client';
import { VerificationService } from './verification.service';

class SubmitVerificationDto extends zodDto(submitVerificationSchema) {}
class VerificationDecisionDto extends zodDto(verificationDecisionSchema) {}
class VerificationListQueryDto extends zodDto(verificationListQuerySchema) {}

const OWNER_OR_MANAGER =
  '`PLATFORM_MANAGER`, or the owner of the hotel (also while the partner is suspended). Hotel staff get 403, outsiders get 404 `VERIFICATION_NOT_FOUND`';

@ApiTags('verification')
@Controller()
export class VerificationController {
  constructor(private readonly verification: VerificationService) {}

  @HotelAccessRequired('owner')
  @ApiOperation({
    summary: 'Submit a verification request for a hotel',
    description:
      'The 4 wizard steps in one body. The request type is derived by the backend: a DRAFT hotel → `INITIAL` (the hotel becomes PENDING_VERIFICATION); an active hotel asked to re-verify → `RENEWAL`; otherwise `UPDATE`. Each `fileId` must come from `POST /uploads/verification-documents` by the same partner, one file per document.',
  })
  @ApiData(verificationRequestResponseSchema, HttpStatus.CREATED)
  @ApiErrors(
    ErrorCode.VERIFICATION_DOCUMENTS_MISSING,
    ErrorCode.VERIFICATION_PENDING,
    ErrorCode.HOTEL_STATUS_CONFLICT,
  )
  @Post('hotels/:hotelId/verification-requests')
  submit(
    @CurrentUser() user: AuthUser,
    @Param('hotelId') hotelId: string,
    @Body() dto: SubmitVerificationDto,
    @ReqMeta() meta: RequestMeta,
  ) {
    return this.verification.submit(user, hotelId, dto, meta);
  }

  @HotelAccessRequired('owner-view')
  @ApiOperation({
    summary: "List a hotel's verification requests, newest first",
    description:
      'Includes the reviewer reasons. The beneficiary account number and the representative ID number are masked (`****1234`).',
  })
  @ApiData(z.array(verificationRequestResponseSchema))
  @Get('hotels/:hotelId/verification-requests')
  history(@Param('hotelId') hotelId: string) {
    return this.verification.history(hotelId);
  }

  @ApiOperation({ summary: 'Get a verification request in full' })
  @ApiAccess(OWNER_OR_MANAGER)
  @ApiData(verificationRequestResponseSchema)
  @ApiErrors(ErrorCode.VERIFICATION_NOT_FOUND, ErrorCode.FORBIDDEN)
  @Get('verification-requests/:id')
  detail(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.verification.detail(user, id);
  }

  @ApiAccess(OWNER_OR_MANAGER)
  @ApiOperation({
    summary: 'Get a short-lived link to view a document',
    description:
      'Returns JSON, not a redirect, because a new browser tab cannot send the Bearer token. The link is valid 5 minutes; ask for a new one each time.',
  })
  @ApiData(verificationFileLinkResponseSchema)
  @ApiErrors(ErrorCode.VERIFICATION_NOT_FOUND, ErrorCode.FORBIDDEN)
  @Get('verification-documents/:id/file')
  fileLink(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.verification.fileLink(user, id);
  }

  @Roles(UserRole.PLATFORM_MANAGER)
  @ApiOperation({
    summary: 'The review queue, oldest first by default',
    description:
      '`search` matches the hotel name. The queue has no beneficiary data; compute the SLA from `submittedAt`.',
  })
  @ApiPage(verificationRequestSummaryResponseSchema)
  @Get('verification-requests')
  queue(@Query() query: VerificationListQueryDto) {
    return this.verification.queue(query);
  }

  @Roles(UserRole.PLATFORM_MANAGER)
  @ApiOperation({
    summary: 'Approve a pending request',
    description:
      'An `INITIAL` request makes the hotel ACTIVE (and the partner APPROVED on their first hotel); it cannot be approved while the partner is suspended. `UPDATE` / `RENEWAL` requests do not change the hotel status. The partner is emailed.',
  })
  @ApiData(verificationRequestResponseSchema)
  @ApiErrors(
    ErrorCode.VERIFICATION_NOT_FOUND,
    ErrorCode.VERIFICATION_ALREADY_DECIDED,
    {
      code: ErrorCode.PARTNER_SUSPENDED,
      status: HttpStatus.CONFLICT,
      description:
        "The partner is suspended, so their hotel's first request cannot be approved (reject or request changes still work)",
    },
  )
  @Post('verification-requests/:id/approve')
  @HttpCode(HttpStatus.OK)
  approve(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @ReqMeta() meta: RequestMeta,
  ) {
    return this.verification.decide(user, id, 'APPROVED', null, meta);
  }

  @Roles(UserRole.PLATFORM_MANAGER)
  @ApiOperation({
    summary: 'Reject a pending request with a reason',
    description:
      'An `INITIAL` request sends the hotel back to DRAFT. The partner is emailed with the reason.',
  })
  @ApiData(verificationRequestResponseSchema)
  @ApiErrors(
    ErrorCode.VERIFICATION_NOT_FOUND,
    ErrorCode.VERIFICATION_ALREADY_DECIDED,
  )
  @Post('verification-requests/:id/reject')
  @HttpCode(HttpStatus.OK)
  reject(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: VerificationDecisionDto,
    @ReqMeta() meta: RequestMeta,
  ) {
    return this.verification.decide(user, id, 'REJECTED', dto.reason, meta);
  }

  @Roles(UserRole.PLATFORM_MANAGER)
  @ApiOperation({
    summary: 'Ask the partner for changes, with a reason',
    description:
      'An `INITIAL` request sends the hotel back to DRAFT; the partner edits it and submits a new request. The partner is emailed with the reason.',
  })
  @ApiData(verificationRequestResponseSchema)
  @ApiErrors(
    ErrorCode.VERIFICATION_NOT_FOUND,
    ErrorCode.VERIFICATION_ALREADY_DECIDED,
  )
  @Post('verification-requests/:id/request-changes')
  @HttpCode(HttpStatus.OK)
  requestChanges(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: VerificationDecisionDto,
    @ReqMeta() meta: RequestMeta,
  ) {
    return this.verification.decide(
      user,
      id,
      'NEEDS_REVISION',
      dto.reason,
      meta,
    );
  }

  @Roles(UserRole.PLATFORM_MANAGER)
  @ApiOperation({
    summary: 'Ask an active hotel to verify again, with a reason',
    description:
      'Creates a `RENEWAL` request in NEEDS_REVISION (for example an expired license). The hotel stays ACTIVE while the partner submits the renewal. The partner is emailed with the reason.',
  })
  @ApiData(verificationRequestResponseSchema, HttpStatus.CREATED)
  @ApiErrors(
    ErrorCode.HOTEL_NOT_FOUND,
    ErrorCode.HOTEL_STATUS_CONFLICT,
    ErrorCode.VERIFICATION_PENDING,
  )
  @Post('hotels/:hotelId/reverification')
  requestReverification(
    @CurrentUser() user: AuthUser,
    @Param('hotelId') hotelId: string,
    @Body() dto: VerificationDecisionDto,
    @ReqMeta() meta: RequestMeta,
  ) {
    return this.verification.requestReverification(
      user,
      hotelId,
      dto.reason,
      meta,
    );
  }
}
