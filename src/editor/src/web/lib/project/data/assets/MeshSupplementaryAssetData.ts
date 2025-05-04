import { AssetType, IMeshSupplementaryAssetData, MeshSupplementaryAssetData as MeshSupplementaryAssetDataRuntime } from "@polyzone/runtime/src/cartridge";
import { BaseAssetData, CommonAssetDataArgs } from "../BaseAssetData";
import { MeshSupplementaryAssetDefinition } from "@lib/project/definition";

export class MeshSupplementaryAssetData extends BaseAssetData<AssetType.MeshSupplementary> implements IMeshSupplementaryAssetData {
  private _meshSupplementaryAssetData: MeshSupplementaryAssetDataRuntime;

  public constructor(args: CommonAssetDataArgs) {
    const meshSupplementaryAssetData = new MeshSupplementaryAssetDataRuntime(args);
    super(args, meshSupplementaryAssetData);
    this._meshSupplementaryAssetData = meshSupplementaryAssetData;
  }

  public toAssetDefinition(): MeshSupplementaryAssetDefinition {
    return {
      id: this.id,
      type: AssetType.MeshSupplementary,
      hash: this.hash,
      path: this.path,
    };
  }
}
