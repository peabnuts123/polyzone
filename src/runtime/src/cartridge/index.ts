import { Unzipped, unzipSync } from 'fflate';

export * from './archive';
export * from './data';
export * from './Cartridge';

import { CartridgeArchive } from './archive/CartridgeArchive';
import { AssetDb, SceneDb } from './data';
import { Cartridge } from './Cartridge';

// @NOTE This function is not really async.
// Would prefer proper async alternative `unzip()` from fflate, but encountering bugs in obscure scenario(s):
//  - Safari on MacOS
//  - Using next.js
//  - Certain kinds of zip (0x80000 bytes or more)
//  - Devtools open
const unzipAsync = (data: Uint8Array): Promise<Unzipped> => {
  return new Promise((resolve, reject) => {
    try {
      const result = unzipSync(data);
      resolve(result);
    } catch (e) {
      reject(e);
    }
  });
};

export async function readCartridgeArchive(cartridgeBytes: Uint8Array): Promise<CartridgeArchive> {
  const startTime = performance.now();
  const cartridgeData = await unzipAsync(cartridgeBytes);
  const endTime = performance.now();
  console.log(`[Cartridge] (unzipAsync) Decompressed cartridge in ${endTime - startTime}ms`);
  return new CartridgeArchive(cartridgeData);
}

/**
 * Fetch and parse a {@link CartridgeArchive} file from a URL.
 * @param url URL for the cartridge archive file
 */
export async function fetchCartridge(url: string): Promise<CartridgeArchive> {
  const response = await fetch(url);
  const responseBytes = await response.arrayBuffer();
  const cartridgeBytes = new Uint8Array(responseBytes);
  console.log(`Got cartridge data: ${Math.round(cartridgeBytes.byteLength / 1024)}kb`);

  return readCartridgeArchive(cartridgeBytes);
}

/**
 * Load raw data defined in a {@link CartridgeArchive} into a usable format that
 * can be loaded into the game.
 * @param cartridgeArchive {@link CartridgeArchive} file to load.
 */
export async function loadCartridge(cartridgeArchive: CartridgeArchive): Promise<Cartridge> {
  // @TODO validate DTO
  const cartridgeManifest = cartridgeArchive.manifest;

  const assetDb = new AssetDb(cartridgeManifest.assets, cartridgeArchive.fileSystem);
  const sceneDb = new SceneDb(cartridgeManifest.scenes, assetDb);

  return new Cartridge(sceneDb, assetDb);
}
