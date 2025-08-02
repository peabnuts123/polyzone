import { describe, test, expect } from 'vitest';

import { AssetType } from '@polyzone/runtime/src/cartridge';

import { MaterialAssetDefinition, TextureAssetDefinition } from '@lib/project';
import { createMockMaterial, MockMaterial } from '@test/integration/mock/material-editor/createMockMaterial';
import { MockProject } from '@test/integration/mock/project/MockProject';
import { MockAssets } from '@test/integration/mock/assets';
import { MockProjectController } from '@test/integration/mock/project/MockProjectController';
import { MockMaterialEditorViewController } from '@test/integration/mock/material-editor/MockMaterialEditorViewController';

import { SetMaterialDiffuseTextureEnabledMutation } from './SetMaterialDiffuseTextureEnabledMutation';


describe(SetMaterialDiffuseTextureEnabledMutation.name, () => {
  test("Toggling diffuse texture enabled state updates all relevant state correctly", async () => {
    // Setup
    let mockTextureAssetDefinition!: TextureAssetDefinition;
    let mockMaterialAssetDefinition!: MaterialAssetDefinition;
    let mockMaterial!: MockMaterial;
    const mock = new MockProject(({ manifest, asset, scene }) => {
      // Must define texture first since it is referenced by the material
      mockTextureAssetDefinition = asset(AssetType.Texture, 'textures/asphalt.png', MockAssets.textures.asphaltPng);
      mockMaterial = createMockMaterial({
        diffuseTextureAssetId: mockTextureAssetDefinition.id,
      });

      return {
        manifest: manifest(),
        assets: [
          mockTextureAssetDefinition,
          mockMaterialAssetDefinition = asset(AssetType.Material, 'materials/mock.pzmat', mockMaterial.data),
        ],
        scenes: [
          scene('sample'),
        ],
      };
    });

    const mockProjectController = await MockProjectController.create(mock);
    const mockMaterialEditorViewController = await MockMaterialEditorViewController.create(
      mockProjectController,
      mockMaterialAssetDefinition,
      mockMaterial.definition,
    );

    // Capture initial state (texture should be enabled since it's defined in the material)
    const initialDataEnabledValue = mockMaterialEditorViewController.materialData.diffuseTextureEnabled;
    const initialDataValue = mockMaterialEditorViewController.materialData.diffuseTexture;
    const initialBabylonTextureValue = mockMaterialEditorViewController.materialInstance.diffuseTexture;
    const initialJsonValue = mockMaterialEditorViewController.materialJson.value.diffuseTextureAssetId;
    const initialCachedAsset = await mockProjectController.assetCache.loadAsset(mockMaterialEditorViewController.materialAssetData, mockMaterialEditorViewController.scene);

    // Test: Disable the texture
    const disableMutation = new SetMaterialDiffuseTextureEnabledMutation(false);
    await mockMaterialEditorViewController.mutator.apply(disableMutation);

    const disabledDataEnabledValue = mockMaterialEditorViewController.materialData.diffuseTextureEnabled;
    const disabledDataValue = mockMaterialEditorViewController.materialData.diffuseTexture;
    const disabledBabylonTextureValue = mockMaterialEditorViewController.materialInstance.diffuseTexture;
    const disabledJsonValue = mockMaterialEditorViewController.materialJson.value.diffuseTextureAssetId;
    const disabledCachedAsset = await mockProjectController.assetCache.loadAsset(mockMaterialEditorViewController.materialAssetData, mockMaterialEditorViewController.scene);

    // Test: Re-enable the texture
    const enableMutation = new SetMaterialDiffuseTextureEnabledMutation(true);
    await mockMaterialEditorViewController.mutator.apply(enableMutation);

    const enabledDataEnabledValue = mockMaterialEditorViewController.materialData.diffuseTextureEnabled;
    const enabledDataValue = mockMaterialEditorViewController.materialData.diffuseTexture;
    const enabledBabylonTextureValue = mockMaterialEditorViewController.materialInstance.diffuseTexture;
    const enabledJsonValue = mockMaterialEditorViewController.materialJson.value.diffuseTextureAssetId;
    const enabledCachedAsset = await mockProjectController.assetCache.loadAsset(mockMaterialEditorViewController.materialAssetData, mockMaterialEditorViewController.scene);

    // Assert
    /* Initial state (texture enabled) */
    expect(initialDataEnabledValue, "Material data should have diffuse texture enabled initially").toBe(true);
    expect(initialDataValue, "Material data should have diffuse texture defined initially").toBeDefined();
    expect(initialBabylonTextureValue, "Babylon material should have diffuse texture defined initially").toBeDefined();
    expect(initialJsonValue, "Material asset should have diffuse texture defined initially").toBe(mockTextureAssetDefinition.id);
    expect(initialCachedAsset.diffuseTexture, "Cached material should have diffuse texture defined initially").toBeDefined();

    /* After disabling */
    expect(disabledDataEnabledValue, "Material data should not have diffuse texture enabled after disabling").toBe(false);
    expect(disabledDataValue, "Material data should not have diffuse texture defined after disabling").toBeUndefined();
    expect(disabledBabylonTextureValue, "Babylon material should not have diffuse texture defined after disabling").toBeUndefined();
    expect(disabledJsonValue, "Material asset should not have diffuse texture defined after disabling").toBeUndefined();
    expect(disabledCachedAsset.diffuseTexture, "Cached material should not have diffuse texture defined after disabling").toBeUndefined();

    /* After re-enabling */
    expect(enabledDataEnabledValue, "Material data should have diffuse texture enabled after re-enabling").toBe(true);
    expect(enabledDataValue, "Material data should have diffuse texture defined after re-enabling").toBeDefined();
    expect(enabledBabylonTextureValue, "Babylon material should have diffuse texture defined after re-enabling").toBeDefined();
    expect(enabledJsonValue, "Material asset should have diffuse texture defined after re-enabling").toBe(mockTextureAssetDefinition.id);
    expect(enabledCachedAsset.diffuseTexture, "Cached material should have diffuse texture defined after re-enabling").toBeDefined();
  });
});
