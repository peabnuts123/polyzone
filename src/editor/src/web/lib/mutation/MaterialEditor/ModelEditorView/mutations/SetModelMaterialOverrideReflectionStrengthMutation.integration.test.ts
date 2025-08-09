import { describe, test, expect } from 'vitest';

import { AssetType, MeshAssetMaterialOverrideReflectionData } from '@polyzone/runtime/src/cartridge';
import { RetroMaterial } from '@polyzone/runtime/src/materials/RetroMaterial';

import { MeshAssetDefinition, TextureAssetDefinition } from '@lib/project/definition';
import { MockProject } from '@test/integration/mock/project/MockProject';
import { MockAssets } from '@test/integration/mock/assets';
import { MockModelEditorViewController } from '@test/integration/mock/material-editor/MockModelEditorViewController';
import { MockProjectController } from '@test/integration/mock/project/MockProjectController';

import { SetModelMaterialOverrideReflectionStrengthMutation } from './SetModelMaterialOverrideReflectionStrengthMutation';

describe(SetModelMaterialOverrideReflectionStrengthMutation.name, () => {
  test("Setting reflection strength override on material with 3x2 reflection type updates state correctly", async () => {
    // Setup
    const mockMaterialName = 'Main'; // @NOTE Must match `sphere.mtl` - referenced in mock project definition
    let mockMeshAssetDefinition!: MeshAssetDefinition;
    let mockTextureAssetDefinition!: TextureAssetDefinition;
    const initialStrength = 0.5;
    const newStrength = 0.8;
    const mock = new MockProject(({ manifest, asset, scene }) => ({
      manifest: manifest(),
      assets: [
        mockTextureAssetDefinition = asset(AssetType.Texture, 'textures/skybox.png', MockAssets.textures.stonesPng),
        mockMeshAssetDefinition = asset(AssetType.Mesh, 'models/sphere.obj', MockAssets.models.sphereObj, {
          materialOverrides: {
            [mockMaterialName]: {
              reflection: {
                type: '3x2',
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
    }));

    const mockProjectController = await MockProjectController.create(mock);
    const mockMeshAssetData = mockProjectController.project.assets.getById(mockMeshAssetDefinition.id, AssetType.Mesh);
    const mockModelEditorViewController = await MockModelEditorViewController.create(mockProjectController, mockMeshAssetData);

    /* Test selector utilities */
    function getDataValue(): number | undefined {
      return (mockMeshAssetData.getOverridesForMaterial(mockMaterialName)?.reflection as MeshAssetMaterialOverrideReflectionData)?.strength;
    }
    function getBabylonValue(): number | undefined {
      return mockModelEditorViewController.getMaterialByName(mockMaterialName).overridesFromAsset.reflectionTexture?.level;
    }
    function getJsonValue(): number | undefined {
      const assetDefinition = mockProjectController.projectDefinition.assets.find((asset) => asset.id === mockMeshAssetDefinition.id) as MeshAssetDefinition;
      return assetDefinition.materialOverrides![mockMaterialName].reflection?.strength;
    }
    async function getCachedMaterialReflectionStrength(): Promise<number | undefined> {
      const asset = await mockProjectController.assetCache.loadAsset(mockMeshAssetData, mockModelEditorViewController.scene);
      const material = asset.assetContainer.materials.find((material) => material.name === mockMaterialName) as RetroMaterial;
      return material.reflectionTexture?.level;
    }

    /* Capture initial state */
    const initialDataValue = getDataValue();
    const initialBabylonValue = getBabylonValue();
    const initialJsonValue = getJsonValue();
    const initialCachedMaterialReflectionStrength = await getCachedMaterialReflectionStrength();

    const mutation = new SetModelMaterialOverrideReflectionStrengthMutation(
      mockMeshAssetData.id,
      mockMaterialName,
    );

    // Test
    await mockModelEditorViewController.mutator.beginContinuous(mutation);
    await mockModelEditorViewController.mutator.updateContinuous(mutation, { reflectionStrength: newStrength });
    await mockModelEditorViewController.mutator.apply(mutation);

    /* Capture updated state */
    const updatedDataValue = getDataValue();
    const updatedBabylonValue = getBabylonValue();
    const updatedJsonValue = getJsonValue();
    const updatedCachedMaterialReflectionStrength = await getCachedMaterialReflectionStrength();

    // Assert
    /* Initial state */
    expect(initialDataValue, "Mesh asset data should have initial reflection strength").toBe(initialStrength);
    expect(initialBabylonValue, "Babylon material should have initial reflection strength").toBe(initialStrength);
    expect(initialJsonValue, "Mesh asset definition should have initial reflection strength").toBe(initialStrength);
    expect(initialCachedMaterialReflectionStrength, "Cached material should have initial reflection strength").toBe(initialStrength);

    /* After mutation */
    expect(updatedDataValue, "Mesh asset data should have updated reflection strength after mutation").toBe(newStrength);
    expect(updatedBabylonValue, "Babylon material should have updated reflection strength after mutation").toBe(newStrength);
    expect(updatedJsonValue, "Mesh asset definition should have updated reflection strength after mutation").toBe(newStrength);
    expect(updatedCachedMaterialReflectionStrength, "Cached material should have updated reflection strength after mutation").toBe(newStrength);
  });

  test("Multiple updates before apply only persists final value", async () => {
    // Setup
    const mockMaterialName = 'Main'; // @NOTE Must match `sphere.mtl` - referenced in mock project definition
    let mockMeshAssetDefinition!: MeshAssetDefinition;
    let mockTextureAssetDefinition!: TextureAssetDefinition;
    const initialStrength = 0.2;
    const mock = new MockProject(({ manifest, asset, scene }) => ({
      manifest: manifest(),
      assets: [
        mockTextureAssetDefinition = asset(AssetType.Texture, 'textures/skybox.png', MockAssets.textures.stonesPng),
        mockMeshAssetDefinition = asset(AssetType.Mesh, 'models/sphere.obj', MockAssets.models.sphereObj, {
          materialOverrides: {
            [mockMaterialName]: {
              reflection: {
                type: 'box-net',
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
    }));

    const mockProjectController = await MockProjectController.create(mock);
    const mockMeshAssetData = mockProjectController.project.assets.getById(mockMeshAssetDefinition.id, AssetType.Mesh);
    const mockModelEditorViewController = await MockModelEditorViewController.create(mockProjectController, mockMeshAssetData);

    /* Test selector utilities */
    function getDataValue(): number | undefined {
      return (mockMeshAssetData.getOverridesForMaterial(mockMaterialName)?.reflection as MeshAssetMaterialOverrideReflectionData)?.strength;
    }
    function getBabylonValue(): number | undefined {
      return mockModelEditorViewController.getMaterialByName(mockMaterialName).overridesFromAsset.reflectionTexture?.level;
    }
    function getJsonValue(): number | undefined {
      const assetDefinition = mockProjectController.projectDefinition.assets.find((asset) => asset.id === mockMeshAssetDefinition.id) as MeshAssetDefinition;
      return assetDefinition.materialOverrides![mockMaterialName].reflection?.strength;
    }

    /* Capture initial state */
    const initialDataValue = getDataValue();
    const initialBabylonValue = getBabylonValue();
    const initialJsonValue = getJsonValue();

    const mutation = new SetModelMaterialOverrideReflectionStrengthMutation(
      mockMeshAssetData.id,
      mockMaterialName,
    );

    // Test
    await mockModelEditorViewController.mutator.beginContinuous(mutation);

    // Multiple updates - simulate dragging a slider
    let intermediateStrength = 0;
    for (let i = 1; i <= 5; i++) {
      intermediateStrength = i * 0.1;
      await mockModelEditorViewController.mutator.updateContinuous(mutation, { reflectionStrength: intermediateStrength });

      const intermediateDataValue = getDataValue();
      const intermediateBabylonValue = getBabylonValue();
      const intermediateJsonValue = getJsonValue();

      expect(intermediateDataValue, `Mesh asset data should have intermediate reflection strength on update ${i}`).toBe(intermediateStrength);
      expect(intermediateBabylonValue, `Babylon material should have intermediate reflection strength on update ${i}`).toBe(intermediateStrength);
      expect(intermediateJsonValue, `Mesh asset definition should still have initial reflection strength on update ${i} (not persisted yet)`).toBe(initialStrength);
    }

    await mockModelEditorViewController.mutator.apply(mutation);

    /* Capture final state */
    const finalDataValue = getDataValue();
    const finalBabylonValue = getBabylonValue();
    const finalJsonValue = getJsonValue();

    // Assert
    /* Initial state */
    expect(initialDataValue, "Mesh asset data should have initial reflection strength").toBe(initialStrength);
    expect(initialBabylonValue, "Babylon material should have initial reflection strength").toBe(initialStrength);
    expect(initialJsonValue, "Mesh asset definition should have initial reflection strength").toBe(initialStrength);

    /* Final state */
    expect(finalDataValue, "Mesh asset data should have final reflection strength").toBe(intermediateStrength);
    expect(finalBabylonValue, "Babylon material should have final reflection strength").toBe(intermediateStrength);
    expect(finalJsonValue, "Mesh asset definition should have final reflection strength (persisted only at the end)").toBe(intermediateStrength);
  });

  test("Attempting to set reflection strength on material without reflection override throws error", async () => {
    // Setup
    const mockMaterialName = 'Main'; // @NOTE Must match `sphere.mtl` - referenced in mock project definition
    let mockMeshAssetDefinition!: MeshAssetDefinition;
    const mock = new MockProject(({ manifest, asset, scene }) => ({
      manifest: manifest(),
      assets: [
        mockMeshAssetDefinition = asset(AssetType.Mesh, 'models/sphere.obj', MockAssets.models.sphereObj, {
          materialOverrides: {
            [mockMaterialName]: {
              // @NOTE No reflection config - material doesn't have any reflection override set
              diffuseColor: { r: 255, g: 128, b: 0 },
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

    const mutation = new SetModelMaterialOverrideReflectionStrengthMutation(
      mockMeshAssetData.id,
      mockMaterialName,
    );

    // Test
    const testFunc = async (): Promise<void> => {
      return mockModelEditorViewController.mutator.beginContinuous(mutation);
    };

    // Assert
    await expect(testFunc, "Should throw error when trying to set reflection strength on material without reflection override")
      .rejects.toThrow("Cannot set reflection strength for material override - the material doesn't have a reflection override yet");
  });
});
