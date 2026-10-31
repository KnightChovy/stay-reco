import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  hotelResponseSchema,
  hotelSummaryResponseSchema,
  z,
} from '@stayreco/shared';
import {
  type AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ErrorCode } from '../../common/errors/error-code';
import { HotelAccessRequired } from '../../common/hotel-access/hotel-access.guard';
import { ApiData, ApiErrors } from '../../common/swagger/api-docs.decorators';
import { UserRole } from '../../generated/prisma/client';
import {
  CancellationPolicyDto,
  CreateHotelDto,
  HotelAmenitiesDto,
  HotelPoliciesDto,
  LateCheckoutPolicyDto,
  RoomConfigDto,
  UpdateHotelDto,
} from './dto/hotel.dto';
import { HotelsService } from './hotels.service';

@ApiTags('hotels')
@Controller()
export class HotelsController {
  constructor(private readonly hotels: HotelsService) {}

  @ApiOperation({
    summary:
      'List my hotels: owned ones for a partner, the assigned one for staff',
  })
  @Roles(UserRole.HOTEL_PARTNER, UserRole.HOTEL_STAFF)
  @ApiData(z.array(hotelSummaryResponseSchema))
  @Get('me/hotels')
  myHotels(@CurrentUser() user: AuthUser) {
    return this.hotels.myHotels(user);
  }

  @ApiOperation({ summary: 'Create a hotel (status DRAFT)' })
  @Roles(UserRole.HOTEL_PARTNER)
  @ApiData(hotelResponseSchema, HttpStatus.CREATED)
  @ApiErrors(ErrorCode.PARTNER_SUSPENDED)
  @Post('hotels')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateHotelDto) {
    return this.hotels.create(user, dto);
  }

  @ApiOperation({
    summary: 'Get a hotel with its amenities, images, policies and room config',
  })
  @HotelAccessRequired('member')
  @ApiData(hotelResponseSchema)
  @Get('hotels/:hotelId')
  findOne(@Param('hotelId') hotelId: string) {
    return this.hotels.findOne(hotelId);
  }

  @ApiOperation({
    summary: 'Update hotel details; send `null` to clear an optional field',
  })
  @HotelAccessRequired('owner')
  @ApiData(hotelResponseSchema)
  @Patch('hotels/:hotelId')
  update(@Param('hotelId') hotelId: string, @Body() dto: UpdateHotelDto) {
    return this.hotels.update(hotelId, dto);
  }

  @ApiOperation({
    summary: "Replace the hotel's amenities (ids from `GET /amenities`)",
  })
  @HotelAccessRequired('owner')
  @ApiData(hotelResponseSchema)
  @Put('hotels/:hotelId/amenities')
  setAmenities(
    @Param('hotelId') hotelId: string,
    @Body() dto: HotelAmenitiesDto,
  ) {
    return this.hotels.setAmenities(hotelId, dto.amenityIds);
  }

  @ApiOperation({
    summary: "Replace the hotel's policies; keys not sent are removed",
  })
  @HotelAccessRequired('owner')
  @ApiData(hotelResponseSchema)
  @Put('hotels/:hotelId/policies')
  setPolicies(
    @Param('hotelId') hotelId: string,
    @Body() dto: HotelPoliciesDto,
  ) {
    return this.hotels.setPolicies(hotelId, dto.policies);
  }

  @ApiOperation({
    summary: 'Set the hotel cancellation policy',
    description:
      'Guests cancel for free until the hotel check-in time (14:00 when not set), `freeCancellationDays` days before the check-in date; after that `feePercent` of the amount paid is kept. `freeCancellationDays: null` means no free period (`null` + 100 = non-refundable). Until it is set, `cancellationPolicy` shows the default (1 day, 100%). Existing bookings keep the policy fixed on them.',
  })
  @HotelAccessRequired('owner')
  @ApiData(hotelResponseSchema)
  @Patch('hotels/:hotelId/cancellation-policy')
  setCancellationPolicy(
    @Param('hotelId') hotelId: string,
    @Body() dto: CancellationPolicyDto,
  ) {
    return this.hotels.setCancellationPolicy(hotelId, dto);
  }

  @ApiOperation({
    summary: 'Set the hotel late check-out policy',
    description:
      'Decisions L1–L3. Free for `graceMinutes` after the check-out time (12:00 when not set); then, on the check-out date, `beforeCutoffPercent` of the last night price (fixed at booking) × rooms until `cutoffTime` and `afterCutoffPercent` from it; each later day adds `afterCutoffPercent`. Rounded half up to whole dong and paid at the front desk, outside StayReco (no wallet, no commission). The policy in force at check-out applies.',
  })
  @HotelAccessRequired('owner')
  @ApiData(hotelResponseSchema)
  @Patch('hotels/:hotelId/late-checkout-policy')
  setLateCheckoutPolicy(
    @Param('hotelId') hotelId: string,
    @Body() dto: LateCheckoutPolicyDto,
  ) {
    return this.hotels.setLateCheckoutPolicy(hotelId, dto);
  }

  @ApiOperation({
    summary: 'Remove the hotel late check-out policy',
    description:
      'Checking out late costs nothing again (`lateCheckoutPolicy: null`, the default).',
  })
  @HotelAccessRequired('owner')
  @ApiData(hotelResponseSchema)
  @Delete('hotels/:hotelId/late-checkout-policy')
  clearLateCheckoutPolicy(@Param('hotelId') hotelId: string) {
    return this.hotels.clearLateCheckoutPolicy(hotelId);
  }

  @ApiOperation({
    summary:
      'Set the declared number of physical rooms and the default base price (required before creating rooms)',
  })
  @HotelAccessRequired('owner')
  @ApiData(hotelResponseSchema)
  @ApiErrors(ErrorCode.ROOM_LIMIT_REACHED)
  @Put('hotels/:hotelId/room-config')
  setRoomConfig(@Param('hotelId') hotelId: string, @Body() dto: RoomConfigDto) {
    return this.hotels.setRoomConfig(hotelId, dto);
  }
}
