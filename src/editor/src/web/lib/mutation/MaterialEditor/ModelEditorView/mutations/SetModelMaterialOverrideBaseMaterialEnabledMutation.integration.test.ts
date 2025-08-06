import { describe, test, expect } from 'vitest';

import { AssetType } from '@polyzone/runtime/src/cartridge';
import { RetroMaterial } from '@polyzone/runtime/src/materials/RetroMaterial';
import { CubeTexture } from '@babylonjs/core/Materials/Textures/cubeTexture';

import { MeshAssetDefinition, MaterialAssetDefinition, TextureAssetDefinition } from '@lib/project';
import { createMockMaterial } from '@test/integration/mock/material-editor/createMockMaterial';
import { MockProject } from '@test/integration/mock/project/MockProject';
import { MockAssets } from '@test/integration/mock/assets';
import { MockProjectController } from '@test/integration/mock/project/MockProjectController';
import { MockModelEditorViewController } from '@test/integration/mock/material-editor/MockModelEditorViewController';

import { SetModelMaterialOverrideBaseMaterialEnabledMutation } from './SetModelMaterialOverrideBaseMaterialEnabledMutation';


describe(SetModelMaterialOverrideBaseMaterialEnabledMutation.name, () => {
  test("Toggling base material enabled state updates all relevant state correctly", async () => {
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
                materialAssetId: mockMaterialAssetDefinition.id,
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

    // Capture initial state (base material should be enabled since it's defined in the material overrides)
    const initialDataEnabledValue = mockMeshAssetData.getOverridesForMaterial(mockMaterialName)?.materialEnabled;
    const initialDataValue = mockMeshAssetData.getOverridesForMaterial(mockMaterialName)?.material;
    const initialBabylonMaterialReflectionTexture = mockModelEditorViewController.getMaterialByName(mockMaterialName).reflectionTexture;
    const initialJsonValue = getJsonMaterialAssetId();
    const initialCachedMaterialReflectionTexture = await getCachedMaterialReflectionTexture();

    // Test: Disable the base material
    const disableMutation = new SetModelMaterialOverrideBaseMaterialEnabledMutation(mockMeshAssetData.id, mockMaterialName, false);
    await mockModelEditorViewController.mutator.apply(disableMutation);

    const disabledDataEnabledValue = mockMeshAssetData.getOverridesForMaterial(mockMaterialName)?.materialEnabled;
    const disabledDataValue = mockMeshAssetData.getOverridesForMaterial(mockMaterialName)?.material;
    const disabledBabylonMaterialReflectionTexture = mockModelEditorViewController.getMaterialByName(mockMaterialName).reflectionTexture;
    const disabledJsonValue = getJsonMaterialAssetId();
    const disabledCachedMaterialReflectionTexture = await getCachedMaterialReflectionTexture();

    // Test: Re-enable the base material
    const enableMutation = new SetModelMaterialOverrideBaseMaterialEnabledMutation(mockMeshAssetData.id, mockMaterialName, true);
    await mockModelEditorViewController.mutator.apply(enableMutation);

    const enabledDataEnabledValue = mockMeshAssetData.getOverridesForMaterial(mockMaterialName)?.materialEnabled;
    const enabledDataValue = mockMeshAssetData.getOverridesForMaterial(mockMaterialName)?.material;
    const enabledBabylonMaterialReflectionTexture = mockModelEditorViewController.getMaterialByName(mockMaterialName).reflectionTexture;
    const enabledJsonValue = getJsonMaterialAssetId();
    const enabledCachedMaterialReflectionTexture = await getCachedMaterialReflectionTexture();

    // Assert
    /* Initial state (base material enabled) */
    expect(initialDataEnabledValue, "Material override data should have base material enabled initially").toBe(true);
    expect(initialDataValue, "Material override data should have base material defined initially").toBeDefined();
    expect(initialBabylonMaterialReflectionTexture, "Babylon material should have reflection texture from base material initially").toBeDefined();
    expect(initialJsonValue, "Mesh asset definition should have base material defined initially").toBe(mockMaterialAssetDefinition.id);
    expect(initialCachedMaterialReflectionTexture, "Cached material should have reflection texture from base material initially").toBeDefined();

    /* After disabling */
    expect(disabledDataEnabledValue, "Material override data should not have base material enabled after disabling").toBe(false);
    expect(disabledDataValue, "Material override data should not have base material defined after disabling").toBeUndefined();
    expect(disabledBabylonMaterialReflectionTexture, "Babylon material should not have reflection texture from base material after disabling").toBeUndefined();
    expect(disabledJsonValue, "Mesh asset definition should not have base material defined after disabling").toBeUndefined();
    expect(disabledCachedMaterialReflectionTexture, "Cached material should not have reflection texture from base material after disabling").toBeUndefined();

    /* After re-enabling */
    expect(enabledDataEnabledValue, "Material override data should have base material enabled after re-enabling").toBe(true);
    expect(enabledDataValue, "Material override data should have base material defined after re-enabling").toBeDefined();
    expect(enabledBabylonMaterialReflectionTexture, "Babylon material should have reflection texture from base material after re-enabling").toBeDefined();
    expect(enabledJsonValue, "Mesh asset definition should have base material defined after re-enabling").toBe(mockMaterialAssetDefinition.id);
    expect(enabledCachedMaterialReflectionTexture, "Cached material should have reflection texture from base material after re-enabling").toBeDefined();
  });
});
