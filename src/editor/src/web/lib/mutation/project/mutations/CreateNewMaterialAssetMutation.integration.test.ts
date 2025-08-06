import { describe, test, expect } from 'vitest';

import { TauriMockConfig } from '@lib/tauri/mock/BrowserMock';
import { MockProject } from '@test/integration/mock/project/MockProject';
import { MockProjectController } from '@test/integration/mock/project/MockProjectController';
import { randomHash } from '@test/util';

import { CreateNewMaterialAssetMutation } from './CreateNewMaterialAssetMutation';

describe(CreateNewMaterialAssetMutation.name, () => {
  test("Calling apply() updates state correctly", async () => {
    // Setup
    const mock = new MockProject(({ manifest }) => ({
      manifest: manifest(),
      assets: [],
      scenes: [],
    }));
    const mockProjectController = await MockProjectController.create(mock);

    const mockNewAssetPath = 'materials/newMaterial.pzmat';
    const mockNewAssetHash = randomHash();
    TauriMockConfig.polyzone.hashDataResult = mockNewAssetHash; // Mock tauri response
    const mutation = new CreateNewMaterialAssetMutation(mockNewAssetPath);

    const initialProjectDataAssets = [...mockProjectController.project.assets.assets];
    const initialAssetData = mockProjectController.project.assets.assets.find((asset) => asset.path === mockNewAssetPath);
    const initialAssetDefinition = mockProjectController.projectDefinition.assets.find((assetDefinition) => assetDefinition.path === mockNewAssetPath);
    const initialAssetFile = mock.fileSystem.files[mockNewAssetPath];

    // Test
    await mockProjectController.mutator.apply(mutation);

    const updatedProjectDataAssets = [...mockProjectController.project.assets.assets];
    const updatedAssetData = mockProjectController.project.assets.assets.find((asset) => asset.path === mockNewAssetPath);
    const updatedAssetDefinition = mockProjectController.projectDefinition.assets.find((assetDefinition) => assetDefinition.path === mockNewAssetPath);
    const updatedAssetFile = mock.fileSystem.files[mockNewAssetPath];


    // Assert
    /* Initial values */
    expect(initialProjectDataAssets).toHaveLength(0);
    expect(initialAssetData).toBeUndefined();
    expect(initialAssetDefinition).toBeUndefined();
    expect(initialAssetFile).toBeUndefined();
    /* Updated values */
    expect(updatedProjectDataAssets).toHaveLength(1);
    expect(updatedAssetData).toBeDefined();
    expect(updatedAssetData?.hash).toBe(mockNewAssetHash);
    expect(updatedAssetDefinition).toBeDefined();
    expect(updatedAssetDefinition?.hash).toBe(mockNewAssetHash);
    expect(updatedAssetFile).toBeDefined();
  });
});
