import { z } from 'zod';

export const ExtinguisherType = z.enum(['WATER', 'CO2', 'FOAM', 'DRY_CHEMICAL']);
export const ExtinguisherSize = z.enum(['LBS_2_5', 'LBS_5', 'LBS_9', 'LBS_12']);
export const ExtinguisherStatus = z.enum([
  'ACTIVE',
  'DUE_FOR_INSPECTION',
  'EXPIRED',
  'UNDER_MAINTENANCE',
  'OUT_OF_SERVICE',
]);

export const createSchema = z.object({
  body: z.object({
    serialNumber: z.string().min(3).max(50),
    location: z.string().min(2).max(200),
    type: ExtinguisherType,
    size: ExtinguisherSize,
    installationDate: z.coerce.date(),
    expiryDate: z.coerce.date(),
    status: ExtinguisherStatus.optional(),
  }).refine((d) => d.expiryDate > d.installationDate, {
    message: 'expiryDate must be after installationDate',
    path: ['expiryDate'],
  }),
});

export const updateSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    serialNumber: z.string().min(3).max(50).optional(),
    location: z.string().min(2).max(200).optional(),
    type: ExtinguisherType.optional(),
    size: ExtinguisherSize.optional(),
    installationDate: z.coerce.date().optional(),
    expiryDate: z.coerce.date().optional(),
    status: ExtinguisherStatus.optional(),
  }),
});

export const idSchema = z.object({ params: z.object({ id: z.string().uuid() }) });

export const listSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().optional(),
    status: ExtinguisherStatus.optional(),
    type: ExtinguisherType.optional(),
    sortBy: z.enum(['createdAt', 'expiryDate', 'serialNumber', 'status']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
});
