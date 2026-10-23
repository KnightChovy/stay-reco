import type { PricingRule, PricingRuleShape } from '@stayreco/shared';
import type { Price } from '../../generated/prisma/client';
import { toCalendarDate } from '../../common/http/calendar-date';
import { toNumber } from '../../common/http/decimal';

const dateOrNull = (date: Date | null) => (date ? toCalendarDate(date) : null);

/** Pricing rules are the non-BASE `price` rows; the BASE row is the room type's `basePrice`. */
export const toPricingRule = (p: Price): PricingRule => ({
  id: p.priceId,
  roomTypeId: p.roomTypeId,
  name: p.name,
  ruleType: p.ruleType,
  adjustmentType: p.adjustmentType!,
  adjustmentValue: toNumber(p.adjustmentValue!),
  validFrom: dateOrNull(p.validFrom),
  validTo: dateOrNull(p.validTo),
  dayOfWeek: p.dayOfWeek,
  minDaysBefore: p.minDaysBefore,
  maxDaysBefore: p.maxDaysBefore,
  priority: p.priority,
  isActive: p.isActive,
  createdAt: p.createdAt.toISOString(),
});

/** A stored rule in the form `pricingRuleIssues` checks, so a PATCH can be validated on the merged result. */
export const toRuleShape = (p: Price): PricingRuleShape => {
  const rule = toPricingRule(p);
  return { ...rule, ruleType: rule.ruleType as PricingRuleShape['ruleType'] };
};
