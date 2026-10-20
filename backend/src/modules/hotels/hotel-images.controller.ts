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
import { ApiTags } from '@nestjs/swagger';
import { uploadHotelImageSchema } from '@stayreco/shared';
import {
  type AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { HotelAccessRequired } from '../../common/hotel-access/hotel-access.guard';
import { UploadedFileOf, UploadFile } from '../../common/upload/upload-file';
import { UpdateHotelImageDto, UploadHotelImageDto } from './dto/hotel.dto';
import { HotelImagesService } from './hotel-images.service';

@ApiTags('hotels')
@Controller()
export class HotelImagesController {
  constructor(private readonly images: HotelImagesService) {}

  @HotelAccessRequired('owner')
  @UploadFile('image', uploadHotelImageSchema)
  @Post('hotels/:hotelId/images')
  upload(
    @Param('hotelId') hotelId: string,
    @UploadedFileOf('image') file: Buffer,
    @Body() dto: UploadHotelImageDto,
  ) {
    return this.images.upload(hotelId, file, dto);
  }

  @Patch('hotel-images/:id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateHotelImageDto,
  ) {
    return this.images.update(user, id, dto);
  }

  @Delete('hotel-images/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.images.remove(user, id);
  }
}
