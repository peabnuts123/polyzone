import { Unzipped, unzipSync } from 'fflate';

import { CartridgeFileSystem } from '@polyzone/runtime/filesystem';

export * from './archive';
export * from './data';
export * from './Cartridge';

import { AssetDb, SceneDb, createAssetData } from './data';
import { Cartridge } from './Cartridge';
import { CartridgeArchiveManifest } from './archive/CartridgeArchiveManifest';

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

export async function readCartridgeArchive(cartridgeBytes: Uint8Array): Promise<CartridgeFileSystem> {
  const startTime = performance.now();
  const cartridgeData = await unzipAsync(cartridgeBytes);
  const endTime = performance.now();
  console.log(`[${Cartridge.name}] (${readCartridgeArchive.name}) Decompressed cartridge in ${Math.trunc(endTime - startTime)}ms (${Math.trunc(cartridgeBytes.length / 1024)}kb)`);
  return new CartridgeFileSystem(cartridgeData);
}

/**
 * Fetch and parse a {@link CartridgeArchive} file from a URL.
 * @param url URL for the cartridge archive file
 */
export async function fetchCartridge(url: string): Promise<CartridgeFileSystem> {
  const response = await fetch(url);
  const responseBytes = await response.arrayBuffer();
  const cartridgeBytes = new Uint8Array(responseBytes);
  console.log(`[${Cartridge.name}] (${fetchCartridge.name}) Fetched cartridge '${url}'`);

  return readCartridgeArchive(cartridgeBytes);
}


/**
 * Path inside a cartridge that contains the manifest.
 */
export const CartridgeManifestPath = 'manifest.json';

/**
 * Load raw data from a {@link CartridgeFileSystem} into a usable format that
 * can be loaded into the game.
 * @param fileSystem {@link CartridgeFileSystem} from which to read data.
 */
export function loadCartridge(fileSystem: CartridgeFileSystem): Cartridge {
  // Read manifest from cartridge
  // @TODO validate manifest with zod
  const manifestFile = fileSystem.readFileSync(CartridgeManifestPath);
  const manifestJson = new TextDecoder().decode(manifestFile.bytes);
  const manifest = JSON.parse(manifestJson) as CartridgeArchiveManifest;

  // Construct Cartridge
  const assetDb = new AssetDb(manifest.assets, fileSystem, createAssetData);
  const sceneDb = new SceneDb(manifest.scenes, assetDb);
  return new Cartridge(sceneDb, assetDb);
}
