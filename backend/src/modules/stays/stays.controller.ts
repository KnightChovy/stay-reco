import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  hotelListingResponseSchema,
  hotelSearchResultResponseSchema,
  roomTypeListingResponseSchema,
} from '@stayreco/shared';
import { Public } from '../../common/decorators/public.decorator';
import { ErrorCode } from '../../common/errors/error-code';
import {
  ApiData,
  ApiErrors,
  ApiPage,
} from '../../common/swagger/api-docs.decorators';
import { HotelSearchQueryDto, StayQueryDto } from './dto/stay.dto';
import { StaysService } from './stays.service';

@ApiTags('search')
@Public()
@Controller()
export class StaysController {
  constructor(private readonly stays: StaysService) {}

  @ApiOperation({
    summary: 'Search hotels for a stay',
    description:
      'Public. Only bookable hotels (ACTIVE, partner not suspended) with at least one room type free on every night that fits the guests. `destination` matches the city, name or address, ignoring case and Vietnamese accents. `fromTotal` is the cheapest total for the stay and the rooms asked; `priceMin` / `priceMax` filter on it. `freeCancellation` is true when that offer can still be cancelled for free.',
  })
  @ApiPage(hotelSearchResultResponseSchema)
  @Get('hotels')
  search(@Query() query: HotelSearchQueryDto) {
    return this.stays.search(query);
  }

  @ApiOperation({
    summary: 'Hotel page for customers',
    description:
      'Public. Without dates, the room types come without prices (`offer: null`). With `checkIn` / `checkOut`, each room type has an `offer`; a full or too small one shows `available: 0` or `fitsGuests: false` instead of being left out.',
  })
  @ApiData(hotelListingResponseSchema)
  @ApiErrors(ErrorCode.HOTEL_NOT_FOUND)
  @Get('hotels/:hotelId/listing')
  hotelListing(
    @Param('hotelId') hotelId: string,
    @Query() query: StayQueryDto,
  ) {
    return this.stays.hotelListing(hotelId, query);
  }

  @ApiOperation({
    summary: 'Room type page for customers',
    description:
      'Public. Same `offer` as on the hotel page; `offer: null` without dates.',
  })
  @ApiData(roomTypeListingResponseSchema)
  @ApiErrors(ErrorCode.ROOM_TYPE_NOT_FOUND)
  @Get('room-types/:id/listing')
  roomTypeListing(@Param('id') id: string, @Query() query: StayQueryDto) {
    return this.stays.roomTypeListing(id, query);
  }
}
