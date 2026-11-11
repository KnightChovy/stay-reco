import {
  createReviewSchema,
  reviewListQuerySchema,
  reviewVisibilitySchema,
  updateReviewSchema,
} from '@stayreco/shared';
import { zodDto } from '../../../common/pipes/validation';

export class CreateReviewDto extends zodDto(createReviewSchema) {}
export class UpdateReviewDto extends zodDto(updateReviewSchema) {}
export class ReviewVisibilityDto extends zodDto(reviewVisibilitySchema) {}
export class ReviewListQueryDto extends zodDto(reviewListQuerySchema) {}
