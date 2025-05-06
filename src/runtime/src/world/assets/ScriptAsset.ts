import { AssetType, IScriptAssetData } from '@polyzone/runtime/src/cartridge';

import { LoadedAssetBase } from './LoadedAssetBase';
import type { AssetCacheContext } from './AssetCache';


export class ScriptAsset extends LoadedAssetBase<AssetType.Script> {
  public get type(): AssetType.Script { return AssetType.Script; }

  private constructor() {
    super();
  }

  public static async fromAssetData(_assetData: IScriptAssetData, _context: AssetCacheContext): Promise<ScriptAsset> {
    /* No data to load at-present */
    return new ScriptAsset();
  }
}
