import { z } from 'zod';

export const createSchema = z.object({
  body: z.object({
    extinguisherId: z.string().uuid(),
    inspectorId: z.string().uuid(),
    scheduledAt: z.coerce.date(),
    notes: z.string().max(1000).optional(),
  }),
});

export const updateSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    scheduledAt: z.coerce.date().optional(),
    inspectorId: z.string().uuid().optional(),
    notes: z.string().max(1000).optional(),
  }),
});

export const completeSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({ notes: z.string().max(1000).optional() }),
});

export const idSchema = z.object({ params: z.object({ id: z.string().uuid() }) });

export const listSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
    extinguisherId: z.string().uuid().optional(),
    inspectorId: z.string().uuid().optional(),
  }),
});
