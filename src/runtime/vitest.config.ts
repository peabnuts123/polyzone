import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: 'jsdom',
    server: {
      deps: {
        inline: ['@lopoly/engine'],
      },
    },
    expect: {
      requireAssertions: true,
    },
    reporters: ['verbose'],
  },
});
