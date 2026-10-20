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
import { ApiTags } from '@nestjs/swagger';
import { uploadRoomTypeImageSchema } from '@stayreco/shared';
import {
  type AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { HotelAccessRequired } from '../../common/hotel-access/hotel-access.guard';
import { UploadedFileOf, UploadFile } from '../../common/upload/upload-file';
import {
  CreateRoomTypeDto,
  UpdateRoomTypeDto,
  UpdateRoomTypeImageDto,
  UploadRoomTypeImageDto,
} from './dto/room.dto';
import { RoomTypeImagesService } from './room-type-images.service';
import { RoomTypesService } from './room-types.service';

@ApiTags('rooms')
@Controller()
export class RoomTypesController {
  constructor(
    private readonly roomTypes: RoomTypesService,
    private readonly images: RoomTypeImagesService,
  ) {}

  @HotelAccessRequired('member')
  @Get('hotels/:hotelId/room-types')
  list(@Param('hotelId') hotelId: string) {
    return this.roomTypes.list(hotelId);
  }

  @HotelAccessRequired('owner')
  @Post('hotels/:hotelId/room-types')
  create(@Param('hotelId') hotelId: string, @Body() dto: CreateRoomTypeDto) {
    return this.roomTypes.create(hotelId, dto);
  }

  @Get('room-types/:id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.roomTypes.findOne(user, id);
  }

  @Patch('room-types/:id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateRoomTypeDto,
  ) {
    return this.roomTypes.update(user, id, dto);
  }

  @Delete('room-types/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.roomTypes.remove(user, id);
  }

  @UploadFile('image', uploadRoomTypeImageSchema)
  @Post('room-types/:id/images')
  uploadImage(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @UploadedFileOf('image') file: Buffer,
    @Body() dto: UploadRoomTypeImageDto,
  ) {
    return this.images.upload(user, id, file, dto);
  }

  @Patch('room-type-images/:id')
  updateImage(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateRoomTypeImageDto,
  ) {
    return this.images.update(user, id, dto);
  }

  @Delete('room-type-images/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeImage(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.images.remove(user, id);
  }
}
