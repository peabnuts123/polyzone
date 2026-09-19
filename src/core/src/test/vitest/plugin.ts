// import { fileURLToPath } from 'node:url';
import { Plugin } from 'vitest/config';

/*
  @TODO
  And then the idea is that all of this would live in like a PolyZone testing development package
 */

const SetupFilePath = 'setup.js';

// @TODO A good name
export function polyzone(): Plugin {
  return {
    name: 'polyzone',
    config() {
      // const setupFile: string = fileURLToPath(
      //   new URL(SetupFilePath, import.meta.url),
      // );
      const setupFile = '@TODO';
      console.log(`[DEBUG] Registering setup file: ${setupFile}`);
      return {
        test: {
          setupFiles: [setupFile],
        },
      };
    },
  };
}
