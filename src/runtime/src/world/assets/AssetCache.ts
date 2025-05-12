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
  /**
   * Cache of loaded assets, keyed by asset ID.
   */
  private cache: Map<string, LoadedAsset>;
  /**
   * A map of assets' IDs and the IDs of the assets on which those assets depend.
   *
   * Key = Id of the asset.
   * Value = Array of asset IDs on which the asset depends.
   */
  private assetDependencies: Map<string, string[]>;
  /**
   * A map of assets' IDs and the asset IDs of the assets that depend on them.
   */
  private assetDependents: Map<string, string[]>;

  public constructor() {
    this.cache = new Map();
    this.assetDependencies = new Map();
    this.assetDependents = new Map();
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
      const cached = this.cache.get(asset.id);
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
        this.cache.set(asset.id, result);

        return result;
      }
    } catch (e) {
      console.error(`[AssetCache] (loadAsset) Error loading asset: ${asset.path}`, e);
      throw e;
    }
  }

  /**
   * Register an asset dependency from `assetId` onto `dependencyAssetId`.
   * @param assetId The ID of the asset which is dependent on the asset with ID `dependencyAssetId`.
   * @param dependencyAssetId The ID of the asset on which the asset with ID `assetId` is dependent.
   */
  public registerDependency(assetId: string, dependencyAssetId: string): void {
    const assetDependencies = this.assetDependencies.get(assetId) || [];
    const assetDependents = this.assetDependents.get(dependencyAssetId) || [];

    // Add the dependency if it doesn't already exist
    if (!assetDependencies.includes(dependencyAssetId)) {
      assetDependencies.push(dependencyAssetId);
    }
    this.assetDependencies.set(assetId, assetDependencies);

    // Add the dependent if it doesn't already exist
    if (!assetDependents.includes(assetId)) {
      assetDependents.push(assetId);
    }
    this.assetDependents.set(dependencyAssetId, assetDependents);
  }

  /**
   * Get an array of the Asset IDs on which the asset with ID `assetId` depends.
   * @param assetId The ID of the asset whose dependencies are to be retrieved.
   */
  public getAssetDependencies(assetId: string): string[] {
    return this.assetDependencies.get(assetId) || [];
  }

  /**
   * Get an array of the IDs of assets which depend on the asset with the ID `assetId`.
   * @param assetId The ID of the asset whose dependents are to be retrieved.
   */
  public getAssetDependents(assetId: string): string[] {
    return this.assetDependents.get(assetId) || [];
  }

  public delete(assetId: string): void {
    const cached = this.cache.get(assetId);
    if (cached) {
      cached.dispose();
      this.cache.delete(assetId);
    }
  }

  public clear(): void {
    this.cache.forEach((asset) => asset.dispose());
    this.cache.clear();
    this.assetDependencies.clear();
    this.assetDependents.clear();
  }

  public onDestroy(): void {
    this.cache.forEach((asset) => asset.dispose());
  }
}
