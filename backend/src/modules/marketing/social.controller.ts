import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  contentMetricResponseSchema,
  contentScheduleResponseSchema,
  facebookAuthorizeResponseSchema,
  facebookExchangeResponseSchema,
  socialAccountResponseSchema,
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
import { ErrorCode } from '../../common/errors/error-code';
import { HotelAccessRequired } from '../../common/hotel-access/hotel-access.guard';
import {
  ApiData,
  ApiErrors,
  ApiHotelAccess,
  ApiPage,
} from '../../common/swagger/api-docs.decorators';
import { StaffPermission } from '../../generated/prisma/client';
import { FacebookOauthService } from './facebook-oauth.service';
import { MetricsService } from './metrics.service';
import { ScheduleService } from './schedule.service';
import { SocialAccountsService } from './social-accounts.service';
import {
  ConnectSocialAccountDto,
  FacebookConnectDto,
  FacebookExchangeDto,
  ScheduleContentDto,
  ScheduleListQueryDto,
} from './dto/marketing.dto';

/** Connected pages, the posting calendar and how the posts did (phase 5, M11, M9, M15). */
@ApiTags('marketing')
@Controller()
export class SocialController {
  constructor(
    private readonly accounts: SocialAccountsService,
    private readonly facebook: FacebookOauthService,
    private readonly schedules: ScheduleService,
    private readonly metrics: MetricsService,
  ) {}

  @ApiOperation({
    summary: 'Connect a social page',
    description:
      "The **owner** only: a page posts under the hotel's name. `accountName` is the id the platform posts under - a Facebook Page id, or an Instagram Business account id - not the display name. The token is stored encrypted and is never read back out of the API; paste a long-lived one, and send `expiresAt` if the platform gave one.",
  })
  @HotelAccessRequired('owner')
  @ApiData(socialAccountResponseSchema, HttpStatus.CREATED)
  @Post('hotels/:hotelId/social-accounts')
  connect(
    @CurrentUser() user: AuthUser,
    @Param('hotelId') hotelId: string,
    @Body() dto: ConnectSocialAccountDto,
    @ReqMeta() meta: RequestMeta,
  ) {
    return this.accounts.connect(user, hotelId, dto, meta);
  }

  @ApiOperation({
    summary: 'Start connecting a Facebook page',
    description:
      'The **owner** only, and the first of three steps (M16). Returns a Facebook URL to open in the browser; Facebook asks the owner which pages this app may post to, then sends them back to the configured redirect with a `code` and the `state` from this URL. The owner never sees a token. Answers `503 SOCIAL_OAUTH_DISABLED` when the server has no Meta app configured - pasting a page token still works.',
  })
  @HotelAccessRequired('owner')
  @ApiErrors(ErrorCode.SOCIAL_OAUTH_DISABLED)
  @ApiData(facebookAuthorizeResponseSchema)
  @Get('hotels/:hotelId/social-accounts/facebook/authorize')
  authorizeFacebook(@Param('hotelId') hotelId: string) {
    return this.facebook.authorize(hotelId);
  }

  @ApiOperation({
    summary: 'Read back the pages the owner just granted',
    description:
      'Step two. The page the owner lands on reads `code` and `state` out of the query string and posts them here, inside their own session: a redirect from Facebook carries no `Authorization` header, so it cannot call the API itself. Returns the pages the owner administers, which of them this hotel already posts to, and a `connectionToken` that stands in for the access token for ten minutes. No token is in the answer.',
  })
  @HotelAccessRequired('owner')
  @ApiErrors(
    ErrorCode.SOCIAL_OAUTH_DISABLED,
    ErrorCode.SOCIAL_OAUTH_INVALID,
    ErrorCode.SOCIAL_OAUTH_FAILED,
  )
  @ApiData(facebookExchangeResponseSchema)
  @Post('hotels/:hotelId/social-accounts/facebook/exchange')
  @HttpCode(HttpStatus.OK)
  exchangeFacebook(
    @Param('hotelId') hotelId: string,
    @Body() dto: FacebookExchangeDto,
  ) {
    return this.facebook.exchange(hotelId, dto.code, dto.state);
  }

  @ApiOperation({
    summary: 'Finish connecting the pages the owner picked',
    description:
      'Step three. An owner may administer a dozen pages and only one of them is this hotel, so nothing is connected until they say which. `instagram: true` also connects the Instagram Business account linked to that page, publishing with the same token. Reconnecting a page already on the hotel updates its token rather than adding a second row.',
  })
  @HotelAccessRequired('owner')
  @ApiErrors(
    ErrorCode.SOCIAL_OAUTH_DISABLED,
    ErrorCode.SOCIAL_OAUTH_INVALID,
    ErrorCode.SOCIAL_OAUTH_FAILED,
  )
  @ApiData(z.array(socialAccountResponseSchema), HttpStatus.CREATED)
  @Post('hotels/:hotelId/social-accounts/facebook/connect')
  connectFacebook(
    @CurrentUser() user: AuthUser,
    @Param('hotelId') hotelId: string,
    @Body() dto: FacebookConnectDto,
    @ReqMeta() meta: RequestMeta,
  ) {
    return this.facebook.connect(user, hotelId, dto, meta);
  }

  @ApiOperation({
    summary: 'The pages this hotel has connected',
    description:
      '`usable` is false once the token has expired; the publisher skips such a page and says so on the post rather than failing silently. Tokens are never part of this answer.',
  })
  @HotelAccessRequired('member', { permission: StaffPermission.MARKETING })
  @ApiData(z.array(socialAccountResponseSchema))
  @Get('hotels/:hotelId/social-accounts')
  listAccounts(@Param('hotelId') hotelId: string) {
    return this.accounts.list(hotelId);
  }

  @ApiOperation({
    summary: 'Disconnect a page',
    description:
      'The owner only. Clears the token and cancels everything still waiting to go out on that page. The page is kept, not deleted: a post that already went out points at it, and that record should outlive the connection.',
  })
  @ApiHotelAccess('owner', ErrorCode.SOCIAL_ACCOUNT_NOT_FOUND)
  @Delete('social-accounts/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  disconnect(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @ReqMeta() meta: RequestMeta,
  ) {
    return this.accounts.disconnect(user, id, meta);
  }

  @ApiOperation({
    summary: 'Schedule approved content',
    description:
      'Only content the owner has approved (`CONTENT_NOT_APPROVED` otherwise), aimed at one connected page. Leave `scheduledAt` out, or set it in the past, to go out at the next run of the publisher, which is within a minute - that is what a "post now" button sends. One approved piece can be scheduled to several pages.',
  })
  @ApiHotelAccess('member', ErrorCode.CONTENT_NOT_FOUND)
  @ApiData(contentScheduleResponseSchema, HttpStatus.CREATED)
  @ApiErrors(ErrorCode.CONTENT_NOT_APPROVED, ErrorCode.SOCIAL_ACCOUNT_NOT_FOUND)
  @Post('marketing-content/:id/schedule')
  schedule(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ScheduleContentDto,
    @ReqMeta() meta: RequestMeta,
  ) {
    return this.schedules.schedule(user, id, dto, meta);
  }

  @ApiOperation({
    summary: 'The posting calendar',
    description:
      'Soonest first; a post with no time is due now and sorts first. `status` and `platform` may each be repeated, and `from`/`until` bound the window a calendar screen shows. `failureReason` carries the platform’s own words when a post did not go out.',
  })
  @HotelAccessRequired('member', { permission: StaffPermission.MARKETING })
  @ApiPage(contentScheduleResponseSchema)
  @Get('hotels/:hotelId/content-schedules')
  listSchedules(
    @Param('hotelId') hotelId: string,
    @Query() query: ScheduleListQueryDto,
  ) {
    return this.schedules.list(hotelId, query);
  }

  @ApiOperation({
    summary: 'One scheduled post',
    description:
      '`externalPostId` is the platform’s own id, once the post exists; the figures are read against it.',
  })
  @ApiHotelAccess('member', ErrorCode.SCHEDULE_NOT_FOUND)
  @ApiData(contentScheduleResponseSchema)
  @Get('content-schedules/:id')
  findSchedule(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.schedules.findOne(user, id);
  }

  @ApiOperation({
    summary: 'Take a post off the calendar',
    description:
      'Only while it is still `SCHEDULED`. What already went out stays on the record, so a published post cannot be cancelled - delete it on the platform.',
  })
  @ApiHotelAccess('member', ErrorCode.SCHEDULE_NOT_FOUND)
  @ApiData(contentScheduleResponseSchema)
  @ApiErrors(ErrorCode.SCHEDULE_STATUS_CONFLICT)
  @Delete('content-schedules/:id')
  @HttpCode(HttpStatus.OK)
  cancel(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @ReqMeta() meta: RequestMeta,
  ) {
    return this.schedules.cancel(user, id, meta);
  }

  @ApiOperation({
    summary: 'How a post did',
    description:
      'Every reading taken, newest first. Each refresh appends rather than overwrites, so a post that gained its reach on day three can be told apart from one that got it in the first hour.',
  })
  @ApiHotelAccess('member', ErrorCode.SCHEDULE_NOT_FOUND)
  @ApiData(z.array(contentMetricResponseSchema))
  @Get('content-schedules/:id/metrics')
  metricHistory(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.metrics.history(user, id);
  }

  @ApiOperation({
    summary: 'Read the figures from the platform again',
    description:
      'Asks the platform how the post is doing now and keeps the answer. Only for a post that went out. Costs one call to the platform, nothing to the AI budget.',
  })
  @ApiHotelAccess('member', ErrorCode.SCHEDULE_NOT_FOUND)
  @ApiData(contentMetricResponseSchema)
  @ApiErrors(
    ErrorCode.SCHEDULE_STATUS_CONFLICT,
    ErrorCode.SOCIAL_PUBLISH_FAILED,
    ErrorCode.SOCIAL_PLATFORM_UNSUPPORTED,
  )
  @Post('content-schedules/:id/metrics/refresh')
  @HttpCode(HttpStatus.OK)
  refreshMetrics(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.metrics.refresh(user, id);
  }
}
