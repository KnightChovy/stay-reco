import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  contentIdeaResponseSchema,
  marketingContentResponseSchema,
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
import { ContentIdeasService } from './content-ideas.service';
import { ContentService } from './content.service';
import {
  ContentListQueryDto,
  GenerateContentDto,
  RejectContentDto,
  UpdateContentDto,
} from './dto/marketing.dto';

/** Marketing drafts, written by the AI in the hotel's voice and approved by the owner (M7, M8). */
@ApiTags('marketing')
@Controller()
export class ContentController {
  constructor(
    private readonly content: ContentService,
    private readonly ideas: ContentIdeasService,
  ) {}

  @ApiOperation({
    summary: 'What is worth posting about right now',
    description:
      "Read out of the hotel's own figures - rooms still empty this week, a discount running, a recent review worth quoting - so staff pick an idea instead of inventing one. Costs nothing: these are database queries, not model calls. Each idea's `brief` can be sent straight back to the generate endpoint.",
  })
  @HotelAccessRequired('member', { permission: StaffPermission.MARKETING })
  @ApiData(z.array(contentIdeaResponseSchema))
  @Get('hotels/:hotelId/marketing-content/ideas')
  suggestions(@Param('hotelId') hotelId: string) {
    return this.ideas.forHotel(hotelId);
  }

  @ApiOperation({
    summary: 'Write a draft',
    description:
      "Written in the hotel's brand voice; `platform` shapes the length and tone. The model is told never to invent a price, date, discount or amenity the brief does not give it. The draft is saved as `DRAFT` whatever happens next. Costs one model call against the monthly budget.",
  })
  @HotelAccessRequired('member', { permission: StaffPermission.MARKETING })
  @ApiData(marketingContentResponseSchema, HttpStatus.CREATED)
  @ApiErrors(
    ErrorCode.AI_UNAVAILABLE,
    ErrorCode.AI_BUDGET_EXCEEDED,
    ErrorCode.AI_REFUSED,
  )
  @Post('hotels/:hotelId/marketing-content/generate')
  generate(
    @CurrentUser() user: AuthUser,
    @Param('hotelId') hotelId: string,
    @Body() dto: GenerateContentDto,
    @ReqMeta() meta: RequestMeta,
  ) {
    return this.content.generate(user, hotelId, dto, meta);
  }

  @ApiOperation({
    summary: "A hotel's marketing content",
    description:
      'Newest first. `status` and `contentType` may each be repeated, so an approval queue sends `status=PENDING_APPROVAL`.',
  })
  @HotelAccessRequired('member', { permission: StaffPermission.MARKETING })
  @ApiPage(marketingContentResponseSchema)
  @Get('hotels/:hotelId/marketing-content')
  list(@Param('hotelId') hotelId: string, @Query() query: ContentListQueryDto) {
    return this.content.list(hotelId, query);
  }

  @ApiOperation({
    summary: 'One piece of content',
    description:
      '`rejectedReason` carries why it was sent back, when the status is `REJECTED`.',
  })
  @ApiHotelAccess('member', ErrorCode.CONTENT_NOT_FOUND)
  @ApiData(marketingContentResponseSchema)
  @Get('marketing-content/:id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.content.findOne(user, id);
  }

  @ApiOperation({
    summary: 'Edit a draft',
    description:
      'Only while it is `DRAFT` or `REJECTED`; editing a rejected piece puts it back to `DRAFT`. Once approved the text is frozen, so what the owner approved is what goes out.',
  })
  @ApiHotelAccess('member', ErrorCode.CONTENT_NOT_FOUND)
  @ApiData(marketingContentResponseSchema)
  @ApiErrors(ErrorCode.CONTENT_STATUS_CONFLICT)
  @Patch('marketing-content/:id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateContentDto,
  ) {
    return this.content.update(user, id, dto);
  }

  @ApiOperation({
    summary: 'Send a draft for approval',
    description: '`DRAFT` or `REJECTED` → `PENDING_APPROVAL`.',
  })
  @ApiHotelAccess('member', ErrorCode.CONTENT_NOT_FOUND)
  @ApiData(marketingContentResponseSchema)
  @ApiErrors(ErrorCode.CONTENT_STATUS_CONFLICT)
  @Post('marketing-content/:id/submit')
  @HttpCode(HttpStatus.OK)
  submit(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @ReqMeta() meta: RequestMeta,
  ) {
    return this.content.submit(user, id, meta);
  }

  @ApiOperation({
    summary: 'Approve content',
    description:
      'The **owner** only. Staff write and submit; the owner decides what goes out under the hotel’s name.',
  })
  @ApiHotelAccess('owner', ErrorCode.CONTENT_NOT_FOUND)
  @ApiData(marketingContentResponseSchema)
  @ApiErrors(ErrorCode.CONTENT_STATUS_CONFLICT)
  @Post('marketing-content/:id/approve')
  @HttpCode(HttpStatus.OK)
  approve(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @ReqMeta() meta: RequestMeta,
  ) {
    return this.content.approve(user, id, meta);
  }

  @ApiOperation({
    summary: 'Send content back with a reason',
    description:
      'The owner only. The reason comes back on the piece as `rejectedReason`, so the writer can fix it rather than guess.',
  })
  @ApiHotelAccess('owner', ErrorCode.CONTENT_NOT_FOUND)
  @ApiData(marketingContentResponseSchema)
  @ApiErrors(ErrorCode.CONTENT_STATUS_CONFLICT)
  @Post('marketing-content/:id/reject')
  @HttpCode(HttpStatus.OK)
  reject(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: RejectContentDto,
    @ReqMeta() meta: RequestMeta,
  ) {
    return this.content.reject(user, id, dto, meta);
  }

  @ApiOperation({
    summary: 'Delete a draft',
    description:
      'Only a `DRAFT` or `REJECTED` piece. Anything approved or published stays, as the record of what went out.',
  })
  @ApiHotelAccess('member', ErrorCode.CONTENT_NOT_FOUND)
  @ApiErrors(ErrorCode.CONTENT_STATUS_CONFLICT)
  @Delete('marketing-content/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.content.remove(user, id);
  }
}
