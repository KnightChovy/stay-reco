import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  completeOnboardingSchema,
  onboardingHotelSuggestionsResponseSchema,
  onboardingHotelsQuerySchema,
  onboardingResponseSchema,
} from '@stayreco/shared';
import {
  type AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ErrorCode } from '../../common/errors/error-code';
import { zodDto } from '../../common/pipes/validation';
import { ApiData, ApiErrors } from '../../common/swagger/api-docs.decorators';
import { UserRole } from '../../generated/prisma/client';
import { OnboardingService } from './onboarding.service';

class CompleteOnboardingDto extends zodDto(completeOnboardingSchema) {}
class OnboardingHotelsQueryDto extends zodDto(onboardingHotelsQuerySchema) {}

/** First-login preferences and the welcome voucher (docs/design/onboarding-welcome-voucher.md). */
@ApiTags('onboarding')
@Controller('me/onboarding')
export class OnboardingController {
  constructor(private readonly onboarding: OnboardingService) {}

  @ApiOperation({
    summary: 'Where I am in onboarding, and what to pick from',
    description:
      '`NEW`: show the screen after sign-in. `SKIPPED`: offer it again from the account page. `COMPLETED`: done, and `options` is null. `voucher` is the welcome code once issued.',
  })
  @ApiData(onboardingResponseSchema)
  @Roles(UserRole.CUSTOMER)
  @Get()
  get(@CurrentUser() user: AuthUser) {
    return this.onboarding.get(user.accountId);
  }

  @ApiOperation({
    summary: 'Hotels that fit the answers I gave so far',
    description:
      "The hotel step, asked after the destinations and taste steps with their answers: bookable hotels in the cities picked (every city when none) that fit a chosen travel style, ranked by how much of the style, amenities and views they share, at most 12. A hotel fits a style when its name, description, amenities and room types use at least two of that style's phrases, the recommender's own vocabulary. `matches` says what it fits; a hotel whose cheapest night is more than 20% over the budget comes last with `overBudget`. Empty when nothing fits: let the customer finish without a hotel.",
  })
  @ApiData(onboardingHotelSuggestionsResponseSchema)
  @Roles(UserRole.CUSTOMER)
  @Get('hotels')
  hotels(@Query() query: OnboardingHotelsQueryDto) {
    return this.onboarding.suggestHotels(query);
  }

  @ApiOperation({
    summary: 'Save my picks and get the welcome voucher',
    description:
      'At least 3 picks over all the lists (a budget counts as one). Cities, hotels and views must be ones `GET` offered. The picks become my preferences (the same keys as `/me/preferences`), and the platform issues one welcome code, once per customer, paid out of its commission. Once completed, change the picks with `PUT /me/preferences`.',
  })
  @ApiData(onboardingResponseSchema)
  @ApiErrors(ErrorCode.ONBOARDING_ALREADY_COMPLETED)
  @Roles(UserRole.CUSTOMER)
  @Post()
  @HttpCode(HttpStatus.OK)
  complete(@CurrentUser() user: AuthUser, @Body() dto: CompleteOnboardingDto) {
    return this.onboarding.complete(user.accountId, dto);
  }

  @ApiOperation({
    summary: 'Skip onboarding for now',
    description:
      'Saves only that it was skipped, so the screen is not forced on me again. Finishing it later still earns the welcome code.',
  })
  @ApiData(onboardingResponseSchema)
  @ApiErrors(ErrorCode.ONBOARDING_ALREADY_COMPLETED)
  @Roles(UserRole.CUSTOMER)
  @Post('skip')
  @HttpCode(HttpStatus.OK)
  skip(@CurrentUser() user: AuthUser) {
    return this.onboarding.skip(user.accountId);
  }
}
