import { describe, test, expect } from 'vitest';
import { CubeTexture } from '@babylonjs/core/Materials/Textures/cubeTexture';

import { AssetType, MeshAssetMaterialOverrideReflection3x2Data, MeshAssetMaterialOverrideReflectionBoxNetData, MeshAssetMaterialOverrideReflectionSeparateData } from '@polyzone/runtime/src/cartridge';
import { RetroMaterial } from '@polyzone/runtime/src/materials/RetroMaterial';

import { MeshAssetDefinition, TextureAssetDefinition } from '@lib/project/definition';
import { MockProject } from '@test/integration/mock/project/MockProject';
import { MockAssets } from '@test/integration/mock/assets';
import { MockModelEditorViewController } from '@test/integration/mock/material-editor/MockModelEditorViewController';
import { MockProjectController } from '@test/integration/mock/project/MockProjectController';

import { SetModelMaterialOverrideReflectionTypeMutation } from './SetModelMaterialOverrideReflectionTypeMutation';

describe(SetModelMaterialOverrideReflectionTypeMutation.name, () => {
  test("Setting reflection type from undefined to a specific type", async () => {
    // Setup
    const mockMaterialName = 'Main'; // @NOTE Must match `sphere.mtl` - referenced in mock project definition
    let mockMeshAssetDefinition!: MeshAssetDefinition;
    const mock = new MockProject(({ manifest, asset, scene }) => ({
      manifest: manifest(),
      assets: [
        mockMeshAssetDefinition = asset(AssetType.Mesh, 'models/sphere.obj', MockAssets.models.sphereObj, {
          // @NOTE Empty material overrides i.e. no reflection setting
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

    // Enable reflection (required for the mutation to work properly)
    mockMeshAssetData.setMaterialOverride(mockMaterialName, (overrides) => {
      overrides.reflectionEnabled = true;
    });

    /* Test selector utilities */
    async function getCachedMaterialReflectionTexture(): Promise<CubeTexture | undefined> {
      const asset = await mockProjectController.assetCache.loadAsset(mockMeshAssetData, mockModelEditorViewController.scene);
      const material = asset.assetContainer.materials.find((material) => material.name === mockMaterialName) as RetroMaterial;
      return material.reflectionTexture;
    }

    /* Capture initial state */
    const initialDataValue = mockMeshAssetData.getOverridesForMaterial(mockMaterialName)?.reflection;
    const initialBabylonValue = mockModelEditorViewController.getMaterialByName(mockMaterialName).reflectionTexture;
    const initialJsonValue = (mockProjectController.projectDefinition.assets.find((asset) => asset.id === mockMeshAssetDefinition.id) as MeshAssetDefinition).materialOverrides?.[mockMaterialName]?.reflection;
    const initialCachedAsset = await getCachedMaterialReflectionTexture();

    const reflectionType = '3x2';
    const mutation = new SetModelMaterialOverrideReflectionTypeMutation(mockMeshAssetData.id, mockMaterialName, reflectionType);

    // Test
    await mockModelEditorViewController.mutator.apply(mutation);

    /* Capture updated state */
    const updatedDataValue = mockMeshAssetData.getOverridesForMaterial(mockMaterialName)?.reflection as MeshAssetMaterialOverrideReflection3x2Data;
    const updatedBabylonValue = mockModelEditorViewController.getMaterialByName(mockMaterialName).reflectionTexture;
    const updatedJsonValue = (mockProjectController.projectDefinition.assets.find((asset) => asset.id === mockMeshAssetDefinition.id) as MeshAssetDefinition).materialOverrides?.[mockMaterialName]?.reflection;
    const updatedCachedAsset = await getCachedMaterialReflectionTexture();

    // Assert
    /* Initial state */
    expect(initialDataValue, "Material override data should not have reflection defined initially").toBeUndefined();
    expect(initialBabylonValue, "Babylon material should not have reflection texture defined initially").toBeUndefined();
    expect(initialJsonValue, "Mesh asset definition should not have reflection defined initially").toBeUndefined();
    expect(initialCachedAsset, "Cached material should not have reflection texture defined initially").toBeUndefined();

    /* After mutation */
    expect(updatedDataValue.type, "Material override data should have the correct reflection type after mutation").toBe(reflectionType);
    expect(updatedDataValue.texture, "Material override data should not have texture defined after mutation").toBeUndefined();
    expect(updatedDataValue.strength, "Material override data should not have strength defined after mutation").toBeUndefined();
    expect(updatedBabylonValue, "Babylon material should not have reflection texture defined after mutation").toBeUndefined();
    expect(updatedJsonValue?.type, "Mesh asset definition should have the correct reflection type after mutation").toBe(reflectionType);
    expect(updatedCachedAsset, "Cached material should not have reflection texture defined after mutation").toBeUndefined();
  });

  test("Changing reflection type between single-texture types preserves texture and strength", async () => {
    // Setup
    const mockMaterialName = 'Main'; // @NOTE Must match `sphere.mtl` - referenced in mock project definition
    let mockTextureAssetDefinition!: TextureAssetDefinition;
    let mockMeshAssetDefinition!: MeshAssetDefinition;
    const initialReflectionType = '6x1';
    const newReflectionType = '3x2';
    const initialStrength = 0.7;
    const mock = new MockProject(({ manifest, asset, scene }) => {
      mockTextureAssetDefinition = asset(AssetType.Texture, 'textures/skybox.png', MockAssets.textures.stonesPng);
      return {
        manifest: manifest(),
        assets: [
          mockTextureAssetDefinition,
          mockMeshAssetDefinition = asset(AssetType.Mesh, 'models/sphere.obj', MockAssets.models.sphereObj, {
            materialOverrides: {
              [mockMaterialName]: {
                reflection: {
                  type: initialReflectionType,
                  strength: initialStrength,
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
      };
    });

    const mockProjectController = await MockProjectController.create(mock);
    const mockMeshAssetData = mockProjectController.project.assets.getById(mockMeshAssetDefinition.id, AssetType.Mesh);
    const mockModelEditorViewController = await MockModelEditorViewController.create(mockProjectController, mockMeshAssetData);

    /* Test selector utilities */
    async function getCachedMaterialReflectionTexture(): Promise<CubeTexture | undefined> {
      const asset = await mockProjectController.assetCache.loadAsset(mockMeshAssetData, mockModelEditorViewController.scene);
      const material = asset.assetContainer.materials.find((material) => material.name === mockMaterialName) as RetroMaterial;
      return material.reflectionTexture;
    }

    /* Capture initial state */
    const initialDataValue = mockMeshAssetData.getOverridesForMaterial(mockMaterialName)?.reflection as MeshAssetMaterialOverrideReflection3x2Data;
    const initialBabylonValue = mockModelEditorViewController.getMaterialByName(mockMaterialName).reflectionTexture;
    const initialJsonValue = (mockProjectController.projectDefinition.assets.find((asset) => asset.id === mockMeshAssetDefinition.id) as MeshAssetDefinition).materialOverrides?.[mockMaterialName]?.reflection;
    const initialCachedAsset = await getCachedMaterialReflectionTexture();

    const mutation = new SetModelMaterialOverrideReflectionTypeMutation(mockMeshAssetData.id, mockMaterialName, newReflectionType);

    // Test
    await mockModelEditorViewController.mutator.apply(mutation);

    /* Capture updated state */
    const updatedDataValue = mockMeshAssetData.getOverridesForMaterial(mockMaterialName)?.reflection as MeshAssetMaterialOverrideReflection3x2Data;
    const updatedBabylonValue = mockModelEditorViewController.getMaterialByName(mockMaterialName).reflectionTexture;
    const updatedJsonValue = (mockProjectController.projectDefinition.assets.find((asset) => asset.id === mockMeshAssetDefinition.id) as MeshAssetDefinition).materialOverrides?.[mockMaterialName]?.reflection;
    const updatedCachedAsset = await getCachedMaterialReflectionTexture();

    // Assert
    /* Initial state */
    expect(initialDataValue.type, "Material override data should have the initial reflection type").toBe(initialReflectionType);
    expect(initialDataValue.texture?.id, "Material override data should have the initial texture").toBe(mockTextureAssetDefinition.id);
    expect(initialDataValue.strength, "Material override data should have the initial strength").toBe(initialStrength);
    expect(initialBabylonValue, "Babylon material should have reflection texture defined initially").toBeDefined();
    expect(initialJsonValue?.type, "Mesh asset definition should have the initial reflection type").toBe(initialReflectionType);
    expect(initialCachedAsset, "Cached material should have reflection texture defined initially").toBeDefined();

    /* After mutation */
    expect(updatedDataValue.type, "Material override data should have the updated reflection type after mutation").toBe(newReflectionType);
    expect(updatedDataValue.texture?.id, "Material override data should preserve the texture after mutation").toBe(mockTextureAssetDefinition.id);
    expect(updatedDataValue.strength, "Material override data should preserve the strength after mutation").toBe(initialStrength);
    expect(updatedBabylonValue, "Babylon material should have reflection texture defined after mutation").toBeDefined();
    expect(updatedJsonValue?.type, "Mesh asset definition should have the updated reflection type after mutation").toBe(newReflectionType);
    expect(updatedCachedAsset, "Cached material should have reflection texture defined after mutation").toBeDefined();
  });

  test("Changing from single-texture type to separate type preserves first texture", async () => {
    // Setup
    const mockMaterialName = 'Main'; // @NOTE Must match `sphere.mtl` - referenced in mock project definition
    let mockTextureAssetDefinition!: TextureAssetDefinition;
    let mockMeshAssetDefinition!: MeshAssetDefinition;
    const initialReflectionType = 'box-net';
    const newReflectionType = 'separate';
    const initialStrength = 0.8;
    const mock = new MockProject(({ manifest, asset, scene }) => {
      mockTextureAssetDefinition = asset(AssetType.Texture, 'textures/skybox.png', MockAssets.textures.stonesPng);
      return {
        manifest: manifest(),
        assets: [
          mockTextureAssetDefinition,
          mockMeshAssetDefinition = asset(AssetType.Mesh, 'models/sphere.obj', MockAssets.models.sphereObj, {
            materialOverrides: {
              [mockMaterialName]: {
                reflection: {
                  type: initialReflectionType,
                  strength: initialStrength,
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
      };
    });

    const mockProjectController = await MockProjectController.create(mock);
    const mockMeshAssetData = mockProjectController.project.assets.getById(mockMeshAssetDefinition.id, AssetType.Mesh);
    const mockModelEditorViewController = await MockModelEditorViewController.create(mockProjectController, mockMeshAssetData);

    /* Test selector utilities */
    async function getCachedMaterialReflectionTexture(): Promise<CubeTexture | undefined> {
      const asset = await mockProjectController.assetCache.loadAsset(mockMeshAssetData, mockModelEditorViewController.scene);
      const material = asset.assetContainer.materials.find((material) => material.name === mockMaterialName) as RetroMaterial;
      return material.reflectionTexture;
    }

    /* Capture initial state */
    const initialDataValue = mockMeshAssetData.getOverridesForMaterial(mockMaterialName)?.reflection as MeshAssetMaterialOverrideReflectionBoxNetData;
    const initialBabylonValue = mockModelEditorViewController.getMaterialByName(mockMaterialName).reflectionTexture;
    const initialJsonValue = (mockProjectController.projectDefinition.assets.find((asset) => asset.id === mockMeshAssetDefinition.id) as MeshAssetDefinition).materialOverrides?.[mockMaterialName]?.reflection;
    const initialCachedAsset = await getCachedMaterialReflectionTexture();

    const mutation = new SetModelMaterialOverrideReflectionTypeMutation(mockMeshAssetData.id, mockMaterialName, newReflectionType);

    // Test
    await mockModelEditorViewController.mutator.apply(mutation);

    /* Capture updated state */
    const updatedDataValue = mockMeshAssetData.getOverridesForMaterial(mockMaterialName)?.reflection as MeshAssetMaterialOverrideReflectionSeparateData;
    const updatedBabylonValue = mockModelEditorViewController.getMaterialByName(mockMaterialName).reflectionTexture;
    const updatedJsonValue = (mockProjectController.projectDefinition.assets.find((asset) => asset.id === mockMeshAssetDefinition.id) as MeshAssetDefinition).materialOverrides?.[mockMaterialName]?.reflection;
    const updatedCachedAsset = await getCachedMaterialReflectionTexture();

    // Assert
    /* Initial state */
    expect(initialDataValue.type, "Material override data should have the initial reflection type").toBe(initialReflectionType);
    expect(initialDataValue.texture?.id, "Material override data should have the initial texture").toBe(mockTextureAssetDefinition.id);
    expect(initialDataValue.strength, "Material override data should have the initial strength").toBe(initialStrength);
    expect(initialBabylonValue, "Babylon material should have reflection texture defined initially").toBeDefined();
    expect(initialJsonValue?.type, "Mesh asset definition should have the initial reflection type").toBe(initialReflectionType);
    expect(initialCachedAsset, "Cached material should have reflection texture defined initially").toBeDefined();

    /* After mutation */
    expect(updatedDataValue.type, "Material override data should have the updated reflection type after mutation").toBe(newReflectionType);
    expect(updatedDataValue.pxTexture?.id, "Material override data should have texture moved to pxTexture after mutation").toBe(mockTextureAssetDefinition.id);
    expect(updatedDataValue.strength, "Material override data should preserve the strength after mutation").toBe(initialStrength);
    expect(updatedBabylonValue, "Babylon material should not have reflection texture defined after mutation (only 1 of 6 textures set)").toBeUndefined();
    expect(updatedJsonValue?.type, "Mesh asset definition should have the updated reflection type after mutation").toBe(newReflectionType);
    expect(updatedCachedAsset, "Cached material should not have reflection texture defined after mutation (only 1 of 6 textures set)").toBeUndefined();
  });

  test("Changing from separate type to single-texture type preserves first texture", async () => {
    // Setup
    const mockMaterialName = 'Main'; // @NOTE Must match `sphere.mtl` - referenced in mock project definition
    let mockTextureAssetDefinition!: TextureAssetDefinition;
    let mockMeshAssetDefinition!: MeshAssetDefinition;
    const initialReflectionType = 'separate';
    const newReflectionType = '3x2';
    const initialStrength = 0.6;
    const mock = new MockProject(({ manifest, asset, scene }) => {
      // @NOTE Use the same texture asset for all 6 separate texture references
      mockTextureAssetDefinition = asset(AssetType.Texture, 'textures/skybox.png', MockAssets.textures.stonesPng);
      return {
        manifest: manifest(),
        assets: [
          mockTextureAssetDefinition,
          mockMeshAssetDefinition = asset(AssetType.Mesh, 'models/sphere.obj', MockAssets.models.sphereObj, {
            materialOverrides: {
              [mockMaterialName]: {
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
    async function getCachedMaterialReflectionTexture(): Promise<CubeTexture | undefined> {
      const asset = await mockProjectController.assetCache.loadAsset(mockMeshAssetData, mockModelEditorViewController.scene);
      const material = asset.assetContainer.materials.find((material) => material.name === mockMaterialName) as RetroMaterial;
      return material.reflectionTexture;
    }

    /* Capture initial state */
    const initialDataValue = mockMeshAssetData.getOverridesForMaterial(mockMaterialName)?.reflection as MeshAssetMaterialOverrideReflectionSeparateData;
    const initialBabylonValue = mockModelEditorViewController.getMaterialByName(mockMaterialName).reflectionTexture;
    const initialJsonValue = (mockProjectController.projectDefinition.assets.find((asset) => asset.id === mockMeshAssetDefinition.id) as MeshAssetDefinition).materialOverrides?.[mockMaterialName]?.reflection;
    const initialCachedAsset = await getCachedMaterialReflectionTexture();

    const mutation = new SetModelMaterialOverrideReflectionTypeMutation(mockMeshAssetData.id, mockMaterialName, newReflectionType);

    // Test
    await mockModelEditorViewController.mutator.apply(mutation);

    /* Capture updated state */
    const updatedDataValue = mockMeshAssetData.getOverridesForMaterial(mockMaterialName)?.reflection as MeshAssetMaterialOverrideReflection3x2Data;
    const updatedBabylonValue = mockModelEditorViewController.getMaterialByName(mockMaterialName).reflectionTexture;
    const updatedJsonValue = (mockProjectController.projectDefinition.assets.find((asset) => asset.id === mockMeshAssetDefinition.id) as MeshAssetDefinition).materialOverrides?.[mockMaterialName]?.reflection;
    const updatedCachedAsset = await getCachedMaterialReflectionTexture();

    // Assert
    /* Initial state */
    expect(initialDataValue.type, "Material override data should have the initial reflection type").toBe(initialReflectionType);
    expect(initialDataValue.pxTexture?.id, "Material override data should have the initial pxTexture").toBe(mockTextureAssetDefinition.id);
    expect(initialDataValue.nxTexture?.id, "Material override data should have the initial nxTexture").toBe(mockTextureAssetDefinition.id);
    expect(initialDataValue.strength, "Material override data should have the initial strength").toBe(initialStrength);
    expect(initialBabylonValue, "Babylon material should have reflection texture defined initially (all 6 textures defined)").toBeDefined();
    expect(initialJsonValue?.type, "Mesh asset definition should have the initial reflection type").toBe(initialReflectionType);
    expect(initialCachedAsset, "Cached material should have reflection texture defined initially").toBeDefined();

    /* After mutation */
    expect(updatedDataValue.type, "Material override data should have the updated reflection type after mutation").toBe(newReflectionType);
    expect(updatedDataValue.texture?.id, "Material override data should have pxTexture moved to texture after mutation").toBe(mockTextureAssetDefinition.id);
    expect(updatedDataValue.strength, "Material override data should preserve the strength after mutation").toBe(initialStrength);
    expect(updatedBabylonValue, "Babylon material should have reflection texture defined after mutation").toBeDefined();
    expect(updatedJsonValue?.type, "Mesh asset definition should have the updated reflection type after mutation").toBe(newReflectionType);
    expect(updatedCachedAsset, "Cached material should have reflection texture defined after mutation").toBeDefined();
  });

  test("Setting reflection type to undefined removes all reflection config", async () => {
    // Setup
    const mockMaterialName = 'Main'; // @NOTE Must match `sphere.mtl` - referenced in mock project definition
    let mockTextureAssetDefinition!: TextureAssetDefinition;
    let mockMeshAssetDefinition!: MeshAssetDefinition;
    const initialReflectionType = '3x2';
    const initialStrength = 0.9;
    const mock = new MockProject(({ manifest, asset, scene }) => {
      mockTextureAssetDefinition = asset(AssetType.Texture, 'textures/skybox.png', MockAssets.textures.stonesPng);
      return {
        manifest: manifest(),
        assets: [
          mockTextureAssetDefinition,
          mockMeshAssetDefinition = asset(AssetType.Mesh, 'models/sphere.obj', MockAssets.models.sphereObj, {
            materialOverrides: {
              [mockMaterialName]: {
                reflection: {
                  type: initialReflectionType,
                  strength: initialStrength,
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
      };
    });

    const mockProjectController = await MockProjectController.create(mock);
    const mockMeshAssetData = mockProjectController.project.assets.getById(mockMeshAssetDefinition.id, AssetType.Mesh);
    const mockModelEditorViewController = await MockModelEditorViewController.create(mockProjectController, mockMeshAssetData);

    /* Test selector utilities */
    async function getCachedMaterialReflectionTexture(): Promise<CubeTexture | undefined> {
      const asset = await mockProjectController.assetCache.loadAsset(mockMeshAssetData, mockModelEditorViewController.scene);
      const material = asset.assetContainer.materials.find((material) => material.name === mockMaterialName) as RetroMaterial;
      return material.reflectionTexture;
    }

    /* Capture initial state */
    const initialDataValue = mockMeshAssetData.getOverridesForMaterial(mockMaterialName)?.reflection as MeshAssetMaterialOverrideReflection3x2Data;
    const initialBabylonValue = mockModelEditorViewController.getMaterialByName(mockMaterialName).reflectionTexture;
    const initialJsonValue = (mockProjectController.projectDefinition.assets.find((asset) => asset.id === mockMeshAssetDefinition.id) as MeshAssetDefinition).materialOverrides?.[mockMaterialName]?.reflection;
    const initialCachedAsset = await getCachedMaterialReflectionTexture();

    const mutation = new SetModelMaterialOverrideReflectionTypeMutation(mockMeshAssetData.id, mockMaterialName, undefined);

    // Test
    await mockModelEditorViewController.mutator.apply(mutation);

    /* Capture updated state */
    const updatedDataValue = mockMeshAssetData.getOverridesForMaterial(mockMaterialName)?.reflection;
    const updatedBabylonValue = mockModelEditorViewController.getMaterialByName(mockMaterialName).reflectionTexture;
    const updatedJsonValue = (mockProjectController.projectDefinition.assets.find((asset) => asset.id === mockMeshAssetDefinition.id) as MeshAssetDefinition).materialOverrides?.[mockMaterialName]?.reflection;
    const updatedCachedAsset = await getCachedMaterialReflectionTexture();

    // Assert
    /* Initial state */
    expect(initialDataValue.type, "Material override data should have the initial reflection type").toBe(initialReflectionType);
    expect(initialDataValue.texture?.id, "Material override data should have the initial texture").toBe(mockTextureAssetDefinition.id);
    expect(initialDataValue.strength, "Material override data should have the initial strength").toBe(initialStrength);
    expect(initialBabylonValue, "Babylon material should have reflection texture defined initially").toBeDefined();
    expect(initialJsonValue?.type, "Mesh asset definition should have the initial reflection type").toBe(initialReflectionType);
    expect(initialCachedAsset, "Cached material should have reflection texture defined initially").toBeDefined();

    /* After mutation */
    expect(updatedDataValue, "Material override data should not have reflection defined after mutation").toBeUndefined();
    expect(updatedBabylonValue, "Babylon material should not have reflection texture defined after mutation").toBeUndefined();
    expect(updatedJsonValue, "Mesh asset definition should not have reflection defined after mutation").toBeUndefined();
    expect(updatedCachedAsset, "Cached material should not have reflection texture defined after mutation").toBeUndefined();
  });
});
