import { describe, test, expect } from 'vitest';
import { Color3 } from '@babylonjs/core/Maths/math.color';

import { AssetType } from '@polyzone/runtime/src/cartridge';
import { toColor3Babylon, toColor3Core, toColor3Definition } from '@polyzone/runtime/src/util';
import { RetroMaterial } from '@polyzone/runtime/src/materials/RetroMaterial';

import { MeshAssetDefinition } from '@lib/project';
import { MockProject } from '@test/integration/mock/project/MockProject';
import { MockAssets } from '@test/integration/mock/assets';
import { MockProjectController } from '@test/integration/mock/project/MockProjectController';
import { MockModelEditorViewController } from '@test/integration/mock/material-editor/MockModelEditorViewController';

import { SetModelMaterialOverrideDiffuseColorEnabledMutation } from './SetModelMaterialOverrideDiffuseColorEnabledMutation';


describe(SetModelMaterialOverrideDiffuseColorEnabledMutation.name, () => {
  test("Enabling diffuse color override updates state correctly", async () => {
    // Setup
    const mockMaterialName = 'Main'; // @NOTE Must match `sphere.mtl` - referenced in mock project definition
    let mockMeshAssetDefinition!: MeshAssetDefinition;
    const mock = new MockProject(({ manifest, asset, scene }) => ({
      manifest: manifest(),
      assets: [
        mockMeshAssetDefinition = asset(AssetType.Mesh, 'models/sphere.obj', MockAssets.models.sphereObj, {
          // @NOTE Empty material overrides i.e. no diffuse color override
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
    async function getCachedMaterialDiffuseColor(): Promise<Color3 | undefined> {
      const asset = await mockProjectController.assetCache.loadAsset(mockMeshAssetData, mockModelEditorViewController.scene);
      const material = asset.assetContainer.materials.find((material) => material.name === mockMaterialName) as RetroMaterial;
      return material.overridesFromAsset.diffuseColor;
    }

    const initialDataEnabledValue = mockMeshAssetData.getOverridesForMaterial(mockMaterialName)?.diffuseColorEnabled;
    const initialDataValue = mockMeshAssetData.getOverridesForMaterial(mockMaterialName)?.diffuseColor;
    const initialBabylonColorValue = mockModelEditorViewController.getMaterialByName(mockMaterialName).overridesFromAsset.diffuseColor;
    const initialJsonValue = (mockProjectController.projectDefinition.assets.find((asset) => asset.id === mockMeshAssetDefinition.id) as MeshAssetDefinition).materialOverrides?.[mockMaterialName]?.diffuseColor;
    const initialCachedMaterialColor = await getCachedMaterialDiffuseColor();

    const mutation = new SetModelMaterialOverrideDiffuseColorEnabledMutation(mockMeshAssetData.id, mockMaterialName, true);

    // Test
    await mockModelEditorViewController.mutator.apply(mutation);

    const updatedDataEnabledValue = mockMeshAssetData.getOverridesForMaterial(mockMaterialName)?.diffuseColorEnabled;
    const updatedDataValue = mockMeshAssetData.getOverridesForMaterial(mockMaterialName)?.diffuseColor;
    const updatedBabylonColorValue = mockModelEditorViewController.getMaterialByName(mockMaterialName).overridesFromAsset.diffuseColor;
    const updatedJsonValue = (mockProjectController.projectDefinition.assets.find((asset) => asset.id === mockMeshAssetDefinition.id) as MeshAssetDefinition).materialOverrides?.[mockMaterialName]?.diffuseColor;
    const updatedCachedMaterialColor = await getCachedMaterialDiffuseColor();

    // Assert
    /* Initial */
    expect(initialDataEnabledValue, "Material override data should not have diffuse color enabled initially").toBeUndefined();
    expect(initialDataValue, "Material override data should not have diffuse color defined initially").toBeUndefined();
    expect(initialBabylonColorValue, "Babylon material should not have diffuse color override defined initially").toBeUndefined();
    expect(initialJsonValue, "Mesh asset definition should not have diffuse color override defined initially").toBeUndefined();
    expect(initialCachedMaterialColor, "Cached mesh asset's material should not have diffuse color override defined initially").toBeUndefined();
    /* After mutation */
    expect(updatedDataEnabledValue, "Material override data should have diffuse color enabled after mutation").toBe(true);
    expect(updatedDataValue, "Material override data should have diffuse color defined after mutation").toEqual(toColor3Core(RetroMaterial.Defaults.diffuseColor));
    expect(updatedBabylonColorValue, "Babylon material should have diffuse color override defined after mutation").toEqual(toColor3Babylon(RetroMaterial.Defaults.diffuseColor));
    expect(updatedJsonValue, "Mesh asset definition should have diffuse color override defined after mutation").toEqual(toColor3Definition(RetroMaterial.Defaults.diffuseColor));
    expect(updatedCachedMaterialColor, "Cached mesh asset's material should have diffuse color override defined after mutation").toEqual(toColor3Babylon(RetroMaterial.Defaults.diffuseColor));
  });

  test("Disabling diffuse color override updates state correctly", async () => {
    // Setup
    const mockMaterialName = 'Main'; // @NOTE Must match `sphere.mtl` - referenced in mock project definition
    const initialColor = { r: 255, g: 128, b: 64 };
    let mockMeshAssetDefinition!: MeshAssetDefinition;
    const mock = new MockProject(({ manifest, asset, scene }) => ({
      manifest: manifest(),
      assets: [
        mockMeshAssetDefinition = asset(AssetType.Mesh, 'models/sphere.obj', MockAssets.models.sphereObj, {
          materialOverrides: {
            [mockMaterialName]: {
              diffuseColor: initialColor,
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
    async function getCachedMaterialDiffuseColor(): Promise<Color3 | undefined> {
      const asset = await mockProjectController.assetCache.loadAsset(mockMeshAssetData, mockModelEditorViewController.scene);
      const material = asset.assetContainer.materials.find((material) => material.name === mockMaterialName) as RetroMaterial;
      return material.overridesFromAsset.diffuseColor;
    }

    const initialDataEnabledValue = mockMeshAssetData.getOverridesForMaterial(mockMaterialName)?.diffuseColorEnabled;
    const initialDataValue = mockMeshAssetData.getOverridesForMaterial(mockMaterialName)?.diffuseColor;
    const initialDataRawValue = mockMeshAssetData.getOverridesForMaterial(mockMaterialName)?.diffuseColorRawValue;
    const initialBabylonColorValue = mockModelEditorViewController.getMaterialByName(mockMaterialName).overridesFromAsset.diffuseColor;
    const initialJsonValue = (mockProjectController.projectDefinition.assets.find((asset) => asset.id === mockMeshAssetDefinition.id) as MeshAssetDefinition).materialOverrides?.[mockMaterialName]?.diffuseColor;
    const initialCachedMaterialColor = await getCachedMaterialDiffuseColor();

    const mutation = new SetModelMaterialOverrideDiffuseColorEnabledMutation(mockMeshAssetData.id, mockMaterialName, false);

    // Test
    await mockModelEditorViewController.mutator.apply(mutation);

    const updatedDataEnabledValue = mockMeshAssetData.getOverridesForMaterial(mockMaterialName)?.diffuseColorEnabled;
    const updatedDataValue = mockMeshAssetData.getOverridesForMaterial(mockMaterialName)?.diffuseColor;
    const updatedDataRawValue = mockMeshAssetData.getOverridesForMaterial(mockMaterialName)?.diffuseColorRawValue;
    const updatedBabylonColorValue = mockModelEditorViewController.getMaterialByName(mockMaterialName).overridesFromAsset.diffuseColor;
    const updatedJsonValue = (mockProjectController.projectDefinition.assets.find((asset) => asset.id === mockMeshAssetDefinition.id) as MeshAssetDefinition).materialOverrides?.[mockMaterialName]?.diffuseColor;
    const updatedCachedMaterialColor = await getCachedMaterialDiffuseColor();

    // Assert
    /* Initial */
    expect(initialDataEnabledValue, "Material override data should have diffuse color enabled initially").toBe(true);
    expect(initialDataValue, "Material override data should have diffuse color defined initially").toEqual(toColor3Core(initialColor));
    expect(initialDataRawValue, "Material override data should have diffuse color raw value defined initially").toEqual(toColor3Core(initialColor));
    expect(initialBabylonColorValue, "Babylon material should have diffuse color override defined initially").toEqual(toColor3Babylon(initialColor));
    expect(initialJsonValue, "Mesh asset definition should have diffuse color override defined initially").toEqual(initialColor);
    expect(initialCachedMaterialColor, "Cached mesh asset's material should have diffuse color override defined initially").toEqual(toColor3Babylon(initialColor));
    /* After mutation */
    expect(updatedDataEnabledValue, "Material override data should not have diffuse color enabled after mutation").toBe(false);
    expect(updatedDataValue, "Material override data should not have diffuse color defined after mutation").toBeUndefined();
    expect(updatedDataRawValue, "Material override data should still have diffuse color raw value after mutation").toEqual(toColor3Core(initialColor));
    expect(updatedBabylonColorValue, "Babylon material should not have diffuse color override defined after mutation").toBeUndefined();
    expect(updatedJsonValue, "Mesh asset definition should not have diffuse color override defined after mutation").toBeUndefined();
    expect(updatedCachedMaterialColor, "Cached mesh asset's material should not have diffuse color override defined after mutation").toBeUndefined();
  });
});
