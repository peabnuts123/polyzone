import { describe, test, expect } from 'vitest';
import { CubeTexture } from '@babylonjs/core/Materials/Textures/cubeTexture';

import { AssetType } from '@polyzone/runtime/src/cartridge';
import { RetroMaterial } from '@polyzone/runtime/src/materials/RetroMaterial';

import { MeshAssetDefinition, MaterialAssetDefinition, TextureAssetDefinition } from '@lib/project';
import { createMockMaterial } from '@test/integration/mock/material-editor/createMockMaterial';
import { MockProject } from '@test/integration/mock/project/MockProject';
import { MockAssets } from '@test/integration/mock/assets';
import { MockProjectController } from '@test/integration/mock/project/MockProjectController';
import { MockModelEditorViewController } from '@test/integration/mock/material-editor/MockModelEditorViewController';

import { SetModelMaterialOverrideBaseMaterialMutation } from './SetModelMaterialOverrideBaseMaterialMutation';

describe(SetModelMaterialOverrideBaseMaterialMutation.name, () => {
  test("Setting a base material from undefined applies the base material properties", async () => {
    // Setup
    const mockMaterialName = 'Main'; // @NOTE Must match `sphere.mtl` - referenced in mock project definition
    let mockTextureAssetDefinition!: TextureAssetDefinition;
    let mockMaterialAssetDefinition!: MaterialAssetDefinition;
    let mockMeshAssetDefinition!: MeshAssetDefinition;

    const mock = new MockProject(({ manifest, asset, scene }) => {
      // Must define texture first since it is referenced by the material
      mockTextureAssetDefinition = asset(AssetType.Texture, 'textures/reflection.png', MockAssets.textures.stonesPng);

      const mockMaterial = createMockMaterial({
        reflection: {
          type: '3x2',
          strength: 1.0,
          textureAssetId: mockTextureAssetDefinition.id,
        },
      });
      mockMaterialAssetDefinition = asset(AssetType.Material, 'materials/baseMaterial.pzmat', mockMaterial.data);

      return {
        manifest: manifest(),
        assets: [
          mockTextureAssetDefinition,
          mockMaterialAssetDefinition,
          mockMeshAssetDefinition = asset(AssetType.Mesh, 'models/sphere.obj', MockAssets.models.sphereObj, {
            // @NOTE No materialOverrides - starts without base material
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

    // Manually set materialEnabled to true after the mutation so the getter works correctly
    mockMeshAssetData.setMaterialOverride(mockMaterialName, (overrides) => {
      overrides.materialEnabled = true;
    });

    /* Test selector utilities */
    async function getCachedMaterialReflectionTexture(): Promise<CubeTexture | undefined> {
      const asset = await mockProjectController.assetCache.loadAsset(mockMeshAssetData, mockModelEditorViewController.scene);
      const material = asset.assetContainer.materials.find((material) => material.name === mockMaterialName) as RetroMaterial;
      return material.overridesFromMaterial.reflectionTexture;
    }
    function getJsonMaterialAssetId(): string | undefined {
      const meshAssetDefinition = mockProjectController.projectDefinition.assets.find((asset) => asset.id === mockMeshAssetDefinition.id) as MeshAssetDefinition;
      return meshAssetDefinition.materialOverrides?.[mockMaterialName]?.materialAssetId;
    }

    // Capture initial state (no base material should be set)
    const initialDataValue = mockMeshAssetData.getOverridesForMaterial(mockMaterialName)?.material;
    const initialBabylonMaterialReflectionTexture = mockModelEditorViewController.getMaterialByName(mockMaterialName).overridesFromMaterial.reflectionTexture;
    const initialBabylonReflectionTexture = mockModelEditorViewController.getMaterialByName(mockMaterialName).reflectionTexture;
    const initialJsonValue = getJsonMaterialAssetId();
    const initialCachedMaterialReflectionTexture = await getCachedMaterialReflectionTexture();

    // Test
    const mutation = new SetModelMaterialOverrideBaseMaterialMutation(mockMeshAssetData.id, mockMaterialName, mockMaterialAssetDefinition.id);
    await mockModelEditorViewController.mutator.apply(mutation);

    // Capture updated state
    const updatedDataValue = mockMeshAssetData.getOverridesForMaterial(mockMaterialName)?.material;
    const updatedBabylonMaterialReflectionTexture = mockModelEditorViewController.getMaterialByName(mockMaterialName).overridesFromMaterial.reflectionTexture;
    const updatedBabylonReflectionTexture = mockModelEditorViewController.getMaterialByName(mockMaterialName).reflectionTexture;
    const updatedJsonValue = getJsonMaterialAssetId();
    const updatedCachedMaterialReflectionTexture = await getCachedMaterialReflectionTexture();

    // Assert
    /* Initial state (no base material) */
    expect(initialDataValue, "Material override data should not have base material defined initially").toBeUndefined();
    expect(initialBabylonMaterialReflectionTexture, "Babylon material should not have reflection texture from base material initially").toBeUndefined();
    expect(initialBabylonReflectionTexture, "Babylon material should not have reflection texture initially").toBeUndefined();
    expect(initialJsonValue, "Mesh asset definition should not have base material defined initially").toBeUndefined();
    expect(initialCachedMaterialReflectionTexture, "Cached material should not have reflection texture from base material initially").toBeUndefined();

    /* After setting base material */
    expect(updatedDataValue, "Material override data should have base material defined after mutation").toBeDefined();
    expect(updatedDataValue?.id, "Material override data should reference the correct base material").toBe(mockMaterialAssetDefinition.id);
    expect(updatedBabylonMaterialReflectionTexture, "Babylon material should have reflection texture from base material after mutation").toBeDefined();
    expect(updatedBabylonReflectionTexture, "Babylon material should have reflection texture after mutation").toBeDefined();
    expect(updatedJsonValue, "Mesh asset definition should have base material defined after mutation").toBe(mockMaterialAssetDefinition.id);
    expect(updatedCachedMaterialReflectionTexture, "Cached material should have reflection texture from base material after mutation").toBeDefined();
  });

  test("Changing from one base material to another updates material properties correctly", async () => {
    // Setup
    const mockMaterialName = 'Main'; // @NOTE Must match `sphere.mtl` - referenced in mock project definition
    let mockFirstTextureAssetDefinition!: TextureAssetDefinition;
    let mockSecondTextureAssetDefinition!: TextureAssetDefinition;
    let mockFirstMaterialAssetDefinition!: MaterialAssetDefinition;
    let mockSecondMaterialAssetDefinition!: MaterialAssetDefinition;
    let mockMeshAssetDefinition!: MeshAssetDefinition;

    const mock = new MockProject(({ manifest, asset, scene }) => {
      // Create textures
      mockFirstTextureAssetDefinition = asset(AssetType.Texture, 'textures/first-reflection.png', MockAssets.textures.stonesPng);
      mockSecondTextureAssetDefinition = asset(AssetType.Texture, 'textures/second-reflection.png', MockAssets.textures.asphaltPng);

      // Create first base material
      const mockFirstMaterial = createMockMaterial({
        reflection: {
          type: '3x2',
          strength: 1.0,
          textureAssetId: mockFirstTextureAssetDefinition.id,
        },
      });
      mockFirstMaterialAssetDefinition = asset(AssetType.Material, 'materials/firstBaseMaterial.pzmat', mockFirstMaterial.data);

      // Create second base material
      const mockSecondMaterial = createMockMaterial({
        reflection: {
          type: '6x1',
          strength: 0.8,
          textureAssetId: mockSecondTextureAssetDefinition.id,
        },
      });
      mockSecondMaterialAssetDefinition = asset(AssetType.Material, 'materials/secondBaseMaterial.pzmat', mockSecondMaterial.data);

      return {
        manifest: manifest(),
        assets: [
          mockFirstTextureAssetDefinition,
          mockSecondTextureAssetDefinition,
          mockFirstMaterialAssetDefinition,
          mockSecondMaterialAssetDefinition,
          mockMeshAssetDefinition = asset(AssetType.Mesh, 'models/sphere.obj', MockAssets.models.sphereObj, {
            materialOverrides: {
              [mockMaterialName]: {
                materialAssetId: mockFirstMaterialAssetDefinition.id, // Start with first material
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
      return material.overridesFromMaterial.reflectionTexture;
    }
    function getJsonMaterialAssetId(): string | undefined {
      const meshAssetDefinition = mockProjectController.projectDefinition.assets.find((asset) => asset.id === mockMeshAssetDefinition.id) as MeshAssetDefinition;
      return meshAssetDefinition.materialOverrides?.[mockMaterialName]?.materialAssetId;
    }

    // Capture initial state (should have first base material)
    const initialDataValue = mockMeshAssetData.getOverridesForMaterial(mockMaterialName)?.material;
    const initialBabylonMaterialReflectionTexture = mockModelEditorViewController.getMaterialByName(mockMaterialName).overridesFromMaterial.reflectionTexture;
    const initialBabylonReflectionTexture = mockModelEditorViewController.getMaterialByName(mockMaterialName).reflectionTexture;
    const initialJsonValue = getJsonMaterialAssetId();
    const initialCachedMaterialReflectionTexture = await getCachedMaterialReflectionTexture();

    // Test
    const mutation = new SetModelMaterialOverrideBaseMaterialMutation(mockMeshAssetData.id, mockMaterialName, mockSecondMaterialAssetDefinition.id);
    await mockModelEditorViewController.mutator.apply(mutation);

    // Capture updated state
    const updatedDataValue = mockMeshAssetData.getOverridesForMaterial(mockMaterialName)?.material;
    const updatedBabylonMaterialReflectionTexture = mockModelEditorViewController.getMaterialByName(mockMaterialName).overridesFromMaterial.reflectionTexture;
    const updatedBabylonReflectionTexture = mockModelEditorViewController.getMaterialByName(mockMaterialName).reflectionTexture;
    const updatedJsonValue = getJsonMaterialAssetId();
    const updatedCachedMaterialReflectionTexture = await getCachedMaterialReflectionTexture();

    // Assert
    /* Initial state (first base material) */
    expect(initialDataValue?.id, "Material override data should have first base material defined initially").toBe(mockFirstMaterialAssetDefinition.id);
    expect(initialBabylonMaterialReflectionTexture, "Babylon material should have reflection texture from first base material initially").toBeDefined();
    expect(initialBabylonReflectionTexture, "Babylon material should have reflection texture initially").toBeDefined();
    expect(initialJsonValue, "Mesh asset definition should have first base material defined initially").toBe(mockFirstMaterialAssetDefinition.id);
    expect(initialCachedMaterialReflectionTexture, "Cached material should have reflection texture from first base material initially").toBeDefined();

    /* After changing to second base material */
    expect(updatedDataValue?.id, "Material override data should have second base material defined after mutation").toBe(mockSecondMaterialAssetDefinition.id);
    expect(updatedBabylonMaterialReflectionTexture, "Babylon material should have reflection texture from second base material after mutation").toBeDefined();
    expect(updatedBabylonReflectionTexture, "Babylon material should have reflection texture after mutation").toBeDefined();
    expect(updatedJsonValue, "Mesh asset definition should have second base material defined after mutation").toBe(mockSecondMaterialAssetDefinition.id);
    expect(updatedCachedMaterialReflectionTexture, "Cached material should have reflection texture from second base material after mutation").toBeDefined();

    // The reflection textures should be different (since they come from different base materials)
    expect(initialBabylonMaterialReflectionTexture, "Initial and updated reflection textures should be different").not.toBe(updatedBabylonMaterialReflectionTexture);
    expect(initialCachedMaterialReflectionTexture, "Initial and updated cached reflection textures should be different").not.toBe(updatedCachedMaterialReflectionTexture);
  });

  test("Unsetting a base material removes base material properties", async () => {
    // Setup
    const mockMaterialName = 'Main'; // @NOTE Must match `sphere.mtl` - referenced in mock project definition
    let mockTextureAssetDefinition!: TextureAssetDefinition;
    let mockMaterialAssetDefinition!: MaterialAssetDefinition;
    let mockMeshAssetDefinition!: MeshAssetDefinition;

    const mock = new MockProject(({ manifest, asset, scene }) => {
      // Must define texture first since it is referenced by the material
      mockTextureAssetDefinition = asset(AssetType.Texture, 'textures/reflection.png', MockAssets.textures.stonesPng);

      const mockMaterial = createMockMaterial({
        reflection: {
          type: '3x2',
          strength: 1.0,
          textureAssetId: mockTextureAssetDefinition.id,
        },
      });
      mockMaterialAssetDefinition = asset(AssetType.Material, 'materials/baseMaterial.pzmat', mockMaterial.data);

      return {
        manifest: manifest(),
        assets: [
          mockTextureAssetDefinition,
          mockMaterialAssetDefinition,
          mockMeshAssetDefinition = asset(AssetType.Mesh, 'models/sphere.obj', MockAssets.models.sphereObj, {
            materialOverrides: {
              [mockMaterialName]: {
                materialAssetId: mockMaterialAssetDefinition.id, // Start with base material set
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
      return material.overridesFromMaterial.reflectionTexture;
    }
    function getJsonMaterialAssetId(): string | undefined {
      const meshAssetDefinition = mockProjectController.projectDefinition.assets.find((asset) => asset.id === mockMeshAssetDefinition.id) as MeshAssetDefinition;
      return meshAssetDefinition.materialOverrides?.[mockMaterialName]?.materialAssetId;
    }

    // Capture initial state (should have base material set)
    const initialDataValue = mockMeshAssetData.getOverridesForMaterial(mockMaterialName)?.material;
    const initialBabylonMaterialReflectionTexture = mockModelEditorViewController.getMaterialByName(mockMaterialName).overridesFromMaterial.reflectionTexture;
    const initialBabylonReflectionTexture = mockModelEditorViewController.getMaterialByName(mockMaterialName).reflectionTexture;
    const initialJsonValue = getJsonMaterialAssetId();
    const initialCachedMaterialReflectionTexture = await getCachedMaterialReflectionTexture();

    // Test
    const mutation = new SetModelMaterialOverrideBaseMaterialMutation(mockMeshAssetData.id, mockMaterialName, undefined);
    await mockModelEditorViewController.mutator.apply(mutation);

    // Capture updated state
    const updatedDataValue = mockMeshAssetData.getOverridesForMaterial(mockMaterialName)?.material;
    const updatedBabylonMaterialReflectionTexture = mockModelEditorViewController.getMaterialByName(mockMaterialName).overridesFromMaterial.reflectionTexture;
    const updatedBabylonReflectionTexture = mockModelEditorViewController.getMaterialByName(mockMaterialName).reflectionTexture;
    const updatedJsonValue = getJsonMaterialAssetId();
    const updatedCachedMaterialReflectionTexture = await getCachedMaterialReflectionTexture();

    // Assert
    /* Initial state (base material set) */
    expect(initialDataValue, "Material override data should have base material defined initially").toBeDefined();
    expect(initialDataValue?.id, "Material override data should reference the correct base material initially").toBe(mockMaterialAssetDefinition.id);
    expect(initialBabylonMaterialReflectionTexture, "Babylon material should have reflection texture from base material initially").toBeDefined();
    expect(initialBabylonReflectionTexture, "Babylon material should have reflection texture initially").toBeDefined();
    expect(initialJsonValue, "Mesh asset definition should have base material defined initially").toBe(mockMaterialAssetDefinition.id);
    expect(initialCachedMaterialReflectionTexture, "Cached material should have reflection texture from base material initially").toBeDefined();

    /* After unsetting base material */
    expect(updatedDataValue, "Material override data should not have base material defined after unsetting").toBeUndefined();
    expect(updatedBabylonMaterialReflectionTexture, "Babylon material should not have reflection texture from base material after unsetting").toBeUndefined();
    expect(updatedBabylonReflectionTexture, "Babylon material should not have reflection texture after unsetting").toBeUndefined();
    expect(updatedJsonValue, "Mesh asset definition should not have base material defined after unsetting").toBeUndefined();
    expect(updatedCachedMaterialReflectionTexture, "Cached material should not have reflection texture from base material after unsetting").toBeUndefined();
  });
});
