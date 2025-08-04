import { describe, test, expect } from 'vitest';

import { AssetType, MeshAssetMaterialOverrideReflection3x2Data, MeshAssetMaterialOverrideReflectionBoxNetData, MeshAssetMaterialOverrideReflectionSeparateData } from '@polyzone/runtime/src/cartridge';

import { MaterialAssetDefinition, TextureAssetDefinition } from '@lib/project/definition';
import { MockProject } from '@test/integration/mock/project/MockProject';
import { MockAssets } from '@test/integration/mock/assets';
import { MockMaterialEditorViewController } from '@test/integration/mock/material-editor/MockMaterialEditorViewController';
import { MockProjectController } from '@test/integration/mock/project/MockProjectController';
import { createMockMaterial, MockMaterial } from '@test/integration/mock/material-editor/createMockMaterial';

import { SetMaterialReflectionTypeMutation } from './SetMaterialReflectionTypeMutation';

describe(SetMaterialReflectionTypeMutation.name, () => {
  test("Setting reflection type from undefined to a specific type", async () => {
    // Setup
    let mockMaterialAssetDefinition!: MaterialAssetDefinition;
    let mockMaterial!: MockMaterial;
    const mock = new MockProject(({ manifest, asset, scene }) => {
      mockMaterial = createMockMaterial({
        // @NOTE Empty material i.e. no reflection setting
      });

      return {
        manifest: manifest(),
        assets: [
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

    // Enable reflection (required for the mutation to work properly)
    mockMaterialEditorViewController.materialData.reflectionEnabled = true;

    /* Capture initial state */
    const initialDataValue = mockMaterialEditorViewController.materialData.reflection;
    const initialBabylonValue = mockMaterialEditorViewController.materialInstance.reflectionTexture;
    const initialJsonValue = mockMaterialEditorViewController.materialJson.value.reflection;
    const initialCachedAsset = await mockProjectController.assetCache.loadAsset(mockMaterialEditorViewController.materialAssetData, mockMaterialEditorViewController.scene);

    const reflectionType = '3x2';
    const mutation = new SetMaterialReflectionTypeMutation(reflectionType);

    // Test
    await mockMaterialEditorViewController.mutator.apply(mutation);

    /* Capture updated state */
    const updatedDataValue = mockMaterialEditorViewController.materialData.reflection as MeshAssetMaterialOverrideReflection3x2Data;
    const updatedBabylonValue = mockMaterialEditorViewController.materialInstance.reflectionTexture;
    const updatedJsonValue = mockMaterialEditorViewController.materialJson.value.reflection;
    const updatedCachedAsset = await mockProjectController.assetCache.loadAsset(mockMaterialEditorViewController.materialAssetData, mockMaterialEditorViewController.scene);

    // Assert
    /* Initial state */
    expect(initialDataValue, "Material data should not have reflection defined initially").toBeUndefined();
    expect(initialBabylonValue, "Babylon material should not have reflection texture defined initially").toBeUndefined();
    expect(initialJsonValue, "Material asset should not have reflection defined initially").toBeUndefined();
    expect(initialCachedAsset.reflectionTexture, "Cached material should not have reflection texture defined initially").toBeUndefined();

    /* After mutation */
    expect(updatedDataValue.type, "Material data should have the correct reflection type after mutation").toBe(reflectionType);
    expect(updatedDataValue.texture, "Material data should not have texture defined after mutation").toBeUndefined();
    expect(updatedDataValue.strength, "Material data should not have strength defined after mutation").toBeUndefined();
    expect(updatedBabylonValue, "Babylon material should not have reflection texture defined after mutation").toBeUndefined();
    expect(updatedJsonValue?.type, "Material asset should have the correct reflection type after mutation").toBe(reflectionType);
    expect(updatedCachedAsset.reflectionTexture, "Cached material should not have reflection texture defined after mutation").toBeUndefined();
  });

  test("Changing reflection type between single-texture types preserves texture and strength", async () => {
    // Setup
    let mockTextureAssetDefinition!: TextureAssetDefinition;
    let mockMaterialAssetDefinition!: MaterialAssetDefinition;
    let mockMaterial!: MockMaterial;
    const initialReflectionType = '6x1';
    const newReflectionType = '3x2';
    const initialStrength = 0.7;
    const mock = new MockProject(({ manifest, asset, scene }) => {
      mockTextureAssetDefinition = asset(AssetType.Texture, 'textures/skybox.png', MockAssets.textures.stonesPng);
      mockMaterial = createMockMaterial({
        reflection: {
          type: initialReflectionType,
          strength: initialStrength,
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

    /* Capture initial state */
    const initialDataValue = mockMaterialEditorViewController.materialData.reflection as MeshAssetMaterialOverrideReflection3x2Data;
    const initialBabylonValue = mockMaterialEditorViewController.materialInstance.reflectionTexture;
    const initialJsonValue = mockMaterialEditorViewController.materialJson.value.reflection;
    const initialCachedAsset = await mockProjectController.assetCache.loadAsset(mockMaterialEditorViewController.materialAssetData, mockMaterialEditorViewController.scene);

    const mutation = new SetMaterialReflectionTypeMutation(newReflectionType);

    // Test
    await mockMaterialEditorViewController.mutator.apply(mutation);

    /* Capture updated state */
    const updatedDataValue = mockMaterialEditorViewController.materialData.reflection as MeshAssetMaterialOverrideReflection3x2Data;
    const updatedBabylonValue = mockMaterialEditorViewController.materialInstance.reflectionTexture;
    const updatedJsonValue = mockMaterialEditorViewController.materialJson.value.reflection;
    const updatedCachedAsset = await mockProjectController.assetCache.loadAsset(mockMaterialEditorViewController.materialAssetData, mockMaterialEditorViewController.scene);

    // Assert
    /* Initial state */
    expect(initialDataValue.type, "Material data should have the initial reflection type").toBe(initialReflectionType);
    expect(initialDataValue.texture?.id, "Material data should have the initial texture").toBe(mockTextureAssetDefinition.id);
    expect(initialDataValue.strength, "Material data should have the initial strength").toBe(initialStrength);
    expect(initialBabylonValue, "Babylon material should have reflection texture defined initially").toBeDefined();
    expect(initialJsonValue?.type, "Material asset should have the initial reflection type").toBe(initialReflectionType);
    expect(initialCachedAsset.reflectionTexture, "Cached material should have reflection texture defined initially").toBeDefined();

    /* After mutation */
    expect(updatedDataValue.type, "Material data should have the updated reflection type after mutation").toBe(newReflectionType);
    expect(updatedDataValue.texture?.id, "Material data should preserve the texture after mutation").toBe(mockTextureAssetDefinition.id);
    expect(updatedDataValue.strength, "Material data should preserve the strength after mutation").toBe(initialStrength);
    expect(updatedBabylonValue, "Babylon material should have reflection texture defined after mutation").toBeDefined();
    expect(updatedJsonValue?.type, "Material asset should have the updated reflection type after mutation").toBe(newReflectionType);
    expect(updatedCachedAsset.reflectionTexture, "Cached material should have reflection texture defined after mutation").toBeDefined();
  });

  test("Changing from single-texture type to separate type preserves first texture", async () => {
    // Setup
    let mockTextureAssetDefinition!: TextureAssetDefinition;
    let mockMaterialAssetDefinition!: MaterialAssetDefinition;
    let mockMaterial!: MockMaterial;
    const initialReflectionType = 'box-net';
    const newReflectionType = 'separate';
    const initialStrength = 0.8;
    const mock = new MockProject(({ manifest, asset, scene }) => {
      mockTextureAssetDefinition = asset(AssetType.Texture, 'textures/skybox.png', MockAssets.textures.stonesPng);
      mockMaterial = createMockMaterial({
        reflection: {
          type: initialReflectionType,
          strength: initialStrength,
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

    /* Capture initial state */
    const initialDataValue = mockMaterialEditorViewController.materialData.reflection as MeshAssetMaterialOverrideReflectionBoxNetData;
    const initialBabylonValue = mockMaterialEditorViewController.materialInstance.reflectionTexture;
    const initialJsonValue = mockMaterialEditorViewController.materialJson.value.reflection;
    const initialCachedAsset = await mockProjectController.assetCache.loadAsset(mockMaterialEditorViewController.materialAssetData, mockMaterialEditorViewController.scene);

    const mutation = new SetMaterialReflectionTypeMutation(newReflectionType);

    // Test
    await mockMaterialEditorViewController.mutator.apply(mutation);

    /* Capture updated state */
    const updatedDataValue = mockMaterialEditorViewController.materialData.reflection as MeshAssetMaterialOverrideReflectionSeparateData;
    const updatedBabylonValue = mockMaterialEditorViewController.materialInstance.reflectionTexture;
    const updatedJsonValue = mockMaterialEditorViewController.materialJson.value.reflection;
    const updatedCachedAsset = await mockProjectController.assetCache.loadAsset(mockMaterialEditorViewController.materialAssetData, mockMaterialEditorViewController.scene);

    // Assert
    /* Initial state */
    expect(initialDataValue.type, "Material data should have the initial reflection type").toBe(initialReflectionType);
    expect(initialDataValue.texture?.id, "Material data should have the initial texture").toBe(mockTextureAssetDefinition.id);
    expect(initialDataValue.strength, "Material data should have the initial strength").toBe(initialStrength);
    expect(initialBabylonValue, "Babylon material should have reflection texture defined initially").toBeDefined();
    expect(initialJsonValue?.type, "Material asset should have the initial reflection type").toBe(initialReflectionType);
    expect(initialCachedAsset.reflectionTexture, "Cached material should have reflection texture defined initially").toBeDefined();

    /* After mutation */
    expect(updatedDataValue.type, "Material data should have the updated reflection type after mutation").toBe(newReflectionType);
    expect(updatedDataValue.pxTexture?.id, "Material data should have texture moved to pxTexture after mutation").toBe(mockTextureAssetDefinition.id);
    expect(updatedDataValue.strength, "Material data should preserve the strength after mutation").toBe(initialStrength);
    expect(updatedBabylonValue, "Babylon material should not have reflection texture defined after mutation (only 1 of 6 textures set)").toBeUndefined();
    expect(updatedJsonValue?.type, "Material asset should have the updated reflection type after mutation").toBe(newReflectionType);
    expect(updatedCachedAsset.reflectionTexture, "Cached material should not have reflection texture defined after mutation (only 1 of 6 textures set)").toBeUndefined();
  });

  test("Changing from separate type to single-texture type preserves first texture", async () => {
    // Setup
    let mockTextureAssetDefinition!: TextureAssetDefinition;
    let mockMaterialAssetDefinition!: MaterialAssetDefinition;
    let mockMaterial!: MockMaterial;
    const initialReflectionType = 'separate';
    const newReflectionType = '3x2';
    const initialStrength = 0.6;
    const mock = new MockProject(({ manifest, asset, scene }) => {
      // @NOTE Use the same texture asset for all 6 separate texture references
      mockTextureAssetDefinition = asset(AssetType.Texture, 'textures/skybox.png', MockAssets.textures.stonesPng);
      mockMaterial = createMockMaterial({
        reflection: {
          type: initialReflectionType,
          strength: initialStrength,
          pxTextureAssetId: mockTextureAssetDefinition.id,
          nxTextureAssetId: mockTextureAssetDefinition.id,
          pyTextureAssetId: mockTextureAssetDefinition.id,
          nyTextureAssetId: mockTextureAssetDefinition.id,
          pzTextureAssetId: mockTextureAssetDefinition.id,
          nzTextureAssetId: mockTextureAssetDefinition.id,
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

    /* Capture initial state */
    const initialDataValue = mockMaterialEditorViewController.materialData.reflection as MeshAssetMaterialOverrideReflectionSeparateData;
    const initialBabylonValue = mockMaterialEditorViewController.materialInstance.reflectionTexture;
    const initialJsonValue = mockMaterialEditorViewController.materialJson.value.reflection;
    const initialCachedAsset = await mockProjectController.assetCache.loadAsset(mockMaterialEditorViewController.materialAssetData, mockMaterialEditorViewController.scene);

    const mutation = new SetMaterialReflectionTypeMutation(newReflectionType);

    // Test
    await mockMaterialEditorViewController.mutator.apply(mutation);

    /* Capture updated state */
    const updatedDataValue = mockMaterialEditorViewController.materialData.reflection as MeshAssetMaterialOverrideReflection3x2Data;
    const updatedBabylonValue = mockMaterialEditorViewController.materialInstance.reflectionTexture;
    const updatedJsonValue = mockMaterialEditorViewController.materialJson.value.reflection;
    const updatedCachedAsset = await mockProjectController.assetCache.loadAsset(mockMaterialEditorViewController.materialAssetData, mockMaterialEditorViewController.scene);

    // Assert
    /* Initial state */
    expect(initialDataValue.type, "Material data should have the initial reflection type").toBe(initialReflectionType);
    expect(initialDataValue.pxTexture?.id, "Material data should have the initial pxTexture").toBe(mockTextureAssetDefinition.id);
    expect(initialDataValue.nxTexture?.id, "Material data should have the initial nxTexture").toBe(mockTextureAssetDefinition.id);
    expect(initialDataValue.strength, "Material data should have the initial strength").toBe(initialStrength);
    expect(initialBabylonValue, "Babylon material should have reflection texture defined initially (all 6 textures defined)").toBeDefined();
    expect(initialJsonValue?.type, "Material asset should have the initial reflection type").toBe(initialReflectionType);
    expect(initialCachedAsset.reflectionTexture, "Cached material should have reflection texture defined initially").toBeDefined();

    /* After mutation */
    expect(updatedDataValue.type, "Material data should have the updated reflection type after mutation").toBe(newReflectionType);
    expect(updatedDataValue.texture?.id, "Material data should have pxTexture moved to texture after mutation").toBe(mockTextureAssetDefinition.id);
    expect(updatedDataValue.strength, "Material data should preserve the strength after mutation").toBe(initialStrength);
    expect(updatedBabylonValue, "Babylon material should have reflection texture defined after mutation").toBeDefined();
    expect(updatedJsonValue?.type, "Material asset should have the updated reflection type after mutation").toBe(newReflectionType);
    expect(updatedCachedAsset.reflectionTexture, "Cached material should have reflection texture defined after mutation").toBeDefined();
  });

  test("Setting reflection type to undefined removes all reflection config", async () => {
    // Setup
    let mockTextureAssetDefinition!: TextureAssetDefinition;
    let mockMaterialAssetDefinition!: MaterialAssetDefinition;
    let mockMaterial!: MockMaterial;
    const initialReflectionType = '3x2';
    const initialStrength = 0.9;
    const mock = new MockProject(({ manifest, asset, scene }) => {
      mockTextureAssetDefinition = asset(AssetType.Texture, 'textures/skybox.png', MockAssets.textures.stonesPng);
      mockMaterial = createMockMaterial({
        reflection: {
          type: initialReflectionType,
          strength: initialStrength,
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

    /* Capture initial state */
    const initialDataValue = mockMaterialEditorViewController.materialData.reflection as MeshAssetMaterialOverrideReflection3x2Data;
    const initialBabylonValue = mockMaterialEditorViewController.materialInstance.reflectionTexture;
    const initialJsonValue = mockMaterialEditorViewController.materialJson.value.reflection;
    const initialCachedAsset = await mockProjectController.assetCache.loadAsset(mockMaterialEditorViewController.materialAssetData, mockMaterialEditorViewController.scene);

    const mutation = new SetMaterialReflectionTypeMutation(undefined);

    // Test
    await mockMaterialEditorViewController.mutator.apply(mutation);

    /* Capture updated state */
    const updatedDataValue = mockMaterialEditorViewController.materialData.reflection;
    const updatedBabylonValue = mockMaterialEditorViewController.materialInstance.reflectionTexture;
    const updatedJsonValue = mockMaterialEditorViewController.materialJson.value.reflection;
    const updatedCachedAsset = await mockProjectController.assetCache.loadAsset(mockMaterialEditorViewController.materialAssetData, mockMaterialEditorViewController.scene);

    // Assert
    /* Initial state */
    expect(initialDataValue.type, "Material data should have the initial reflection type").toBe(initialReflectionType);
    expect(initialDataValue.texture?.id, "Material data should have the initial texture").toBe(mockTextureAssetDefinition.id);
    expect(initialDataValue.strength, "Material data should have the initial strength").toBe(initialStrength);
    expect(initialBabylonValue, "Babylon material should have reflection texture defined initially").toBeDefined();
    expect(initialJsonValue?.type, "Material asset should have the initial reflection type").toBe(initialReflectionType);
    expect(initialCachedAsset.reflectionTexture, "Cached material should have reflection texture defined initially").toBeDefined();

    /* After mutation */
    expect(updatedDataValue, "Material data should not have reflection defined after mutation").toBeUndefined();
    expect(updatedBabylonValue, "Babylon material should not have reflection texture defined after mutation").toBeUndefined();
    expect(updatedJsonValue, "Material asset should not have reflection defined after mutation").toBeUndefined();
    expect(updatedCachedAsset.reflectionTexture, "Cached material should not have reflection texture defined after mutation").toBeUndefined();
  });
});
