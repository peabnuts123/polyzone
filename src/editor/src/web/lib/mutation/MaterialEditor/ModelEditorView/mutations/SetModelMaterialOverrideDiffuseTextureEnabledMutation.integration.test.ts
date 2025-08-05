import { describe, test, expect } from 'vitest';
import { BaseTexture } from '@babylonjs/core/Materials/Textures/baseTexture';

import { AssetType } from '@polyzone/runtime/src/cartridge';
import { RetroMaterial } from '@polyzone/runtime/src/materials/RetroMaterial';

import { MeshAssetDefinition, TextureAssetDefinition } from '@lib/project';
import { MockProject } from '@test/integration/mock/project/MockProject';
import { MockAssets } from '@test/integration/mock/assets';
import { MockProjectController } from '@test/integration/mock/project/MockProjectController';
import { MockModelEditorViewController } from '@test/integration/mock/material-editor/MockModelEditorViewController';

import { SetModelMaterialOverrideDiffuseTextureEnabledMutation } from './SetModelMaterialOverrideDiffuseTextureEnabledMutation';


describe(SetModelMaterialOverrideDiffuseTextureEnabledMutation.name, () => {
  test("Toggling diffuse texture enabled state updates all relevant state correctly", async () => {
    // Setup
    const mockMaterialName = 'Main'; // @NOTE Must match `sphere.mtl` - referenced in mock project definition
    let mockTextureAssetDefinition!: TextureAssetDefinition;
    let mockMeshAssetDefinition!: MeshAssetDefinition;
    const mock = new MockProject(({ manifest, asset, scene }) => {
      // Must define texture first since it is referenced by the mesh material overrides
      mockTextureAssetDefinition = asset(AssetType.Texture, 'textures/asphalt.png', MockAssets.textures.asphaltPng);

      return {
        manifest: manifest(),
        assets: [
          mockTextureAssetDefinition,
          mockMeshAssetDefinition = asset(AssetType.Mesh, 'models/sphere.obj', MockAssets.models.sphereObj, {
            materialOverrides: {
              [mockMaterialName]: {
                diffuseTextureAssetId: mockTextureAssetDefinition.id,
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
    async function getCachedMaterialDiffuseTexture(): Promise<BaseTexture | undefined> {
      const asset = await mockProjectController.assetCache.loadAsset(mockMeshAssetData, mockModelEditorViewController.scene);
      const material = asset.assetContainer.materials.find((material) => material.name === mockMaterialName) as RetroMaterial;
      return material.overridesFromAsset.diffuseTexture;
    }

    // Capture initial state (texture should be enabled since it's defined in the material overrides)
    const initialDataEnabledValue = mockMeshAssetData.getOverridesForMaterial(mockMaterialName)?.diffuseTextureEnabled;
    const initialDataValue = mockMeshAssetData.getOverridesForMaterial(mockMaterialName)?.diffuseTexture;
    const initialBabylonTextureValue = mockModelEditorViewController.getMaterialByName(mockMaterialName).overridesFromAsset.diffuseTexture;
    const initialJsonValue = (mockProjectController.projectDefinition.assets.find((asset) => asset.id === mockMeshAssetDefinition.id) as MeshAssetDefinition).materialOverrides?.[mockMaterialName]?.diffuseTextureAssetId;
    const initialCachedTexture = await getCachedMaterialDiffuseTexture();

    // Test: Disable the texture
    const disableMutation = new SetModelMaterialOverrideDiffuseTextureEnabledMutation(mockMeshAssetData.id, mockMaterialName, false);
    await mockModelEditorViewController.mutator.apply(disableMutation);

    const disabledDataEnabledValue = mockMeshAssetData.getOverridesForMaterial(mockMaterialName)?.diffuseTextureEnabled;
    const disabledDataValue = mockMeshAssetData.getOverridesForMaterial(mockMaterialName)?.diffuseTexture;
    const disabledBabylonTextureValue = mockModelEditorViewController.getMaterialByName(mockMaterialName).overridesFromAsset.diffuseTexture;
    const disabledJsonValue = (mockProjectController.projectDefinition.assets.find((asset) => asset.id === mockMeshAssetDefinition.id) as MeshAssetDefinition).materialOverrides?.[mockMaterialName]?.diffuseTextureAssetId;
    const disabledCachedTexture = await getCachedMaterialDiffuseTexture();

    // Test: Re-enable the texture
    const enableMutation = new SetModelMaterialOverrideDiffuseTextureEnabledMutation(mockMeshAssetData.id, mockMaterialName, true);
    await mockModelEditorViewController.mutator.apply(enableMutation);

    const enabledDataEnabledValue = mockMeshAssetData.getOverridesForMaterial(mockMaterialName)?.diffuseTextureEnabled;
    const enabledDataValue = mockMeshAssetData.getOverridesForMaterial(mockMaterialName)?.diffuseTexture;
    const enabledBabylonTextureValue = mockModelEditorViewController.getMaterialByName(mockMaterialName).overridesFromAsset.diffuseTexture;
    const enabledJsonValue = (mockProjectController.projectDefinition.assets.find((asset) => asset.id === mockMeshAssetDefinition.id) as MeshAssetDefinition).materialOverrides?.[mockMaterialName]?.diffuseTextureAssetId;
    const enabledCachedTexture = await getCachedMaterialDiffuseTexture();

    // Assert
    /* Initial state (texture enabled) */
    expect(initialDataEnabledValue, "Material override data should have diffuse texture enabled initially").toBe(true);
    expect(initialDataValue, "Material override data should have diffuse texture defined initially").toBeDefined();
    expect(initialBabylonTextureValue, "Babylon material should have diffuse texture defined initially").toBeDefined();
    expect(initialJsonValue, "Mesh asset definition should have diffuse texture defined initially").toBe(mockTextureAssetDefinition.id);
    expect(initialCachedTexture, "Cached material should have diffuse texture defined initially").toBeDefined();

    /* After disabling */
    expect(disabledDataEnabledValue, "Material override data should not have diffuse texture enabled after disabling").toBe(false);
    expect(disabledDataValue, "Material override data should not have diffuse texture defined after disabling").toBeUndefined();
    expect(disabledBabylonTextureValue, "Babylon material should not have diffuse texture defined after disabling").toBeUndefined();
    expect(disabledJsonValue, "Mesh asset definition should not have diffuse texture defined after disabling").toBeUndefined();
    expect(disabledCachedTexture, "Cached material should not have diffuse texture defined after disabling").toBeUndefined();

    /* After re-enabling */
    expect(enabledDataEnabledValue, "Material override data should have diffuse texture enabled after re-enabling").toBe(true);
    expect(enabledDataValue, "Material override data should have diffuse texture defined after re-enabling").toBeDefined();
    expect(enabledBabylonTextureValue, "Babylon material should have diffuse texture defined after re-enabling").toBeDefined();
    expect(enabledJsonValue, "Mesh asset definition should have diffuse texture defined after re-enabling").toBe(mockTextureAssetDefinition.id);
    expect(enabledCachedTexture, "Cached material should have diffuse texture defined after re-enabling").toBeDefined();
  });
});
