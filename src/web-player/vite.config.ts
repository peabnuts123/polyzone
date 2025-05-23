import { UserConfigExport, defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig((env) => {
  const config: UserConfigExport = {
    clearScreen: false,
    esbuild: {
      target: "es2020",
    },
    assetsInclude: ["**/*.fx"],
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
