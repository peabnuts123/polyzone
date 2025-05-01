import { BaseAssetDefinition } from "./AssetDefinition";
import { AssetType } from "./AssetType";

export interface ScriptAssetDefinition extends BaseAssetDefinition {
  type: AssetType.Script;
}
