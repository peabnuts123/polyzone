import type { Scene as BabylonScene } from "@babylonjs/core/scene";

import { AssetType, IScriptAssetData } from '@polyzone/runtime/src/cartridge';

import { LoadedAssetBase } from './LoadedAssetBase';
import type { AssetCache } from './AssetCache';


export class ScriptAsset extends LoadedAssetBase<AssetType.Script> {
  public get type(): AssetType.Script { return AssetType.Script; }

  private constructor() {
    super();
  }

  public static async fromAssetData(_assetData: IScriptAssetData, _scene: BabylonScene, _assetCache: AssetCache): Promise<ScriptAsset> {
    /* No data to load at-present */
    return new ScriptAsset();
  }
}
