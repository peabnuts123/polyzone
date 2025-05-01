import { AssetType, TextureAssetDefinition } from "../../archive/assets";
import { BaseAssetData, IBaseAssetData } from "./BaseAssetData";
import { IAssetDb } from "./AssetDb";

export interface ITextureAssetData extends IBaseAssetData<AssetType.Texture> {
}

export class TextureAssetData extends BaseAssetData<AssetType.Texture> implements ITextureAssetData {
  public readonly type: AssetType.Texture = AssetType.Texture;
  public loadDefinition(_assetDefinition: TextureAssetDefinition, _assetDb: IAssetDb): void {
    /* No extra data to load at-present. */
  }
}
