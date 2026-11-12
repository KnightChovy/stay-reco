import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { ContentReportsService } from './content-reports.service';
import { ReviewImagesController } from './review-images.controller';
import { ReviewImagesService } from './review-images.service';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

@Module({
  imports: [StorageModule],
  controllers: [ReviewsController, ReviewImagesController],
  providers: [ReviewsService, ReviewImagesService, ContentReportsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
