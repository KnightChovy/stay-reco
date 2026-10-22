import { z } from 'zod';

/**
 * Named response schemas. Types come from them with `z.infer`, and the backend turns the registry into Swagger
 * components with the same names, so the docs cannot drift from what the API returns.
 */
export const responseSchemas = z.registry<{ id: string; description?: string }>();

/** ISO 8601 date-time in UTC, e.g. "2026-10-14T03:00:00.000Z". */
export const isoDateTime = () => z.iso.datetime();
