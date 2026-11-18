import { z } from 'zod';
import { AddOnTiming } from '../enums';
import { moneySchema } from './common';

export const ADD_ON_LIMITS = {
  /** Distinct add-ons on one booking request. */
  maxLines: 10,
  maxQuantity: 20,
} as const;

const addOnFields = {
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(1000),
  /** Price of one unit, in dong. */
  price: moneySchema,
  timing: z.enum(AddOnTiming),
  /** False: only staff can add it to a stay, paid at the desk. */
  prebookable: z.boolean(),
};

/** `POST /hotels/:hotelId/add-ons`. */
export const createAddOnSchema = z.strictObject({
  ...addOnFields,
  description: addOnFields.description.optional(),
  prebookable: addOnFields.prebookable.default(true),
});
export type CreateAddOnInput = z.infer<typeof createAddOnSchema>;

/** `PATCH /add-ons/:id`. Only the fields sent change; `null` clears the description. Bookings keep their prices. */
export const updateAddOnSchema = z.strictObject({
  name: addOnFields.name.optional(),
  description: addOnFields.description.nullable().optional(),
  price: addOnFields.price.optional(),
  timing: addOnFields.timing.optional(),
  prebookable: addOnFields.prebookable.optional(),
  /** False takes it off sale; lines already booked stay. */
  isActive: z.boolean().optional(),
});
export type UpdateAddOnInput = z.infer<typeof updateAddOnSchema>;

/** One add-on of a booking request or a quote. */
export const addOnLineInputSchema = z.strictObject({
  addOnId: z.uuid(),
  quantity: z.number().int().min(1).max(ADD_ON_LIMITS.maxQuantity).default(1),
});
export type AddOnLineInput = z.infer<typeof addOnLineInputSchema>;

/** The `addOns` field of `POST /bookings` and the discount quote: each add-on at most once. */
export const addOnLinesSchema = z
  .array(addOnLineInputSchema)
  .max(ADD_ON_LIMITS.maxLines)
  .refine((lines) => new Set(lines.map((l) => l.addOnId)).size === lines.length, 'add-ons must be different');

/** `POST /bookings/:id/add-ons`: staff add a service used during the stay, collected at the front desk. */
export const addBookingAddOnSchema = addOnLineInputSchema;
export type AddBookingAddOnInput = z.infer<typeof addBookingAddOnSchema>;
