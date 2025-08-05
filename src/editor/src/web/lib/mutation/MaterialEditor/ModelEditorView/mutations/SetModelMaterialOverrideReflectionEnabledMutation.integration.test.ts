import { describe, test, expect } from 'vitest';
import { CubeTexture } from '@babylonjs/core/Materials/Textures/cubeTexture';

import { AssetType, MeshAssetMaterialOverrideReflection3x2Data } from '@polyzone/runtime/src/cartridge';
import { RetroMaterial } from '@polyzone/runtime/src/materials/RetroMaterial';

import { MeshAssetDefinition, TextureAssetDefinition } from '@lib/project/definition';
import { MockProject } from '@test/integration/mock/project/MockProject';
import { MockAssets } from '@test/integration/mock/assets';
import { MockProjectController } from '@test/integration/mock/project/MockProjectController';
import { MockModelEditorViewController } from '@test/integration/mock/material-editor/MockModelEditorViewController';

import { SetModelMaterialOverrideReflectionEnabledMutation } from './SetModelMaterialOverrideReflectionEnabledMutation';

describe(SetModelMaterialOverrideReflectionEnabledMutation.name, () => {
  test("Toggling reflection enabled state updates all relevant state correctly", async () => {
    // Setup
    const mockMaterialName = 'Main'; // @NOTE Must match `sphere.mtl` - referenced in mock project definition
    let mockTextureAssetDefinition!: TextureAssetDefinition;
    let mockMeshAssetDefinition!: MeshAssetDefinition;
    const mock = new MockProject(({ manifest, asset, scene }) => {
      // Must define texture first since it is referenced by the mesh material overrides
      mockTextureAssetDefinition = asset(AssetType.Texture, 'textures/skybox.png', MockAssets.textures.stonesPng);

      return {
        manifest: manifest(),
        assets: [
          mockTextureAssetDefinition,
          mockMeshAssetDefinition = asset(AssetType.Mesh, 'models/sphere.obj', MockAssets.models.sphereObj, {
            materialOverrides: {
              [mockMaterialName]: {
                reflection: {
                  type: '3x2',
                  strength: 0.8,
                  textureAssetId: mockTextureAssetDefinition.id,
                },
              },
            },
          }),
          asset(AssetType.MeshSupplementary, 'models/sphere.mtl', MockAssets.models.sphereMtl),
        ],
        scenes: [
          scene('sample'),
        ],
      };
    });

    const mockProjectController = await MockProjectController.create(mock);
    const mockMeshAssetData = mockProjectController.project.assets.getById(mockMeshAssetDefinition.id, AssetType.Mesh);
    const mockModelEditorViewController = await MockModelEditorViewController.create(mockProjectController, mockMeshAssetData);

    /* Test selector utilities */
    async function getCachedMaterialReflectionTexture(): Promise<CubeTexture | undefined> {
      const asset = await mockProjectController.assetCache.loadAsset(mockMeshAssetData, mockModelEditorViewController.scene);
      const material = asset.assetContainer.materials.find((material) => material.name === mockMaterialName) as RetroMaterial;
      return material.overridesFromAsset.reflectionTexture;
    }

    // Capture initial state (reflection should be enabled since it's defined in the material overrides)
    const initialDataEnabledValue = mockMeshAssetData.getOverridesForMaterial(mockMaterialName)?.reflectionEnabled;
    const initialDataValue = mockMeshAssetData.getOverridesForMaterial(mockMaterialName)?.reflection as MeshAssetMaterialOverrideReflection3x2Data;
    const initialBabylonTextureValue = mockModelEditorViewController.getMaterialByName(mockMaterialName).overridesFromAsset.reflectionTexture;
    const initialJsonValue = (mockProjectController.projectDefinition.assets.find((asset) => asset.id === mockMeshAssetDefinition.id) as MeshAssetDefinition).materialOverrides?.[mockMaterialName]?.reflection;
    const initialCachedTexture = await getCachedMaterialReflectionTexture();

    // Test: Disable the reflection
    const disableMutation = new SetModelMaterialOverrideReflectionEnabledMutation(mockMeshAssetData.id, mockMaterialName, false);
    await mockModelEditorViewController.mutator.apply(disableMutation);

    const disabledDataEnabledValue = mockMeshAssetData.getOverridesForMaterial(mockMaterialName)?.reflectionEnabled;
    const disabledDataValue = mockMeshAssetData.getOverridesForMaterial(mockMaterialName)?.reflection as MeshAssetMaterialOverrideReflection3x2Data;
    const disabledBabylonTextureValue = mockModelEditorViewController.getMaterialByName(mockMaterialName).overridesFromAsset.reflectionTexture;
    const disabledJsonValue = (mockProjectController.projectDefinition.assets.find((asset) => asset.id === mockMeshAssetDefinition.id) as MeshAssetDefinition).materialOverrides?.[mockMaterialName]?.reflection;
    const disabledCachedTexture = await getCachedMaterialReflectionTexture();

    // Test: Re-enable the reflection
    const enableMutation = new SetModelMaterialOverrideReflectionEnabledMutation(mockMeshAssetData.id, mockMaterialName, true);
    await mockModelEditorViewController.mutator.apply(enableMutation);

    const enabledDataEnabledValue = mockMeshAssetData.getOverridesForMaterial(mockMaterialName)?.reflectionEnabled;
    const enabledDataValue = mockMeshAssetData.getOverridesForMaterial(mockMaterialName)?.reflection as MeshAssetMaterialOverrideReflection3x2Data;
    const enabledBabylonTextureValue = mockModelEditorViewController.getMaterialByName(mockMaterialName).overridesFromAsset.reflectionTexture;
    const enabledJsonValue = (mockProjectController.projectDefinition.assets.find((asset) => asset.id === mockMeshAssetDefinition.id) as MeshAssetDefinition).materialOverrides?.[mockMaterialName]?.reflection;
    const enabledCachedTexture = await getCachedMaterialReflectionTexture();

    // Assert
    /* Initial state (reflection enabled) */
    expect(initialDataEnabledValue, "Material override data should have reflection enabled initially").toBe(true);
    expect(initialDataValue, "Material override data should have reflection defined initially").toBeDefined();
    expect(initialDataValue.type, "Material override data should have 3x2 reflection type initially").toBe('3x2');
    expect(initialDataValue.strength, "Material override data should have correct reflection strength initially").toBe(0.8);
    expect(initialDataValue.texture?.id, "Material override data should have correct reflection texture initially").toBe(mockTextureAssetDefinition.id);
    expect(initialBabylonTextureValue, "Babylon material should have reflection texture defined initially").toBeDefined();
    expect(initialJsonValue, "Mesh asset definition should have reflection defined initially").toBeDefined();
    expect(initialJsonValue?.type, "Mesh asset definition should have 3x2 reflection type initially").toBe('3x2');
    expect(initialCachedTexture, "Cached material should have reflection texture defined initially").toBeDefined();

    /* After disabling */
    expect(disabledDataEnabledValue, "Material override data should not have reflection enabled after disabling").toBe(false);
    expect(disabledDataValue, "Material override data should not have reflection defined after disabling (getter returns undefined)").toBeUndefined();
    expect(disabledBabylonTextureValue, "Babylon material should not have reflection texture defined after disabling").toBeUndefined();
    expect(disabledJsonValue, "Mesh asset definition should not have reflection defined after disabling").toBeUndefined();
    expect(disabledCachedTexture, "Cached material should not have reflection texture defined after disabling").toBeUndefined();

    /* After re-enabling */
    expect(enabledDataEnabledValue, "Material override data should have reflection enabled after re-enabling").toBe(true);
    expect(enabledDataValue, "Material override data should have reflection defined after re-enabling").toBeDefined();
    expect(enabledDataValue.type, "Material override data should still have 3x2 reflection type after re-enabling").toBe('3x2');
    expect(enabledDataValue.strength, "Material override data should still have correct reflection strength after re-enabling").toBe(0.8);
    expect(enabledDataValue.texture?.id, "Material override data should still have correct reflection texture after re-enabling").toBe(mockTextureAssetDefinition.id);
    expect(enabledBabylonTextureValue, "Babylon material should have reflection texture defined after re-enabling").toBeDefined();
    expect(enabledJsonValue, "Mesh asset definition should have reflection defined after re-enabling").toBeDefined();
    expect(enabledJsonValue?.type, "Mesh asset definition should have 3x2 reflection type after re-enabling").toBe('3x2');
    expect(enabledCachedTexture, "Cached material should have reflection texture defined after re-enabling").toBeDefined();
  });
});
