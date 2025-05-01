import { AssetType, ITextureAssetData, TextureAssetData as TextureAssetDataRuntime } from "@polyzone/runtime/src/cartridge";
import { BaseAssetData, CommonAssetDataArgs } from "../BaseAssetData";

export class TextureAssetData extends BaseAssetData<AssetType.Texture> implements ITextureAssetData {
  private _textureAssetData: TextureAssetDataRuntime;

  public constructor(args: CommonAssetDataArgs) {
    const textureAssetData = new TextureAssetDataRuntime(args);
    super(args, textureAssetData);
    this._textureAssetData = textureAssetData;
  }
}
