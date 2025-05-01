import { BaseAssetDefinition } from "./AssetDefinition";
import { AssetType } from "./AssetType";

export interface TextureAssetDefinition extends BaseAssetDefinition {
  type: AssetType.Texture;
}
