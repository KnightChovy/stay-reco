import { z } from 'zod';
import { NotificationType } from '../enums';
import { isoDateTime, responseSchemas } from './registry';

/** In-app notifications (decision O12): one next to every booking, refund and change-request email. */

export const notificationResponseSchema = z
  .object({
    id: z.uuid(),
    type: z.enum(NotificationType),
    title: z.string().nullable(),
    message: z.string(),
    link: z.string().nullable().describe('App path to open, e.g. "/account/bookings/<id>"; null when none.'),
    isRead: z.boolean(),
    createdAt: isoDateTime(),
  })
  .register(responseSchemas, { id: 'Notification' });
export type Notification = z.infer<typeof notificationResponseSchema>;

export const unreadCountResponseSchema = z
  .object({ count: z.number().int() })
  .register(responseSchemas, { id: 'UnreadCount' });
export type UnreadCount = z.infer<typeof unreadCountResponseSchema>;

export const readAllResponseSchema = z
  .object({ updated: z.number().int().describe('Notifications marked as read by this call.') })
  .register(responseSchemas, { id: 'ReadAllResult' });
export type ReadAllResult = z.infer<typeof readAllResponseSchema>;
