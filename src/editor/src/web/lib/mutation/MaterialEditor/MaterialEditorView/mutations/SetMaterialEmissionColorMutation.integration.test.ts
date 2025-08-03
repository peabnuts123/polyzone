import { describe, test, expect } from 'vitest';

import { AssetType } from '@polyzone/runtime/src/cartridge';
import { Color3 } from '@polyzone/core/src/util';
import { toColor3Babylon, toColor3Core, toColor3Definition } from '@polyzone/runtime/src/util';

import { MaterialAssetDefinition } from '@lib/project';
import { createMockMaterial } from '@test/integration/mock/material-editor/createMockMaterial';
import { MockProject } from '@test/integration/mock/project/MockProject';
import { MockProjectController } from '@test/integration/mock/project/MockProjectController';
import { MockMaterialEditorViewController } from '@test/integration/mock/material-editor/MockMaterialEditorViewController';

import { SetMaterialEmissionColorMutation } from './SetMaterialEmissionColorMutation';


describe(SetMaterialEmissionColorMutation.name, () => {
  test("Setting emission color on material with no existing color", async () => {
    // Setup
    const mockMaterial = createMockMaterial({
      // @NOTE Empty material i.e. no emission color setting
    });
    let mockMaterialAssetDefinition!: MaterialAssetDefinition;
    const mock = new MockProject(({ manifest, asset, scene }) => ({
      manifest: manifest(),
      assets: [
        mockMaterialAssetDefinition = asset(AssetType.Material, 'materials/mock.pzmat', mockMaterial.data),
      ],
      scenes: [
        scene('sample'),
      ],
    }));
    const mockProjectController = await MockProjectController.create(mock);
    const mockMaterialEditorViewController = await MockMaterialEditorViewController.create(
      mockProjectController,
      mockMaterialAssetDefinition,
      mockMaterial.definition,
    );

    // Enable emission color first (simulating user checking the "enabled" box in UI)
    mockMaterialEditorViewController.materialData.emissionColorEnabled = true;

    const initialDataValue = mockMaterialEditorViewController.materialData.emissionColor;
    const initialBabylonColorValue = mockMaterialEditorViewController.materialInstance.emissionColor;
    const initialJsonValue = mockMaterialEditorViewController.materialJson.value.emissionColor;
    const initialCachedAsset = await mockProjectController.assetCache.loadAsset(mockMaterialEditorViewController.materialAssetData, mockMaterialEditorViewController.scene);

    const newColor = new Color3(255, 128, 0);
    const mutation = new SetMaterialEmissionColorMutation();

    // Test continuous mutation flow
    await mockMaterialEditorViewController.mutator.beginContinuous(mutation);
    await mockMaterialEditorViewController.mutator.updateContinuous(mutation, { emissionColor: newColor });

    const afterUpdateDataValue = mockMaterialEditorViewController.materialData.emissionColor;
    const afterUpdateBabylonColorValue = mockMaterialEditorViewController.materialInstance.emissionColor;

    await mockMaterialEditorViewController.mutator.apply(mutation);

    const finalDataValue = mockMaterialEditorViewController.materialData.emissionColor;
    const finalBabylonColorValue = mockMaterialEditorViewController.materialInstance.emissionColor;
    const finalJsonValue = mockMaterialEditorViewController.materialJson.value.emissionColor;
    const finalCachedAsset = await mockProjectController.assetCache.loadAsset(mockMaterialEditorViewController.materialAssetData, mockMaterialEditorViewController.scene);

    // Assert
    /* Initial state */
    expect(initialDataValue, "Material data should not have an emission color defined initially").toBeUndefined();
    expect(initialBabylonColorValue, "Babylon material should not have an emission color defined initially").toBeUndefined();
    expect(initialJsonValue, "Material asset should not have an emission color defined initially").toBeUndefined();
    expect(initialCachedAsset.emissionColor, "Cached material should not have an emission color defined initially").toBeUndefined();

    /* After update() */
    expect(afterUpdateDataValue, "Material data should have the new emission color after update").toEqual(newColor);
    expect(afterUpdateBabylonColorValue, "Babylon material should have the correct color after update").toEqual(toColor3Babylon(newColor));

    /* After apply() */
    expect(finalDataValue, "Material data should still have the new emission color after apply").toEqual(newColor);
    expect(finalBabylonColorValue, "Babylon material should still have the correct color after apply").toEqual(toColor3Babylon(newColor));
    expect(finalJsonValue, "Material asset should have the new emission color persisted").toEqual(toColor3Definition(newColor));
    expect(finalCachedAsset.emissionColor, "Cached material should have the correct color").toEqual(toColor3Babylon(newColor));
  });

  test("Updating existing emission color on material", async () => {
    // Setup
    const initialColor = { r: 100, g: 200, b: 50 };
    const mockMaterial = createMockMaterial({
      emissionColor: initialColor,
    });
    let mockMaterialAssetDefinition!: MaterialAssetDefinition;
    const mock = new MockProject(({ manifest, asset, scene }) => ({
      manifest: manifest(),
      assets: [
        mockMaterialAssetDefinition = asset(AssetType.Material, 'materials/mock.pzmat', mockMaterial.data),
      ],
      scenes: [
        scene('sample'),
      ],
    }));
    const mockProjectController = await MockProjectController.create(mock);
    const mockMaterialEditorViewController = await MockMaterialEditorViewController.create(
      mockProjectController,
      mockMaterialAssetDefinition,
      mockMaterial.definition,
    );

    const initialDataValue = mockMaterialEditorViewController.materialData.emissionColor;
    const initialBabylonColorValue = mockMaterialEditorViewController.materialInstance.emissionColor;
    const initialJsonValue = mockMaterialEditorViewController.materialJson.value.emissionColor;
    const initialCachedAsset = await mockProjectController.assetCache.loadAsset(mockMaterialEditorViewController.materialAssetData, mockMaterialEditorViewController.scene);

    const newColor = new Color3(255, 64, 128);
    const mutation = new SetMaterialEmissionColorMutation();

    // Test continuous mutation flow
    await mockMaterialEditorViewController.mutator.beginContinuous(mutation);

    await mockMaterialEditorViewController.mutator.updateContinuous(mutation, { emissionColor: newColor });

    await mockMaterialEditorViewController.mutator.apply(mutation);

    const finalDataValue = mockMaterialEditorViewController.materialData.emissionColor;
    const finalBabylonColorValue = mockMaterialEditorViewController.materialInstance.emissionColor;
    const finalJsonValue = mockMaterialEditorViewController.materialJson.value.emissionColor;
    const finalCachedAsset = await mockProjectController.assetCache.loadAsset(mockMaterialEditorViewController.materialAssetData, mockMaterialEditorViewController.scene);

    // Assert
    /* Initial state */
    expect(initialDataValue, "Material data should have the initial emission color").toEqual(toColor3Core(initialColor));
    expect(initialBabylonColorValue, "Babylon material should have the correct initial color").toEqual(toColor3Babylon(initialColor));
    expect(initialJsonValue, "Material asset should have the initial emission color").toEqual(initialColor);
    expect(initialCachedAsset.emissionColor, "Cached material should have the correct initial color").toEqual(toColor3Babylon(initialColor));

    /* After mutation */
    expect(finalDataValue, "Material data should have the new emission color").toEqual(newColor);
    expect(finalBabylonColorValue, "Babylon material should have the correct new color").toEqual(toColor3Babylon(newColor));
    expect(finalJsonValue, "Material asset should have the new emission color persisted").toEqual(toColor3Definition(newColor));
    expect(finalCachedAsset.emissionColor, "Cached material should have the correct new color").toEqual(toColor3Babylon(newColor));
  });

  test("Multiple updates before apply only persists final value", async () => {
    // Setup
    const mockMaterial = createMockMaterial({
      emissionColor: { r: 255, g: 255, b: 255 },
    });
    let mockMaterialAssetDefinition!: MaterialAssetDefinition;
    const mock = new MockProject(({ manifest, asset, scene }) => ({
      manifest: manifest(),
      assets: [
        mockMaterialAssetDefinition = asset(AssetType.Material, 'materials/mock.pzmat', mockMaterial.data),
      ],
      scenes: [
        scene('sample'),
      ],
    }));
    const mockProjectController = await MockProjectController.create(mock);
    const mockMaterialEditorViewController = await MockMaterialEditorViewController.create(
      mockProjectController,
      mockMaterialAssetDefinition,
      mockMaterial.definition,
    );
    const initialJsonValue = mockMaterialEditorViewController.materialJson.value.emissionColor;

    const mutation = new SetMaterialEmissionColorMutation();

    // Test continuous mutation flow with multiple updates
    await mockMaterialEditorViewController.mutator.beginContinuous(mutation);

    // Multiple updates using a loop - only the final color should be persisted
    const finalColor = new Color3(255, 0, 0);
    for (let i = 0; i < 3; i++) {
      const testColor = new Color3(0, i * 50, 0);
      await mockMaterialEditorViewController.mutator.updateContinuous(mutation, { emissionColor: testColor });

      // Each update should modify the data state
      const afterUpdateDataValue = mockMaterialEditorViewController.materialData.emissionColor;
      expect(afterUpdateDataValue, `Material data should have intermediate color after update ${i}`).toEqual(testColor);

      // But JSON should not be updated until apply()
      const afterUpdateJsonValue = mockMaterialEditorViewController.materialJson.value.emissionColor;
      expect(afterUpdateJsonValue, `Material JSON should still have initial color during update ${i}`).toEqual({ r: 255, g: 255, b: 255 });
    }

    // Final update with the color we want to persist
    await mockMaterialEditorViewController.mutator.updateContinuous(mutation, { emissionColor: finalColor });

    // Apply should only persist the final value
    await mockMaterialEditorViewController.mutator.apply(mutation);

    const finalDataValue = mockMaterialEditorViewController.materialData.emissionColor;
    const finalJsonValue = mockMaterialEditorViewController.materialJson.value.emissionColor;
    const finalCachedAsset = await mockProjectController.assetCache.loadAsset(mockMaterialEditorViewController.materialAssetData, mockMaterialEditorViewController.scene);

    // Assert
    /* Initial state */
    expect(initialJsonValue, "Material asset should have the initial white color").toEqual({ r: 255, g: 255, b: 255 });

    /* After apply - only final value should be persisted */
    expect(finalDataValue, "Material data should have the final color").toEqual(finalColor);
    expect(finalJsonValue, "Material JSON should have the final color persisted").toEqual({ r: 255, g: 0, b: 0 });
    expect(finalCachedAsset.emissionColor, "Cached material should have the final color").toBeDefined();
    expect(finalCachedAsset.emissionColor, "Cached material should have the correct final color").toEqual(toColor3Babylon(finalColor));
  });
});
