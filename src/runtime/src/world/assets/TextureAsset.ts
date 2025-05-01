import type { Scene as BabylonScene } from "@babylonjs/core/scene";
import { Texture } from '@babylonjs/core/Materials/Textures/texture';

import { AssetType, ITextureAssetData } from '@polyzone/runtime/src/cartridge';

import { LoadedAssetBase } from './LoadedAssetBase';
import type { AssetCache } from './AssetCache';


export class TextureAsset extends LoadedAssetBase<AssetType.Texture> {
  public get type(): AssetType.Texture { return AssetType.Texture; }

  private _texture: Texture;

  private constructor(texture: Texture) {
    super();
    this._texture = texture;
  }

  public static async fromAssetData(assetData: ITextureAssetData, scene: BabylonScene, _assetCache: AssetCache): Promise<TextureAsset> {
    const texture = new Texture(assetData.babylonFetchUrl, scene, {
      noMipmap: true,
      samplingMode: Texture.NEAREST_SAMPLINGMODE,
      // invertY: false, // @TODO?
    });

    // Load texture (async)
    await new Promise((resolve, reject) => {
      texture.onLoadObservable.addOnce(() => {
        if (texture.loadingError) {
          reject(texture.errorObject);
        } else {
          resolve(texture);
        }
      });
    });

    return new TextureAsset(texture);
  }

  public dispose(): void {
    this.texture.dispose();
  }

  public get texture(): Texture {
    return this._texture;
  }
}
