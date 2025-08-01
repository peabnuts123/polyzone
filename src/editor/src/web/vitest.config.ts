import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  assetsInclude: [
    '**/*.fx',
    'test/integration/mock/assets/models/*',
    'test/integration/mock/assets/scripts/*',
    'test/integration/mock/assets/textures/*',
  ],
  test: {
    exclude: [
      '**\/node_modules/**',
      '**\/.git/**',
      '**/*.integration.test.?(c|m)[jt]s?(x)',
    ],
    setupFiles: [
      'test/setup/deregisterAllFileSystems.ts',
    ],
    environment: 'happy-dom', // @TODO Probably none of this
    expect: {
      requireAssertions: true,
    },
    reporters: ['verbose'],
  },
});
