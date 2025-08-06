import { describe, test, expect } from 'vitest';
import { AssetType } from '@polyzone/runtime/src/cartridge';

import { MockProject } from '@test/integration/mock/project/MockProject';
import { MockProjectController } from '@test/integration/mock/project/MockProjectController';
import { MockAssets } from '@test/integration/mock/assets';

import { MoveAssetMutation } from './MoveAssetMutation';

describe(MoveAssetMutation.name, () => {
  test("Moving an asset to a new path updates all state correctly", async () => {
    // Setup
    let mockAssetDefinition!: any;
    const mockOldPath = 'textures/oldTexture.png';
    const mockNewPath = 'textures/newTexture.png';

    const mock = new MockProject(({ manifest, asset }) => ({
      manifest: manifest(),
      assets: [
        mockAssetDefinition = asset(AssetType.Texture, mockOldPath, MockAssets.textures.stonesPng),
      ],
      scenes: [],
    }));
    const mockProjectController = await MockProjectController.create(mock);

    const mutation = new MoveAssetMutation(mockAssetDefinition.id, mockNewPath);

    const initialAssetDataPath = mockProjectController.project.assets.findById(mockAssetDefinition.id)?.path;
    const initialAssetDefinitionPath = mockProjectController.projectDefinition.assets.find((asset) => asset.id === mockAssetDefinition.id)?.path;
    const initialOldFile = mock.fileSystem.files[mockOldPath];
    const initialNewFile = mock.fileSystem.files[mockNewPath];

    // Test
    await mockProjectController.mutator.apply(mutation);

    const updatedAssetDataPath = mockProjectController.project.assets.findById(mockAssetDefinition.id)?.path;
    const updatedAssetDefinitionPath = mockProjectController.projectDefinition.assets.find((asset) => asset.id === mockAssetDefinition.id)?.path;
    const updatedOldFile = mock.fileSystem.files[mockOldPath];
    const updatedNewFile = mock.fileSystem.files[mockNewPath];

    // Assert
    /* Initial values */
    expect(initialAssetDataPath).toBe(mockOldPath);
    expect(initialAssetDefinitionPath).toBe(mockOldPath);
    expect(initialOldFile).toBeDefined();
    expect(initialNewFile).toBeUndefined();
    /* Updated values */
    expect(updatedAssetDataPath).toBe(mockNewPath);
    expect(updatedAssetDefinitionPath).toBe(mockNewPath);
    expect(updatedOldFile).toBeUndefined();
    expect(updatedNewFile).toBeDefined();
  });

  test("Attempting to move a non-existent asset throws an error", async () => {
    // Setup
    const mock = new MockProject(({ manifest }) => ({
      manifest: manifest(),
      assets: [],
      scenes: [],
    }));
    const mockProjectController = await MockProjectController.create(mock);

    const nonExistentAssetId = 'non-existent-asset-id';
    const mockNewPath = 'textures/newTexture.png';
    const mutation = new MoveAssetMutation(nonExistentAssetId, mockNewPath);

    // Test
    const testFunc = (): Promise<void> => mockProjectController.mutator.apply(mutation);

    // Assert
    await expect(testFunc).rejects.toThrow(`Cannot move asset - No asset exists with Id '${nonExistentAssetId}'`);
  });
});
