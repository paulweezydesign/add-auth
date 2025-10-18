const { defaults: tsJestPreset } = require('ts-jest/presets');

/** @type {import('jest').Config} */
module.exports = {
  ...tsJestPreset,
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/tests'],
  setupFilesAfterEnv: [
    ...((tsJestPreset.setupFilesAfterEnv ?? [])),
    '<rootDir>/jest.setup.ts'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts'
  ],
  coverageDirectory: 'coverage',
  globals: {
    ...(tsJestPreset.globals ?? {}),
    'ts-jest': {
      ...((tsJestPreset.globals ?? {})['ts-jest'] ?? {}),
      tsconfig: 'tsconfig.json',
      isolatedModules: false,
    },
  },
};
