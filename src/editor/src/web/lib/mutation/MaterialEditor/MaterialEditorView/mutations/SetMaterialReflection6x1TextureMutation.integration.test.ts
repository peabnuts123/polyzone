import { CubeTexture } from '@babylonjs/core/Materials/Textures/cubeTexture';
import { describe, test, expect } from 'vitest';

import { AssetType, ITextureAssetData, MeshAssetMaterialOverrideReflection6x1Data, MeshAssetMaterialOverrideReflection6x1Definition } from '@polyzone/runtime/src/cartridge';
import { MaterialAsset } from '@polyzone/runtime/src/world';

import { MaterialAssetDefinition, TextureAssetDefinition } from '@lib/project/definition';
import { MockProject } from '@test/integration/mock/project/MockProject';
import { MockAssets } from '@test/integration/mock/assets';
import { MockMaterialEditorViewController } from '@test/integration/mock/material-editor/MockMaterialEditorViewController';
import { MockProjectController } from '@test/integration/mock/project/MockProjectController';
import { createMockMaterial, MockMaterial } from '@test/integration/mock/material-editor/createMockMaterial';

import { SetMaterialReflection6x1TextureMutation } from './SetMaterialReflection6x1TextureMutation';

describe(SetMaterialReflection6x1TextureMutation.name, () => {
  test("Setting reflection texture on material with 6x1 reflection type but no texture updates state correctly", async () => {
    // Setup
    let mockTextureAssetDefinition!: TextureAssetDefinition;
    let mockMaterialAssetDefinition!: MaterialAssetDefinition;
    let mockMaterial!: MockMaterial;
    const mock = new MockProject(({ manifest, asset, scene }) => {
      mockTextureAssetDefinition = asset(AssetType.Texture, 'textures/skybox.png', MockAssets.textures.stonesPng);
      mockMaterial = createMockMaterial({
        reflection: {
          type: '6x1',
          strength: 1.0,
          // @NOTE No textureAssetId set initially
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

    /* Test selector utilities */
    function getDataValue(): ITextureAssetData | undefined {
      return (mockMaterialEditorViewController.materialData.reflection as MeshAssetMaterialOverrideReflection6x1Data)?.texture;
    }
    function getBabylonValue(): CubeTexture | undefined {
      return mockMaterialEditorViewController.materialInstance.reflectionTexture;
    }
    function getJsonValue(): string | undefined {
      return (mockMaterialEditorViewController.materialJson.value.reflection as MeshAssetMaterialOverrideReflection6x1Definition)?.textureAssetId;
    }
    async function getCachedAssetReflectionTexture(): Promise<CubeTexture | undefined> {
      const asset = await mockProjectController.assetCache.loadAsset(mockMaterialEditorViewController.materialAssetData, mockMaterialEditorViewController.scene) as MaterialAsset;
      return asset.reflectionTexture;
    }

    /* Capture initial state */
    const initialDataValue = getDataValue();
    const initialBabylonValue = getBabylonValue();
    const initialJsonValue = getJsonValue();
    const initialCachedAssetReflectionTexture = await getCachedAssetReflectionTexture();

    const mutation = new SetMaterialReflection6x1TextureMutation(mockTextureAssetDefinition.id);

    // Test
    await mockMaterialEditorViewController.mutator.apply(mutation);

    /* Capture updated state */
    const updatedDataValue = getDataValue();
    const updatedBabylonValue = getBabylonValue();
    const updatedJsonValue = getJsonValue();
    const updatedCachedAssetReflectionTexture = await getCachedAssetReflectionTexture();

    // Assert
    /* Initial state */
    expect(initialDataValue, "Material data should not have reflection texture defined initially").toBeUndefined();
    expect(initialBabylonValue, "Babylon material should not have reflection texture defined initially").toBeUndefined();
    expect(initialJsonValue, "Material asset should not have reflection texture defined initially").toBeUndefined();
    expect(initialCachedAssetReflectionTexture, "Cached material should not have reflection texture defined initially").toBeUndefined();

    /* After mutation */
    expect(updatedDataValue?.id, "Material data should have the correct reflection texture after mutation").toBe(mockTextureAssetDefinition.id);
    expect(updatedBabylonValue, "Babylon material should have reflection texture defined after mutation").toBeDefined();
    expect(updatedJsonValue, "Material asset should have reflection texture defined after mutation").toBe(mockTextureAssetDefinition.id);
    expect(updatedCachedAssetReflectionTexture, "Cached material should have reflection texture defined after mutation").toBeDefined();
  });

  test("Changing reflection texture on material with existing 6x1 texture updates state correctly", async () => {
    // Setup
    let mockTextureAssetDefinition1!: TextureAssetDefinition;
    let mockTextureAssetDefinition2!: TextureAssetDefinition;
    let mockMaterialAssetDefinition!: MaterialAssetDefinition;
    let mockMaterial!: MockMaterial;
    const mock = new MockProject(({ manifest, asset, scene }) => {
      mockTextureAssetDefinition1 = asset(AssetType.Texture, 'textures/skybox1.png', MockAssets.textures.stonesPng);
      mockTextureAssetDefinition2 = asset(AssetType.Texture, 'textures/skybox2.png', MockAssets.textures.asphaltPng);
      mockMaterial = createMockMaterial({
        reflection: {
          type: '6x1',
          strength: 1.0,
          textureAssetId: mockTextureAssetDefinition1.id,
        },
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

    /* Test selector utilities */
    function getDataValue(): ITextureAssetData | undefined {
      return (mockMaterialEditorViewController.materialData.reflection as MeshAssetMaterialOverrideReflection6x1Data)?.texture;
    }
    function getBabylonValue(): CubeTexture | undefined {
      return mockMaterialEditorViewController.materialInstance.reflectionTexture;
    }
    function getJsonValue(): string | undefined {
      return (mockMaterialEditorViewController.materialJson.value.reflection as MeshAssetMaterialOverrideReflection6x1Definition)?.textureAssetId;
    }
    async function getCachedAssetReflectionTexture(): Promise<CubeTexture | undefined> {
      const asset = await mockProjectController.assetCache.loadAsset(mockMaterialEditorViewController.materialAssetData, mockMaterialEditorViewController.scene) as MaterialAsset;
      return asset.reflectionTexture;
    }

    /* Capture initial state */
    const initialDataValue = getDataValue();
    const initialBabylonValue = getBabylonValue();
    const initialJsonValue = getJsonValue();
    const initialCachedAssetReflectionTexture = await getCachedAssetReflectionTexture();

    const mutation = new SetMaterialReflection6x1TextureMutation(mockTextureAssetDefinition2.id);

    // Test
    await mockMaterialEditorViewController.mutator.apply(mutation);

    /* Capture updated state */
    const updatedDataValue = getDataValue();
    const updatedBabylonValue = getBabylonValue();
    const updatedJsonValue = getJsonValue();
    const updatedCachedAssetReflectionTexture = await getCachedAssetReflectionTexture();

    // Assert
    /* Initial state */
    expect(initialDataValue?.id, "Material data should have the initial reflection texture").toBe(mockTextureAssetDefinition1.id);
    expect(initialBabylonValue, "Babylon material should have reflection texture defined initially").toBeDefined();
    expect(initialJsonValue, "Material asset should have the initial reflection texture").toBe(mockTextureAssetDefinition1.id);
    expect(initialCachedAssetReflectionTexture, "Cached material should have reflection texture defined initially").toBeDefined();

    /* After mutation */
    expect(updatedDataValue?.id, "Material data should have the updated reflection texture after mutation").toBe(mockTextureAssetDefinition2.id);
    expect(updatedBabylonValue, "Babylon material should have reflection texture defined after mutation").toBeDefined();
    expect(updatedJsonValue, "Material asset should have the updated reflection texture after mutation").toBe(mockTextureAssetDefinition2.id);
    expect(updatedCachedAssetReflectionTexture, "Cached material should have reflection texture defined after mutation").toBeDefined();
  });

  test("Removing reflection texture on material with existing 6x1 texture updates state correctly", async () => {
    // Setup
    let mockTextureAssetDefinition!: TextureAssetDefinition;
    let mockMaterialAssetDefinition!: MaterialAssetDefinition;
    let mockMaterial!: MockMaterial;
    const mock = new MockProject(({ manifest, asset, scene }) => {
      mockTextureAssetDefinition = asset(AssetType.Texture, 'textures/skybox.png', MockAssets.textures.stonesPng);
      mockMaterial = createMockMaterial({
        reflection: {
          type: '6x1',
          strength: 1.0,
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

    /* Test selector utilities */
    function getDataValue(): ITextureAssetData | undefined {
      return (mockMaterialEditorViewController.materialData.reflection as MeshAssetMaterialOverrideReflection6x1Data)?.texture;
    }
    function getBabylonValue(): CubeTexture | undefined {
      return mockMaterialEditorViewController.materialInstance.reflectionTexture;
    }
    function getJsonValue(): string | undefined {
      return (mockMaterialEditorViewController.materialJson.value.reflection as MeshAssetMaterialOverrideReflection6x1Definition)?.textureAssetId;
    }
    async function getCachedAssetReflectionTexture(): Promise<CubeTexture | undefined> {
      const asset = await mockProjectController.assetCache.loadAsset(mockMaterialEditorViewController.materialAssetData, mockMaterialEditorViewController.scene) as MaterialAsset;
      return asset.reflectionTexture;
    }

    /* Capture initial state */
    const initialDataValue = getDataValue();
    const initialBabylonValue = getBabylonValue();
    const initialJsonValue = getJsonValue();
    const initialCachedAssetReflectionTexture = await getCachedAssetReflectionTexture();

    const mutation = new SetMaterialReflection6x1TextureMutation(undefined);

    // Test
    await mockMaterialEditorViewController.mutator.apply(mutation);

    /* Capture updated state */
    const updatedDataValue = getDataValue();
    const updatedBabylonValue = getBabylonValue();
    const updatedJsonValue = getJsonValue();
    const updatedCachedAssetReflectionTexture = await getCachedAssetReflectionTexture();

    // Assert
    /* Initial state */
    expect(initialDataValue?.id, "Material data should have the initial reflection texture").toBe(mockTextureAssetDefinition.id);
    expect(initialBabylonValue, "Babylon material should have reflection texture defined initially").toBeDefined();
    expect(initialJsonValue, "Material asset should have the initial reflection texture").toBe(mockTextureAssetDefinition.id);
    expect(initialCachedAssetReflectionTexture, "Cached material should have reflection texture defined initially").toBeDefined();

    /* After mutation */
    expect(updatedDataValue, "Material data should not have reflection texture defined after mutation").toBeUndefined();
    expect(updatedBabylonValue, "Babylon material should not have reflection texture defined after mutation").toBeUndefined();
    expect(updatedJsonValue, "Material asset should not have reflection texture defined after mutation").toBeUndefined();
    expect(updatedCachedAssetReflectionTexture, "Cached material should not have reflection texture defined after mutation").toBeUndefined();
  });

  test("Attempting to set reflection texture on material without 6x1 reflection type throws error", async () => {
    // Setup
    let mockTextureAssetDefinition!: TextureAssetDefinition;
    let mockMaterialAssetDefinition!: MaterialAssetDefinition;
    let mockMaterial!: MockMaterial;
    const mock = new MockProject(({ manifest, asset, scene }) => {
      mockTextureAssetDefinition = asset(AssetType.Texture, 'textures/skybox.png', MockAssets.textures.stonesPng);
      mockMaterial = createMockMaterial({
        // @NOTE No reflection config - material doesn't have 6x1 reflection type set
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

    const mutation = new SetMaterialReflection6x1TextureMutation(mockTextureAssetDefinition.id);

    // Test
    const testFunc = async (): Promise<void> => {
      return mockMaterialEditorViewController.mutator.apply(mutation);
    };

    // Assert
    await expect(testFunc, "Should throw error when trying to set 6x1 reflection texture on material without 6x1 reflection type")
      .rejects.toThrow("Cannot set reflection texture for material - the material doesn't have the correct reflection type set");
  });

  test("Attempting to set reflection texture on material with different reflection type throws error", async () => {
    // Setup
    let mockTextureAssetDefinition!: TextureAssetDefinition;
    let mockMaterialAssetDefinition!: MaterialAssetDefinition;
    let mockMaterial!: MockMaterial;
    const mock = new MockProject(({ manifest, asset, scene }) => {
      mockTextureAssetDefinition = asset(AssetType.Texture, 'textures/skybox.png', MockAssets.textures.stonesPng);
      mockMaterial = createMockMaterial({
        reflection: {
          type: '3x2', // @NOTE Different reflection type
          strength: 1.0,
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

    const mutation = new SetMaterialReflection6x1TextureMutation(mockTextureAssetDefinition.id);

    // Test
    const testFunc = async (): Promise<void> => {
      return mockMaterialEditorViewController.mutator.apply(mutation);
    };

    // Assert
    await expect(testFunc, "Should throw error when trying to set 6x1 reflection texture on material with different reflection type")
      .rejects.toThrow("Cannot set reflection texture for material - the material doesn't have the correct reflection type set");
  });
});
