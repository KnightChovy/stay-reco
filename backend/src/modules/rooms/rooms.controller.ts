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
import { ApiTags } from '@nestjs/swagger';
import {
  type AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import {
  ReqMeta,
  type RequestMeta,
} from '../../common/decorators/request-meta.decorator';
import { HotelAccessRequired } from '../../common/hotel-access/hotel-access.guard';
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
  @Get('hotels/:hotelId/rooms')
  list(@Param('hotelId') hotelId: string, @Query() query: RoomListQueryDto) {
    return this.rooms.list(hotelId, query);
  }

  @HotelAccessRequired('owner')
  @Post('hotels/:hotelId/rooms')
  create(@Param('hotelId') hotelId: string, @Body() dto: CreateRoomDto) {
    return this.rooms.create(hotelId, dto);
  }

  @Patch('rooms/:id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateRoomDto,
  ) {
    return this.rooms.update(user, id, dto);
  }

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
