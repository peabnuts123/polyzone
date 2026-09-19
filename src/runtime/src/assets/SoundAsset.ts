
import { AssetType } from '@polyzone/runtime/cartridge/archive';
import { ISoundAssetData } from '@polyzone/runtime/cartridge/data';

import { LoadedAssetBase } from './LoadedAssetBase';
import type { AssetCacheContext } from './AssetCache';


export class SoundAsset extends LoadedAssetBase<AssetType.Sound> {
  public get type(): AssetType.Sound { return AssetType.Sound; }

  private constructor(id: string) {
    super(id);
  }

  public static fromAssetData(assetData: ISoundAssetData, _context: AssetCacheContext): Promise<SoundAsset> {
    /* No data to load at-present */
    return Promise.resolve(new SoundAsset(assetData.id));
  }
}
