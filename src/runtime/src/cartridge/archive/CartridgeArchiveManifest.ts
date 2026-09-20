
import { AssetDefinition } from "./assets/AssetDefinition";
import { SceneDefinition } from "./SceneDefinition";

/**
 * Raw manifest containing all the content in the Cartridge.
 * i.e. the definition of the Cartridge on-disk, before being loaded by the engine.
 */
export interface CartridgeArchiveManifest {
  // @TODO any metadata like THE TITLE OF THE GAME? Lol
  scenes: SceneDefinition[];
  assets: AssetDefinition[];
}
