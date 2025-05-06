import { AssetType, MaterialAssetDefinition } from "../../archive/assets";
import { BaseAssetData, IBaseAssetData } from "./BaseAssetData";
import { IAssetDb } from "./AssetDb";

export interface IMaterialAssetData extends IBaseAssetData<AssetType.Material> {
}

export class MaterialAssetData extends BaseAssetData<AssetType.Material> implements IMaterialAssetData {
  public readonly type: AssetType.Material = AssetType.Material;
  public loadDefinition(_assetDefinition: MaterialAssetDefinition, _assetDb: IAssetDb): void {
    /* No extra data to load at-present. */
  }
}
