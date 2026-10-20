/**
 * Prisma turns `contains`, `startsWith` and case-insensitive `equals` into (I)LIKE without escaping. Escape user input
 * so `%`, `_` and `\` are plain characters (e.g. room `1_1` must not match `101`).
 */
export const escapeLike = (value: string) =>
  value.replace(/[\\%_]/g, (c) => `\\${c}`);
