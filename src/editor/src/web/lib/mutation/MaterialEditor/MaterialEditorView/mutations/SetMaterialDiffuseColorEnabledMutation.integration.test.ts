import { describe, test, expect } from 'vitest';

import { AssetType } from '@polyzone/runtime/src/cartridge';

import { MaterialAssetDefinition } from '@lib/project';
import { createMockMaterial } from '@test/integration/mock/material-editor/createMockMaterial';
import { MockProject } from '@test/integration/mock/project/MockProject';
import { MockProjectController } from '@test/integration/mock/project/MockProjectController';
import { MockMaterialEditorViewController } from '@test/integration/mock/material-editor/MockMaterialEditorViewController';

import { SetMaterialDiffuseColorEnabledMutation } from './SetMaterialDiffuseColorEnabledMutation';


describe(SetMaterialDiffuseColorEnabledMutation.name, () => {
  test("Enabling diffuse color in material updates state correctly", async () => {
    // Setup
    const mockMaterial = createMockMaterial({
      // @NOTE Empty material i.e. no diffuse color setting
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

    const initialDataEnabledValue = mockMaterialEditorViewController.materialData.diffuseColorEnabled;
    const initialDataValue = mockMaterialEditorViewController.materialData.diffuseColor;
    const initialBabylonColorValue = mockMaterialEditorViewController.materialInstance.diffuseColor;
    const initialJsonValue = mockMaterialEditorViewController.materialJson.value.diffuseColor;
    const initialCachedAsset = await mockProjectController.assetCache.loadAsset(mockMaterialEditorViewController.materialAssetData, mockMaterialEditorViewController.scene);

    const mutation = new SetMaterialDiffuseColorEnabledMutation(true);

    // Test
    await mockMaterialEditorViewController.mutator.apply(mutation);

    const updatedDataEnabledValue = mockMaterialEditorViewController.materialData.diffuseColorEnabled;
    const updatedDataValue = mockMaterialEditorViewController.materialData.diffuseColor;
    const updatedBabylonColorValue = mockMaterialEditorViewController.materialInstance.diffuseColor;
    const updatedJsonValue = mockMaterialEditorViewController.materialJson.value.diffuseColor;
    const updatedCachedAsset = await mockProjectController.assetCache.loadAsset(mockMaterialEditorViewController.materialAssetData, mockMaterialEditorViewController.scene);

    // Assert
    /* Initial */
    expect(initialDataEnabledValue, "Material data should not have a diffuse color enabled initially").toBe(false);
    expect(initialDataValue, "Material data should not have a diffuse color defined initially").toBeUndefined();
    expect(initialBabylonColorValue, "Babylon material should not have a diffuse colour defined initially").toBeUndefined();
    expect(initialJsonValue, "Material asset should not have a diffuse colour defined initially").toBeUndefined();
    expect(initialCachedAsset.diffuseColor, "Cached material should not have a diffuse colour defined initially").toBeUndefined();
    /* After mutation */
    expect(updatedDataEnabledValue, "Material data should have a diffuse color enabled after mutation").toBe(true);
    expect(updatedDataValue, "Material data should have a diffuse color defined after mutation").toBeDefined();
    expect(updatedBabylonColorValue, "Babylon material should have a diffuse color defined after mutation").toBeDefined();
    expect(updatedJsonValue, "Material asset should have a diffuse color defined after mutation").toBeDefined();
    expect(updatedCachedAsset.diffuseColor, "Cached material should have a diffuse colour defined after mutation").toBeDefined();
  });

  test("Disabling diffuse color in material updates state correctly", async () => {
    // Setup
    const mockMaterial = createMockMaterial({
      diffuseColor: { r: 255, g: 0, b: 255 },
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

    const initialDataEnabledValue = mockMaterialEditorViewController.materialData.diffuseColorEnabled;
    const initialDataValue = mockMaterialEditorViewController.materialData.diffuseColor;
    const initialBabylonColorValue = mockMaterialEditorViewController.materialInstance.diffuseColor;
    const initialJsonValue = mockMaterialEditorViewController.materialJson.value.diffuseColor;
    const initialCachedAsset = await mockProjectController.assetCache.loadAsset(mockMaterialEditorViewController.materialAssetData, mockMaterialEditorViewController.scene);

    const mutation = new SetMaterialDiffuseColorEnabledMutation(false);

    // Test
    await mockMaterialEditorViewController.mutator.apply(mutation);

    const updatedDataEnabledValue = mockMaterialEditorViewController.materialData.diffuseColorEnabled;
    const updatedDataValue = mockMaterialEditorViewController.materialData.diffuseColor;
    const updatedBabylonColorValue = mockMaterialEditorViewController.materialInstance.diffuseColor;
    const updatedJsonValue = mockMaterialEditorViewController.materialJson.value.diffuseColor;
    const updatedCachedAsset = await mockProjectController.assetCache.loadAsset(mockMaterialEditorViewController.materialAssetData, mockMaterialEditorViewController.scene);

    // Assert
    /* Initial */
    expect(initialDataEnabledValue, "Material data should have a diffuse color enabled initially").toBe(true);
    expect(initialDataValue, "Material data should have a diffuse color defined initially").toBeDefined();
    expect(initialBabylonColorValue, "Babylon material should have a diffuse color defined initially").toBeDefined();
    expect(initialJsonValue, "Material asset should have a diffuse color defined initially").toBeDefined();
    expect(initialCachedAsset.diffuseColor, "Cached material should have a diffuse colour defined initially").toBeDefined();
    /* After mutation */
    expect(updatedDataEnabledValue, "Material data should not have a diffuse color enabled after mutation").toBe(false);
    expect(updatedDataValue, "Material data should not have a diffuse color defined after mutation").toBeUndefined();
    expect(updatedBabylonColorValue, "Babylon material should not have a diffuse colour defined after mutation").toBeUndefined();
    expect(updatedJsonValue, "Material asset should not have a diffuse colour defined after mutation").toBeUndefined();
    expect(updatedCachedAsset.diffuseColor, "Cached material should not have a diffuse colour defined after mutation").toBeUndefined();
  });
});
