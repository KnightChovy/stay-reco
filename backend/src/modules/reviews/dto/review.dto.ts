import {
  createReviewSchema,
  decideReportSchema,
  reportListQuerySchema,
  reportReviewSchema,
  reviewListQuerySchema,
  reviewVisibilitySchema,
  updateReviewSchema,
} from '@stayreco/shared';
import { zodDto } from '../../../common/pipes/validation';

export class CreateReviewDto extends zodDto(createReviewSchema) {}
export class UpdateReviewDto extends zodDto(updateReviewSchema) {}
export class ReviewVisibilityDto extends zodDto(reviewVisibilitySchema) {}
export class ReviewListQueryDto extends zodDto(reviewListQuerySchema) {}
export class ReportReviewDto extends zodDto(reportReviewSchema) {}
export class ReportListQueryDto extends zodDto(reportListQuerySchema) {}
export class DecideReportDto extends zodDto(decideReportSchema) {}
