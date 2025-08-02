import '@vitest/browser/providers/playwright';

import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';

export default defineConfig({
  plugins: [tsconfigPaths()],
  assetsInclude: [
    '**/*.fx',
    'test/integration/mock/assets/models/*',
    'test/integration/mock/assets/scripts/*',
    'test/integration/mock/assets/textures/*',
  ],
  test: {
    testTimeout: 3_000,
    include: [
      '**/*.integration.test.?(c|m)[jt]s?(x)',
    ],
    setupFiles: [
      'test/setup/deregisterAllFileSystems.ts',
      'test/setup/mockTauri.ts',
    ],
    browser: {
      provider: 'playwright',
      enabled: true,
      headless: true,
      instances: [
        {
          browser: 'chromium',
          screenshotFailures: false,
        },
      ],
    },
    expect: {
      requireAssertions: true,
    },
    reporters: ['verbose'],
  },
  resolve: {
    alias: {
      '@polyzone/runtime/src': path.resolve(__dirname, '../../../runtime/src'),
      '@polyzone/core/src': path.resolve(__dirname, '../../../core/src'),
    },
  },
});
