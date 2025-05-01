import { AssetType, MeshSupplementaryAssetDefinition } from "../../archive/assets";
import { BaseAssetData, IBaseAssetData } from "./BaseAssetData";
import { IAssetDb } from "./AssetDb";

export interface IMeshSupplementaryAssetData extends IBaseAssetData<AssetType.MeshSupplementary> {
}

export class MeshSupplementaryAssetData extends BaseAssetData<AssetType.MeshSupplementary> implements IMeshSupplementaryAssetData {
  public readonly type: AssetType.MeshSupplementary = AssetType.MeshSupplementary;
  public loadDefinition(_assetDefinition: MeshSupplementaryAssetDefinition, _assetDb: IAssetDb): void {
    /* No extra data to load at-present. */
  }
}
