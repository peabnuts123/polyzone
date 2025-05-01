import { AssetType, IScriptAssetData, ScriptAssetData as ScriptAssetDataRuntime } from "@polyzone/runtime/src/cartridge";
import { BaseAssetData, CommonAssetDataArgs } from "../BaseAssetData";

export class ScriptAssetData extends BaseAssetData<AssetType.Script> implements IScriptAssetData {
  private _scriptAssetData: ScriptAssetDataRuntime;

  public constructor(args: CommonAssetDataArgs) {
    const scriptAssetData = new ScriptAssetDataRuntime(args);
    super(args, scriptAssetData);
    this._scriptAssetData = scriptAssetData;
  }
}
