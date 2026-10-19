import { Body, Controller, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  type AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { HotelAccessRequired } from '../../common/hotel-access/hotel-access.guard';
import { UserRole } from '../../generated/prisma/client';
import {
  CreateHotelDto,
  HotelAmenitiesDto,
  HotelPoliciesDto,
  RoomConfigDto,
  UpdateHotelDto,
} from './dto/hotel.dto';
import { HotelsService } from './hotels.service';

@ApiTags('hotels')
@Controller()
export class HotelsController {
  constructor(private readonly hotels: HotelsService) {}

  @Roles(UserRole.HOTEL_PARTNER, UserRole.HOTEL_STAFF)
  @Get('me/hotels')
  myHotels(@CurrentUser() user: AuthUser) {
    return this.hotels.myHotels(user);
  }

  @Roles(UserRole.HOTEL_PARTNER)
  @Post('hotels')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateHotelDto) {
    return this.hotels.create(user, dto);
  }

  @HotelAccessRequired('member')
  @Get('hotels/:hotelId')
  findOne(@Param('hotelId') hotelId: string) {
    return this.hotels.findOne(hotelId);
  }

  @HotelAccessRequired('owner')
  @Patch('hotels/:hotelId')
  update(@Param('hotelId') hotelId: string, @Body() dto: UpdateHotelDto) {
    return this.hotels.update(hotelId, dto);
  }

  @HotelAccessRequired('owner')
  @Put('hotels/:hotelId/amenities')
  setAmenities(
    @Param('hotelId') hotelId: string,
    @Body() dto: HotelAmenitiesDto,
  ) {
    return this.hotels.setAmenities(hotelId, dto.amenityIds);
  }

  @HotelAccessRequired('owner')
  @Put('hotels/:hotelId/policies')
  setPolicies(
    @Param('hotelId') hotelId: string,
    @Body() dto: HotelPoliciesDto,
  ) {
    return this.hotels.setPolicies(hotelId, dto.policies);
  }

  @HotelAccessRequired('owner')
  @Put('hotels/:hotelId/room-config')
  setRoomConfig(@Param('hotelId') hotelId: string, @Body() dto: RoomConfigDto) {
    return this.hotels.setRoomConfig(hotelId, dto);
  }
}
