import { LoadAssetContainerAsync } from '@babylonjs/core/Loading/sceneLoader.js';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { AssetContainer } from '@babylonjs/core/assetContainer';
import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial';
import { CubeTexture } from '@babylonjs/core/Materials/Textures/cubeTexture';

import { AssetType, IMeshAssetData } from '@polyzone/runtime/src/cartridge';
import { debug_modTexture } from "@polyzone/runtime/src";
import { toColor3Babylon } from "@polyzone/runtime/src/util";
import { RetroMaterial } from "@polyzone/runtime/src/materials/RetroMaterial";

import { LoadedAssetBase } from './LoadedAssetBase';
import type { AssetCacheContext } from './AssetCache';
import { ReflectionLoading } from './TextureAsset';


export class MeshAsset extends LoadedAssetBase<AssetType.Mesh> {
  public get type(): AssetType.Mesh { return AssetType.Mesh; }

  private _assetContainer: AssetContainer;

  private constructor(assetContainer: AssetContainer) {
    super();
    this._assetContainer = assetContainer;
  }

  public static async fromAssetData(assetData: IMeshAssetData, context: AssetCacheContext): Promise<MeshAsset> {
    const { scene, assetCache } = context;

    // Load mesh
    // @TODO can we rely on cache better? Is this the right thing to be using?
    const assetContainer = await LoadAssetContainerAsync(assetData.babylonFetchUrl, scene, { pluginExtension: assetData.fileExtension });

    // @TODO Store textures (and other assets) in assetCache

    for (const texture of assetContainer.textures) {
      debug_modTexture(texture);
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

      // Set overrides
      const materialOverrideData = assetData.getOverridesForMaterial(oldMaterial.name);
      if (materialOverrideData !== undefined) {
        // BASE MATERIAL OVERRIDES
        if (materialOverrideData.material !== undefined) {
          const material = await assetCache.loadAsset(materialOverrideData.material, context);
          newMaterial.readOverridesFromMaterial(material);
        }

        // ASSET-SPECIFIC OVERRIDES
        /* Diffuse color */
        if (materialOverrideData.diffuseColor !== undefined) {
          newMaterial.overridesFromAsset.diffuseColor = toColor3Babylon(materialOverrideData.diffuseColor);
        }

        /* Diffuse texture */
        if (materialOverrideData.diffuseTexture !== undefined) {
          const textureAsset = await assetCache.loadAsset(materialOverrideData.diffuseTexture, context);
          newMaterial.overridesFromAsset.diffuseTexture = textureAsset.texture;
        }

        /* Emission color */
        if (materialOverrideData.emissionColor !== undefined) {
          newMaterial.overridesFromAsset.emissionColor = toColor3Babylon(materialOverrideData.emissionColor);
        }

        /* Reflection */
        if (materialOverrideData.reflection !== undefined) {
          newMaterial.overridesFromAsset.reflectionTexture = await ReflectionLoading.load(materialOverrideData.reflection, context);
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

    return new MeshAsset(assetContainer);
  }

  public override dispose(): void {
    this.assetContainer.dispose();
  }

  public get assetContainer(): AssetContainer { return this._assetContainer; }
}
