import type { Config } from 'jest';

// See jest docs for config options: https://jestjs.io/docs/en/configuration
const config: Config = {
  verbose: true,
  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest',
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  testRegex: [
    "\\.test.[jt]sx?$",
  ],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    '<rootDir>/src/**/*.{js,ts,jsx,tsx}',
  ],
  reporters: ["default"],
  coverageReporters: ["lcov", "text"],
};

export default config;
