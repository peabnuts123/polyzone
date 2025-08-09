import { describe, test, expect } from 'vitest';

import { AssetType } from '@polyzone/runtime/src/cartridge';

import { MaterialAssetDefinition, TextureAssetDefinition } from '@lib/project/definition';
import { MockProject } from '@test/integration/mock/project/MockProject';
import { MockAssets } from '@test/integration/mock/assets';
import { MockMaterialEditorViewController } from '@test/integration/mock/material-editor/MockMaterialEditorViewController';
import { MockProjectController } from '@test/integration/mock/project/MockProjectController';
import { createMockMaterial, MockMaterial } from '@test/integration/mock/material-editor/createMockMaterial';

import { SetMaterialReflectionEnabledMutation } from './SetMaterialReflectionEnabledMutation';

describe(SetMaterialReflectionEnabledMutation.name, () => {
  test("Toggling reflection enabled state updates all relevant state correctly", async () => {
    // Setup
    let mockTextureAssetDefinition!: TextureAssetDefinition;
    let mockMaterialAssetDefinition!: MaterialAssetDefinition;
    let mockMaterial!: MockMaterial;
    const mock = new MockProject(({ manifest, asset, scene }) => {
      mockTextureAssetDefinition = asset(AssetType.Texture, 'textures/skybox.png', MockAssets.textures.stonesPng);
      mockMaterial = createMockMaterial({
        reflection: {
          type: '3x2',
          strength: 0.8,
          textureAssetId: mockTextureAssetDefinition.id,
        },
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

    // Capture initial state (reflection should be enabled since it's defined in the material)
    const initialDataEnabledValue = mockMaterialEditorViewController.materialData.reflectionEnabled;
    const initialDataValue = mockMaterialEditorViewController.materialData.reflection;
    const initialBabylonTextureValue = mockMaterialEditorViewController.materialInstance.reflectionTexture;
    const initialJsonValue = mockMaterialEditorViewController.materialJson.value.reflection;
    const initialCachedAsset = await mockProjectController.assetCache.loadAsset(mockMaterialEditorViewController.materialAssetData, mockMaterialEditorViewController.scene);

    // Test: Disable the reflection
    const disableMutation = new SetMaterialReflectionEnabledMutation(false);
    await mockMaterialEditorViewController.mutator.apply(disableMutation);

    const disabledDataEnabledValue = mockMaterialEditorViewController.materialData.reflectionEnabled;
    const disabledDataValue = mockMaterialEditorViewController.materialData.reflection;
    const disabledBabylonTextureValue = mockMaterialEditorViewController.materialInstance.reflectionTexture;
    const disabledJsonValue = mockMaterialEditorViewController.materialJson.value.reflection;
    const disabledCachedAsset = await mockProjectController.assetCache.loadAsset(mockMaterialEditorViewController.materialAssetData, mockMaterialEditorViewController.scene);

    // Test: Re-enable the reflection
    const enableMutation = new SetMaterialReflectionEnabledMutation(true);
    await mockMaterialEditorViewController.mutator.apply(enableMutation);

    const enabledDataEnabledValue = mockMaterialEditorViewController.materialData.reflectionEnabled;
    const enabledDataValue = mockMaterialEditorViewController.materialData.reflection;
    const enabledBabylonTextureValue = mockMaterialEditorViewController.materialInstance.reflectionTexture;
    const enabledJsonValue = mockMaterialEditorViewController.materialJson.value.reflection;
    const enabledCachedAsset = await mockProjectController.assetCache.loadAsset(mockMaterialEditorViewController.materialAssetData, mockMaterialEditorViewController.scene);

    // Assert
    /* Initial state (reflection enabled) */
    expect(initialDataEnabledValue, "Material data should have reflection enabled initially").toBe(true);
    expect(initialDataValue, "Material data should have reflection defined initially").toBeDefined();
    expect(initialDataValue?.type, "Material data should have 3x2 reflection type initially").toBe('3x2');
    expect(initialDataValue?.strength, "Material data should have correct reflection strength initially").toBe(0.8);
    expect(initialBabylonTextureValue, "Babylon material should have reflection texture defined initially").toBeDefined();
    expect(initialJsonValue, "Material asset should have reflection defined initially").toBeDefined();
    expect(initialJsonValue?.type, "Material asset should have 3x2 reflection type initially").toBe('3x2');
    expect(initialCachedAsset.reflectionTexture, "Cached material should have reflection texture defined initially").toBeDefined();

    /* After disabling */
    expect(disabledDataEnabledValue, "Material data should not have reflection enabled after disabling").toBe(false);
    expect(disabledDataValue, "Material data should not have reflection defined after disabling (getter returns undefined)").toBeUndefined();
    expect(disabledBabylonTextureValue, "Babylon material should not have reflection texture defined after disabling").toBeUndefined();
    expect(disabledJsonValue, "Material asset should not have reflection defined after disabling").toBeUndefined();
    expect(disabledCachedAsset.reflectionTexture, "Cached material should not have reflection texture defined after disabling").toBeUndefined();

    /* After re-enabling */
    expect(enabledDataEnabledValue, "Material data should have reflection enabled after re-enabling").toBe(true);
    expect(enabledDataValue, "Material data should have reflection defined after re-enabling").toBeDefined();
    expect(enabledDataValue?.type, "Material data should still have 3x2 reflection type after re-enabling").toBe('3x2');
    expect(enabledDataValue?.strength, "Material data should still have correct reflection strength after re-enabling").toBe(0.8);
    expect(enabledBabylonTextureValue, "Babylon material should have reflection texture defined after re-enabling").toBeDefined();
    expect(enabledJsonValue, "Material asset should have reflection defined after re-enabling").toBeDefined();
    expect(enabledJsonValue?.type, "Material asset should have 3x2 reflection type after re-enabling").toBe('3x2');
    expect(enabledCachedAsset.reflectionTexture, "Cached material should have reflection texture defined after re-enabling").toBeDefined();
  });
});
