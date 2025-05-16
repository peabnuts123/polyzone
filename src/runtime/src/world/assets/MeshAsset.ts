import { LoadAssetContainerAsync } from '@babylonjs/core/Loading/sceneLoader.js';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { AssetContainer } from '@babylonjs/core/assetContainer';
import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial';
import { CubeTexture } from '@babylonjs/core/Materials/Textures/cubeTexture';

import { AssetType, IMeshAssetData } from '@polyzone/runtime/src/cartridge';
import { debug_modTexture } from "@polyzone/runtime/src";
import { areUrisCanonicallyEquivalent, toColor3Babylon } from "@polyzone/runtime/src/util";
import { RetroMaterial } from "@polyzone/runtime/src/materials/RetroMaterial";

import { LoadedAssetBase } from './LoadedAssetBase';
import type { AssetCacheContext } from './AssetCache';
import { ReflectionLoading } from './TextureAsset';
import { BaseTexture } from '@babylonjs/core/Materials/Textures/baseTexture';

export class MeshAsset extends LoadedAssetBase<AssetType.Mesh> {
  public get type(): AssetType.Mesh { return AssetType.Mesh; }

  private _assetContainer: AssetContainer;

  private constructor(id: string, assetContainer: AssetContainer) {
    super(id);
    this._assetContainer = assetContainer;
  }

  public static async fromAssetData(assetData: IMeshAssetData, context: AssetCacheContext): Promise<MeshAsset> {
    const { scene, assetCache, assetDb } = context;

    // Load mesh
    // @TODO can we rely on cache better? All transitive assets will be reloaded. Is this the right thing to be using?
    const assetContainer = await LoadAssetContainerAsync(assetData.babylonFetchUrl, scene, { pluginExtension: assetData.fileExtension });

    // @TODO Store textures (and other assets) in assetCache

    function registerDependencyForTexture(texture: BaseTexture): void {
      const textureAsset = assetDb.assets.find((asset) => {
        return areUrisCanonicallyEquivalent(asset.babylonFetchUrl, texture.name) && asset.type === AssetType.Texture;
      });

      if (textureAsset === undefined) {
        console.error(`[MeshAsset] (fromAssetData) Mesh has reference to non-tracked asset: '${texture.name}'`);
      } else {
        assetCache.registerDependency(assetData.id, textureAsset.id);
      }
    }

    for (const texture of assetContainer.textures) {
      debug_modTexture(texture);
      registerDependencyForTexture(texture);

      // @TODO How can I see if there's a reference to a MeshSupplementary asset?
    }

    // Replace every material with custom PolyZone material
    for (let i = 0; i < assetContainer.materials.length; i++) {
      const oldMaterial = assetContainer.materials[i];
      const newMaterial: RetroMaterial = new RetroMaterial(oldMaterial.name, assetContainer.scene);

      // Bind supported properties from original material
      if (oldMaterial instanceof StandardMaterial) {
        newMaterial.diffuseColor = oldMaterial.diffuseColor;
        newMaterial.diffuseTexture = oldMaterial.diffuseTexture || undefined;
        newMaterial.emissionColor = oldMaterial.emissiveColor;
        if (oldMaterial.reflectionTexture instanceof CubeTexture) { // Not sure this is even possible
          newMaterial.reflectionTexture = oldMaterial.reflectionTexture;
        }
      } else if (oldMaterial instanceof PBRMaterial) {
        newMaterial.diffuseColor = oldMaterial.albedoColor;
        newMaterial.diffuseTexture = oldMaterial.albedoTexture || undefined;
        newMaterial.emissionColor = oldMaterial.emissiveColor.multiplyByFloats(
          oldMaterial.emissiveIntensity,
          oldMaterial.emissiveIntensity,
          oldMaterial.emissiveIntensity,
        );
        if (oldMaterial.reflectionTexture instanceof CubeTexture) { // Not sure this is even possible
          newMaterial.reflectionTexture = oldMaterial.reflectionTexture;
        }
      } else {
        console.error(`[MeshAsset] (fromAssetData) Could not load material info. Unimplemented material type: `, oldMaterial);
        // @NOTE continue processing / replace material (it will just be blank, untextured etc.)
        // We do this so that we guarantee every mesh has our material.
      }

      // Register dependencies on original material textures
      if (newMaterial.diffuseTexture) {
        registerDependencyForTexture(newMaterial.diffuseTexture);
      }
      if (newMaterial.reflectionTexture) {
        registerDependencyForTexture(newMaterial.reflectionTexture);
      }

      // Set overrides
      const materialOverrideData = assetData.getOverridesForMaterial(oldMaterial.name);
      if (materialOverrideData !== undefined) {
        // BASE MATERIAL OVERRIDES
        if (materialOverrideData.material !== undefined) {
          assetCache.registerDependency(assetData.id, materialOverrideData.material.id);
          const material = await assetCache.loadAsset(materialOverrideData.material, scene);
          newMaterial.readOverridesFromMaterial(material);
        }

        // ASSET-SPECIFIC OVERRIDES
        /* Diffuse color */
        if (materialOverrideData.diffuseColor !== undefined) {
          newMaterial.overridesFromAsset.diffuseColor = toColor3Babylon(materialOverrideData.diffuseColor);
        }

        /* Diffuse texture */
        if (materialOverrideData.diffuseTexture !== undefined) {
          assetCache.registerDependency(assetData.id, materialOverrideData.diffuseTexture.id);
          const textureAsset = await assetCache.loadAsset(materialOverrideData.diffuseTexture, scene);
          newMaterial.overridesFromAsset.diffuseTexture = textureAsset.texture;
        }

        /* Emission color */
        if (materialOverrideData.emissionColor !== undefined) {
          newMaterial.overridesFromAsset.emissionColor = toColor3Babylon(materialOverrideData.emissionColor);
        }

        /* Reflection */
        if (materialOverrideData.reflection !== undefined) {
          const reflection = await ReflectionLoading.load(materialOverrideData.reflection, assetCache, scene);
          reflection?.textureAssetData.forEach((textureAssetData) => assetCache.registerDependency(assetData.id, textureAssetData.id));
          newMaterial.overridesFromAsset.reflectionTexture = reflection?.texture;
        }
      }

      // Replace material in scene
      assetContainer.scene.removeMaterial(oldMaterial);
      assetContainer.scene.addMaterial(newMaterial);

      // Find any meshes referencing the old material and replace them
      for (const mesh of assetContainer.meshes) {
        if (mesh.material?.name === oldMaterial.name) {
          mesh.material = newMaterial;
        }
      }

      // Update the container, IDK
      assetContainer.materials[i] = newMaterial;
      oldMaterial.dispose();
    }

    return new MeshAsset(assetData.id, assetContainer);
  }

  public override dispose(): void {
    this.assetContainer.dispose();
  }

  public get assetContainer(): AssetContainer { return this._assetContainer; }
}
