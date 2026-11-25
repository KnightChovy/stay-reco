import { z } from 'zod';
import { AddOnPayment, AddOnTiming } from '../enums';
import { isoDateTime, responseSchemas } from './registry';

export const hotelAddOnResponseSchema = z
  .object({
    id: z.uuid(),
    name: z.string(),
    description: z.string().nullable(),
    price: z.number().describe('One unit, in dong.'),
    timing: z.enum(AddOnTiming),
    prebookable: z.boolean().describe('False: only staff can add it to a stay, paid at the desk.'),
    isActive: z.boolean(),
    createdAt: isoDateTime(),
  })
  .register(responseSchemas, { id: 'HotelAddOn', description: 'A service a hotel sells on top of the room.' });
export type HotelAddOn = z.infer<typeof hotelAddOnResponseSchema>;

export const bookingAddOnResponseSchema = z
  .object({
    id: z.uuid(),
    addOnId: z.uuid(),
    name: z.string().describe('Fixed when the line was added.'),
    timing: z.enum(AddOnTiming),
    unitPrice: z.number().describe('Fixed when the line was added.'),
    quantity: z.number().int(),
    amount: z.number().describe('unitPrice × quantity.'),
    payment: z
      .enum(AddOnPayment)
      .describe('PREPAID: in the booking total. FRONT_DESK: added by staff, collected at check-out.'),
    createdAt: isoDateTime(),
  })
  .register(responseSchemas, { id: 'BookingAddOn' });
export type BookingAddOn = z.infer<typeof bookingAddOnResponseSchema>;
