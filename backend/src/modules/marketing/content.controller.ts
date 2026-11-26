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
  contentVariantResponseSchema,
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
import { UploadedFileOf, UploadFile } from '../../common/upload/upload-file';
import { StaffPermission } from '../../generated/prisma/client';
import { ContentIdeasService } from './content-ideas.service';
import { ContentImagesService } from './content-images.service';
import { ContentService } from './content.service';
import {
  ContentListQueryDto,
  CreateContentDto,
  GenerateContentDto,
  GenerateImageDto,
  RejectContentDto,
  UpdateContentDto,
} from './dto/marketing.dto';

/** Marketing drafts, written by the AI in the hotel's voice and posted by staff with `MARKETING` (M7, M8). */
@ApiTags('marketing')
@Controller()
export class ContentController {
  constructor(
    private readonly content: ContentService,
    private readonly ideas: ContentIdeasService,
    private readonly images: ContentImagesService,
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
    summary: 'Write three versions to choose from',
    description:
      'Same brief and rules as `generate`, but nothing is saved: the answer is three versions, each from a different angle. Staff pick one, edit it if they like, and save it with `POST /hotels/:hotelId/marketing-content`. One model call against the monthly budget, not three.',
  })
  @HotelAccessRequired('member', { permission: StaffPermission.MARKETING })
  @ApiData(z.array(contentVariantResponseSchema))
  @ApiErrors(
    ErrorCode.AI_UNAVAILABLE,
    ErrorCode.AI_BUDGET_EXCEEDED,
    ErrorCode.AI_REFUSED,
  )
  @Post('hotels/:hotelId/marketing-content/variants')
  @HttpCode(HttpStatus.OK)
  variants(
    @CurrentUser() user: AuthUser,
    @Param('hotelId') hotelId: string,
    @Body() dto: GenerateContentDto,
  ) {
    return this.content.variants(user, hotelId, dto);
  }

  @ApiOperation({
    summary: 'Save a draft',
    description:
      'Saves the version picked from `variants` (or written by hand) as a `DRAFT`, ready to edit, illustrate and schedule. Costs nothing.',
  })
  @HotelAccessRequired('member', { permission: StaffPermission.MARKETING })
  @ApiData(marketingContentResponseSchema, HttpStatus.CREATED)
  @Post('hotels/:hotelId/marketing-content')
  create(
    @CurrentUser() user: AuthUser,
    @Param('hotelId') hotelId: string,
    @Body() dto: CreateContentDto,
    @ReqMeta() meta: RequestMeta,
  ) {
    return this.content.create(user, hotelId, dto, meta);
  }

  @ApiOperation({
    summary: "A hotel's marketing content",
    description:
      'Newest first. `status` and `contentType` may each be repeated, e.g. `status=DRAFT&status=SCHEDULED`.',
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
    summary: 'Edit a piece',
    description:
      'Anything not yet `PUBLISHED`. The status stays (a `REJECTED` piece from before goes back to `DRAFT`); a `SCHEDULED` piece keeps its posts, which go out with the edit. Refused while one of its posts is being sent right now.',
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
    summary: 'Send a draft for approval (no longer needed)',
    description:
      '`DRAFT` or `REJECTED` → `PENDING_APPROVAL`. Kept for older clients: there is no approval step, a draft is scheduled directly.',
    deprecated: true,
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
      '`PENDING_APPROVAL` → `APPROVED`. Kept for older clients; nothing requires it. Staff with `MARKETING` or the owner.',
    deprecated: true,
  })
  @ApiHotelAccess('member', ErrorCode.CONTENT_NOT_FOUND)
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
      '`PENDING_APPROVAL` → `REJECTED`, the reason coming back as `rejectedReason`. Kept for older clients; nothing requires it.',
    deprecated: true,
  })
  @ApiHotelAccess('member', ErrorCode.CONTENT_NOT_FOUND)
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
    summary: 'Attach a picture',
    description:
      'Staff with `MARKETING`, in the same window as editing the words: anything not yet `PUBLISHED`. JPEG, PNG or WebP, up to 10MB. Uploading again replaces the picture and deletes the old file. Facebook and Instagram fetch the image themselves, which is why it is hosted rather than sent with the post; Instagram refuses a post without one.',
  })
  @UploadFile('image')
  @ApiData(marketingContentResponseSchema, HttpStatus.CREATED)
  @ApiErrors(
    ErrorCode.CONTENT_NOT_FOUND,
    ErrorCode.CONTENT_STATUS_CONFLICT,
    ErrorCode.UPLOAD_INVALID_FILE,
  )
  @Post('marketing-content/:id/image')
  setImage(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @UploadedFileOf('image') file: Buffer,
  ) {
    return this.images.set(user, id, file);
  }

  @ApiOperation({
    summary: 'Let the AI draw the picture',
    description:
      'Same window and the same effect as uploading one: the picture is hosted, attached, and replaces the old one. Drawn from `prompt` when given, otherwise from the post itself, in the brand voice; photorealistic, no text, no logos, no recognisable faces. Staff see it before scheduling. One image call against the monthly budget - an image costs far more than a draft.',
  })
  @ApiData(marketingContentResponseSchema)
  @ApiErrors(
    ErrorCode.CONTENT_NOT_FOUND,
    ErrorCode.CONTENT_STATUS_CONFLICT,
    ErrorCode.AI_UNAVAILABLE,
    ErrorCode.AI_BUDGET_EXCEEDED,
    ErrorCode.AI_REFUSED,
  )
  @Post('marketing-content/:id/image/generate')
  @HttpCode(HttpStatus.OK)
  generateImage(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: GenerateImageDto,
  ) {
    return this.images.generate(user, id, dto);
  }

  @ApiOperation({
    summary: 'Remove the picture',
    description:
      'Same window as attaching one. The file is deleted too, unless the URL was set by hand rather than uploaded.',
  })
  @ApiData(marketingContentResponseSchema)
  @ApiErrors(ErrorCode.CONTENT_NOT_FOUND, ErrorCode.CONTENT_STATUS_CONFLICT)
  @Delete('marketing-content/:id/image')
  removeImage(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.images.remove(user, id);
  }

  @ApiOperation({
    summary: 'Delete a draft',
    description:
      'Only a piece not yet put on a page. Anything scheduled or published stays, as the record of what went out; cancel its posts first.',
  })
  @ApiHotelAccess('member', ErrorCode.CONTENT_NOT_FOUND)
  @ApiErrors(ErrorCode.CONTENT_STATUS_CONFLICT)
  @Delete('marketing-content/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.content.remove(user, id);
  }
}
