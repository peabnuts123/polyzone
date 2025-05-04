import { LoadAssetContainerAsync } from '@babylonjs/core/Loading/sceneLoader.js';
import { Scene as BabylonScene } from "@babylonjs/core/scene";
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { AssetContainer } from '@babylonjs/core/assetContainer';
import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial';

import { AssetType, IMeshAssetData } from '@polyzone/runtime/src/cartridge';
import { debug_modTexture } from "@polyzone/runtime/src";
import { RetroMaterial } from "@polyzone/runtime/src/materials/RetroMaterial";

import { LoadedAssetBase } from './LoadedAssetBase';
import type { AssetCache } from './AssetCache';
import { toColor3Babylon } from '../../util';
import { CubeTexture } from '@babylonjs/core/Materials/Textures/cubeTexture';
import { ReflectionLoading } from './TextureAsset';


export class MeshAsset extends LoadedAssetBase<AssetType.Mesh> {
  public get type(): AssetType.Mesh { return AssetType.Mesh; }

  private _assetContainer: AssetContainer;

  private constructor(assetContainer: AssetContainer) {
    super();
    this._assetContainer = assetContainer;
  }

  public static async fromAssetData(assetData: IMeshAssetData, scene: BabylonScene, assetCache: AssetCache): Promise<MeshAsset> {
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
        /* Diffuse color */
        if (materialOverrideData.diffuseColor !== undefined) {
          newMaterial.overrides.diffuseColor = toColor3Babylon(materialOverrideData.diffuseColor);
        }

        /* Diffuse texture */
        if (materialOverrideData.diffuseTexture !== undefined) {
          const textureAsset = await assetCache.loadAsset(materialOverrideData.diffuseTexture, scene);
          newMaterial.overrides.diffuseTexture = textureAsset.texture;
        }

        /* Emission color */
        if (materialOverrideData.emissionColor !== undefined) {
          newMaterial.overrides.emissionColor = toColor3Babylon(materialOverrideData.emissionColor);
        }

        /* Reflection */
        if (materialOverrideData.reflection !== undefined) {
          /* @NOTE Reflection loading mechanisms might return `undefined` if data is empty */
          switch (materialOverrideData.reflection.type) {
            case 'box-net': {
              newMaterial.overrides.reflectionTexture = await ReflectionLoading.loadBoxNet(materialOverrideData.reflection, assetCache, scene);
              break;
            }
            case '3x2': {
              newMaterial.overrides.reflectionTexture = await ReflectionLoading.load3x2(materialOverrideData.reflection, assetCache, scene);
              break;
            }
            case '6x1': {
              newMaterial.overrides.reflectionTexture = await ReflectionLoading.load6x1(materialOverrideData.reflection, assetCache, scene);
              break;
            }
            case 'separate': {
              newMaterial.overrides.reflectionTexture = await ReflectionLoading.loadSeparate(materialOverrideData.reflection, assetCache, scene);
              break;
            }
            default:
              throw new Error(`Unimplemented reflection type '${(materialOverrideData.reflection as { 'type': string }).type}'`);
          }
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
