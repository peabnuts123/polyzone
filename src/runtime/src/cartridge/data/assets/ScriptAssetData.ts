import { AssetType, ScriptAssetDefinition } from "../../archive/assets";
import { BaseAssetData, IBaseAssetData } from "./BaseAssetData";
import { IAssetDb } from "./AssetDb";

export interface IScriptAssetData extends IBaseAssetData<AssetType.Script> {
}

export class ScriptAssetData extends BaseAssetData<AssetType.Script> implements IScriptAssetData {
  public readonly type: AssetType.Script = AssetType.Script;

  public loadDefinition(_assetDefinition: ScriptAssetDefinition, _assetDb: IAssetDb): void {
    /* No extra data to load at-present. */
  }
}
