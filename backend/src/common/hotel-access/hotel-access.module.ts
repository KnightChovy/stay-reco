import { Global, Module } from '@nestjs/common';
import { HotelAccessGuard } from './hotel-access.guard';
import { HotelAccessService } from './hotel-access.service';

@Global()
@Module({
  providers: [HotelAccessService, HotelAccessGuard],
  exports: [HotelAccessService, HotelAccessGuard],
})
export class HotelAccessModule {}
