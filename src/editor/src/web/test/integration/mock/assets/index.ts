// @NOTE Don't forget to use `?inline` (binary) or `?raw` (plaintext) when importing asset files
/* Models (binary) */
import sphereObj from '@test/integration/mock/assets/models/sphere.obj?inline';
import sphereMtl from '@test/integration/mock/assets/models/sphere.mtl?inline';

/* Scripts (plaintext) */
import myObject from '@test/integration/mock/assets/scripts/my-object?raw';

/* Textures (binary) */
import asphaltPng from '@test/integration/mock/assets/textures/asphalt.png?inline';
import stonesPng from '@test/integration/mock/assets/textures/stones.png?inline';

/**
 * Re-encode a base64 encoded binary file into raw bytes (Uint8Array).
 * Use for any binary asset.
 * @param str Base64 encoded string, e.g. `data:image/png;base64,...`
 */
function base64StringToByteArray(str: string): Uint8Array {
  // Remove data URL prefix if present
  const base64 = str.includes(',') ? str.split(',')[1] : str;
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Encode a plain UTF8 string into raw bytes (Uint8Array).
 * Use for any plaintext asset (e.g. code).
 * @param str Plaintext string
 */
function stringToByteArray(str: string): Uint8Array {
  const textEncoder = new TextEncoder();
  return textEncoder.encode(str);
}

/**
 * Set of mock assets, ready to be used as mocks.
 * Assets are encoded as raw bytes.
 */
export const MockAssets: {
  [AssetKind: string]: Record<string, Uint8Array>,
} = {
  models: {
    sphereObj: base64StringToByteArray(sphereObj),
    sphereMtl: base64StringToByteArray(sphereMtl),
  },
  scripts: {
    myObject: stringToByteArray(myObject),
  },
  textures: {
    asphaltPng: base64StringToByteArray(asphaltPng),
    stonesPng: base64StringToByteArray(stonesPng),
  },
};

