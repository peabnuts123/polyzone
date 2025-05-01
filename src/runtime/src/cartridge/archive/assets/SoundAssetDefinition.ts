import { BaseAssetDefinition } from "./AssetDefinition";
import { AssetType } from "./AssetType";

export interface SoundAssetDefinition extends BaseAssetDefinition {
  type: AssetType.Sound;
}
