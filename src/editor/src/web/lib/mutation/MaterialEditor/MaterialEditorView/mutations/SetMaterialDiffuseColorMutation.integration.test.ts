import { describe, test, expect } from 'vitest';
import { Color3 as Color3Babylon } from '@babylonjs/core/Maths/math.color';


import { AssetType } from '@polyzone/runtime/src/cartridge';
import { Color3 } from '@polyzone/core/src/util';
import { toColor3Babylon, toColor3Core, toColor3Definition } from '@polyzone/runtime/src/util';

import { MaterialAssetDefinition } from '@lib/project';
import { createMockMaterial } from '@test/integration/mock/material-editor/createMockMaterial';
import { MockProject } from '@test/integration/mock/project/MockProject';
import { MockProjectController } from '@test/integration/mock/project/MockProjectController';
import { MockMaterialEditorViewController } from '@test/integration/mock/material-editor/MockMaterialEditorViewController';

import { SetMaterialDiffuseColorMutation } from './SetMaterialDiffuseColorMutation';


describe(SetMaterialDiffuseColorMutation.name, () => {
  test("Setting diffuse color on material with no existing color", async () => {
    // Setup
    const mockMaterial = createMockMaterial({
      // @NOTE Empty material i.e. no diffuse color setting
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

    /* Test selector utilities */
    async function getCachedMaterialDiffuseColor(): Promise<Color3Babylon | undefined> {
      const materialAsset = await mockProjectController.assetCache.loadAsset(mockMaterialEditorViewController.materialAssetData, mockMaterialEditorViewController.scene);
      return materialAsset.diffuseColor;
    }

    // Enable diffuse color first (simulating user checking the "enabled" box in UI)
    mockMaterialEditorViewController.materialData.diffuseColorEnabled = true;

    const initialDataValue = mockMaterialEditorViewController.materialData.diffuseColor;
    const initialBabylonColorValue = mockMaterialEditorViewController.materialInstance.diffuseColor;
    const initialJsonValue = mockMaterialEditorViewController.materialJson.value.diffuseColor;
    const initialCachedMaterialColor = await getCachedMaterialDiffuseColor();

    const newColor = new Color3(255, 128, 64);
    const mutation = new SetMaterialDiffuseColorMutation();


    // Test continuous mutation flow
    await mockMaterialEditorViewController.mutator.beginContinuous(mutation);
    await mockMaterialEditorViewController.mutator.updateContinuous(mutation, { diffuseColor: newColor });

    const afterUpdateDataValue = mockMaterialEditorViewController.materialData.diffuseColor;
    const afterUpdateBabylonColorValue = mockMaterialEditorViewController.materialInstance.diffuseColor;
    const afterUpdateJsonValue = mockMaterialEditorViewController.materialJson.value.diffuseColor;
    const afterUpdateCachedMaterialColor = await getCachedMaterialDiffuseColor();

    await mockMaterialEditorViewController.mutator.apply(mutation);

    const finalDataValue = mockMaterialEditorViewController.materialData.diffuseColor;
    const finalBabylonColorValue = mockMaterialEditorViewController.materialInstance.diffuseColor;
    const finalJsonValue = mockMaterialEditorViewController.materialJson.value.diffuseColor;
    const finalMaterialColor = await getCachedMaterialDiffuseColor();

    // Assert
    /* Initial state */
    expect(initialDataValue, "Material data should not have a diffuse color defined initially").toBeUndefined();
    expect(initialBabylonColorValue, "Babylon material should not have a diffuse color defined initially").toBeUndefined();
    expect(initialJsonValue, "Material asset should not have a diffuse color defined initially").toBeUndefined();
    expect(initialCachedMaterialColor, "Cached material should not have a diffuse color defined initially").toBeUndefined();

    /* After update() */
    expect(afterUpdateDataValue, "Material data should have the new diffuse color after update").toEqual(newColor);
    expect(afterUpdateBabylonColorValue, "Babylon material should have the correct color after update").toEqual(toColor3Babylon(newColor));
    expect(afterUpdateJsonValue, "Material asset should not have a diffuse color defined after update").toBeUndefined();
    expect(afterUpdateCachedMaterialColor, "Cached material should not have a diffuse color defined after update").toBeUndefined();

    /* After apply() */
    expect(finalDataValue, "Material data should still have the new diffuse color after apply").toEqual(newColor);
    expect(finalBabylonColorValue, "Babylon material should still have the correct color after apply").toEqual(toColor3Babylon(newColor));
    expect(finalJsonValue, "Material asset should have the new diffuse color persisted").toEqual(toColor3Definition(newColor));
    expect(finalMaterialColor, "Cached material should have the correct color").toEqual(toColor3Babylon(newColor));
  });

  test("Updating existing diffuse color on material", async () => {
    // Setup
    const initialColor = { r: 100, g: 200, b: 50 };
    const mockMaterial = createMockMaterial({
      diffuseColor: initialColor,
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

    const initialDataValue = mockMaterialEditorViewController.materialData.diffuseColor;
    const initialBabylonColorValue = mockMaterialEditorViewController.materialInstance.diffuseColor;
    const initialJsonValue = mockMaterialEditorViewController.materialJson.value.diffuseColor;
    const initialCachedAsset = await mockProjectController.assetCache.loadAsset(mockMaterialEditorViewController.materialAssetData, mockMaterialEditorViewController.scene);

    const newColor = new Color3(0, 255, 128);
    const mutation = new SetMaterialDiffuseColorMutation();

    // Test continuous mutation flow
    await mockMaterialEditorViewController.mutator.beginContinuous(mutation);

    await mockMaterialEditorViewController.mutator.updateContinuous(mutation, { diffuseColor: newColor });

    await mockMaterialEditorViewController.mutator.apply(mutation);

    const finalDataValue = mockMaterialEditorViewController.materialData.diffuseColor;
    const finalBabylonColorValue = mockMaterialEditorViewController.materialInstance.diffuseColor;
    const finalJsonValue = mockMaterialEditorViewController.materialJson.value.diffuseColor;
    const finalCachedAsset = await mockProjectController.assetCache.loadAsset(mockMaterialEditorViewController.materialAssetData, mockMaterialEditorViewController.scene);

    // Assert
    /* Initial state */
    expect(initialDataValue, "Material data should have the initial diffuse color").toEqual(toColor3Core(initialColor));
    expect(initialBabylonColorValue, "Babylon material should have the correct initial color").toEqual(toColor3Babylon(initialColor));
    expect(initialJsonValue, "Material asset should have the initial diffuse color").toEqual(initialColor);
    expect(initialCachedAsset.diffuseColor, "Cached material should have the correct initial color").toEqual(toColor3Babylon(initialColor));

    /* After mutation */
    expect(finalDataValue, "Material data should have the new diffuse color").toEqual(newColor);
    expect(finalBabylonColorValue, "Babylon material should have the correct new color").toEqual(toColor3Babylon(newColor));
    expect(finalJsonValue, "Material asset should have the new diffuse color persisted").toEqual(toColor3Definition(newColor));
    expect(finalCachedAsset.diffuseColor, "Cached material should have the correct new color").toEqual(toColor3Babylon(newColor));
  });

  test("Multiple updates before apply only persists final value", async () => {
    // Setup
    const mockMaterial = createMockMaterial({
      diffuseColor: { r: 255, g: 255, b: 255 },
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
    const initialJsonValue = mockMaterialEditorViewController.materialJson.value.diffuseColor;

    const mutation = new SetMaterialDiffuseColorMutation();

    // Test continuous mutation flow with multiple updates
    await mockMaterialEditorViewController.mutator.beginContinuous(mutation);

    // Multiple updates using a loop - only the final color should be persisted
    const finalColor = new Color3(0, 0, 255);
    for (let i = 0; i < 3; i++) {
      const testColor = new Color3(0, i * 50, 0);
      await mockMaterialEditorViewController.mutator.updateContinuous(mutation, { diffuseColor: testColor });

      // Each update should modify the data state
      const afterUpdateDataValue = mockMaterialEditorViewController.materialData.diffuseColor;
      expect(afterUpdateDataValue, `Material data should have intermediate color after update ${i}`).toEqual(testColor);

      // But JSON should not be updated until apply()
      const afterUpdateJsonValue = mockMaterialEditorViewController.materialJson.value.diffuseColor;
      expect(afterUpdateJsonValue, `Material JSON should still have initial color during update ${i}`).toEqual({ r: 255, g: 255, b: 255 });
    }

    // Final update with the color we want to persist
    await mockMaterialEditorViewController.mutator.updateContinuous(mutation, { diffuseColor: finalColor });

    // Apply should only persist the final value
    await mockMaterialEditorViewController.mutator.apply(mutation);

    const finalDataValue = mockMaterialEditorViewController.materialData.diffuseColor;
    const finalJsonValue = mockMaterialEditorViewController.materialJson.value.diffuseColor;
    const finalCachedAsset = await mockProjectController.assetCache.loadAsset(mockMaterialEditorViewController.materialAssetData, mockMaterialEditorViewController.scene);

    // Assert
    /* Initial state */
    expect(initialJsonValue, "Material asset should have the initial white color").toEqual({ r: 255, g: 255, b: 255 });

    /* After apply - only final value should be persisted */
    expect(finalDataValue, "Material data should have the final color").toEqual(finalColor);
    expect(finalJsonValue, "Material JSON should have the final color persisted").toEqual({ r: 0, g: 0, b: 255 });
    expect(finalCachedAsset.diffuseColor, "Cached material should have the final color").toBeDefined();
    expect(finalCachedAsset.diffuseColor, "Cached material should have the correct final color").toEqual(toColor3Babylon(finalColor));
  });
});
