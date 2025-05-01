import { AssetType, IMeshSupplementaryAssetData, MeshSupplementaryAssetData as MeshSupplementaryAssetDataRuntime } from "@polyzone/runtime/src/cartridge";
import { BaseAssetData, CommonAssetDataArgs } from "../BaseAssetData";

export class MeshSupplementaryAssetData extends BaseAssetData<AssetType.MeshSupplementary> implements IMeshSupplementaryAssetData {
  private _meshSupplementaryAssetData: MeshSupplementaryAssetDataRuntime;

  public constructor(args: CommonAssetDataArgs) {
    const meshSupplementaryAssetData = new MeshSupplementaryAssetDataRuntime(args);
    super(args, meshSupplementaryAssetData);
    this._meshSupplementaryAssetData = meshSupplementaryAssetData;
  }
}
