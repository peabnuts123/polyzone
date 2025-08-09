import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';

/**
 * Glob pattern for any script file extension.
 * Explanation:
 *  ?(c|m)   "c" or "m" (optional group)
 *  [jt]     "j" or "t"
 *  s        "s"
 *  ?(x)     "x" (optional group)
 */
export const ScriptFileExtensionGlob = `?(c|m)[jt]s?(x)`;

export default defineConfig({
  plugins: [tsconfigPaths()],
  assetsInclude: [
    '**/*.fx',
    'test/integration/mock/assets/models/*',
    'test/integration/mock/assets/scripts/*',
    'test/integration/mock/assets/textures/*',
  ],
  resolve: {
    alias: {
      '@polyzone/runtime/src': path.resolve(__dirname, '../../../runtime/src'),
      '@polyzone/core/src': path.resolve(__dirname, '../../../core/src'),
    },
  },
  test: {
    setupFiles: [
      'test/setup/deregisterAllFileSystems.ts',
    ],
    expect: {
      requireAssertions: true,
    },
    reporters: ['verbose'],
    coverage: {
      clean: true,
      include: [
        `src/**/*.${ScriptFileExtensionGlob}`,
        `lib/**/*.${ScriptFileExtensionGlob}`,
      ],
      exclude: ['test/**/*'],
      reportsDirectory: 'coverage/unit',
      reporter: ['json', 'html'],
    },
    projects: [
      {
        /* Unit tests */
        extends: true,
        test: {
          name: "Unit",
          exclude: [
            '**/node_modules/**',
            '**/.git/**',
            `**/*.integration.test.${ScriptFileExtensionGlob}`,
          ],
          environment: 'happy-dom', // @TODO Needed?
        },
      },
      {
        /* Integration tests */
        extends: true,
        test: {
          name: "Integration",
          testTimeout: 3000,
          include: [
            `**/*.integration.test.${ScriptFileExtensionGlob}`,
          ],
          setupFiles: [
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
        },
      },
    ],
  },
});
