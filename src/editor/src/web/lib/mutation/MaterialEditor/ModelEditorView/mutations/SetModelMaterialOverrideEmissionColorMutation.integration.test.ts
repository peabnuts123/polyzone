import { describe, test, expect } from 'vitest';
import { Color3 as Color3Babylon } from '@babylonjs/core/Maths/math.color';

import { AssetType } from '@polyzone/runtime/src/cartridge';
import { Color3 as Color3Core } from '@polyzone/core/src/util';
import { toColor3Babylon, toColor3Core, toColor3Definition } from '@polyzone/runtime/src/util';
import { RetroMaterial } from '@polyzone/runtime/src/materials/RetroMaterial';

import { MeshAssetDefinition } from '@lib/project';
import { MockProject } from '@test/integration/mock/project/MockProject';
import { MockAssets } from '@test/integration/mock/assets';
import { MockProjectController } from '@test/integration/mock/project/MockProjectController';
import { MockModelEditorViewController } from '@test/integration/mock/material-editor/MockModelEditorViewController';

import { SetModelMaterialOverrideEmissionColorMutation } from './SetModelMaterialOverrideEmissionColorMutation';


describe(SetModelMaterialOverrideEmissionColorMutation.name, () => {
  test("Setting emission color override on material with no existing color override", async () => {
    // Setup
    const mockMaterialName = 'Main'; // @NOTE Must match `sphere.mtl` - referenced in mock project definition
    let mockMeshAssetDefinition!: MeshAssetDefinition;
    const mock = new MockProject(({ manifest, asset, scene }) => ({
      manifest: manifest(),
      assets: [
        mockMeshAssetDefinition = asset(AssetType.Mesh, 'models/sphere.obj', MockAssets.models.sphereObj, {
          // @NOTE Empty material overrides i.e. no emission color override
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

    // Enable emission color override first (simulating user checking the "enabled" box in UI)
    mockMeshAssetData.setMaterialOverride(mockMaterialName, (overrides) => {
      overrides.emissionColorEnabled = true;
    });

    /* Test selector utilities */
    async function getCachedMaterialEmissionColor(): Promise<Color3Babylon | undefined> {
      const asset = await mockProjectController.assetCache.loadAsset(mockMeshAssetData, mockModelEditorViewController.scene);
      const material = asset.assetContainer.materials.find((material) => material.name === mockMaterialName) as RetroMaterial;
      return material.overridesFromAsset.emissionColor;
    }

    const initialDataValue = mockMeshAssetData.getOverridesForMaterial(mockMaterialName)?.emissionColor;
    const initialBabylonColorValue = mockModelEditorViewController.getMaterialByName(mockMaterialName).overridesFromAsset.emissionColor;
    const initialJsonValue = (mockProjectController.projectDefinition.assets.find((asset) => asset.id === mockMeshAssetDefinition.id) as MeshAssetDefinition).materialOverrides?.[mockMaterialName]?.emissionColor;
    const initialCachedMaterialColor = await getCachedMaterialEmissionColor();

    const newColor = new Color3Core(255, 128, 64);
    const mutation = new SetModelMaterialOverrideEmissionColorMutation(mockMeshAssetData.id, mockMaterialName);

    // Test continuous mutation flow
    await mockModelEditorViewController.mutator.beginContinuous(mutation);
    await mockModelEditorViewController.mutator.updateContinuous(mutation, { emissionColor: newColor });

    const afterUpdateDataValue = mockMeshAssetData.getOverridesForMaterial(mockMaterialName)?.emissionColor;
    const afterUpdateBabylonColorValue = mockModelEditorViewController.getMaterialByName(mockMaterialName).overridesFromAsset.emissionColor;
    const afterUpdateJsonValue = (mockProjectController.projectDefinition.assets.find((asset) => asset.id === mockMeshAssetDefinition.id) as MeshAssetDefinition).materialOverrides?.[mockMaterialName]?.emissionColor;
    const afterUpdateCachedMaterialColor = await getCachedMaterialEmissionColor();

    await mockModelEditorViewController.mutator.apply(mutation);

    const finalDataValue = mockMeshAssetData.getOverridesForMaterial(mockMaterialName)?.emissionColor;
    const finalBabylonColorValue = mockModelEditorViewController.getMaterialByName(mockMaterialName).overridesFromAsset.emissionColor;
    const finalJsonValue = (mockProjectController.projectDefinition.assets.find((asset) => asset.id === mockMeshAssetDefinition.id) as MeshAssetDefinition).materialOverrides?.[mockMaterialName]?.emissionColor;
    const finalCachedMaterialColor = await getCachedMaterialEmissionColor();

    // Assert
    /* Initial state */
    expect(initialDataValue, "Material override data should not have an emission color defined initially").toBeUndefined();
    expect(initialBabylonColorValue, "Babylon material should not have an emission color override defined initially").toBeUndefined();
    expect(initialJsonValue, "Mesh asset definition should not have an emission color override defined initially").toBeUndefined();
    expect(initialCachedMaterialColor, "Cached material should not have an emission color override defined initially").toBeUndefined();

    /* After update() */
    expect(afterUpdateDataValue, "Material override data should have the new emission color after update").toEqual(newColor);
    expect(afterUpdateBabylonColorValue, "Babylon material should have the correct color after update").toEqual(toColor3Babylon(newColor));
    expect(afterUpdateJsonValue, "Mesh asset definition should not have an emission color override defined after update").toBeUndefined();
    expect(afterUpdateCachedMaterialColor, "Cached material should have the correct color after update").toEqual(toColor3Babylon(newColor));

    /* After apply() */
    expect(finalDataValue, "Material override data should still have the new emission color after apply").toEqual(newColor);
    expect(finalBabylonColorValue, "Babylon material should still have the correct color after apply").toEqual(toColor3Babylon(newColor));
    expect(finalJsonValue, "Mesh asset definition should have the new emission color persisted").toEqual(toColor3Definition(newColor));
    expect(finalCachedMaterialColor, "Cached material should have the correct color").toEqual(toColor3Babylon(newColor));
  });

  test("Updating existing emission color override on material", async () => {
    // Setup
    const mockMaterialName = 'Main'; // @NOTE Must match `sphere.mtl` - referenced in mock project definition
    const initialColor = { r: 100, g: 200, b: 50 };
    let mockMeshAssetDefinition!: MeshAssetDefinition;
    const mock = new MockProject(({ manifest, asset, scene }) => ({
      manifest: manifest(),
      assets: [
        mockMeshAssetDefinition = asset(AssetType.Mesh, 'models/sphere.obj', MockAssets.models.sphereObj, {
          materialOverrides: {
            [mockMaterialName]: {
              emissionColor: initialColor,
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
    async function getCachedMaterialEmissionColor(): Promise<Color3Babylon | undefined> {
      const asset = await mockProjectController.assetCache.loadAsset(mockMeshAssetData, mockModelEditorViewController.scene);
      const material = asset.assetContainer.materials.find((material) => material.name === mockMaterialName) as RetroMaterial;
      return material.overridesFromAsset.emissionColor;
    }

    const initialDataValue = mockMeshAssetData.getOverridesForMaterial(mockMaterialName)?.emissionColor;
    const initialBabylonColorValue = mockModelEditorViewController.getMaterialByName(mockMaterialName).overridesFromAsset.emissionColor;
    const initialJsonValue = (mockProjectController.projectDefinition.assets.find((asset) => asset.id === mockMeshAssetDefinition.id) as MeshAssetDefinition).materialOverrides?.[mockMaterialName]?.emissionColor;
    const initialCachedMaterialColor = await getCachedMaterialEmissionColor();

    const newColor = new Color3Core(0, 255, 128);
    const mutation = new SetModelMaterialOverrideEmissionColorMutation(mockMeshAssetData.id, mockMaterialName);

    // Test continuous mutation flow
    await mockModelEditorViewController.mutator.beginContinuous(mutation);
    await mockModelEditorViewController.mutator.updateContinuous(mutation, { emissionColor: newColor });
    await mockModelEditorViewController.mutator.apply(mutation);

    const finalDataValue = mockMeshAssetData.getOverridesForMaterial(mockMaterialName)?.emissionColor;
    const finalBabylonColorValue = mockModelEditorViewController.getMaterialByName(mockMaterialName).overridesFromAsset.emissionColor;
    const finalJsonValue = (mockProjectController.projectDefinition.assets.find((asset) => asset.id === mockMeshAssetDefinition.id) as MeshAssetDefinition).materialOverrides?.[mockMaterialName]?.emissionColor;
    const finalCachedMaterialColor = await getCachedMaterialEmissionColor();

    // Assert
    /* Initial state */
    expect(initialDataValue, "Material override data should have the initial emission color").toEqual(toColor3Core(initialColor));
    expect(initialBabylonColorValue, "Babylon material should have the correct initial color").toEqual(toColor3Babylon(initialColor));
    expect(initialJsonValue, "Mesh asset definition should have the initial emission color").toEqual(initialColor);
    expect(initialCachedMaterialColor, "Cached material should have the correct initial color").toEqual(toColor3Babylon(initialColor));

    /* After mutation */
    expect(finalDataValue, "Material override data should have the new emission color").toEqual(newColor);
    expect(finalBabylonColorValue, "Babylon material should have the correct new color").toEqual(toColor3Babylon(newColor));
    expect(finalJsonValue, "Mesh asset definition should have the new emission color persisted").toEqual(toColor3Definition(newColor));
    expect(finalCachedMaterialColor, "Cached material should have the correct new color").toEqual(toColor3Babylon(newColor));
  });

  test("Multiple updates before apply only persists final value", async () => {
    // Setup
    const mockMaterialName = 'Main'; // @NOTE Must match `sphere.mtl` - referenced in mock project definition
    const initialColor = { r: 255, g: 255, b: 255 };
    let mockMeshAssetDefinition!: MeshAssetDefinition;
    const mock = new MockProject(({ manifest, asset, scene }) => ({
      manifest: manifest(),
      assets: [
        mockMeshAssetDefinition = asset(AssetType.Mesh, 'models/sphere.obj', MockAssets.models.sphereObj, {
          materialOverrides: {
            [mockMaterialName]: {
              emissionColor: initialColor,
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
    async function getCachedMaterialEmissionColor(): Promise<Color3Babylon | undefined> {
      const asset = await mockProjectController.assetCache.loadAsset(mockMeshAssetData, mockModelEditorViewController.scene);
      const material = asset.assetContainer.materials.find((material) => material.name === mockMaterialName) as RetroMaterial;
      return material.overridesFromAsset.emissionColor;
    }

    const initialJsonValue = (mockProjectController.projectDefinition.assets.find((asset) => asset.id === mockMeshAssetDefinition.id) as MeshAssetDefinition).materialOverrides?.[mockMaterialName]?.emissionColor;

    const mutation = new SetModelMaterialOverrideEmissionColorMutation(mockMeshAssetData.id, mockMaterialName);

    // Test continuous mutation flow with multiple updates
    await mockModelEditorViewController.mutator.beginContinuous(mutation);

    // Multiple updates using a loop - only the final color should be persisted
    const finalColor = new Color3Core(0, 0, 255);
    for (let i = 0; i < 3; i++) {
      const testColor = new Color3Core(0, i * 50, 0);
      await mockModelEditorViewController.mutator.updateContinuous(mutation, { emissionColor: testColor });

      // Each update should modify the data state
      const afterUpdateDataValue = mockMeshAssetData.getOverridesForMaterial(mockMaterialName)?.emissionColor;
      expect(afterUpdateDataValue, `Material override data should have intermediate color after update ${i}`).toEqual(testColor);

      // But JSON should not be updated until apply()
      const afterUpdateJsonValue = (mockProjectController.projectDefinition.assets.find((asset) => asset.id === mockMeshAssetDefinition.id) as MeshAssetDefinition).materialOverrides?.[mockMaterialName]?.emissionColor;
      expect(afterUpdateJsonValue, `Mesh asset definition should still have initial color during update ${i}`).toEqual(initialColor);
    }

    // Final update with the color we want to persist
    await mockModelEditorViewController.mutator.updateContinuous(mutation, { emissionColor: finalColor });

    // Apply should only persist the final value
    await mockModelEditorViewController.mutator.apply(mutation);

    const finalDataValue = mockMeshAssetData.getOverridesForMaterial(mockMaterialName)?.emissionColor;
    const finalJsonValue = (mockProjectController.projectDefinition.assets.find((asset) => asset.id === mockMeshAssetDefinition.id) as MeshAssetDefinition).materialOverrides?.[mockMaterialName]?.emissionColor;
    const finalCachedMaterialColor = await getCachedMaterialEmissionColor();

    // Assert
    /* Initial state */
    expect(initialJsonValue, "Mesh asset definition should have the initial white color").toEqual(initialColor);

    /* After apply - only final value should be persisted */
    expect(finalDataValue, "Material override data should have the final color").toEqual(finalColor);
    expect(finalJsonValue, "Mesh asset definition should have the final color persisted").toEqual(toColor3Definition(finalColor));
    expect(finalCachedMaterialColor, "Cached material should have the correct final color").toEqual(toColor3Babylon(finalColor));
  });
});
