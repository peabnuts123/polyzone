import type { Scene as BabylonScene } from "@babylonjs/core/scene";

import { AssetType } from '@polyzone/runtime/src/cartridge/archive';
import { IAssetDataOfType } from '@polyzone/runtime/src/cartridge/data';
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

export type CachedAssetFactory = (scene: BabylonScene) => Promise<LoadedAsset>;

export class AssetCache {
  private assetDb: IAssetDb;

  /**
   * Cache of asset factories, keyed by asset ID.
   */
  private assetFactoryCache: Map<string, CachedAssetFactory>;
  /**
   * Cache of loaded asset (promises), keyed by [asset ID, scene instance] as a proxy for a unique WebGL context.
   */
  private assetInstanceCache: Map<string, Map<BabylonScene, Promise<LoadedAsset>>>;

  /**
   * A map of assets' IDs and the IDs of the assets on which those assets depend.
   *
   * Key = Id of the asset.
   * Value = Array of asset IDs on which the asset depends.
   */
  private assetDependencies: Map<string, string[]>;
  /**
   * A map of assets' IDs and the asset IDs of the assets that depend on them.
   *
   * Key = ID of the asset.
   * Value = Array of asset IDs that depend on this asset.
   */
  private assetDependents: Map<string, string[]>;

  public constructor(assetDb: IAssetDb) {
    this.assetDb = assetDb;
    this.assetFactoryCache = new Map();
    this.assetInstanceCache = new Map();
    this.assetDependencies = new Map();
    this.assetDependents = new Map();
  }

  // @TODO Function to purge scene instances (including disposing the resources) i.e. SceneViewController.destroy()

  /**
   * Manually register the factory for a given asset.
   * @param assetId ID of the asset for which the factory creates instances.
   * @param assetFactory Factory function that creates instance of the asset with ID `assetId`.
   */
  public set(assetId: string, assetFactory: (context: AssetCacheContext) => Promise<LoadedAsset>): void {
    this.delete(assetId);

    // Construct cacheable asset factory from provided factory
    const cachedFactory: CachedAssetFactory = (scene: BabylonScene) => {
      const fullContext: AssetCacheContext = {
        assetCache: this,
        assetDb: this.assetDb,
        scene,
      };

      return assetFactory(fullContext);
    };

    this.assetFactoryCache.set(assetId, cachedFactory);
  }

  /**
   * Load an asset through a cache.
   * @param asset Asset to load.
   * @param scene Target Babylon scene these assets will be loaded into.
   * @returns The new asset, or a reference to the existing asset if it existed in the cache.
   */
  public async loadAsset<TAssetType extends AssetType>(asset: IAssetDataOfType<TAssetType>, scene: BabylonScene): Promise<LoadedAssetOfType<TAssetType>> {
    try {
      const cached = this.assetInstanceCache.get(asset.id)?.get(scene);
      if (cached) {
        console.log(`[${AssetCache.name}] (${this.loadAsset.name}) Asset already loaded, returning cached asset: ${asset.path} (scene='${scene.uid}')`);
        return cached as Promise<LoadedAssetOfType<TAssetType>>;
      } else {

        let cachedFactory = this.assetFactoryCache.get(asset.id);

        if (cachedFactory === undefined) {
          console.log(`[${AssetCache.name}] (${this.loadAsset.name}) Creating new factory for asset: ${asset.path}`);
          cachedFactory = (scene: BabylonScene) => {
            const fullContext: AssetCacheContext = {
              assetCache: this,
              assetDb: this.assetDb,
              scene,
            };

            console.log(`[${AssetCache.name}] (${this.loadAsset.name}) Loading new instance of asset: ${asset.path} ((scene='${scene.uid}'))`);

            switch (asset.type) {
              case AssetType.Mesh:
                return MeshAsset.fromAssetData(asset as IMeshAssetData, fullContext);
              case AssetType.MeshSupplementary:
                return MeshSupplementaryAsset.fromAssetData(asset as IMeshSupplementaryAssetData, fullContext);
              case AssetType.Script:
                return ScriptAsset.fromAssetData(asset as IScriptAssetData, fullContext);
              case AssetType.Sound:
                return SoundAsset.fromAssetData(asset as ISoundAssetData, fullContext);
              case AssetType.Texture:
                return TextureAsset.fromAssetData(asset as ITextureAssetData, fullContext);
              case AssetType.Material:
                return MaterialAsset.fromAssetData(asset as IMaterialAssetData, fullContext);
              default:
                throw new Error(`Unimplemented AssetType: ${asset.type}`);
            }
          };

          this.assetFactoryCache.set(asset.id, cachedFactory);
        }

        const newInstancePromise = cachedFactory(scene) as Promise<LoadedAssetOfType<TAssetType>>;

        // Get or initialise asset instance cache (a nested / 2D cache)
        let assetInstanceCache = this.assetInstanceCache.get(asset.id);
        if (assetInstanceCache === undefined) {
          assetInstanceCache = new Map();
          this.assetInstanceCache.set(asset.id, assetInstanceCache);
        }

        // Store new instance in cache
        assetInstanceCache.set(scene, newInstancePromise);

        return newInstancePromise;
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
    const dependencyDependents = this.assetDependents.get(dependencyAssetId) || [];

    // Add the dependency if it doesn't already exist
    if (!assetDependencies.includes(dependencyAssetId)) {
      assetDependencies.push(dependencyAssetId);
    }
    this.assetDependencies.set(assetId, assetDependencies);

    // Add the dependent if it doesn't already exist
    if (!dependencyDependents.includes(assetId)) {
      dependencyDependents.push(assetId);
    }
    this.assetDependents.set(dependencyAssetId, dependencyDependents);
  }

  public unregisterDependency(assetId: string, dependencyAssetId: string): void {
    const assetDependencies = this.assetDependencies.get(assetId) || [];
    const dependencyDependents = this.assetDependents.get(dependencyAssetId) || [];

    // Remove dependency from asset's list of dependencies
    this.assetDependencies.set(assetId, assetDependencies.filter((dependency) => dependency !== dependencyAssetId));

    // Remove asset from dependency's list of dependents
    this.assetDependents.set(dependencyAssetId, dependencyDependents.filter((dependent) => dependent !== assetId));
  }

  /**
   * Remove all cached instances of any assets loaded for the given scene.
   * @param scene
   */
  public async disposeSceneInstances(scene: BabylonScene): Promise<void> {
    // const assetInstanceCache = this.assetInstanceCache.get(assetId);
    // const instance = await assetInstanceCache?.get(scene);
    // assetInstanceCache?.delete(scene);
    // instance?.dispose();

    const disposePromises: Promise<void>[] = [];
    this.assetInstanceCache.forEach((assetInstanceCache) => {
      const sceneInstancePromise = assetInstanceCache.get(scene);
      if (sceneInstancePromise !== undefined) {
        disposePromises.push(
          sceneInstancePromise.then((sceneInstance) => sceneInstance.dispose()),
        );
        assetInstanceCache.delete(scene);
      }
    });

    await Promise.all(disposePromises);
  }

  /**
   * Get an array of the Asset IDs on which the asset with ID `assetId` depends.
   *
   * NOTE: This will return direct AND transitive dependencies.
   * @param assetId The ID of the asset whose dependencies are to be retrieved.
   */
  public getAssetDependencies(assetId: string): string[] {
    const allDependencies = new Set<string>();

    // Look up this asset's direct dependencies
    const directDependencies = this.assetDependencies.get(assetId);
    if (directDependencies !== undefined) {
      for (const dependencyId of directDependencies) {
        // Collect dependencies into a set (to ensure there are no duplicates)
        allDependencies.add(dependencyId);

        // Recursively collect all of the dependencies of this asset's direct dependencies
        this.getAssetDependencies(dependencyId)
          .forEach((transitiveDependencyId) => allDependencies.add(transitiveDependencyId));
      }
    }

    return Array.from(allDependencies);
  }

  /**
   * Get an array of the IDs of assets which depend on the asset with the ID `assetId`.
   *
   * NOTE: This will return direct AND transitive dependents.
   * @param assetId The ID of the asset whose dependents are to be retrieved.
   */
  public getAssetDependents(assetId: string): string[] {
    const allDependents = new Set<string>();

    // Look up this asset's direct dependents
    const directDependents = this.assetDependents.get(assetId);
    if (directDependents !== undefined) {
      for (const dependentId of directDependents) {
        // Collect dependents into a set (to ensure there are no duplicates)
        allDependents.add(dependentId);

        // Recursively collect all of the depends of this asset's direct dependents
        this.getAssetDependents(dependentId)
          .forEach((transitiveDependentId) => allDependents.add(transitiveDependentId));
      }
    }

    return Array.from(allDependents);
  }

  /**
   * Remove an asset from the cache.
   *
   * NOTE: Any assets that have a direct or transitive dependency on
   * the asset with ID `assetId` will ALSO be removed from the cache.
   * @param assetId ID of the asset to remove from the cache.
   */
  public delete(assetId: string): void {
    this.assetFactoryCache.delete(assetId);
    this.assetInstanceCache.delete(assetId);

    // @NOTE Since `assetId` is being removed from the cache, we kind of have to remove
    // all of `assetId`'s dependents from the cache too, otherwise their cached value
    // will load against a stale reference.
    // Recursively delete `assetId`'s dependents first before adjusting any references to `assetId`
    const assetDependents = this.assetDependents.get(assetId) || [];
    for (const assetDependentId of assetDependents) {
      this.delete(assetDependentId);
    }

    // @NOTE This map will already be empty after calling `delete()` on all dependents
    this.assetDependents.delete(assetId);

    // Look up asset's dependencies
    const assetDependencies = this.assetDependencies.get(assetId) || [];
    // For each dependency
    for (const assetDependencyId of assetDependencies) {
      // Look up the list of that dependency's dependents
      const dependencyDependents = this.assetDependents.get(assetDependencyId);
      if (dependencyDependents !== undefined) {
        // Remove the asset from its dependency's list of dependents
        this.assetDependents.set(assetDependencyId, dependencyDependents.filter((dependentId) => dependentId !== assetId));
      }
    }

    // Clear out any known dependencies for this asset
    this.assetDependencies.delete(assetId);
  }

  public clear(): void {
    this.assetFactoryCache.clear();
    this.assetInstanceCache.clear();
    this.assetDependencies.clear();
    this.assetDependents.clear();
  }
}
