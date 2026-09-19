import { AssetType } from '@polyzone/runtime/cartridge/archive';
import { IMeshSupplementaryAssetData } from '@polyzone/runtime/cartridge/data';

import { LoadedAssetBase } from './LoadedAssetBase';
import type { AssetCacheContext } from './AssetCache';


export class MeshSupplementaryAsset extends LoadedAssetBase<AssetType.MeshSupplementary> {
  public get type(): AssetType.MeshSupplementary { return AssetType.MeshSupplementary; }

  private constructor(id: string) {
    super(id);
  }

  public static fromAssetData(assetData: IMeshSupplementaryAssetData, _context: AssetCacheContext): Promise<MeshSupplementaryAsset> {
    /* No data to load at-present */
    return Promise.resolve(new MeshSupplementaryAsset(assetData.id));
  }
}
