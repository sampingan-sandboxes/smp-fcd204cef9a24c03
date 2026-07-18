/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/jest.setup.ts'],
  // Acceptance step definitions live in /tests; the candidate's own unit tests use the
  // standard *.test.ts naming (anywhere under src or tests).
  testMatch: ['**/?(*.)+(test).ts', '<rootDir>/tests/**/*.steps.ts'],
  // Coverage is measured against the code you write in the module.
  // `npm run test:coverage` must report 100%.
  collectCoverageFrom: ['src/components/auth/**/*.ts'],
  coverageThreshold: {
    global: { branches: 100, functions: 100, lines: 100, statements: 100 },
  },
};
