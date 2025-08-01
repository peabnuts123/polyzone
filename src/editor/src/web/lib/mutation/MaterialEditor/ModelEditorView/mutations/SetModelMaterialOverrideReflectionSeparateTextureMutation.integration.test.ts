import { CubeTexture } from '@babylonjs/core/Materials/Textures/cubeTexture';
import { describe, test, expect } from 'vitest';

import { AssetType, ITextureAssetData, MeshAssetMaterialOverrideReflectionSeparateData, MeshAssetMaterialOverrideReflectionSeparateDefinition } from '@polyzone/runtime/src/cartridge';
import { RetroMaterial } from '@polyzone/runtime/src/materials/RetroMaterial';

import { MeshAssetDefinition, TextureAssetDefinition } from '@lib/project/definition';
import { MockProject } from '@test/integration/mock/project/MockProject';
import { MockAssets } from '@test/integration/mock/assets';
import { MockModelEditorViewController } from '@test/integration/mock/material-editor/MockModelEditorViewController';
import { MockProjectController } from '@test/integration/mock/project/MockProjectController';

import { ReflectionSeparateTexture, SetModelMaterialOverrideReflectionSeparateTextureMutation } from './SetModelMaterialOverrideReflectionSeparateTextureMutation';

describe(SetModelMaterialOverrideReflectionSeparateTextureMutation.name, () => {
  test("Setting reflection texture override updates state correctly", async () => {
    // Setup
    /* Build mock project */
    const mockMaterialName = 'Main'; // @NOTE Must match `sphere.mtl` - referenced in mock project definition
    let mockMeshAssetDefinition!: MeshAssetDefinition;
    let mockTextureAssetDefinition!: TextureAssetDefinition;
    const mock = new MockProject(({ manifest, asset, scene }) => {
      mockTextureAssetDefinition = asset(AssetType.Texture, 'textures/stones.png', MockAssets.textures.stonesPng);
      mockMeshAssetDefinition = asset(AssetType.Mesh, 'models/sphere.obj', MockAssets.models.sphereObj, {
        materialOverrides: {
          [mockMaterialName]: {
            diffuseColor: { r: 255, g: 128, b: 0 },
            reflection: {
              type: 'separate',
              nxTextureAssetId: mockTextureAssetDefinition.id,
              // @NOTE pxTextureAssetId is NOT set - will be set by the test
              nyTextureAssetId: mockTextureAssetDefinition.id,
              pyTextureAssetId: mockTextureAssetDefinition.id,
              nzTextureAssetId: mockTextureAssetDefinition.id,
              pzTextureAssetId: mockTextureAssetDefinition.id,
            },
          },
        },
      });

      return {
        manifest: manifest(),
        assets: [
          mockMeshAssetDefinition,
          mockTextureAssetDefinition,
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
    function getDataValue(): ITextureAssetData | undefined {
      return (mockMeshAssetData.getOverridesForMaterial(mockMaterialName)?.reflection as MeshAssetMaterialOverrideReflectionSeparateData)?.pxTexture;
    }
    function getBabylonValue(): CubeTexture | undefined {
      return mockModelEditorViewController.getMaterialByName(mockMaterialName)?.reflectionTexture;
    }
    function getJsonValue(): string | undefined {
      const assetDefinition = mockProjectController.projectDefinition.assets.find((asset) => asset.id === mockMeshAssetDefinition.id) as MeshAssetDefinition;
      return (assetDefinition.materialOverrides![mockMaterialName].reflection as MeshAssetMaterialOverrideReflectionSeparateDefinition)?.pxTextureAssetId;
    }
    async function getCachedMaterialTextureValue(): Promise<CubeTexture | undefined> {
      const asset = await mockProjectController.assetCache.loadAsset(mockMeshAssetData, mockModelEditorViewController.scene);
      const material = asset.assetContainer.materials.find((material) => material.name === mockMaterialName) as RetroMaterial;
      return material.reflectionTexture;
    }

    /* Capture initial state */
    const initialDataValue = getDataValue();
    const initialBabylonValue = getBabylonValue();
    const initialJsonValue = getJsonValue();
    const initialCachedAssetMaterialInstance = await getCachedMaterialTextureValue();

    const mutation = new SetModelMaterialOverrideReflectionSeparateTextureMutation(
      mockMeshAssetData.id,
      mockMaterialName,
      mockTextureAssetDefinition.id,
      ReflectionSeparateTexture.positiveX, // @NOTE Specify override for positive X, thus making the reflection config "complete"
    );

    // Test
    await mockModelEditorViewController.mutator.apply(mutation);

    /* Capture updated state */
    const updatedDataValue = getDataValue();
    const updatedBabylonValue = getBabylonValue();
    const updatedJsonValue = getJsonValue();
    const updatedCachedAssetMaterialInstance = await getCachedMaterialTextureValue();

    // Assert
    /* Initial */
    expect(initialDataValue, "Mesh asset data should not have a Positive X reflection texture override defined initially").toBeUndefined();
    expect(initialBabylonValue, "Babylon material should not have a reflection texture defined initially").toBeUndefined();
    expect(initialJsonValue, "Mesh asset definition should not have a Positive X reflection texture override defined initially").toBeUndefined();
    expect(initialCachedAssetMaterialInstance, "Cached mesh asset's material should not have a reflection texture defined initially").toBeUndefined();
    /* After mutation */
    expect(updatedDataValue, "Mesh asset data should have a Positive X reflection texture override defined after mutation").toBeDefined();
    expect(updatedBabylonValue, "Babylon material should have a reflection texture defined after mutation").toBeDefined();
    expect(updatedJsonValue, "Mesh asset definition should have a Positive X reflection texture override defined after mutation").toBeDefined();
    expect(updatedCachedAssetMaterialInstance, "Cached mesh asset's material should have a reflection texture defined after mutation").toBeDefined();
  });
});
