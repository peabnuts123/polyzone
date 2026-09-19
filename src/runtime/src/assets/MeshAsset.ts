import { Model } from '@lopoly/engine/models';
import { GltfLoader } from '@lopoly/engine/loaders/GltfLoader';
import { ObjLoader } from '@lopoly/engine/loaders/ObjLoader';
import { ModelDefinition } from '@lopoly/engine/loaders/definitions';
import { getAllMaterialNamesForModelDefinition } from '@lopoly/engine/util';
import { Material } from '@lopoly/engine';

import { AssetType } from '@polyzone/runtime/cartridge/archive';
import { IMeshAssetData } from '@polyzone/runtime/cartridge/data';
import { areUrisCanonicallyEquivalent } from "@polyzone/runtime/util/path";

import { LoadedAssetBase } from './LoadedAssetBase';
import type { AssetCacheContext } from './AssetCache';
import { ReflectionLoading } from './TextureAsset';

// @NOTE Lighting enabled by default (for now?)
const DefaultUnlitState = false;

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
        console.error(`[${MeshAsset.name}] (${this.fromAssetData.name}) Mesh has reference to non-tracked asset: '${textureDependency.path}'`);
      } else {
        // @TODO store loaded texture asset in asset cache (in case anybody else wants it)
        assetCache.registerDependency(assetData.id, textureAsset.id);
      }
    }

    const model = await Model.fromDefinition(engine, definition);

    const materialNames = getAllMaterialNamesForModelDefinition(definition);
    for (const materialName of materialNames) {
      const materialOverrideData = assetData.getOverridesForMaterial(materialName);
      const materialOverrides = new Material();
      materialOverrides.unlit = DefaultUnlitState;

      if (materialOverrideData !== undefined) {
        // BASE MATERIAL OVERRIDES
        if (materialOverrideData.material !== undefined) {
          assetCache.registerDependency(assetData.id, materialOverrideData.material.id);
          const material = await assetCache.loadAsset(materialOverrideData.material);

          materialOverrides.diffuseColor = material.diffuseColor?.toColor4();
          materialOverrides.diffuseTexture = material.diffuseTexture;
          materialOverrides.reflectionCubemap = material.reflectionCubemap;
          materialOverrides.reflectionIntensity = material.reflectionStrength;
          if (material.lightingEnabled !== undefined) {
            materialOverrides.unlit = !material.lightingEnabled;
          }
        }

        // ASSET-SPECIFIC OVERRIDES
        /* Diffuse color */
        if (materialOverrideData.diffuseColor !== undefined) {
          materialOverrides.diffuseColor = materialOverrideData.diffuseColor.toColor4();
        }

        /* Diffuse texture */
        if (materialOverrideData.diffuseTexture !== undefined) {
          assetCache.registerDependency(assetData.id, materialOverrideData.diffuseTexture.id);
          const textureAsset = await assetCache.loadAsset(materialOverrideData.diffuseTexture);
          materialOverrides.diffuseTexture = textureAsset.texture;
        }

        /* Reflection */
        if (materialOverrideData.reflection !== undefined) {
          const reflection = await ReflectionLoading.load(materialOverrideData.reflection, assetCache, engine);
          if (reflection) {
            materialOverrides.reflectionCubemap = reflection.cubemap;
            materialOverrides.reflectionIntensity = reflection.strength;
            reflection.textureAssetData.forEach((textureAssetData) => assetCache.registerDependency(assetData.id, textureAssetData.id));
          }
        }

        /* Lighting */
        if (materialOverrideData.lightingEnabled !== undefined) {
          materialOverrides.unlit = !materialOverrideData.lightingEnabled;
        }
      }

      // Apply overrides
      model.setMaterialOverride(materialName, materialOverrides, 'override');
    }

    return new MeshAsset(assetData.id, model);
  }
}
