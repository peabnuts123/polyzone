import { describe, test, expect } from 'vitest';
import { BaseTexture } from '@babylonjs/core/Materials/Textures/baseTexture';

import { AssetType } from '@polyzone/runtime/src/cartridge';
import { RetroMaterial } from '@polyzone/runtime/src/materials/RetroMaterial';

import { MeshAssetDefinition, TextureAssetDefinition } from '@lib/project';
import { MockProject } from '@test/integration/mock/project/MockProject';
import { MockAssets } from '@test/integration/mock/assets';
import { MockProjectController } from '@test/integration/mock/project/MockProjectController';
import { MockModelEditorViewController } from '@test/integration/mock/material-editor/MockModelEditorViewController';

import { SetModelMaterialOverrideDiffuseTextureMutation } from './SetModelMaterialOverrideDiffuseTextureMutation';

describe(SetModelMaterialOverrideDiffuseTextureMutation.name, () => {
  test("Setting diffuse texture override on material with no texture updates state correctly", async () => {
    // Setup
    const mockMaterialName = 'Main'; // @NOTE Must match `sphere.mtl` - referenced in mock project definition
    let mockTextureAssetDefinition!: TextureAssetDefinition;
    let mockMeshAssetDefinition!: MeshAssetDefinition;
    const mock = new MockProject(({ manifest, asset, scene }) => {
      // Must define texture first since it will be referenced by the mutation
      mockTextureAssetDefinition = asset(AssetType.Texture, 'textures/asphalt.png', MockAssets.textures.asphaltPng);

      return {
        manifest: manifest(),
        assets: [
          mockTextureAssetDefinition,
          mockMeshAssetDefinition = asset(AssetType.Mesh, 'models/sphere.obj', MockAssets.models.sphereObj, {
            materialOverrides: {
              [mockMaterialName]: {
                // @NOTE Empty material override i.e. no diffuse texture setting
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
    async function getCachedMaterialDiffuseTexture(): Promise<BaseTexture | undefined> {
      const asset = await mockProjectController.assetCache.loadAsset(mockMeshAssetData, mockModelEditorViewController.scene);
      const material = asset.assetContainer.materials.find((material) => material.name === mockMaterialName) as RetroMaterial;
      return material.overridesFromAsset.diffuseTexture;
    }

    // Capture initial state
    const initialDataValue = mockMeshAssetData.getOverridesForMaterial(mockMaterialName)?.diffuseTexture;
    const initialBabylonTextureValue = mockModelEditorViewController.getMaterialByName(mockMaterialName).overridesFromAsset.diffuseTexture;
    const initialJsonValue = (mockProjectController.projectDefinition.assets.find((asset) => asset.id === mockMeshAssetDefinition.id) as MeshAssetDefinition).materialOverrides?.[mockMaterialName]?.diffuseTextureAssetId;
    const initialCachedTexture = await getCachedMaterialDiffuseTexture();

    // Enable diffuse texture (required for the mutation to work properly)
    mockMeshAssetData.setMaterialOverride(mockMaterialName, (overrides) => {
      overrides.diffuseTextureEnabled = true;
    });

    const mutation = new SetModelMaterialOverrideDiffuseTextureMutation(mockMeshAssetData.id, mockMaterialName, mockTextureAssetDefinition.id);

    // Test
    await mockModelEditorViewController.mutator.apply(mutation);

    const updatedDataValue = mockMeshAssetData.getOverridesForMaterial(mockMaterialName)?.diffuseTexture;
    const updatedBabylonTextureValue = mockModelEditorViewController.getMaterialByName(mockMaterialName).overridesFromAsset.diffuseTexture;
    const updatedJsonValue = (mockProjectController.projectDefinition.assets.find((asset) => asset.id === mockMeshAssetDefinition.id) as MeshAssetDefinition).materialOverrides?.[mockMaterialName]?.diffuseTextureAssetId;
    const updatedCachedTexture = await getCachedMaterialDiffuseTexture();

    // Assert
    /* Initial state */
    expect(initialDataValue, "Material override data should not have diffuse texture defined initially").toBeUndefined();
    expect(initialBabylonTextureValue, "Babylon material should not have diffuse texture defined initially").toBeUndefined();
    expect(initialJsonValue, "Mesh asset definition should not have diffuse texture defined initially").toBeUndefined();
    expect(initialCachedTexture, "Cached material should not have diffuse texture defined initially").toBeUndefined();

    /* After mutation */
    expect(updatedDataValue?.id, "Material override data should have the correct diffuse texture after mutation").toBe(mockTextureAssetDefinition.id);
    expect(updatedBabylonTextureValue, "Babylon material should have diffuse texture defined after mutation").toBeDefined();
    expect(updatedJsonValue, "Mesh asset definition should have diffuse texture defined after mutation").toBe(mockTextureAssetDefinition.id);
    expect(updatedCachedTexture, "Cached material should have diffuse texture defined after mutation").toBeDefined();
  });

  test("Changing diffuse texture override on material with existing texture updates state correctly", async () => {
    // Setup
    const mockMaterialName = 'Main'; // @NOTE Must match `sphere.mtl` - referenced in mock project definition
    let mockTextureAssetDefinition1!: TextureAssetDefinition;
    let mockTextureAssetDefinition2!: TextureAssetDefinition;
    let mockMeshAssetDefinition!: MeshAssetDefinition;
    const mock = new MockProject(({ manifest, asset, scene }) => {
      // Define both textures
      mockTextureAssetDefinition1 = asset(AssetType.Texture, 'textures/asphalt.png', MockAssets.textures.asphaltPng);
      mockTextureAssetDefinition2 = asset(AssetType.Texture, 'textures/stones.png', MockAssets.textures.stonesPng);

      return {
        manifest: manifest(),
        assets: [
          mockTextureAssetDefinition1,
          mockTextureAssetDefinition2,
          mockMeshAssetDefinition = asset(AssetType.Mesh, 'models/sphere.obj', MockAssets.models.sphereObj, {
            materialOverrides: {
              [mockMaterialName]: {
                diffuseTextureAssetId: mockTextureAssetDefinition1.id,
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
    async function getCachedMaterialDiffuseTexture(): Promise<BaseTexture | undefined> {
      const asset = await mockProjectController.assetCache.loadAsset(mockMeshAssetData, mockModelEditorViewController.scene);
      const material = asset.assetContainer.materials.find((material) => material.name === mockMaterialName) as RetroMaterial;
      return material.overridesFromAsset.diffuseTexture;
    }

    // Capture initial state
    const initialDataValue = mockMeshAssetData.getOverridesForMaterial(mockMaterialName)?.diffuseTexture;
    const initialBabylonTextureValue = mockModelEditorViewController.getMaterialByName(mockMaterialName).overridesFromAsset.diffuseTexture;
    const initialJsonValue = (mockProjectController.projectDefinition.assets.find((asset) => asset.id === mockMeshAssetDefinition.id) as MeshAssetDefinition).materialOverrides?.[mockMaterialName]?.diffuseTextureAssetId;
    const initialCachedTexture = await getCachedMaterialDiffuseTexture();

    const mutation = new SetModelMaterialOverrideDiffuseTextureMutation(mockMeshAssetData.id, mockMaterialName, mockTextureAssetDefinition2.id);

    // Test
    await mockModelEditorViewController.mutator.apply(mutation);

    const updatedDataValue = mockMeshAssetData.getOverridesForMaterial(mockMaterialName)?.diffuseTexture;
    const updatedBabylonTextureValue = mockModelEditorViewController.getMaterialByName(mockMaterialName).overridesFromAsset.diffuseTexture;
    const updatedJsonValue = (mockProjectController.projectDefinition.assets.find((asset) => asset.id === mockMeshAssetDefinition.id) as MeshAssetDefinition).materialOverrides?.[mockMaterialName]?.diffuseTextureAssetId;
    const updatedCachedTexture = await getCachedMaterialDiffuseTexture();

    // Assert
    /* Initial state */
    expect(initialDataValue?.id, "Material override data should have the initial diffuse texture").toBe(mockTextureAssetDefinition1.id);
    expect(initialBabylonTextureValue, "Babylon material should have diffuse texture defined initially").toBeDefined();
    expect(initialJsonValue, "Mesh asset definition should have the initial diffuse texture").toBe(mockTextureAssetDefinition1.id);
    expect(initialCachedTexture, "Cached material should have diffuse texture defined initially").toBeDefined();

    /* After mutation */
    expect(updatedDataValue?.id, "Material override data should have the updated diffuse texture after mutation").toBe(mockTextureAssetDefinition2.id);
    expect(updatedBabylonTextureValue, "Babylon material should have diffuse texture defined after mutation").toBeDefined();
    expect(updatedJsonValue, "Mesh asset definition should have the updated diffuse texture after mutation").toBe(mockTextureAssetDefinition2.id);
    expect(updatedCachedTexture, "Cached material should have diffuse texture defined after mutation").toBeDefined();
  });

  test("Removing diffuse texture override on material with existing texture updates state correctly", async () => {
    // Setup
    const mockMaterialName = 'Main'; // @NOTE Must match `sphere.mtl` - referenced in mock project definition
    let mockTextureAssetDefinition!: TextureAssetDefinition;
    let mockMeshAssetDefinition!: MeshAssetDefinition;
    const mock = new MockProject(({ manifest, asset, scene }) => {
      // Define texture first since it will be referenced by the material override
      mockTextureAssetDefinition = asset(AssetType.Texture, 'textures/asphalt.png', MockAssets.textures.asphaltPng);

      return {
        manifest: manifest(),
        assets: [
          mockTextureAssetDefinition,
          mockMeshAssetDefinition = asset(AssetType.Mesh, 'models/sphere.obj', MockAssets.models.sphereObj, {
            materialOverrides: {
              [mockMaterialName]: {
                diffuseTextureAssetId: mockTextureAssetDefinition.id,
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
    async function getCachedMaterialDiffuseTexture(): Promise<BaseTexture | undefined> {
      const asset = await mockProjectController.assetCache.loadAsset(mockMeshAssetData, mockModelEditorViewController.scene);
      const material = asset.assetContainer.materials.find((material) => material.name === mockMaterialName) as RetroMaterial;
      return material.overridesFromAsset.diffuseTexture;
    }

    // Capture initial state
    const initialDataValue = mockMeshAssetData.getOverridesForMaterial(mockMaterialName)?.diffuseTexture;
    const initialBabylonTextureValue = mockModelEditorViewController.getMaterialByName(mockMaterialName).overridesFromAsset.diffuseTexture;
    const initialJsonValue = (mockProjectController.projectDefinition.assets.find((asset) => asset.id === mockMeshAssetDefinition.id) as MeshAssetDefinition).materialOverrides?.[mockMaterialName]?.diffuseTextureAssetId;
    const initialCachedTexture = await getCachedMaterialDiffuseTexture();

    const mutation = new SetModelMaterialOverrideDiffuseTextureMutation(mockMeshAssetData.id, mockMaterialName, undefined);

    // Test
    await mockModelEditorViewController.mutator.apply(mutation);

    const updatedDataValue = mockMeshAssetData.getOverridesForMaterial(mockMaterialName)?.diffuseTexture;
    const updatedBabylonTextureValue = mockModelEditorViewController.getMaterialByName(mockMaterialName).overridesFromAsset.diffuseTexture;
    const updatedJsonValue = (mockProjectController.projectDefinition.assets.find((asset) => asset.id === mockMeshAssetDefinition.id) as MeshAssetDefinition).materialOverrides?.[mockMaterialName]?.diffuseTextureAssetId;
    const updatedCachedTexture = await getCachedMaterialDiffuseTexture();

    // Assert
    /* Initial state */
    expect(initialDataValue?.id, "Material override data should have the initial diffuse texture").toBe(mockTextureAssetDefinition.id);
    expect(initialBabylonTextureValue, "Babylon material should have diffuse texture defined initially").toBeDefined();
    expect(initialJsonValue, "Mesh asset definition should have the initial diffuse texture").toBe(mockTextureAssetDefinition.id);
    expect(initialCachedTexture, "Cached material should have diffuse texture defined initially").toBeDefined();

    /* After mutation */
    expect(updatedDataValue, "Material override data should not have diffuse texture defined after mutation").toBeUndefined();
    expect(updatedBabylonTextureValue, "Babylon material should not have diffuse texture defined after mutation").toBeUndefined();
    expect(updatedJsonValue, "Mesh asset definition should not have diffuse texture defined after mutation").toBeUndefined();
    expect(updatedCachedTexture, "Cached material should not have diffuse texture defined after mutation").toBeUndefined();
  });
});
