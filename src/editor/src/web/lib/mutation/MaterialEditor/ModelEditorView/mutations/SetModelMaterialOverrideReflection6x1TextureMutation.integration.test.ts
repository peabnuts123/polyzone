import { CubeTexture } from '@babylonjs/core/Materials/Textures/cubeTexture';
import { describe, test, expect } from 'vitest';

import { AssetType, ITextureAssetData, MeshAssetMaterialOverrideReflection6x1Data, MeshAssetMaterialOverrideReflection6x1Definition } from '@polyzone/runtime/src/cartridge';
import { RetroMaterial } from '@polyzone/runtime/src/materials/RetroMaterial';

import { MeshAssetDefinition, TextureAssetDefinition } from '@lib/project/definition';
import { MockProject } from '@test/integration/mock/project/MockProject';
import { MockAssets } from '@test/integration/mock/assets';
import { MockModelEditorViewController } from '@test/integration/mock/material-editor/MockModelEditorViewController';
import { MockProjectController } from '@test/integration/mock/project/MockProjectController';

import { SetModelMaterialOverrideReflection6x1TextureMutation } from './SetModelMaterialOverrideReflection6x1TextureMutation';

describe(SetModelMaterialOverrideReflection6x1TextureMutation.name, () => {
  test("Setting reflection texture on model material override with 6x1 reflection type but no texture updates state correctly", async () => {
    // Setup
    const mockMaterialName = 'Main'; // @NOTE Must match `sphere.mtl` - referenced in mock project definition
    let mockMeshAssetDefinition!: MeshAssetDefinition;
    let mockTextureAssetDefinition!: TextureAssetDefinition;
    const mock = new MockProject(({ manifest, asset, scene }) => ({
      manifest: manifest(),
      assets: [
        mockTextureAssetDefinition = asset(AssetType.Texture, 'textures/skybox.png', MockAssets.textures.stonesPng),
        mockMeshAssetDefinition = asset(AssetType.Mesh, 'models/sphere.obj', MockAssets.models.sphereObj, {
          materialOverrides: {
            [mockMaterialName]: {
              reflection: {
                type: '6x1',
                strength: 1.0,
                // @NOTE No textureAssetId set initially
              },
            },
          },
        }),
        asset(AssetType.MeshSupplementary, 'models/sphere.mtl', MockAssets.models.sphereMtl),
      ],
      scenes: [
        scene('sample'),
      ],
    }));

    const mockProjectController = await MockProjectController.create(mock);
    const mockMeshAssetData = mockProjectController.project.assets.getById(mockMeshAssetDefinition.id, AssetType.Mesh);
    const mockModelEditorViewController = await MockModelEditorViewController.create(mockProjectController, mockMeshAssetData);

    /* Test selector utilities */
    function getDataValue(): ITextureAssetData | undefined {
      return (mockMeshAssetData.getOverridesForMaterial(mockMaterialName)?.reflection as MeshAssetMaterialOverrideReflection6x1Data)?.texture;
    }
    function getBabylonValue(): CubeTexture | undefined {
      return mockModelEditorViewController.getMaterialByName(mockMaterialName)?.overridesFromAsset.reflectionTexture;
    }
    function getJsonValue(): string | undefined {
      const assetDefinition = mockProjectController.projectDefinition.assets.find((asset) => asset.id === mockMeshAssetDefinition.id) as MeshAssetDefinition;
      return (assetDefinition.materialOverrides![mockMaterialName].reflection as MeshAssetMaterialOverrideReflection6x1Definition)?.textureAssetId;
    }
    async function getCachedMaterialReflectionTexture(): Promise<CubeTexture | undefined> {
      const asset = await mockProjectController.assetCache.loadAsset(mockMeshAssetData, mockModelEditorViewController.scene);
      const material = asset.assetContainer.materials.find((material) => material.name === mockMaterialName) as RetroMaterial;
      return material.overridesFromAsset.reflectionTexture;
    }

    /* Capture initial state */
    const initialDataValue = getDataValue();
    const initialBabylonValue = getBabylonValue();
    const initialJsonValue = getJsonValue();
    const initialCachedMaterialReflectionTexture = await getCachedMaterialReflectionTexture();

    const mutation = new SetModelMaterialOverrideReflection6x1TextureMutation(
      mockMeshAssetData.id,
      mockMaterialName,
      mockTextureAssetDefinition.id,
    );

    // Test
    await mockModelEditorViewController.mutator.apply(mutation);

    /* Capture updated state */
    const updatedDataValue = getDataValue();
    const updatedBabylonValue = getBabylonValue();
    const updatedJsonValue = getJsonValue();
    const updatedCachedMaterialReflectionTexture = await getCachedMaterialReflectionTexture();

    // Assert
    /* Initial state */
    expect(initialDataValue, "Mesh asset data should not have reflection texture defined initially").toBeUndefined();
    expect(initialBabylonValue, "Babylon material should not have reflection texture defined initially").toBeUndefined();
    expect(initialJsonValue, "Mesh asset should not have reflection texture defined initially").toBeUndefined();
    expect(initialCachedMaterialReflectionTexture, "Cached material should not have reflection texture defined initially").toBeUndefined();

    /* After mutation */
    expect(updatedDataValue?.id, "Mesh asset data should have the correct reflection texture after mutation").toBe(mockTextureAssetDefinition.id);
    expect(updatedBabylonValue, "Babylon material should have reflection texture defined after mutation").toBeDefined();
    expect(updatedJsonValue, "Mesh asset should have reflection texture defined after mutation").toBe(mockTextureAssetDefinition.id);
    expect(updatedCachedMaterialReflectionTexture, "Cached material should have reflection texture defined after mutation").toBeDefined();
  });

  test("Changing reflection texture on model material override with existing 6x1 texture updates state correctly", async () => {
    // Setup
    const mockMaterialName = 'Main'; // @NOTE Must match `sphere.mtl` - referenced in mock project definition
    let mockMeshAssetDefinition!: MeshAssetDefinition;
    let mockTextureAssetDefinition1!: TextureAssetDefinition;
    let mockTextureAssetDefinition2!: TextureAssetDefinition;
    const mock = new MockProject(({ manifest, asset, scene }) => ({
      manifest: manifest(),
      assets: [
        mockTextureAssetDefinition1 = asset(AssetType.Texture, 'textures/skybox1.png', MockAssets.textures.stonesPng),
        mockTextureAssetDefinition2 = asset(AssetType.Texture, 'textures/skybox2.png', MockAssets.textures.asphaltPng),
        mockMeshAssetDefinition = asset(AssetType.Mesh, 'models/sphere.obj', MockAssets.models.sphereObj, {
          materialOverrides: {
            [mockMaterialName]: {
              reflection: {
                type: '6x1',
                strength: 1.0,
                textureAssetId: mockTextureAssetDefinition1.id,
              },
            },
          },
        }),
        asset(AssetType.MeshSupplementary, 'models/sphere.mtl', MockAssets.models.sphereMtl),
      ],
      scenes: [
        scene('sample'),
      ],
    }));

    const mockProjectController = await MockProjectController.create(mock);
    const mockMeshAssetData = mockProjectController.project.assets.getById(mockMeshAssetDefinition.id, AssetType.Mesh);
    const mockModelEditorViewController = await MockModelEditorViewController.create(mockProjectController, mockMeshAssetData);

    /* Test selector utilities */
    function getDataValue(): ITextureAssetData | undefined {
      return (mockMeshAssetData.getOverridesForMaterial(mockMaterialName)?.reflection as MeshAssetMaterialOverrideReflection6x1Data)?.texture;
    }
    function getBabylonValue(): CubeTexture | undefined {
      return mockModelEditorViewController.getMaterialByName(mockMaterialName)?.overridesFromAsset.reflectionTexture;
    }
    function getJsonValue(): string | undefined {
      const assetDefinition = mockProjectController.projectDefinition.assets.find((asset) => asset.id === mockMeshAssetDefinition.id) as MeshAssetDefinition;
      return (assetDefinition.materialOverrides![mockMaterialName].reflection as MeshAssetMaterialOverrideReflection6x1Definition)?.textureAssetId;
    }
    async function getCachedMaterialReflectionTexture(): Promise<CubeTexture | undefined> {
      const asset = await mockProjectController.assetCache.loadAsset(mockMeshAssetData, mockModelEditorViewController.scene);
      const material = asset.assetContainer.materials.find((material) => material.name === mockMaterialName) as RetroMaterial;
      return material.overridesFromAsset.reflectionTexture;
    }

    /* Capture initial state */
    const initialDataValue = getDataValue();
    const initialBabylonValue = getBabylonValue();
    const initialJsonValue = getJsonValue();
    const initialCachedMaterialReflectionTexture = await getCachedMaterialReflectionTexture();

    const mutation = new SetModelMaterialOverrideReflection6x1TextureMutation(
      mockMeshAssetData.id,
      mockMaterialName,
      mockTextureAssetDefinition2.id,
    );

    // Test
    await mockModelEditorViewController.mutator.apply(mutation);

    /* Capture updated state */
    const updatedDataValue = getDataValue();
    const updatedBabylonValue = getBabylonValue();
    const updatedJsonValue = getJsonValue();
    const updatedCachedMaterialReflectionTexture = await getCachedMaterialReflectionTexture();

    // Assert
    /* Initial state */
    expect(initialDataValue?.id, "Mesh asset data should have the initial reflection texture").toBe(mockTextureAssetDefinition1.id);
    expect(initialBabylonValue, "Babylon material should have reflection texture defined initially").toBeDefined();
    expect(initialJsonValue, "Mesh asset should have the initial reflection texture").toBe(mockTextureAssetDefinition1.id);
    expect(initialCachedMaterialReflectionTexture, "Cached material should have reflection texture defined initially").toBeDefined();

    /* After mutation */
    expect(updatedDataValue?.id, "Mesh asset data should have the updated reflection texture after mutation").toBe(mockTextureAssetDefinition2.id);
    expect(updatedBabylonValue, "Babylon material should have reflection texture defined after mutation").toBeDefined();
    expect(updatedJsonValue, "Mesh asset should have the updated reflection texture after mutation").toBe(mockTextureAssetDefinition2.id);
    expect(updatedCachedMaterialReflectionTexture, "Cached material should have reflection texture defined after mutation").toBeDefined();
  });

  test("Removing reflection texture on model material override with existing 6x1 texture updates state correctly", async () => {
    // Setup
    const mockMaterialName = 'Main'; // @NOTE Must match `sphere.mtl` - referenced in mock project definition
    let mockMeshAssetDefinition!: MeshAssetDefinition;
    let mockTextureAssetDefinition!: TextureAssetDefinition;
    const mock = new MockProject(({ manifest, asset, scene }) => ({
      manifest: manifest(),
      assets: [
        mockTextureAssetDefinition = asset(AssetType.Texture, 'textures/skybox.png', MockAssets.textures.stonesPng),
        mockMeshAssetDefinition = asset(AssetType.Mesh, 'models/sphere.obj', MockAssets.models.sphereObj, {
          materialOverrides: {
            [mockMaterialName]: {
              reflection: {
                type: '6x1',
                strength: 1.0,
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
    }));

    const mockProjectController = await MockProjectController.create(mock);
    const mockMeshAssetData = mockProjectController.project.assets.getById(mockMeshAssetDefinition.id, AssetType.Mesh);
    const mockModelEditorViewController = await MockModelEditorViewController.create(mockProjectController, mockMeshAssetData);

    /* Test selector utilities */
    function getDataValue(): ITextureAssetData | undefined {
      return (mockMeshAssetData.getOverridesForMaterial(mockMaterialName)?.reflection as MeshAssetMaterialOverrideReflection6x1Data)?.texture;
    }
    function getBabylonValue(): CubeTexture | undefined {
      return mockModelEditorViewController.getMaterialByName(mockMaterialName)?.overridesFromAsset.reflectionTexture;
    }
    function getJsonValue(): string | undefined {
      const assetDefinition = mockProjectController.projectDefinition.assets.find((asset) => asset.id === mockMeshAssetDefinition.id) as MeshAssetDefinition;
      return (assetDefinition.materialOverrides![mockMaterialName].reflection as MeshAssetMaterialOverrideReflection6x1Definition)?.textureAssetId;
    }
    async function getCachedMaterialReflectionTexture(): Promise<CubeTexture | undefined> {
      const asset = await mockProjectController.assetCache.loadAsset(mockMeshAssetData, mockModelEditorViewController.scene);
      const material = asset.assetContainer.materials.find((material) => material.name === mockMaterialName) as RetroMaterial;
      return material.overridesFromAsset.reflectionTexture;
    }

    /* Capture initial state */
    const initialDataValue = getDataValue();
    const initialBabylonValue = getBabylonValue();
    const initialJsonValue = getJsonValue();
    const initialCachedMaterialReflectionTexture = await getCachedMaterialReflectionTexture();

    const mutation = new SetModelMaterialOverrideReflection6x1TextureMutation(
      mockMeshAssetData.id,
      mockMaterialName,
      undefined,
    );

    // Test
    await mockModelEditorViewController.mutator.apply(mutation);

    /* Capture updated state */
    const updatedDataValue = getDataValue();
    const updatedBabylonValue = getBabylonValue();
    const updatedJsonValue = getJsonValue();
    const updatedCachedMaterialReflectionTexture = await getCachedMaterialReflectionTexture();

    // Assert
    /* Initial state */
    expect(initialDataValue?.id, "Mesh asset data should have the initial reflection texture").toBe(mockTextureAssetDefinition.id);
    expect(initialBabylonValue, "Babylon material should have reflection texture defined initially").toBeDefined();
    expect(initialJsonValue, "Mesh asset should have the initial reflection texture").toBe(mockTextureAssetDefinition.id);
    expect(initialCachedMaterialReflectionTexture, "Cached material should have reflection texture defined initially").toBeDefined();

    /* After mutation */
    expect(updatedDataValue, "Mesh asset data should not have reflection texture defined after mutation").toBeUndefined();
    expect(updatedBabylonValue, "Babylon material should not have reflection texture defined after mutation").toBeUndefined();
    expect(updatedJsonValue, "Mesh asset should not have reflection texture defined after mutation").toBeUndefined();
    expect(updatedCachedMaterialReflectionTexture, "Cached material should not have reflection texture defined after mutation").toBeUndefined();
  });

  test("Attempting to set reflection texture on material override without 6x1 reflection type throws error", async () => {
    // Setup
    const mockMaterialName = 'Main'; // @NOTE Must match `sphere.mtl` - referenced in mock project definition
    let mockMeshAssetDefinition!: MeshAssetDefinition;
    let mockTextureAssetDefinition!: TextureAssetDefinition;
    const mock = new MockProject(({ manifest, asset, scene }) => ({
      manifest: manifest(),
      assets: [
        mockTextureAssetDefinition = asset(AssetType.Texture, 'textures/skybox.png', MockAssets.textures.stonesPng),
        mockMeshAssetDefinition = asset(AssetType.Mesh, 'models/sphere.obj', MockAssets.models.sphereObj, {
          materialOverrides: {
            [mockMaterialName]: {
              // @NOTE No reflection config - material doesn't have 6x1 reflection type set
            },
          },
        }),
        asset(AssetType.MeshSupplementary, 'models/sphere.mtl', MockAssets.models.sphereMtl),
      ],
      scenes: [
        scene('sample'),
      ],
    }));

    const mockProjectController = await MockProjectController.create(mock);
    const mockMeshAssetData = mockProjectController.project.assets.getById(mockMeshAssetDefinition.id, AssetType.Mesh);
    const mockModelEditorViewController = await MockModelEditorViewController.create(mockProjectController, mockMeshAssetData);

    const mutation = new SetModelMaterialOverrideReflection6x1TextureMutation(
      mockMeshAssetData.id,
      mockMaterialName,
      mockTextureAssetDefinition.id,
    );

    // Test
    const testFunc = async (): Promise<void> => {
      return mockModelEditorViewController.mutator.apply(mutation);
    };

    // Assert
    await expect(testFunc, "Should throw error when trying to set 6x1 reflection texture on material override without 6x1 reflection type")
      .rejects.toThrow("Cannot set reflection texture for material override - the material doesn't have a reflection override yet");
  });

  test("Attempting to set reflection texture on material override with different reflection type throws error", async () => {
    // Setup
    const mockMaterialName = 'Main'; // @NOTE Must match `sphere.mtl` - referenced in mock project definition
    let mockMeshAssetDefinition!: MeshAssetDefinition;
    let mockTextureAssetDefinition!: TextureAssetDefinition;
    const mock = new MockProject(({ manifest, asset, scene }) => ({
      manifest: manifest(),
      assets: [
        mockTextureAssetDefinition = asset(AssetType.Texture, 'textures/skybox.png', MockAssets.textures.stonesPng),
        mockMeshAssetDefinition = asset(AssetType.Mesh, 'models/sphere.obj', MockAssets.models.sphereObj, {
          materialOverrides: {
            [mockMaterialName]: {
              reflection: {
                type: '3x2', // @NOTE Different reflection type
                strength: 1.0,
              },
            },
          },
        }),
        asset(AssetType.MeshSupplementary, 'models/sphere.mtl', MockAssets.models.sphereMtl),
      ],
      scenes: [
        scene('sample'),
      ],
    }));

    const mockProjectController = await MockProjectController.create(mock);
    const mockMeshAssetData = mockProjectController.project.assets.getById(mockMeshAssetDefinition.id, AssetType.Mesh);
    const mockModelEditorViewController = await MockModelEditorViewController.create(mockProjectController, mockMeshAssetData);

    const mutation = new SetModelMaterialOverrideReflection6x1TextureMutation(
      mockMeshAssetData.id,
      mockMaterialName,
      mockTextureAssetDefinition.id,
    );

    // Test
    const testFunc = async (): Promise<void> => {
      return mockModelEditorViewController.mutator.apply(mutation);
    };

    // Assert
    await expect(testFunc, "Should throw error when trying to set 6x1 reflection texture on material override with different reflection type")
      .rejects.toThrow("Cannot set reflection texture for material override - the material doesn't have a reflection override yet");
  });
});
