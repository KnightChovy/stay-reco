import { z } from 'zod';

/**
 * `PUT /me/preferences`: the customer's saved preferences as plain key-value pairs, the shape
 * `customer_preference` stores and the recommender of phase 5 reads.
 *
 * Keys given are written; a key set to `null` is removed; keys left out are untouched, so a screen can save the one
 * field it owns without reading the rest first. The backend does not interpret the keys: the FE and the recommender
 * agree on their names, so a new preference needs no migration.
 */
export const updatePreferencesSchema = z.strictObject({
  preferences: z
    .record(
      z.string().trim().min(1).max(100),
      z.string().trim().max(2000).nullable(),
    )
    .refine((v) => Object.keys(v).length > 0, 'at least one preference must be given')
    .refine((v) => Object.keys(v).length <= 100, 'at most 100 preferences at a time'),
});
export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
