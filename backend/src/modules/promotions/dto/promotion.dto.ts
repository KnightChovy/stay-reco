import {
  createPromotionSchema,
  discountQuoteSchema,
  issueVouchersSchema,
  promotionListQuerySchema,
  updatePromotionSchema,
} from '@stayreco/shared';
import { zodDto } from '../../../common/pipes/validation';

export class CreatePromotionDto extends zodDto(createPromotionSchema) {}
export class UpdatePromotionDto extends zodDto(updatePromotionSchema) {}
export class PromotionListQueryDto extends zodDto(promotionListQuerySchema) {}
export class IssueVouchersDto extends zodDto(issueVouchersSchema) {}
export class DiscountQuoteDto extends zodDto(discountQuoteSchema) {}
