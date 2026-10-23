import {
  createPricingRuleSchema,
  pricePreviewQuerySchema,
  pricingRuleListQuerySchema,
  updatePricingRuleSchema,
} from '@stayreco/shared';
import { zodDto } from '../../../common/pipes/validation';

export class CreatePricingRuleDto extends zodDto(createPricingRuleSchema) {}
export class UpdatePricingRuleDto extends zodDto(updatePricingRuleSchema) {}
export class PricingRuleListQueryDto extends zodDto(
  pricingRuleListQuerySchema,
) {}
export class PricePreviewQueryDto extends zodDto(pricePreviewQuerySchema) {}
