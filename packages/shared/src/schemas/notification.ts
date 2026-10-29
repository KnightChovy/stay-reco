import { z } from 'zod';
import { listQuerySchema } from './common';

/** `GET /me/notifications`: newest first; `unread=true` keeps only the unread ones. */
export const notificationListQuerySchema = listQuerySchema.omit({ sort: true, search: true }).extend({
  unread: z.stringbool().optional(),
});
export type NotificationListQuery = z.infer<typeof notificationListQuerySchema>;
