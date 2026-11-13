import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  aiBudgetResponseSchema,
  brandVoiceResponseSchema,
} from '@stayreco/shared';
import {
  type AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { ErrorCode } from '../../common/errors/error-code';
import { HotelAccessRequired } from '../../common/hotel-access/hotel-access.guard';
import { ApiData, ApiErrors } from '../../common/swagger/api-docs.decorators';
import { BrandVoiceService } from './brand-voice.service';
import { AiService } from './ai.service';
import { LearnBrandVoiceDto, UpdateBrandVoiceDto } from './dto/marketing.dto';

/** The brand voice the AI writer uses, and what it has cost (phase 5, M1). */
@ApiTags('marketing')
@Controller('hotels/:hotelId')
export class MarketingController {
  constructor(
    private readonly brandVoice: BrandVoiceService,
    private readonly ai: AiService,
  ) {}

  @ApiOperation({
    summary: "The hotel's brand voice",
    description:
      'Every field is null until a voice has been set up; the writer then falls back to a plain, warm tone. The voice belongs to the partner, so a chain shares one across its hotels.',
  })
  @HotelAccessRequired('member')
  @ApiData(brandVoiceResponseSchema)
  @Get('brand-voice')
  get(@Param('hotelId') hotelId: string) {
    return this.brandVoice.get(hotelId);
  }

  @ApiOperation({
    summary: 'Edit the brand voice by hand',
    description:
      'Writes the fields it is given, removes the ones set to `null`, and leaves the rest alone, so one screen can own one field.',
  })
  @HotelAccessRequired('owner')
  @ApiData(brandVoiceResponseSchema)
  @Patch('brand-voice')
  update(@Param('hotelId') hotelId: string, @Body() dto: UpdateBrandVoiceDto) {
    return this.brandVoice.update(hotelId, dto);
  }

  @ApiOperation({
    summary: 'Work out the brand voice from posts the hotel has published',
    description:
      'Send 2 to 5 posts the hotel is happy with; the model describes the voice they share and saves it over the current one. Asking an owner to describe their own tone rarely works, so this is the way in. Costs one model call against the monthly budget.',
  })
  @HotelAccessRequired('owner')
  @ApiData(brandVoiceResponseSchema)
  @ApiErrors(
    ErrorCode.AI_UNAVAILABLE,
    ErrorCode.AI_BUDGET_EXCEEDED,
    ErrorCode.AI_REFUSED,
  )
  @Post('brand-voice/learn')
  @HttpCode(HttpStatus.OK)
  learn(
    @CurrentUser() user: AuthUser,
    @Param('hotelId') hotelId: string,
    @Body() dto: LearnBrandVoiceDto,
  ) {
    return this.brandVoice.learn(user, hotelId, dto);
  }

  @ApiOperation({
    summary: 'What the AI writer has cost this month',
    description:
      'Spend is counted per calendar month in UTC and resets on the first. At `remainingUsd: 0` the writer answers `AI_BUDGET_EXCEEDED` until the month turns.',
  })
  @HotelAccessRequired('member')
  @ApiData(aiBudgetResponseSchema)
  @Get('ai-budget')
  budget(@Param('hotelId') hotelId: string) {
    return this.ai.budget(hotelId);
  }
}
