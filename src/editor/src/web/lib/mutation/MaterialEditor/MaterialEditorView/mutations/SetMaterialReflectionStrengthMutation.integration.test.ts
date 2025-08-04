import { describe, test, expect } from 'vitest';

import { AssetType, MeshAssetMaterialOverrideReflectionData } from '@polyzone/runtime/src/cartridge';
import { MaterialAsset } from '@polyzone/runtime/src/world';

import { MaterialAssetDefinition, TextureAssetDefinition } from '@lib/project/definition';
import { MockProject } from '@test/integration/mock/project/MockProject';
import { MockAssets } from '@test/integration/mock/assets';
import { MockMaterialEditorViewController } from '@test/integration/mock/material-editor/MockMaterialEditorViewController';
import { MockProjectController } from '@test/integration/mock/project/MockProjectController';
import { createMockMaterial, MockMaterial } from '@test/integration/mock/material-editor/createMockMaterial';

import { SetMaterialReflectionStrengthMutation } from './SetMaterialReflectionStrengthMutation';

describe(SetMaterialReflectionStrengthMutation.name, () => {
  test("Setting reflection strength on material with 3x2 reflection type updates state correctly", async () => {
    // Setup
    let mockTextureAssetDefinition!: TextureAssetDefinition;
    let mockMaterialAssetDefinition!: MaterialAssetDefinition;
    let mockMaterial!: MockMaterial;
    const initialStrength = 0.5;
    const newStrength = 0.8;
    const mock = new MockProject(({ manifest, asset, scene }) => {
      mockTextureAssetDefinition = asset(AssetType.Texture, 'textures/skybox.png', MockAssets.textures.stonesPng);
      mockMaterial = createMockMaterial({
        reflection: {
          type: '3x2',
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

    /* Test selector utilities */
    function getDataValue(): number | undefined {
      return (mockMaterialEditorViewController.materialData.reflection as MeshAssetMaterialOverrideReflectionData)?.strength;
    }
    function getBabylonValue(): number | undefined {
      return mockMaterialEditorViewController.materialInstance.reflectionTexture?.level;
    }
    function getJsonValue(): number | undefined {
      return mockMaterialEditorViewController.materialJson.value.reflection?.strength;
    }
    async function getCachedAssetReflectionStrength(): Promise<number | undefined> {
      const asset = await mockProjectController.assetCache.loadAsset(mockMaterialEditorViewController.materialAssetData, mockMaterialEditorViewController.scene) as MaterialAsset;
      return asset.reflectionTexture?.level;
    }

    /* Capture initial state */
    const initialDataValue = getDataValue();
    const initialBabylonValue = getBabylonValue();
    const initialJsonValue = getJsonValue();
    const initialCachedAssetReflectionStrength = await getCachedAssetReflectionStrength();

    const mutation = new SetMaterialReflectionStrengthMutation();

    // Test
    await mockMaterialEditorViewController.mutator.beginContinuous(mutation);
    mockMaterialEditorViewController.mutator.updateContinuous(mutation, { reflectionStrength: newStrength });
    await mockMaterialEditorViewController.mutator.apply(mutation);

    /* Capture updated state */
    const updatedDataValue = getDataValue();
    const updatedBabylonValue = getBabylonValue();
    const updatedJsonValue = getJsonValue();
    const updatedCachedAssetReflectionStrength = await getCachedAssetReflectionStrength();

    // Assert
    /* Initial state */
    expect(initialDataValue, "Material data should have initial reflection strength").toBe(initialStrength);
    expect(initialBabylonValue, "Babylon material should have initial reflection strength").toBe(initialStrength);
    expect(initialJsonValue, "Material asset should have initial reflection strength").toBe(initialStrength);
    expect(initialCachedAssetReflectionStrength, "Cached material should have initial reflection strength").toBe(initialStrength);

    /* After mutation */
    expect(updatedDataValue, "Material data should have updated reflection strength after mutation").toBe(newStrength);
    expect(updatedBabylonValue, "Babylon material should have updated reflection strength after mutation").toBe(newStrength);
    expect(updatedJsonValue, "Material asset should have updated reflection strength after mutation").toBe(newStrength);
    expect(updatedCachedAssetReflectionStrength, "Cached material should have updated reflection strength after mutation").toBe(newStrength);
  });

  test("Multiple updates before apply only persists final value", async () => {
    // Setup
    let mockTextureAssetDefinition!: TextureAssetDefinition;
    let mockMaterialAssetDefinition!: MaterialAssetDefinition;
    let mockMaterial!: MockMaterial;
    const initialStrength = 0.2;
    const mock = new MockProject(({ manifest, asset, scene }) => {
      mockTextureAssetDefinition = asset(AssetType.Texture, 'textures/skybox.png', MockAssets.textures.stonesPng);
      mockMaterial = createMockMaterial({
        reflection: {
          type: 'box-net',
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

    /* Test selector utilities */
    function getDataValue(): number | undefined {
      return (mockMaterialEditorViewController.materialData.reflection as MeshAssetMaterialOverrideReflectionData)?.strength;
    }
    function getBabylonValue(): number | undefined {
      return mockMaterialEditorViewController.materialInstance.reflectionTexture?.level;
    }
    function getJsonValue(): number | undefined {
      return mockMaterialEditorViewController.materialJson.value.reflection?.strength;
    }

    /* Capture initial state */
    const initialDataValue = getDataValue();
    const initialBabylonValue = getBabylonValue();
    const initialJsonValue = getJsonValue();

    const mutation = new SetMaterialReflectionStrengthMutation();

    // Test
    await mockMaterialEditorViewController.mutator.beginContinuous(mutation);

    // Multiple updates - simulate dragging a slider
    let intermediateStrength = 0;
    for (let i = 1; i <= 5; i++) {
      intermediateStrength = i * 0.1;
      await mockMaterialEditorViewController.mutator.updateContinuous(mutation, { reflectionStrength: intermediateStrength });

      const intermediateDataValue = getDataValue();
      const intermediateBabylonValue = getBabylonValue();
      const intermediateJsonValue = getJsonValue();

      expect(intermediateDataValue, `Material data should have intermediate reflection strength on update ${i}`).toBe(intermediateStrength);
      expect(intermediateBabylonValue, `Babylon material should have intermediate reflection strength on update ${i}`).toBe(intermediateStrength);
      expect(intermediateJsonValue, `Material asset should still have initial reflection strength on update ${i} (not persisted yet)`).toBe(initialStrength);
    }

    await mockMaterialEditorViewController.mutator.apply(mutation);

    /* Capture final state */
    const finalDataValue = getDataValue();
    const finalBabylonValue = getBabylonValue();
    const finalJsonValue = getJsonValue();

    // Assert
    /* Initial state */
    expect(initialDataValue, "Material data should have initial reflection strength").toBe(initialStrength);
    expect(initialBabylonValue, "Babylon material should have initial reflection strength").toBe(initialStrength);
    expect(initialJsonValue, "Material asset should have initial reflection strength").toBe(initialStrength);

    /* Final state */
    expect(finalDataValue, "Material data should have final reflection strength").toBe(intermediateStrength);
    expect(finalBabylonValue, "Babylon material should have final reflection strength").toBe(intermediateStrength);
    expect(finalJsonValue, "Material asset should have final reflection strength (persisted only at the end)").toBe(intermediateStrength);
  });

  test("Attempting to set reflection strength on material without reflection type throws error", async () => {
    // Setup
    let mockMaterialAssetDefinition!: MaterialAssetDefinition;
    let mockMaterial!: MockMaterial;
    const mock = new MockProject(({ manifest, asset, scene }) => {
      mockMaterial = createMockMaterial({
        // @NOTE No reflection config - material doesn't have any reflection type set
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

    const mutation = new SetMaterialReflectionStrengthMutation();

    // Test
    const testFunc = async (): Promise<void> => {
      return mockMaterialEditorViewController.mutator.beginContinuous(mutation);
    };

    // Assert
    await expect(testFunc, "Should throw error when trying to set reflection strength on material without reflection type")
      .rejects.toThrow("Cannot set reflection strength for material - the material doesn't have the correct reflection type set");
  });
});
