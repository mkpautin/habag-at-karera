import { z } from 'zod';

export const pollingConfigSchema = z.object({
  transport: z.literal('poll'),
  intervalMs: z.number().int().min(1000).max(30_000),
});
