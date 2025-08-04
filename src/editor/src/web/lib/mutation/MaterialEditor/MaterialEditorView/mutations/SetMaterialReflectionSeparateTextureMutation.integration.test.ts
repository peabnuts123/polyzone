import { CubeTexture } from '@babylonjs/core/Materials/Textures/cubeTexture';
import { describe, test, expect } from 'vitest';

import { AssetType, ITextureAssetData, MeshAssetMaterialOverrideReflectionSeparateData, MeshAssetMaterialOverrideReflectionSeparateDefinition } from '@polyzone/runtime/src/cartridge';
import { MaterialAsset } from '@polyzone/runtime/src/world';

import { MaterialAssetDefinition, TextureAssetDefinition } from '@lib/project/definition';
import { MockProject } from '@test/integration/mock/project/MockProject';
import { MockAssets } from '@test/integration/mock/assets';
import { MockMaterialEditorViewController } from '@test/integration/mock/material-editor/MockMaterialEditorViewController';
import { MockProjectController } from '@test/integration/mock/project/MockProjectController';
import { createMockMaterial, MockMaterial } from '@test/integration/mock/material-editor/createMockMaterial';
import { ReflectionSeparateTexture } from '@lib/mutation/MaterialEditor/ModelEditorView/mutations/SetModelMaterialOverrideReflectionSeparateTextureMutation';

import { SetMaterialReflectionSeparateTextureMutation } from './SetMaterialReflectionSeparateTextureMutation';

describe(SetMaterialReflectionSeparateTextureMutation.name, () => {
  test("Setting positive X reflection texture on material with separate reflection type but no texture updates state correctly", async () => {
    // Setup
    let mockTextureAssetDefinition!: TextureAssetDefinition;
    let mockMaterialAssetDefinition!: MaterialAssetDefinition;
    let mockMaterial!: MockMaterial;
    const mock = new MockProject(({ manifest, asset, scene }) => {
      mockTextureAssetDefinition = asset(AssetType.Texture, 'textures/skybox.png', MockAssets.textures.stonesPng);
      mockMaterial = createMockMaterial({
        reflection: {
          type: 'separate',
          strength: 1.0,
          // @NOTE No texture asset IDs set initially
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
      return (mockMaterialEditorViewController.materialData.reflection as MeshAssetMaterialOverrideReflectionSeparateData)?.pxTexture;
    }
    function getBabylonValue(): CubeTexture | undefined {
      return mockMaterialEditorViewController.materialInstance.reflectionTexture;
    }
    function getJsonValue(): string | undefined {
      return (mockMaterialEditorViewController.materialJson.value.reflection as MeshAssetMaterialOverrideReflectionSeparateDefinition)?.pxTextureAssetId;
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

    const mutation = new SetMaterialReflectionSeparateTextureMutation(mockTextureAssetDefinition.id, ReflectionSeparateTexture.positiveX);

    // Test
    await mockMaterialEditorViewController.mutator.apply(mutation);

    /* Capture updated state */
    const updatedDataValue = getDataValue();
    const updatedBabylonValue = getBabylonValue();
    const updatedJsonValue = getJsonValue();
    const updatedCachedAssetReflectionTexture = await getCachedAssetReflectionTexture();

    // Assert
    /* Initial state */
    expect(initialDataValue, "Material data should not have positive X reflection texture defined initially").toBeUndefined();
    expect(initialBabylonValue, "Babylon material should not have reflection texture defined initially (since not all 6 textures are set)").toBeUndefined();
    expect(initialJsonValue, "Material asset should not have positive X reflection texture defined initially").toBeUndefined();
    expect(initialCachedAssetReflectionTexture, "Cached material should not have reflection texture defined initially").toBeUndefined();

    /* After mutation */
    expect(updatedDataValue?.id, "Material data should have the correct positive X reflection texture after mutation").toBe(mockTextureAssetDefinition.id);
    expect(updatedBabylonValue, "Babylon material should still not have reflection texture defined after mutation (since only 1 of 6 textures is set)").toBeUndefined();
    expect(updatedJsonValue, "Material asset should have positive X reflection texture defined after mutation").toBe(mockTextureAssetDefinition.id);
    expect(updatedCachedAssetReflectionTexture, "Cached material should still not have reflection texture defined after mutation").toBeUndefined();
  });

  test("Setting positive X reflection texture on material with all 6 separate textures already set updates state correctly", async () => {
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
          type: 'separate',
          strength: 1.0,
          pxTextureAssetId: mockTextureAssetDefinition1.id,
          nxTextureAssetId: mockTextureAssetDefinition1.id,
          pyTextureAssetId: mockTextureAssetDefinition1.id,
          nyTextureAssetId: mockTextureAssetDefinition1.id,
          pzTextureAssetId: mockTextureAssetDefinition1.id,
          nzTextureAssetId: mockTextureAssetDefinition1.id,
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
      return (mockMaterialEditorViewController.materialData.reflection as MeshAssetMaterialOverrideReflectionSeparateData)?.pxTexture;
    }
    function getBabylonValue(): CubeTexture | undefined {
      return mockMaterialEditorViewController.materialInstance.reflectionTexture;
    }
    function getJsonValue(): string | undefined {
      return (mockMaterialEditorViewController.materialJson.value.reflection as MeshAssetMaterialOverrideReflectionSeparateDefinition)?.pxTextureAssetId;
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

    const mutation = new SetMaterialReflectionSeparateTextureMutation(mockTextureAssetDefinition2.id, ReflectionSeparateTexture.positiveX);

    // Test
    await mockMaterialEditorViewController.mutator.apply(mutation);

    /* Capture updated state */
    const updatedDataValue = getDataValue();
    const updatedBabylonValue = getBabylonValue();
    const updatedJsonValue = getJsonValue();
    const updatedCachedAssetReflectionTexture = await getCachedAssetReflectionTexture();

    // Assert
    /* Initial state */
    expect(initialDataValue?.id, "Material data should have the initial positive X reflection texture").toBe(mockTextureAssetDefinition1.id);
    expect(initialBabylonValue, "Babylon material should have reflection texture defined initially (since all 6 textures are set)").toBeDefined();
    expect(initialJsonValue, "Material asset should have the initial positive X reflection texture").toBe(mockTextureAssetDefinition1.id);
    expect(initialCachedAssetReflectionTexture, "Cached material should have reflection texture defined initially").toBeDefined();

    /* After mutation */
    expect(updatedDataValue?.id, "Material data should have the updated positive X reflection texture after mutation").toBe(mockTextureAssetDefinition2.id);
    expect(updatedBabylonValue, "Babylon material should have reflection texture defined after mutation (since all 6 textures are still set)").toBeDefined();
    expect(updatedJsonValue, "Material asset should have the updated positive X reflection texture after mutation").toBe(mockTextureAssetDefinition2.id);
    expect(updatedCachedAssetReflectionTexture, "Cached material should have reflection texture defined after mutation").toBeDefined();
  });

  test("Setting the final (6th) reflection texture on material with 5 separate textures already defined updates state correctly", async () => {
    // Setup
    let mockTextureAssetDefinition!: TextureAssetDefinition;
    let mockMaterialAssetDefinition!: MaterialAssetDefinition;
    let mockMaterial!: MockMaterial;
    const mock = new MockProject(({ manifest, asset, scene }) => {
      mockTextureAssetDefinition = asset(AssetType.Texture, 'textures/skybox.png', MockAssets.textures.stonesPng);
      mockMaterial = createMockMaterial({
        reflection: {
          type: 'separate',
          strength: 0.8,
          pxTextureAssetId: mockTextureAssetDefinition.id,
          nxTextureAssetId: mockTextureAssetDefinition.id,
          pyTextureAssetId: mockTextureAssetDefinition.id,
          nyTextureAssetId: mockTextureAssetDefinition.id,
          pzTextureAssetId: mockTextureAssetDefinition.id,
          // @NOTE Missing nzTextureAssetId - this will be the 6th texture we add
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
      return (mockMaterialEditorViewController.materialData.reflection as MeshAssetMaterialOverrideReflectionSeparateData)?.nzTexture;
    }
    function getBabylonValue(): CubeTexture | undefined {
      return mockMaterialEditorViewController.materialInstance.reflectionTexture;
    }
    function getJsonValue(): string | undefined {
      return (mockMaterialEditorViewController.materialJson.value.reflection as MeshAssetMaterialOverrideReflectionSeparateDefinition)?.nzTextureAssetId;
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

    const mutation = new SetMaterialReflectionSeparateTextureMutation(mockTextureAssetDefinition.id, ReflectionSeparateTexture.negativeZ);

    // Test
    await mockMaterialEditorViewController.mutator.apply(mutation);

    /* Capture updated state */
    const updatedDataValue = getDataValue();
    const updatedBabylonValue = getBabylonValue();
    const updatedJsonValue = getJsonValue();
    const updatedCachedAssetReflectionTexture = await getCachedAssetReflectionTexture();

    // Assert
    /* Initial state */
    expect(initialDataValue, "Material data should not have negative Z reflection texture defined initially").toBeUndefined();
    expect(initialBabylonValue, "Babylon material should not have reflection texture defined initially (since only 5 of 6 textures are set)").toBeUndefined();
    expect(initialJsonValue, "Material asset should not have negative Z reflection texture defined initially").toBeUndefined();
    expect(initialCachedAssetReflectionTexture, "Cached material should not have reflection texture defined initially").toBeUndefined();

    /* After mutation */
    expect(updatedDataValue?.id, "Material data should have the negative Z reflection texture after mutation").toBe(mockTextureAssetDefinition.id);
    expect(updatedBabylonValue, "Babylon material should have reflection texture defined after mutation (since all 6 textures are now set)").toBeDefined();
    expect(updatedJsonValue, "Material asset should have negative Z reflection texture defined after mutation").toBe(mockTextureAssetDefinition.id);
    expect(updatedCachedAssetReflectionTexture, "Cached material should have reflection texture defined after mutation").toBeDefined();
  });

  test("Removing positive X reflection texture on material with existing separate texture updates state correctly", async () => {
    // Setup
    let mockTextureAssetDefinition!: TextureAssetDefinition;
    let mockMaterialAssetDefinition!: MaterialAssetDefinition;
    let mockMaterial!: MockMaterial;
    const mock = new MockProject(({ manifest, asset, scene }) => {
      mockTextureAssetDefinition = asset(AssetType.Texture, 'textures/skybox.png', MockAssets.textures.stonesPng);
      mockMaterial = createMockMaterial({
        reflection: {
          type: 'separate',
          strength: 1.0,
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

    /* Test selector utilities */
    function getDataValue(): ITextureAssetData | undefined {
      return (mockMaterialEditorViewController.materialData.reflection as MeshAssetMaterialOverrideReflectionSeparateData)?.pxTexture;
    }
    function getBabylonValue(): CubeTexture | undefined {
      return mockMaterialEditorViewController.materialInstance.reflectionTexture;
    }
    function getJsonValue(): string | undefined {
      return (mockMaterialEditorViewController.materialJson.value.reflection as MeshAssetMaterialOverrideReflectionSeparateDefinition)?.pxTextureAssetId;
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

    const mutation = new SetMaterialReflectionSeparateTextureMutation(undefined, ReflectionSeparateTexture.positiveX);

    // Test
    await mockMaterialEditorViewController.mutator.apply(mutation);

    /* Capture updated state */
    const updatedDataValue = getDataValue();
    const updatedBabylonValue = getBabylonValue();
    const updatedJsonValue = getJsonValue();
    const updatedCachedAssetReflectionTexture = await getCachedAssetReflectionTexture();

    // Assert
    /* Initial state */
    expect(initialDataValue?.id, "Material data should have the initial positive X reflection texture").toBe(mockTextureAssetDefinition.id);
    expect(initialBabylonValue, "Babylon material should have reflection texture defined initially (since all 6 textures are set)").toBeDefined();
    expect(initialJsonValue, "Material asset should have the initial positive X reflection texture").toBe(mockTextureAssetDefinition.id);
    expect(initialCachedAssetReflectionTexture, "Cached material should have reflection texture defined initially").toBeDefined();

    /* After mutation */
    expect(updatedDataValue, "Material data should not have positive X reflection texture defined after mutation").toBeUndefined();
    expect(updatedBabylonValue, "Babylon material should not have reflection texture defined after mutation (since not all 6 textures are set)").toBeUndefined();
    expect(updatedJsonValue, "Material asset should not have positive X reflection texture defined after mutation").toBeUndefined();
    expect(updatedCachedAssetReflectionTexture, "Cached material should not have reflection texture defined after mutation").toBeUndefined();
  });

  test("Attempting to set reflection texture on material without separate reflection type throws error", async () => {
    // Setup
    let mockTextureAssetDefinition!: TextureAssetDefinition;
    let mockMaterialAssetDefinition!: MaterialAssetDefinition;
    let mockMaterial!: MockMaterial;
    const mock = new MockProject(({ manifest, asset, scene }) => {
      mockTextureAssetDefinition = asset(AssetType.Texture, 'textures/skybox.png', MockAssets.textures.stonesPng);
      mockMaterial = createMockMaterial({
        // @NOTE No reflection config - material doesn't have separate reflection type set
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

    const mutation = new SetMaterialReflectionSeparateTextureMutation(mockTextureAssetDefinition.id, ReflectionSeparateTexture.positiveX);

    // Test
    const testFunc = async (): Promise<void> => {
      return mockMaterialEditorViewController.mutator.apply(mutation);
    };

    // Assert
    await expect(testFunc, "Should throw error when trying to set separate reflection texture on material without separate reflection type")
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
          type: 'box-net', // @NOTE Different reflection type
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

    const mutation = new SetMaterialReflectionSeparateTextureMutation(mockTextureAssetDefinition.id, ReflectionSeparateTexture.positiveX);

    // Test
    const testFunc = async (): Promise<void> => {
      return mockMaterialEditorViewController.mutator.apply(mutation);
    };

    // Assert
    await expect(testFunc, "Should throw error when trying to set separate reflection texture on material with different reflection type")
      .rejects.toThrow("Cannot set reflection texture for material - the material doesn't have the correct reflection type set");
  });
});
