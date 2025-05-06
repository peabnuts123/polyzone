import type { Scene as BabylonScene } from "@babylonjs/core/scene";

import { AssetType } from '@polyzone/runtime/src/cartridge/archive';
import { IAssetData, IAssetDataOfType } from '@polyzone/runtime/src/cartridge/data';
import type { IAssetDb, IMaterialAssetData, IMeshAssetData, IMeshSupplementaryAssetData, IScriptAssetData, ISoundAssetData, ITextureAssetData } from '@polyzone/runtime/src/cartridge/data';

import { LoadedAsset, LoadedAssetOfType } from './LoadedAsset';
import { MeshAsset } from './MeshAsset';
import { TextureAsset } from './TextureAsset';
import { MeshSupplementaryAsset } from "./MeshSupplementaryAsset";
import { ScriptAsset } from "./ScriptAsset";
import { SoundAsset } from "./SoundAsset";
import { MaterialAsset } from "./MaterialAsset";

export interface AssetCacheContext {
  assetCache: AssetCache;
  assetDb: IAssetDb;
  scene: BabylonScene;
}

export type LoadAssetContextParam = Omit<AssetCacheContext, 'assetCache'>;

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
  public async loadAsset<TAssetType extends AssetType>(asset: IAssetDataOfType<TAssetType>, context: LoadAssetContextParam): Promise<LoadedAssetOfType<TAssetType>> {
    const fullContext: AssetCacheContext = {
      ...context,
      assetCache: this,
    };

    try {

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
            assetPromise = MeshAsset.fromAssetData(asset as IMeshAssetData, fullContext) as Promise<LoadedAssetOfType<TAssetType>>;
            break;
          case AssetType.MeshSupplementary:
            assetPromise = MeshSupplementaryAsset.fromAssetData(asset as IMeshSupplementaryAssetData, fullContext) as Promise<LoadedAssetOfType<TAssetType>>;
            break;
          case AssetType.Script:
            assetPromise = ScriptAsset.fromAssetData(asset as IScriptAssetData, fullContext) as Promise<LoadedAssetOfType<TAssetType>>;
            break;
          case AssetType.Sound:
            assetPromise = SoundAsset.fromAssetData(asset as ISoundAssetData, fullContext) as Promise<LoadedAssetOfType<TAssetType>>;
            break;
          case AssetType.Texture:
            assetPromise = TextureAsset.fromAssetData(asset as ITextureAssetData, fullContext) as Promise<LoadedAssetOfType<TAssetType>>;
            break;
          case AssetType.Material:
            assetPromise = MaterialAsset.fromAssetData(asset as IMaterialAssetData, fullContext) as Promise<LoadedAssetOfType<TAssetType>>;
            break;
          default:
            throw new Error(`Unimplemented AssetType: ${asset.type}`);
        }

        const result = await assetPromise;
        this.cache.set(asset, result);

        return result;
      }
    } catch (e) {
      console.error(`[AssetCache] (loadAsset) Error loading asset: ${asset.path}`, e);
      throw e;
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
