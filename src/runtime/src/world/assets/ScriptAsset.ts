import { AssetType, IScriptAssetData } from '@polyzone/runtime/src/cartridge';

import { LoadedAssetBase } from './LoadedAssetBase';
import type { AssetCacheContext } from './AssetCache';


export class ScriptAsset extends LoadedAssetBase<AssetType.Script> {
  public get type(): AssetType.Script { return AssetType.Script; }

  private constructor(id: string) {
    super(id);
  }

  public static fromAssetData(assetData: IScriptAssetData, _context: AssetCacheContext): Promise<ScriptAsset> {
    /* No data to load at-present */
    return Promise.resolve(new ScriptAsset(assetData.id));
  }
}
