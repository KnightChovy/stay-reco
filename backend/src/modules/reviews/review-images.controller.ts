import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  contentReportResponseSchema,
  reviewResponseSchema,
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
import {
  ApiData,
  ApiErrors,
  ApiPage,
} from '../../common/swagger/api-docs.decorators';
import { UploadedFileOf, UploadFile } from '../../common/upload/upload-file';
import { UserRole } from '../../generated/prisma/client';
import { ContentReportsService } from './content-reports.service';
import {
  DecideReportDto,
  ReportListQueryDto,
  ReportReviewDto,
} from './dto/review.dto';
import { ReviewImagesService } from './review-images.service';

/** Review photos, and the flag anyone can raise against a review (R10, R11). */
@ApiTags('reviews')
@Controller()
export class ReviewImagesController {
  constructor(
    private readonly images: ReviewImagesService,
    private readonly reports: ContentReportsService,
  ) {}

  @ApiOperation({
    summary: 'Add a photo to my review',
    description:
      'At most 5 photos, 10MB each, JPEG/PNG/WebP. The sides must be between 1:1 and 4:3 **either way up**, so a portrait photo from a phone is fine but a panorama is not; each side must be at least 200px. Allowed as long as the review itself can be edited, so a guest can come back and add one. Answers the whole review.',
  })
  @UploadFile('image')
  @ApiData(reviewResponseSchema, HttpStatus.CREATED)
  @ApiErrors(
    ErrorCode.REVIEW_NOT_FOUND,
    ErrorCode.REVIEW_WINDOW_CLOSED,
    ErrorCode.UPLOAD_INVALID_FILE,
  )
  @Roles(UserRole.CUSTOMER)
  @Post('reviews/:id/images')
  addImage(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @UploadedFileOf('image') file: Buffer,
  ) {
    return this.images.add(user.accountId, id, file);
  }

  @ApiOperation({
    summary: 'Remove a photo from my review',
    description:
      'The author only, while the review window is open. The file itself is deleted too. Answers the whole review.',
  })
  @ApiData(reviewResponseSchema)
  @ApiErrors(
    ErrorCode.REVIEW_IMAGE_NOT_FOUND,
    ErrorCode.REVIEW_NOT_FOUND,
    ErrorCode.REVIEW_WINDOW_CLOSED,
  )
  @Roles(UserRole.CUSTOMER)
  @Delete('review-images/:id')
  removeImage(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.images.remove(user.accountId, id);
  }

  @ApiOperation({
    summary: 'Report a review, or one of its photos',
    description:
      'The flag under every review. Open to **every signed-in role**, the reviewed hotel included: a hotel may ask for a review to be looked at, but it cannot take one down itself. Sending `reviewImageId` flags that one photo instead of the whole review. Reporting the same thing twice answers `REPORT_ALREADY_RAISED`.',
  })
  @ApiData(contentReportResponseSchema, HttpStatus.CREATED)
  @ApiErrors(
    ErrorCode.REVIEW_NOT_FOUND,
    ErrorCode.REVIEW_IMAGE_NOT_FOUND,
    ErrorCode.REPORT_ALREADY_RAISED,
  )
  @Post('reviews/:id/reports')
  report(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ReportReviewDto,
    @ReqMeta() meta: RequestMeta,
  ) {
    return this.reports.raise(user.accountId, id, dto, meta);
  }

  @ApiOperation({
    summary: 'The reports waiting for a decision',
    description:
      'Oldest first, so nothing waits for ever. Without `status` it shows the ones still needing a decision (`OPEN`, `INVESTIGATING`); pass `status` to see decided ones.',
  })
  @ApiPage(contentReportResponseSchema)
  @Roles(UserRole.PLATFORM_MANAGER)
  @Get('content-reports')
  list(@Query() query: ReportListQueryDto) {
    return this.reports.list(query);
  }

  @ApiOperation({
    summary: 'Decide a report',
    description:
      '`INVESTIGATING` claims it without acting. `RESOLVED` or `DISMISSED` closes it. `hide: true` acts on the content: the flagged photo if the report named one, otherwise the whole review. Dismissing leaves everything as it is. A report already resolved or dismissed answers `REPORT_STATUS_CONFLICT`.',
  })
  @ApiData(contentReportResponseSchema)
  @ApiErrors(ErrorCode.REPORT_NOT_FOUND, ErrorCode.REPORT_STATUS_CONFLICT)
  @Roles(UserRole.PLATFORM_MANAGER)
  @Post('content-reports/:id/decide')
  decide(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: DecideReportDto,
    @ReqMeta() meta: RequestMeta,
  ) {
    return this.reports.decide(user, id, dto, meta);
  }
}
