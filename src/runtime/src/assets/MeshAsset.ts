import { Model } from '@lopoly/engine/models';
import { GltfLoader } from '@lopoly/engine/loaders/GltfLoader';
import { ObjLoader } from '@lopoly/engine/loaders/ObjLoader';
import { ModelDefinition } from '@lopoly/engine/loaders/definitions';

import { AssetType } from '@polyzone/runtime/cartridge/archive';
import { IMeshAssetData } from '@polyzone/runtime/cartridge/data';
import { areUrisCanonicallyEquivalent } from "@polyzone/runtime/util/path";

import { LoadedAssetBase } from './LoadedAssetBase';
import type { AssetCacheContext } from './AssetCache';

export class MeshAsset extends LoadedAssetBase<AssetType.Mesh> {
  public get type(): AssetType.Mesh { return AssetType.Mesh; }

  public readonly model: Model;

  private constructor(id: string, model: Model) {
    super(id);
    this.model = model;
  }

  public static async fromAssetData(assetData: IMeshAssetData, context: AssetCacheContext): Promise<MeshAsset> {
    const { engine, assetCache, assetDb } = context;

    /*
      @TODO Polyzone needs to load `.bin` as gltf supplementary and put a dependency on it
     */

    // Parse model asset definition
    let definition: ModelDefinition;
    switch (assetData.fileExtension) {
      case '.gltf':
      case '.glb':
        definition = await GltfLoader.loadModel(assetData.path, assetDb.fileSystem);
        break;
      case '.obj':
        definition = await ObjLoader.loadModel(assetData.path, assetDb.fileSystem);
        break;
      default:
        throw new Error(`Unsupported model file type: '${assetData.fileExtension}'`);
    }

    // Register asset's dependencies
    // @TODO What if dependencies were just paths? (not strongly typed) OR support for "misc" supplementary in LoPoly
    for (const textureDependency of definition.dependencies?.textures ?? []) {
      const textureAsset = assetDb.assets.find((asset) => {
        return areUrisCanonicallyEquivalent(asset.path, textureDependency.path) && asset.type === AssetType.Texture;
      });

      if (textureAsset === undefined) {
        console.error(`[MeshAsset] (fromAssetData) Mesh has reference to non-tracked asset: '${textureDependency.path}'`);
      } else {
        // @TODO store loaded texture asset in asset cache (in case anybody else wants it)
        assetCache.registerDependency(assetData.id, textureAsset.id);
      }
    }

    // @TODO Consider stripping out unsupported material features from model definition
    // e.g. restrict materials to only PolyZone concepts e.g. diffuse color, diffuse texture, etc.

    const model = await Model.fromDefinition(engine, definition);

    /*
      @TODO Apply material overrides
        - For each material in the definition
        - Read `assetData.getOverridesForMaterial(material.name)`
          - Apply overrides from base material asset
          - Apply diffuse color override
          - Apply diffuse texture override
          - Apply emission color override
          - Apply reflection override
     */

    return new MeshAsset(assetData.id, model);
  }
}
