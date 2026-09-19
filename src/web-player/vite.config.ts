import { UserConfigExport, defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig((env) => {
  const config: UserConfigExport = {
    resolve: {
      tsconfigPaths: true,
    },
    clearScreen: false,
    esbuild: {
      target: "es2020",
    },
    plugins: [
      {
        name: 'watch-pzcart',
        configureServer(server) {
          // Watch the public directory for changes to cartridges
          server.watcher.add('public/*.pzcart');
          server.watcher.on('change', (file) => {
            if (file.includes('pzcart')) {
              server.hot.send({ type: 'full-reload' });
            }
          });
        },
      },
    ],
    server: {
      port: 1420,
    },
  };

  if (env.command !== 'build') {
    console.log(`[Vite] @NOTE Vite running in development mode`);
    // Development-only configuration
  } else {
    console.log(`[Vite] @NOTE Creating a release build`);
    // Release-only configuration
  }

  return config;
});
