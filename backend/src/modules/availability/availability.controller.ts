import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { availabilityDayResponseSchema, z } from '@stayreco/shared';
import { ErrorCode } from '../../common/errors/error-code';
import { HotelAccessRequired } from '../../common/hotel-access/hotel-access.guard';
import { ApiData, ApiErrors } from '../../common/swagger/api-docs.decorators';
import { AvailabilityService } from './availability.service';
import {
  AvailabilityQueryDto,
  UpdateAvailabilityDto,
} from './dto/availability.dto';

@ApiTags('pricing')
@Controller()
export class AvailabilityController {
  constructor(private readonly availability: AvailabilityService) {}

  @ApiOperation({
    summary: 'Rooms on sale per room type and day',
    description:
      'One entry per room type and date, `from` to `to` included (at most 62 days). `onSale` = `totalRooms` − `booked` − `held` − `closed`; rooms locked for maintenance are not in `totalRooms`.',
  })
  @HotelAccessRequired('member')
  @ApiData(z.array(availabilityDayResponseSchema))
  @Get('hotels/:hotelId/availability')
  list(
    @Param('hotelId') hotelId: string,
    @Query() query: AvailabilityQueryDto,
  ) {
    return this.availability.list(hotelId, query);
  }

  @ApiOperation({
    summary: 'Set the rooms on sale of a room type for a range of days',
    description:
      'Closes or reopens rooms so that `onSale` rooms stay on sale each day (the same number as `onSale` in the list); 0 closes the dates. Booked and held nights are never touched: if some day has fewer rooms left than `onSale`, nothing changes and `details` lists those days.',
  })
  @HotelAccessRequired('owner')
  @ApiData(z.array(availabilityDayResponseSchema))
  @ApiErrors(ErrorCode.ROOM_TYPE_NOT_FOUND, ErrorCode.AVAILABILITY_BELOW_BOOKED)
  @Patch('hotels/:hotelId/availability')
  update(
    @Param('hotelId') hotelId: string,
    @Body() dto: UpdateAvailabilityDto,
  ) {
    return this.availability.update(hotelId, dto);
  }
}
