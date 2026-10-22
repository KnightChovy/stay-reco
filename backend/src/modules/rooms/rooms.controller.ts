import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { roomResponseSchema } from '@stayreco/shared';
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
import {
  ApiData,
  ApiErrors,
  ApiHotelAccess,
  ApiPage,
} from '../../common/swagger/api-docs.decorators';
import {
  CreateRoomDto,
  LockRoomDto,
  RoomListQueryDto,
  UpdateRoomDto,
} from './dto/room.dto';
import { RoomsService } from './rooms.service';

@ApiTags('rooms')
@Controller()
export class RoomsController {
  constructor(private readonly rooms: RoomsService) {}

  @HotelAccessRequired('member')
  @ApiOperation({
    summary: "List the hotel's physical rooms",
    description:
      '`search` matches the room number literally. Room numbers sort in natural order (9, 101, 1001).',
  })
  @ApiPage(roomResponseSchema)
  @Get('hotels/:hotelId/rooms')
  list(@Param('hotelId') hotelId: string, @Query() query: RoomListQueryDto) {
    return this.rooms.list(hotelId, query);
  }

  @HotelAccessRequired('owner')
  @ApiOperation({
    summary: 'Create a physical room',
    description:
      'Needs the room config first; the room count cannot exceed `totalRooms`. Room numbers are unique per hotel, case-insensitive.',
  })
  @ApiData(roomResponseSchema, HttpStatus.CREATED)
  @ApiErrors(
    ErrorCode.ROOM_TYPE_NOT_FOUND,
    ErrorCode.ROOM_LIMIT_REACHED,
    ErrorCode.ROOM_NUMBER_TAKEN,
  )
  @Post('hotels/:hotelId/rooms')
  create(@Param('hotelId') hotelId: string, @Body() dto: CreateRoomDto) {
    return this.rooms.create(hotelId, dto);
  }

  @ApiOperation({
    summary: 'Update a room (number, floor, type, notes; not the status)',
  })
  @ApiHotelAccess('owner', ErrorCode.ROOM_NOT_FOUND)
  @ApiData(roomResponseSchema)
  @ApiErrors(ErrorCode.ROOM_TYPE_NOT_FOUND, ErrorCode.ROOM_NUMBER_TAKEN)
  @Patch('rooms/:id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateRoomDto,
  ) {
    return this.rooms.update(user, id, dto);
  }

  @ApiHotelAccess('owner', ErrorCode.ROOM_NOT_FOUND)
  @ApiOperation({
    summary: 'Lock a room for maintenance (status MAINTENANCE)',
    description:
      'A room with a guest (`OCCUPIED`) cannot be locked. Written to the audit log with the reason.',
  })
  @ApiData(roomResponseSchema)
  @ApiErrors(ErrorCode.ROOM_NOT_LOCKABLE)
  @Post('rooms/:id/lock')
  @HttpCode(HttpStatus.OK)
  lock(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: LockRoomDto,
    @ReqMeta() meta: RequestMeta,
  ) {
    return this.rooms.lock(user, id, dto.reason, meta);
  }

  @ApiOperation({ summary: 'Unlock a locked room (status AVAILABLE)' })
  @ApiHotelAccess('owner', ErrorCode.ROOM_NOT_FOUND)
  @ApiData(roomResponseSchema)
  @ApiErrors(ErrorCode.ROOM_NOT_LOCKABLE)
  @Post('rooms/:id/unlock')
  @HttpCode(HttpStatus.OK)
  unlock(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @ReqMeta() meta: RequestMeta,
  ) {
    return this.rooms.unlock(user, id, meta);
  }
}
