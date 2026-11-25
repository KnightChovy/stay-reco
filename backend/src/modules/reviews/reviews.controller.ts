import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  ratingCriterionResponseSchema,
  ratingSummaryResponseSchema,
  reviewEligibilityResponseSchema,
  reviewResponseSchema,
  z,
} from '@stayreco/shared';
import {
  type AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
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
import { UserRole } from '../../generated/prisma/client';
import {
  CreateReviewDto,
  ReviewListQueryDto,
  ReviewVisibilityDto,
  UpdateReviewDto,
} from './dto/review.dto';
import { ReviewsService } from './reviews.service';

/** Post-stay reviews (BR-12): written by the guest who stayed, read by everyone on the hotel page. */
@ApiTags('reviews')
@Controller()
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @ApiOperation({
    summary: 'The criteria a guest scores after a stay',
    description:
      'Heaviest first, the order the review screen shows them in. A review must score every criterion exactly once; the backend turns them into the overall rating with these weights.',
  })
  @ApiData(z.array(ratingCriterionResponseSchema))
  @Public()
  @Get('rating-criteria')
  criteria() {
    return this.reviews.criteria();
  }

  @ApiOperation({
    summary: 'Reviews of a hotel',
    description:
      'Public, so only visible reviews are returned. `sort` is `newest` (default), `oldest`, `rating-desc` or `rating-asc`; `minRating` keeps reviews at or above that overall score, for a "4+ stars" filter.',
  })
  @ApiPage(reviewResponseSchema)
  @Public()
  @Get('hotels/:hotelId/reviews')
  listForHotel(
    @Param('hotelId') hotelId: string,
    @Query() query: ReviewListQueryDto,
  ) {
    return this.reviews.listForHotel(hotelId, query);
  }

  @ApiOperation({
    summary: 'Rating figures of a hotel',
    description:
      'Average and count of the visible reviews, how many fall in each star bucket (an overall of 4.4 counts as 4), and the average of each criterion. A hotel with no review answers an average of 0 and a count of 0.',
  })
  @ApiData(ratingSummaryResponseSchema)
  @Public()
  @Get('hotels/:hotelId/rating-summary')
  summary(@Param('hotelId') hotelId: string) {
    return this.reviews.summary(hotelId);
  }

  @ApiOperation({
    summary: 'Can I review this stay?',
    description:
      'For the "Write a review" button. `canReview` is false with a `reason` of `REVIEW_NOT_ALLOWED` (the stay is not completed), `REVIEW_ALREADY_EXISTS` (then `reviewId` points at it) or `REVIEW_WINDOW_CLOSED`. `closesAt` is the end of the review window.',
  })
  @ApiData(reviewEligibilityResponseSchema)
  @ApiErrors(ErrorCode.BOOKING_NOT_FOUND)
  @Roles(UserRole.CUSTOMER)
  @Get('bookings/:id/review-eligibility')
  eligibility(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.reviews.eligibility(user.accountId, id);
  }

  @ApiOperation({
    summary: 'Write the review of a completed stay',
    description:
      'One review per booking, by the customer who stayed, within `REVIEW_WINDOW_DAYS` of check-out. Every criterion of `GET /rating-criteria` must be scored exactly once; the overall rating is their weighted average and is never sent by the client.',
  })
  @ApiData(reviewResponseSchema, 201)
  @ApiErrors(
    ErrorCode.BOOKING_NOT_FOUND,
    ErrorCode.REVIEW_NOT_ALLOWED,
    ErrorCode.REVIEW_ALREADY_EXISTS,
    ErrorCode.REVIEW_WINDOW_CLOSED,
    ErrorCode.RATING_CRITERION_NOT_FOUND,
  )
  @Roles(UserRole.CUSTOMER)
  @Post('bookings/:id/reviews')
  create(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: CreateReviewDto,
    @ReqMeta() meta: RequestMeta,
  ) {
    return this.reviews.create(user.accountId, id, dto, meta);
  }

  @ApiOperation({
    summary: 'My reviews',
    description:
      'The signed-in customer\x27s own reviews, newest first, including any the hotel has hidden.',
  })
  @ApiPage(reviewResponseSchema)
  @Roles(UserRole.CUSTOMER)
  @Get('me/reviews')
  listMine(@CurrentUser() user: AuthUser, @Query() query: ReviewListQueryDto) {
    return this.reviews.listMine(user.accountId, query);
  }

  @ApiOperation({
    summary: 'Edit my review',
    description:
      'Only the author, and only while the review window is open. Sending `subRatings` replaces all of them and recomputes the overall rating.',
  })
  @ApiData(reviewResponseSchema)
  @ApiErrors(
    ErrorCode.REVIEW_NOT_FOUND,
    ErrorCode.REVIEW_NOT_ALLOWED,
    ErrorCode.REVIEW_WINDOW_CLOSED,
    ErrorCode.RATING_CRITERION_NOT_FOUND,
  )
  @Roles(UserRole.CUSTOMER)
  @Patch('reviews/:id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateReviewDto,
    @ReqMeta() meta: RequestMeta,
  ) {
    return this.reviews.update(user.accountId, id, dto, meta);
  }

  @ApiOperation({
    summary: 'Hide a review, or show it again',
    description:
      'A **platform manager** only (R12). A hotel cannot take down a review of itself; it reports one with `POST /reviews/:id/reports` like anybody else, and a manager decides. A hidden review leaves the public list and the rating figures, but its author still sees it in `GET /me/reviews`.',
  })
  @ApiData(reviewResponseSchema)
  @ApiErrors(ErrorCode.REVIEW_NOT_FOUND)
  @Roles(UserRole.PLATFORM_MANAGER)
  @Patch('reviews/:id/visibility')
  setVisibility(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ReviewVisibilityDto,
    @ReqMeta() meta: RequestMeta,
  ) {
    return this.reviews.setVisibility(user, id, dto.isVisible, meta);
  }
}
