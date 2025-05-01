import type { Scene as BabylonScene } from "@babylonjs/core/scene";

import { AssetType, ISoundAssetData } from '@polyzone/runtime/src/cartridge';

import { LoadedAssetBase } from './LoadedAssetBase';
import type { AssetCache } from './AssetCache';


export class SoundAsset extends LoadedAssetBase<AssetType.Sound> {
  public get type(): AssetType.Sound { return AssetType.Sound; }

  private constructor() {
    super();
  }

  public static async fromAssetData(_assetData: ISoundAssetData, _scene: BabylonScene, _assetCache: AssetCache): Promise<SoundAsset> {
    /* No data to load at-present */
    return new SoundAsset();
  }
}
