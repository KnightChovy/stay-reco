import { z } from 'zod';
import { responseSchemas } from './registry';

/** `GET` / `PUT /me/preferences`: the whole preference set, `{}` when nothing has been saved. */
export const preferencesResponseSchema = z
  .object({
    preferences: z
      .record(z.string(), z.string())
      .describe('Free-form key-value pairs; the backend does not interpret the keys.'),
  })
  .register(responseSchemas, {
    id: 'Preferences',
    description: "The signed-in customer's saved preferences.",
  });
export type Preferences = z.infer<typeof preferencesResponseSchema>;
