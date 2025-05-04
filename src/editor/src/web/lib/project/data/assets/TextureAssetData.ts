import { AssetType, ITextureAssetData, TextureAssetData as TextureAssetDataRuntime } from "@polyzone/runtime/src/cartridge";
import { BaseAssetData, CommonAssetDataArgs } from "../BaseAssetData";
import { TextureAssetDefinition } from "@lib/project/definition";

export class TextureAssetData extends BaseAssetData<AssetType.Texture> implements ITextureAssetData {
  private _textureAssetData: TextureAssetDataRuntime;

  public constructor(args: CommonAssetDataArgs) {
    const textureAssetData = new TextureAssetDataRuntime(args);
    super(args, textureAssetData);
    this._textureAssetData = textureAssetData;
  }

  public toAssetDefinition(): TextureAssetDefinition {
    return {
      id: this.id,
      type: AssetType.Texture,
      hash: this.hash,
      path: this.path,
    };
  }
}
