import { AssetType, SoundAssetDefinition } from "../../archive/assets";
import { BaseAssetData, IBaseAssetData } from "./BaseAssetData";
import { IAssetDb } from "./AssetDb";

export interface ISoundAssetData extends IBaseAssetData<AssetType.Sound> {
}

export class SoundAssetData extends BaseAssetData<AssetType.Sound> implements ISoundAssetData {
  public readonly type: AssetType.Sound = AssetType.Sound;
  public loadDefinition(_assetDefinition: SoundAssetDefinition, _assetDb: IAssetDb): void {
    /* No extra data to load at-present. */
  }
}
