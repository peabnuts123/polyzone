import { describe, test, expect } from 'vitest';

import { AssetType } from '@polyzone/runtime/src/cartridge';

import { MaterialAssetDefinition, TextureAssetDefinition } from '@lib/project';
import { createMockMaterial, MockMaterial } from '@test/integration/mock/material-editor/createMockMaterial';
import { MockProject } from '@test/integration/mock/project/MockProject';
import { MockAssets } from '@test/integration/mock/assets';
import { MockProjectController } from '@test/integration/mock/project/MockProjectController';
import { MockMaterialEditorViewController } from '@test/integration/mock/material-editor/MockMaterialEditorViewController';

import { SetMaterialDiffuseTextureMutation } from './SetMaterialDiffuseTextureMutation';

describe(SetMaterialDiffuseTextureMutation.name, () => {
  test("Setting diffuse texture on material with no texture updates state correctly", async () => {
    // Setup
    let mockTextureAssetDefinition!: TextureAssetDefinition;
    let mockMaterialAssetDefinition!: MaterialAssetDefinition;
    let mockMaterial!: MockMaterial;
    const mock = new MockProject(({ manifest, asset, scene }) => {
      // Must define texture first since it will be referenced by the mutation
      mockTextureAssetDefinition = asset(AssetType.Texture, 'textures/asphalt.png', MockAssets.textures.asphaltPng);
      mockMaterial = createMockMaterial({
        // @NOTE Empty material i.e. no diffuse texture setting
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

    // Capture initial state
    const initialDataValue = mockMaterialEditorViewController.materialData.diffuseTexture;
    const initialBabylonTextureValue = mockMaterialEditorViewController.materialInstance.diffuseTexture;
    const initialJsonValue = mockMaterialEditorViewController.materialJson.value.diffuseTextureAssetId;
    const initialCachedAsset = await mockProjectController.assetCache.loadAsset(mockMaterialEditorViewController.materialAssetData, mockMaterialEditorViewController.scene);

    // Enable diffuse texture (required for the mutation to work properly)
    mockMaterialEditorViewController.materialData.diffuseTextureEnabled = true;

    const mutation = new SetMaterialDiffuseTextureMutation(mockTextureAssetDefinition.id);

    // Test
    await mockMaterialEditorViewController.mutator.apply(mutation);

    const updatedDataValue = mockMaterialEditorViewController.materialData.diffuseTexture;
    const updatedBabylonTextureValue = mockMaterialEditorViewController.materialInstance.diffuseTexture;
    const updatedJsonValue = mockMaterialEditorViewController.materialJson.value.diffuseTextureAssetId;
    const updatedCachedAsset = await mockProjectController.assetCache.loadAsset(mockMaterialEditorViewController.materialAssetData, mockMaterialEditorViewController.scene);

    // Assert
    /* Initial state */
    expect(initialDataValue, "Material data should not have diffuse texture defined initially").toBeUndefined();
    expect(initialBabylonTextureValue, "Babylon material should not have diffuse texture defined initially").toBeUndefined();
    expect(initialJsonValue, "Material asset should not have diffuse texture defined initially").toBeUndefined();
    expect(initialCachedAsset.diffuseTexture, "Cached material should not have diffuse texture defined initially").toBeUndefined();

    /* After mutation */
    expect(updatedDataValue?.id, "Material data should have the correct diffuse texture after mutation").toBe(mockTextureAssetDefinition.id);
    expect(updatedBabylonTextureValue, "Babylon material should have diffuse texture defined after mutation").toBeDefined();
    expect(updatedJsonValue, "Material asset should have diffuse texture defined after mutation").toBe(mockTextureAssetDefinition.id);
    expect(updatedCachedAsset.diffuseTexture, "Cached material should have diffuse texture defined after mutation").toBeDefined();
  });

  test("Changing diffuse texture on material with existing texture updates state correctly", async () => {
    // Setup
    let mockTextureAssetDefinition1!: TextureAssetDefinition;
    let mockTextureAssetDefinition2!: TextureAssetDefinition;
    let mockMaterialAssetDefinition!: MaterialAssetDefinition;
    let mockMaterial!: MockMaterial;
    const mock = new MockProject(({ manifest, asset, scene }) => {
      // Define both textures
      mockTextureAssetDefinition1 = asset(AssetType.Texture, 'textures/asphalt.png', MockAssets.textures.asphaltPng);
      mockTextureAssetDefinition2 = asset(AssetType.Texture, 'textures/stones.png', MockAssets.textures.stonesPng);
      mockMaterial = createMockMaterial({
        diffuseTextureAssetId: mockTextureAssetDefinition1.id,
      });

      return {
        manifest: manifest(),
        assets: [
          mockTextureAssetDefinition1,
          mockTextureAssetDefinition2,
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

    // Capture initial state
    const initialDataValue = mockMaterialEditorViewController.materialData.diffuseTexture;
    const initialBabylonTextureValue = mockMaterialEditorViewController.materialInstance.diffuseTexture;
    const initialJsonValue = mockMaterialEditorViewController.materialJson.value.diffuseTextureAssetId;
    const initialCachedAsset = await mockProjectController.assetCache.loadAsset(mockMaterialEditorViewController.materialAssetData, mockMaterialEditorViewController.scene);

    const mutation = new SetMaterialDiffuseTextureMutation(mockTextureAssetDefinition2.id);

    // Test
    await mockMaterialEditorViewController.mutator.apply(mutation);

    const updatedDataValue = mockMaterialEditorViewController.materialData.diffuseTexture;
    const updatedBabylonTextureValue = mockMaterialEditorViewController.materialInstance.diffuseTexture;
    const updatedJsonValue = mockMaterialEditorViewController.materialJson.value.diffuseTextureAssetId;
    const updatedCachedAsset = await mockProjectController.assetCache.loadAsset(mockMaterialEditorViewController.materialAssetData, mockMaterialEditorViewController.scene);

    // Assert
    /* Initial state */
    expect(initialDataValue?.id, "Material data should have the initial diffuse texture").toBe(mockTextureAssetDefinition1.id);
    expect(initialBabylonTextureValue, "Babylon material should have diffuse texture defined initially").toBeDefined();
    expect(initialJsonValue, "Material asset should have the initial diffuse texture").toBe(mockTextureAssetDefinition1.id);
    expect(initialCachedAsset.diffuseTexture, "Cached material should have diffuse texture defined initially").toBeDefined();

    /* After mutation */
    expect(updatedDataValue?.id, "Material data should have the updated diffuse texture after mutation").toBe(mockTextureAssetDefinition2.id);
    expect(updatedBabylonTextureValue, "Babylon material should have diffuse texture defined after mutation").toBeDefined();
    expect(updatedJsonValue, "Material asset should have the updated diffuse texture after mutation").toBe(mockTextureAssetDefinition2.id);
    expect(updatedCachedAsset.diffuseTexture, "Cached material should have diffuse texture defined after mutation").toBeDefined();
  });

  test("Removing diffuse texture on material with existing texture updates state correctly", async () => {
    // Setup
    let mockTextureAssetDefinition!: TextureAssetDefinition;
    let mockMaterialAssetDefinition!: MaterialAssetDefinition;
    let mockMaterial!: MockMaterial;
    const mock = new MockProject(({ manifest, asset, scene }) => {
      // Define texture first since it will be referenced by the material
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

    // Capture initial state
    const initialDataValue = mockMaterialEditorViewController.materialData.diffuseTexture;
    const initialBabylonTextureValue = mockMaterialEditorViewController.materialInstance.diffuseTexture;
    const initialJsonValue = mockMaterialEditorViewController.materialJson.value.diffuseTextureAssetId;
    const initialCachedAsset = await mockProjectController.assetCache.loadAsset(mockMaterialEditorViewController.materialAssetData, mockMaterialEditorViewController.scene);

    const mutation = new SetMaterialDiffuseTextureMutation(undefined);

    // Test
    await mockMaterialEditorViewController.mutator.apply(mutation);

    const updatedDataValue = mockMaterialEditorViewController.materialData.diffuseTexture;
    const updatedBabylonTextureValue = mockMaterialEditorViewController.materialInstance.diffuseTexture;
    const updatedJsonValue = mockMaterialEditorViewController.materialJson.value.diffuseTextureAssetId;
    const updatedCachedAsset = await mockProjectController.assetCache.loadAsset(mockMaterialEditorViewController.materialAssetData, mockMaterialEditorViewController.scene);

    // Assert
    /* Initial state */
    expect(initialDataValue?.id, "Material data should have the initial diffuse texture").toBe(mockTextureAssetDefinition.id);
    expect(initialBabylonTextureValue, "Babylon material should have diffuse texture defined initially").toBeDefined();
    expect(initialJsonValue, "Material asset should have the initial diffuse texture").toBe(mockTextureAssetDefinition.id);
    expect(initialCachedAsset.diffuseTexture, "Cached material should have diffuse texture defined initially").toBeDefined();

    /* After mutation */
    expect(updatedDataValue, "Material data should not have diffuse texture defined after mutation").toBeUndefined();
    expect(updatedBabylonTextureValue, "Babylon material should not have diffuse texture defined after mutation").toBeUndefined();
    expect(updatedJsonValue, "Material asset should not have diffuse texture defined after mutation").toBeUndefined();
    expect(updatedCachedAsset.diffuseTexture, "Cached material should not have diffuse texture defined after mutation").toBeUndefined();
  });
});
