import { z } from 'zod';
import { NotificationType } from '../enums';
import { listQuerySchema, repeatedQuery } from './common';

/**
 * `GET /me/notifications`: newest first; `unread=true` keeps only the unread ones; `type` (repeatable) keeps those
 * kinds, e.g. `type=BOOKING&type=PAYMENT` for a "Bookings" tab.
 */
export const notificationListQuerySchema = listQuerySchema.omit({ sort: true, search: true }).extend({
  unread: z.stringbool().optional(),
  type: repeatedQuery(z.enum(NotificationType)).optional(),
});
export type NotificationListQuery = z.infer<typeof notificationListQuerySchema>;
