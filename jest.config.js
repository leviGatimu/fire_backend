/**
 * Root Jest config — runs unit/integration tests across all backend workspaces.
 * Tests run WITHOUT a database: Prisma is mocked via jest-mock-extended
 * (see test/prisma-mock.ts). Run with `npm test` from the repo root.
 */
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/packages', '<rootDir>/services'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/*.test.ts'],
  moduleNameMapper: {
    '^@tzw/shared$': '<rootDir>/packages/shared/src',
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.base.json' }],
  },
  clearMocks: true,
  collectCoverageFrom: [
    'services/*/src/services/**/*.ts',
    'services/*/src/validators/**/*.ts',
    'packages/shared/src/**/*.ts',
  ],
};
