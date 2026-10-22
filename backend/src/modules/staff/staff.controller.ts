import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  staffMemberResponseSchema,
  staffPermissionsSchema,
  z,
} from '@stayreco/shared';
import {
  type AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import {
  ReqMeta,
  type RequestMeta,
} from '../../common/decorators/request-meta.decorator';
import { ErrorCode } from '../../common/errors/error-code';
import { HotelAccessRequired } from '../../common/hotel-access/hotel-access.guard';
import { zodDto } from '../../common/pipes/validation';
import {
  ApiData,
  ApiErrors,
  ApiHotelAccess,
} from '../../common/swagger/api-docs.decorators';
import { StaffService } from './staff.service';

class StaffPermissionsDto extends zodDto(staffPermissionsSchema) {}

@ApiTags('staff')
@Controller()
export class StaffController {
  constructor(private readonly staff: StaffService) {}

  /** List the hotel's staff, including pending invitations (INVITED) */
  @HotelAccessRequired('owner-view')
  @ApiData(z.array(staffMemberResponseSchema))
  @Get('hotels/:hotelId/staff')
  list(@Param('hotelId') hotelId: string) {
    return this.staff.list(hotelId);
  }

  /** Replace a staff member's permission groups */
  @ApiHotelAccess('owner', ErrorCode.STAFF_NOT_FOUND)
  @ApiOperation({
    description:
      "An empty array means read-only. Applies from the staff member's next request.",
  })
  @ApiData(staffMemberResponseSchema)
  @Patch('hotel-staff/:id/permissions')
  setPermissions(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: StaffPermissionsDto,
    @ReqMeta() meta: RequestMeta,
  ) {
    return this.staff.setPermissions(user, id, dto.permissions, meta);
  }

  /** Deactivate a staff member (ACTIVE → DEACTIVATED) */
  @ApiHotelAccess('owner', ErrorCode.STAFF_NOT_FOUND)
  @ApiOperation({
    description:
      'Signs the staff member out of every device at once; their sign-in then returns `AUTH_ACCOUNT_DEACTIVATED`.',
  })
  @ApiData(staffMemberResponseSchema)
  @ApiErrors(ErrorCode.STAFF_STATUS_CONFLICT)
  @Post('hotel-staff/:id/deactivate')
  @HttpCode(HttpStatus.OK)
  deactivate(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @ReqMeta() meta: RequestMeta,
  ) {
    return this.staff.deactivate(user, id, meta);
  }

  /** Activate a deactivated staff member (DEACTIVATED → ACTIVE) */
  @ApiHotelAccess('owner', ErrorCode.STAFF_NOT_FOUND)
  @ApiData(staffMemberResponseSchema)
  @ApiErrors(ErrorCode.STAFF_STATUS_CONFLICT)
  @Post('hotel-staff/:id/activate')
  @HttpCode(HttpStatus.OK)
  activate(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @ReqMeta() meta: RequestMeta,
  ) {
    return this.staff.activate(user, id, meta);
  }

  /** Cancel a pending invitation */
  @ApiHotelAccess('owner', ErrorCode.STAFF_NOT_FOUND)
  @ApiOperation({
    description:
      'Only while the invitation is pending (INVITED): the email link stops working and the email can be invited again. Used accounts are deactivated instead.',
  })
  @ApiErrors(ErrorCode.STAFF_STATUS_CONFLICT)
  @Delete('hotel-staff/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  cancelInvitation(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @ReqMeta() meta: RequestMeta,
  ) {
    return this.staff.cancelInvitation(user, id, meta);
  }
}
