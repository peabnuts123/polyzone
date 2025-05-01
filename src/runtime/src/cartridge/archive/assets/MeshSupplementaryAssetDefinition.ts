import { BaseAssetDefinition } from "./AssetDefinition";
import { AssetType } from "./AssetType";

export interface MeshSupplementaryAssetDefinition extends BaseAssetDefinition {
  type: AssetType.MeshSupplementary;
}
