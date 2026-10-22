import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  hotelImageResponseSchema,
  uploadHotelImageSchema,
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
import { UpdateHotelImageDto, UploadHotelImageDto } from './dto/hotel.dto';
import { HotelImagesService } from './hotel-images.service';

@ApiTags('hotels')
@Controller()
export class HotelImagesController {
  constructor(private readonly images: HotelImagesService) {}

  /** Upload a hotel image */
  @HotelAccessRequired('owner')
  @UploadFile('image', uploadHotelImageSchema)
  @ApiOperation({
    description:
      'At most 30 images per hotel. The first image becomes the cover; `isCover: "true"` moves the cover to this image.',
  })
  @ApiData(hotelImageResponseSchema, HttpStatus.CREATED)
  @ApiErrors(ErrorCode.IMAGE_LIMIT_REACHED)
  @Post('hotels/:hotelId/images')
  upload(
    @Param('hotelId') hotelId: string,
    @UploadedFileOf('image') file: Buffer,
    @Body() dto: UploadHotelImageDto,
  ) {
    return this.images.upload(hotelId, file, dto);
  }

  /** Update a hotel image: caption, order, or make it the cover */
  @ApiHotelAccess('owner', ErrorCode.IMAGE_NOT_FOUND)
  @ApiData(hotelImageResponseSchema)
  @Patch('hotel-images/:id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateHotelImageDto,
  ) {
    return this.images.update(user, id, dto);
  }

  /** Delete a hotel image; deleting the cover promotes the next image */
  @ApiHotelAccess('owner', ErrorCode.IMAGE_NOT_FOUND)
  @Delete('hotel-images/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.images.remove(user, id);
  }
}
