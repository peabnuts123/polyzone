import type { Scene as BabylonScene } from "@babylonjs/core/scene";

import { AssetType } from '@polyzone/runtime/src/cartridge/archive';
import { IAssetData, IAssetDataOfType } from '@polyzone/runtime/src/cartridge/data';
import type { IMeshAssetData, IMeshSupplementaryAssetData, IScriptAssetData, ISoundAssetData, ITextureAssetData } from '@polyzone/runtime/src/cartridge/data';

import { LoadedAsset, LoadedAssetOfType } from './LoadedAsset';
import { MeshAsset } from './MeshAsset';
import { TextureAsset } from './TextureAsset';
import { MeshSupplementaryAsset } from "./MeshSupplementaryAsset";
import { ScriptAsset } from "./ScriptAsset";
import { SoundAsset } from "./SoundAsset";

export class AssetCache {
  private cache: Map<IAssetData, LoadedAsset>;

  public constructor() {
    this.cache = new Map<IAssetData, LoadedAsset>();
  }

  /**
     * Load an asset through a cache.
     * @param asset Asset to load.
     * @returns The new asset, or a reference to the existing asset if it existed in the cache.
     */
  public async loadAsset<TAssetType extends AssetType>(asset: IAssetDataOfType<TAssetType>, scene: BabylonScene): Promise<LoadedAssetOfType<TAssetType>> {
    // @NOTE Why does TypeScript want everything to be type laundered here?
    const cached = this.cache.get(asset);
    if (cached) {
      console.log(`[AssetCache] (loadAsset) Asset already loaded, returning cached asset: ${asset.path}`);
      return cached as LoadedAssetOfType<TAssetType>;
    } else {
      console.log(`[AssetCache] (loadAsset) Loading new asset: ${asset.path}`);
      let assetPromise: Promise<LoadedAssetOfType<TAssetType>>;
      switch (asset.type) {
        case AssetType.Mesh:
          assetPromise = MeshAsset.fromAssetData(asset as IMeshAssetData, scene, this) as Promise<LoadedAssetOfType<TAssetType>>;
          break;
        case AssetType.MeshSupplementary:
          assetPromise = MeshSupplementaryAsset.fromAssetData(asset as IMeshSupplementaryAssetData, scene, this) as Promise<LoadedAssetOfType<TAssetType>>;
          break;
        case AssetType.Script:
          assetPromise = ScriptAsset.fromAssetData(asset as IScriptAssetData, scene, this) as Promise<LoadedAssetOfType<TAssetType>>;
          break;
        case AssetType.Sound:
          assetPromise = SoundAsset.fromAssetData(asset as ISoundAssetData, scene, this) as Promise<LoadedAssetOfType<TAssetType>>;
          break;
        case AssetType.Texture:
          assetPromise = TextureAsset.fromAssetData(asset as ITextureAssetData, scene, this) as Promise<LoadedAssetOfType<TAssetType>>;
          break;
        default:
          throw new Error(`Unimplemented AssetType: ${asset.type}`);
      }

      const result = await assetPromise;
      this.cache.set(asset, result);

      return result;
    }
  }

  public delete(asset: IAssetData): void {
    const cached = this.cache.get(asset);
    if (cached) {
      cached.dispose();
      this.cache.delete(asset);
    }
  }

  public clear(): void {
    this.cache.forEach((asset) => asset.dispose());
    this.cache.clear();
  }

  public onDestroy(): void {
    this.cache.forEach((asset) => asset.dispose());
  }
}
