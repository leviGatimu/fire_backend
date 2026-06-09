import { z } from 'zod';

export const createSchema = z.object({
  body: z.object({
    extinguisherId: z.string().uuid(),
    actionTaken: z.string().min(2).max(500),
    actionDate: z.coerce.date(),
    conditionNotes: z.string().max(1000).optional(),
    recommendations: z.string().max(1000).optional(),
  }),
});

export const updateSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    actionTaken: z.string().min(2).max(500).optional(),
    actionDate: z.coerce.date().optional(),
    conditionNotes: z.string().max(1000).optional(),
    recommendations: z.string().max(1000).optional(),
  }),
});

export const idSchema = z.object({ params: z.object({ id: z.string().uuid() }) });

export const listSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    extinguisherId: z.string().uuid().optional(),
  }),
});
