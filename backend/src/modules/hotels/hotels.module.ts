import { Module } from '@nestjs/common';
import { HotelImagesController } from './hotel-images.controller';
import { HotelImagesService } from './hotel-images.service';
import { HotelsController } from './hotels.controller';
import { HotelsService } from './hotels.service';

@Module({
  controllers: [HotelsController, HotelImagesController],
  providers: [HotelsService, HotelImagesService],
})
export class HotelsModule {}
