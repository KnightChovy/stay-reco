import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { hotelAddOnResponseSchema, z } from '@stayreco/shared';
import {
  type AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { ErrorCode } from '../../common/errors/error-code';
import { HotelAccessRequired } from '../../common/hotel-access/hotel-access.guard';
import {
  ApiData,
  ApiHotelAccess,
} from '../../common/swagger/api-docs.decorators';
import { AddOnsService } from './add-ons.service';
import { CreateAddOnDto, UpdateAddOnDto } from './dto/add-on.dto';

@ApiTags('add-ons')
@Controller()
export class AddOnsController {
  constructor(private readonly addOns: AddOnsService) {}

  @ApiOperation({
    summary: 'List the add-ons of a hotel',
    description:
      'Every add-on, the ones off sale included: active first, then by name. Customers read the active ones on the hotel listing (`hotel.addOns`).',
  })
  @HotelAccessRequired('member')
  @ApiData(z.array(hotelAddOnResponseSchema))
  @Get('hotels/:hotelId/add-ons')
  list(@Param('hotelId') hotelId: string) {
    return this.addOns.list(hotelId);
  }

  @ApiOperation({
    summary: 'Create an add-on',
    description:
      '`timing` says when it is delivered (before, during or after the stay) and is only a label. `prebookable` (default true): customers can book it with the stay and pay it in the transfer; false: only staff can add it, paid at the desk.',
  })
  @HotelAccessRequired('owner')
  @ApiData(hotelAddOnResponseSchema, HttpStatus.CREATED)
  @Post('hotels/:hotelId/add-ons')
  create(@Param('hotelId') hotelId: string, @Body() dto: CreateAddOnDto) {
    return this.addOns.create(hotelId, dto);
  }

  @ApiOperation({
    summary: 'Update an add-on',
    description:
      'Only the fields sent change; `isActive: false` takes it off sale. Bookings keep the name and price they were made with.',
  })
  @ApiHotelAccess('owner', ErrorCode.ADD_ON_NOT_FOUND)
  @ApiData(hotelAddOnResponseSchema)
  @Patch('add-ons/:id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateAddOnDto,
  ) {
    return this.addOns.update(user, id, dto);
  }
}
