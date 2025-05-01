import { SceneDb } from "./data/scenes";
import { IAssetDb } from "./data/assets";

/**
 * A loaded game Cartridge, containing all the data for the entire game.
 */
export class Cartridge {
  // @TODO game manifest (e.g. game title)
  public readonly sceneDb: SceneDb;
  public readonly assetDb: IAssetDb;

  public constructor(sceneDb: SceneDb, assetDb: IAssetDb) {
    this.sceneDb = sceneDb;
    this.assetDb = assetDb;
  }
}
