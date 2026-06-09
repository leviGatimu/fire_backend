/**
 * Reusable deep mock of the shared PrismaClient for DB-less unit tests.
 *
 * Usage in a test file (the jest.mock factory must reference a variable whose
 * name starts with "mock", per jest's hoisting rules):
 *
 *   import { mockPrisma } from '../../../../test/prisma-mock';
 *   jest.mock('@tzw/shared', () => {
 *     const actual = jest.requireActual('@tzw/shared');
 *     return { __esModule: true, ...actual, prisma: mockPrisma };
 *   });
 *   import { someService } from '../services/some.service';
 *   // ...then: mockPrisma.user.findUnique.mockResolvedValue(...)
 */
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import type { PrismaClient } from '@prisma/client';

export const mockPrisma = mockDeep<PrismaClient>() as unknown as DeepMockProxy<PrismaClient>;

beforeEach(() => mockReset(mockPrisma));
