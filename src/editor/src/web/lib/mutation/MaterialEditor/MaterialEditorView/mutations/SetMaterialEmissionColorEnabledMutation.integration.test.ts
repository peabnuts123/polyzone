import { describe, test, expect } from 'vitest';

import { AssetType } from '@polyzone/runtime/src/cartridge';

import { MaterialAssetDefinition } from '@lib/project';
import { createMockMaterial } from '@test/integration/mock/material-editor/createMockMaterial';
import { MockProject } from '@test/integration/mock/project/MockProject';
import { MockProjectController } from '@test/integration/mock/project/MockProjectController';
import { MockMaterialEditorViewController } from '@test/integration/mock/material-editor/MockMaterialEditorViewController';

import { SetMaterialEmissionColorEnabledMutation } from './SetMaterialEmissionColorEnabledMutation';


describe(SetMaterialEmissionColorEnabledMutation.name, () => {
  test("Enabling emission color in material updates state correctly", async () => {
    // Setup
    const mockMaterial = createMockMaterial({
      // @NOTE Empty material i.e. no emission color setting
    });
    let mockMaterialAssetDefinition!: MaterialAssetDefinition;
    const mock = new MockProject(({ manifest, asset, scene }) => ({
      manifest: manifest(),
      assets: [
        mockMaterialAssetDefinition = asset(AssetType.Material, 'materials/mock.pzmat', mockMaterial.data),
      ],
      scenes: [
        scene('sample'),
      ],
    }));
    const mockProjectController = await MockProjectController.create(mock);
    const mockMaterialEditorViewController = await MockMaterialEditorViewController.create(
      mockProjectController,
      mockMaterialAssetDefinition,
      mockMaterial.definition,
    );

    const initialDataEnabledValue = mockMaterialEditorViewController.materialData.emissionColorEnabled;
    const initialDataValue = mockMaterialEditorViewController.materialData.emissionColor;
    const initialBabylonColorValue = mockMaterialEditorViewController.materialInstance.emissionColor;
    const initialJsonValue = mockMaterialEditorViewController.materialJson.value.emissionColor;
    const initialCachedAsset = await mockProjectController.assetCache.loadAsset(mockMaterialEditorViewController.materialAssetData, mockMaterialEditorViewController.scene);

    const mutation = new SetMaterialEmissionColorEnabledMutation(true);

    // Test
    await mockMaterialEditorViewController.mutator.apply(mutation);

    const updatedDataEnabledValue = mockMaterialEditorViewController.materialData.emissionColorEnabled;
    const updatedDataValue = mockMaterialEditorViewController.materialData.emissionColor;
    const updatedBabylonColorValue = mockMaterialEditorViewController.materialInstance.emissionColor;
    const updatedJsonValue = mockMaterialEditorViewController.materialJson.value.emissionColor;
    const updatedCachedAsset = await mockProjectController.assetCache.loadAsset(mockMaterialEditorViewController.materialAssetData, mockMaterialEditorViewController.scene);

    // Assert
    /* Initial */
    expect(initialDataEnabledValue, "Material data should not have an emission color enabled initially").toBe(false);
    expect(initialDataValue, "Material data should not have an emission color defined initially").toBeUndefined();
    expect(initialBabylonColorValue, "Babylon material should not have an emission colour defined initially").toBeUndefined();
    expect(initialJsonValue, "Material asset should not have an emission colour defined initially").toBeUndefined();
    expect(initialCachedAsset.emissionColor, "Cached material should not have an emission colour defined initially").toBeUndefined();
    /* After mutation */
    expect(updatedDataEnabledValue, "Material data should have an emission color enabled after mutation").toBe(true);
    expect(updatedDataValue, "Material data should have an emission color defined after mutation").toBeDefined();
    expect(updatedBabylonColorValue, "Babylon material should have an emission color defined after mutation").toBeDefined();
    expect(updatedJsonValue, "Material asset should have an emission color defined after mutation").toBeDefined();
    expect(updatedCachedAsset.emissionColor, "Cached material should have an emission colour defined after mutation").toBeDefined();
  });

  test("Disabling emission color in material updates state correctly", async () => {
    // Setup
    const mockMaterial = createMockMaterial({
      emissionColor: { r: 255, g: 128, b: 0 },
    });
    let mockMaterialAssetDefinition!: MaterialAssetDefinition;
    const mock = new MockProject(({ manifest, asset, scene }) => ({
      manifest: manifest(),
      assets: [
        mockMaterialAssetDefinition = asset(AssetType.Material, 'materials/mock.pzmat', mockMaterial.data),
      ],
      scenes: [
        scene('sample'),
      ],
    }));
    const mockProjectController = await MockProjectController.create(mock);
    const mockMaterialEditorViewController = await MockMaterialEditorViewController.create(
      mockProjectController,
      mockMaterialAssetDefinition,
      mockMaterial.definition,
    );

    const initialDataEnabledValue = mockMaterialEditorViewController.materialData.emissionColorEnabled;
    const initialDataValue = mockMaterialEditorViewController.materialData.emissionColor;
    const initialBabylonColorValue = mockMaterialEditorViewController.materialInstance.emissionColor;
    const initialJsonValue = mockMaterialEditorViewController.materialJson.value.emissionColor;
    const initialCachedAsset = await mockProjectController.assetCache.loadAsset(mockMaterialEditorViewController.materialAssetData, mockMaterialEditorViewController.scene);

    const mutation = new SetMaterialEmissionColorEnabledMutation(false);

    // Test
    await mockMaterialEditorViewController.mutator.apply(mutation);

    const updatedDataEnabledValue = mockMaterialEditorViewController.materialData.emissionColorEnabled;
    const updatedDataValue = mockMaterialEditorViewController.materialData.emissionColor;
    const updatedBabylonColorValue = mockMaterialEditorViewController.materialInstance.emissionColor;
    const updatedJsonValue = mockMaterialEditorViewController.materialJson.value.emissionColor;
    const updatedCachedAsset = await mockProjectController.assetCache.loadAsset(mockMaterialEditorViewController.materialAssetData, mockMaterialEditorViewController.scene);

    // Assert
    /* Initial */
    expect(initialDataEnabledValue, "Material data should have an emission color enabled initially").toBe(true);
    expect(initialDataValue, "Material data should have an emission color defined initially").toBeDefined();
    expect(initialBabylonColorValue, "Babylon material should have an emission color defined initially").toBeDefined();
    expect(initialJsonValue, "Material asset should have an emission color defined initially").toBeDefined();
    expect(initialCachedAsset.emissionColor, "Cached material should have an emission colour defined initially").toBeDefined();
    /* After mutation */
    expect(updatedDataEnabledValue, "Material data should not have an emission color enabled after mutation").toBe(false);
    expect(updatedDataValue, "Material data should not have an emission color defined after mutation").toBeUndefined();
    expect(updatedBabylonColorValue, "Babylon material should not have an emission colour defined after mutation").toBeUndefined();
    expect(updatedJsonValue, "Material asset should not have an emission colour defined after mutation").toBeUndefined();
    expect(updatedCachedAsset.emissionColor, "Cached material should not have an emission colour defined after mutation").toBeUndefined();
  });
});
