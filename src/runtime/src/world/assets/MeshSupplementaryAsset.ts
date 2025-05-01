import type { Scene as BabylonScene } from "@babylonjs/core/scene";

import { AssetType, IMeshSupplementaryAssetData } from '@polyzone/runtime/src/cartridge';

import { LoadedAssetBase } from './LoadedAssetBase';
import type { AssetCache } from './AssetCache';


export class MeshSupplementaryAsset extends LoadedAssetBase<AssetType.MeshSupplementary> {
  public get type(): AssetType.MeshSupplementary { return AssetType.MeshSupplementary; }

  private constructor() {
    super();
  }

  public static async fromAssetData(_assetData: IMeshSupplementaryAssetData, _scene: BabylonScene, _assetCache: AssetCache): Promise<MeshSupplementaryAsset> {
    /* No data to load at-present */
    return new MeshSupplementaryAsset();
  }
}
