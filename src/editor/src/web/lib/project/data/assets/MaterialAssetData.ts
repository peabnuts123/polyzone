import { AssetType, IMaterialAssetData, MaterialAssetData as MaterialAssetDataRuntime } from "@polyzone/runtime/src/cartridge";
import { MaterialAssetDefinition } from "@lib/project/definition";
import { BaseAssetData, CommonAssetDataArgs } from "../BaseAssetData";

export class MaterialAssetData extends BaseAssetData<AssetType.Material> implements IMaterialAssetData {
  private _materialAssetData: MaterialAssetDataRuntime;

  public constructor(args: CommonAssetDataArgs) {
    const materialAssetData = new MaterialAssetDataRuntime(args);
    super(args, materialAssetData);
    this._materialAssetData = materialAssetData;
  }

  public toAssetDefinition(): MaterialAssetDefinition {
    return {
      id: this.id,
      type: AssetType.Material,
      hash: this.hash,
      path: this.path,
    };
  }
}
