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
  roomTypeImageResponseSchema,
  roomTypeResponseSchema,
  uploadRoomTypeImageSchema,
  z,
} from '@stayreco/shared';
import {
  type AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { ErrorCode } from '../../common/errors/error-code';
import { HotelAccessRequired } from '../../common/hotel-access/hotel-access.guard';
import {
  ApiData,
  ApiErrors,
  ApiHotelAccess,
} from '../../common/swagger/api-docs.decorators';
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

  /** List the hotel's room types */
  @HotelAccessRequired('member')
  @ApiData(z.array(roomTypeResponseSchema))
  @Get('hotels/:hotelId/room-types')
  list(@Param('hotelId') hotelId: string) {
    return this.roomTypes.list(hotelId);
  }

  /** Create a room type */
  @HotelAccessRequired('owner')
  @ApiOperation({
    description:
      '`basePrice` is the nightly price before seasonal rules. Unknown bed types or amenities return `VALIDATION_ERROR` on `beds` / `amenityIds`.',
  })
  @ApiData(roomTypeResponseSchema, HttpStatus.CREATED)
  @Post('hotels/:hotelId/room-types')
  create(@Param('hotelId') hotelId: string, @Body() dto: CreateRoomTypeDto) {
    return this.roomTypes.create(hotelId, dto);
  }

  /** Get a room type */
  @ApiHotelAccess('member', ErrorCode.ROOM_TYPE_NOT_FOUND)
  @ApiData(roomTypeResponseSchema)
  @Get('room-types/:id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.roomTypes.findOne(user, id);
  }

  /** Update a room type */
  @ApiHotelAccess('owner', ErrorCode.ROOM_TYPE_NOT_FOUND)
  @ApiOperation({
    description:
      'Sending `beds` or `amenityIds` replaces the whole list; leaving them out keeps them. `description: null` clears it.',
  })
  @ApiData(roomTypeResponseSchema)
  @Patch('room-types/:id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateRoomTypeDto,
  ) {
    return this.roomTypes.update(user, id, dto);
  }

  /** Delete a room type that has no rooms or bookings */
  @ApiHotelAccess('owner', ErrorCode.ROOM_TYPE_NOT_FOUND)
  @ApiErrors(ErrorCode.ROOM_TYPE_IN_USE)
  @Delete('room-types/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.roomTypes.remove(user, id);
  }

  /** Upload a room type image (at most 30, shown by `sortOrder`) */
  @ApiHotelAccess('owner', ErrorCode.ROOM_TYPE_NOT_FOUND)
  @UploadFile('image', uploadRoomTypeImageSchema)
  @ApiData(roomTypeImageResponseSchema, HttpStatus.CREATED)
  @ApiErrors(ErrorCode.IMAGE_LIMIT_REACHED)
  @Post('room-types/:id/images')
  uploadImage(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @UploadedFileOf('image') file: Buffer,
    @Body() dto: UploadRoomTypeImageDto,
  ) {
    return this.images.upload(user, id, file, dto);
  }

  /** Update a room type image: caption or order */
  @ApiHotelAccess('owner', ErrorCode.IMAGE_NOT_FOUND)
  @ApiData(roomTypeImageResponseSchema)
  @Patch('room-type-images/:id')
  updateImage(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateRoomTypeImageDto,
  ) {
    return this.images.update(user, id, dto);
  }

  /** Delete a room type image */
  @ApiHotelAccess('owner', ErrorCode.IMAGE_NOT_FOUND)
  @Delete('room-type-images/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeImage(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.images.remove(user, id);
  }
}
