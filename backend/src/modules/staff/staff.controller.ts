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
import { ApiTags } from '@nestjs/swagger';
import { staffPermissionsSchema } from '@stayreco/shared';
import {
  type AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import {
  ReqMeta,
  type RequestMeta,
} from '../../common/decorators/request-meta.decorator';
import { HotelAccessRequired } from '../../common/hotel-access/hotel-access.guard';
import { zodDto } from '../../common/pipes/validation';
import { StaffService } from './staff.service';

class StaffPermissionsDto extends zodDto(staffPermissionsSchema) {}

@ApiTags('staff')
@Controller()
export class StaffController {
  constructor(private readonly staff: StaffService) {}

  @HotelAccessRequired('owner-view')
  @Get('hotels/:hotelId/staff')
  list(@Param('hotelId') hotelId: string) {
    return this.staff.list(hotelId);
  }

  @Patch('hotel-staff/:id/permissions')
  setPermissions(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: StaffPermissionsDto,
    @ReqMeta() meta: RequestMeta,
  ) {
    return this.staff.setPermissions(user, id, dto.permissions, meta);
  }

  @Post('hotel-staff/:id/deactivate')
  @HttpCode(HttpStatus.OK)
  deactivate(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @ReqMeta() meta: RequestMeta,
  ) {
    return this.staff.deactivate(user, id, meta);
  }

  @Post('hotel-staff/:id/activate')
  @HttpCode(HttpStatus.OK)
  activate(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @ReqMeta() meta: RequestMeta,
  ) {
    return this.staff.activate(user, id, meta);
  }
}
