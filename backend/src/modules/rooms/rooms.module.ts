import { Module } from '@nestjs/common';
import { RoomTypeImagesService } from './room-type-images.service';
import { RoomTypesController } from './room-types.controller';
import { RoomTypesService } from './room-types.service';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';

@Module({
  controllers: [RoomTypesController, RoomsController],
  providers: [RoomTypesService, RoomTypeImagesService, RoomsService],
})
export class RoomsModule {}
