import { BaseAssetDefinition } from "./AssetDefinition";
import { AssetType } from "./AssetType";

export interface MaterialAssetDefinition extends BaseAssetDefinition {
  type: AssetType.Material;
}
