import { createSchema, listSchema } from '../validators/extinguisher.schema';

const validBody = {
  serialNumber: 'SN-1234',
  location: 'Building A',
  type: 'CO2',
  size: 'LBS_5',
  installationDate: '2023-01-01',
  expiryDate: '2026-01-01',
  status: 'ACTIVE',
};

describe('createSchema', () => {
  it('accepts a valid payload', () => {
    const result = createSchema.safeParse({ body: validBody });
    expect(result.success).toBe(true);
  });

  it('rejects when expiryDate <= installationDate', () => {
    const result = createSchema.safeParse({
      body: { ...validBody, installationDate: '2026-01-01', expiryDate: '2026-01-01' },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('expiryDate'))).toBe(true);
    }
  });

  it('rejects a bad enum value for type', () => {
    const result = createSchema.safeParse({ body: { ...validBody, type: 'PLASMA' } });
    expect(result.success).toBe(false);
  });

  it('rejects a bad enum value for size', () => {
    const result = createSchema.safeParse({ body: { ...validBody, size: 'LBS_99' } });
    expect(result.success).toBe(false);
  });
});

describe('listSchema', () => {
  it('applies defaults for page, limit, sortBy and sortOrder', () => {
    const result = listSchema.safeParse({ query: {} });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.query).toEqual({
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
    }
  });

  it('coerces numeric strings and respects provided values', () => {
    const result = listSchema.safeParse({
      query: { page: '2', limit: '50', sortBy: 'expiryDate', sortOrder: 'asc' },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.query.page).toBe(2);
      expect(result.data.query.limit).toBe(50);
      expect(result.data.query.sortBy).toBe('expiryDate');
      expect(result.data.query.sortOrder).toBe('asc');
    }
  });

  it('rejects limit above 100', () => {
    const result = listSchema.safeParse({ query: { limit: '101' } });
    expect(result.success).toBe(false);
  });
});
