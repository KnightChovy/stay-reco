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
import { ApiTags } from '@nestjs/swagger';
import {
  submitVerificationSchema,
  verificationDecisionSchema,
  verificationListQuerySchema,
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
import { HotelAccessRequired } from '../../common/hotel-access/hotel-access.guard';
import { zodDto } from '../../common/pipes/validation';
import { UserRole } from '../../generated/prisma/client';
import { VerificationService } from './verification.service';

class SubmitVerificationDto extends zodDto(submitVerificationSchema) {}
class VerificationDecisionDto extends zodDto(verificationDecisionSchema) {}
class VerificationListQueryDto extends zodDto(verificationListQuerySchema) {}

@ApiTags('verification')
@Controller()
export class VerificationController {
  constructor(private readonly verification: VerificationService) {}

  // ── Hotel owner ──────────────────────────────────────────

  @HotelAccessRequired('owner')
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
  @Get('hotels/:hotelId/verification-requests')
  history(@Param('hotelId') hotelId: string) {
    return this.verification.history(hotelId);
  }

  // ── Owner or platform manager ────────────────────────────

  @Get('verification-requests/:id')
  detail(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.verification.detail(user, id);
  }

  /** Returns a short-lived link (JSON, not a redirect: a new browser tab cannot send the Bearer token). */
  @Get('verification-documents/:id/file')
  fileLink(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.verification.fileLink(user, id);
  }

  // ── Platform manager ─────────────────────────────────────

  @Roles(UserRole.PLATFORM_MANAGER)
  @Get('verification-requests')
  queue(@Query() query: VerificationListQueryDto) {
    return this.verification.queue(query);
  }

  @Roles(UserRole.PLATFORM_MANAGER)
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
