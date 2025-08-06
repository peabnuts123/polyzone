import { describe, test, expect } from 'vitest';

import { MockProject } from '@test/integration/mock/project/MockProject';
import { MockProjectController } from '@test/integration/mock/project/MockProjectController';

import { MoveSceneMutation } from './MoveSceneMutation';

describe(MoveSceneMutation.name, () => {
  test("Moving a scene to a new path updates all state correctly", async () => {
    // Setup
    const mockOldSceneName = 'oldScene';
    const mockOldPath = `scenes/${mockOldSceneName}.pzscene`;
    const mockNewPath = 'scenes/newScene.pzscene';

    const mock = new MockProject(({ manifest, scene }) => ({
      manifest: manifest(),
      assets: [],
      scenes: [
        scene(mockOldSceneName, ({ config }) => ({
          config: config(),
          objects: [],
        })),
      ],
    }));
    const mockProjectController = await MockProjectController.create(mock);

    const sceneData = mockProjectController.project.scenes.getByPath(mockOldPath)!.data;
    const mutation = new MoveSceneMutation(sceneData, mockNewPath);

    const initialSceneDataPath = mockProjectController.project.scenes.getById(sceneData.id)?.data.path;
    const initialSceneManifestPath = mockProjectController.project.scenes.getById(sceneData.id)?.manifest.path;
    const initialSceneDefinitionPath = mockProjectController.projectDefinition.scenes.find((sceneManifest) => sceneManifest.id === sceneData.id)?.path;
    const initialOldFile = mock.fileSystem.files[mockOldPath];
    const initialNewFile = mock.fileSystem.files[mockNewPath];

    // Test
    await mockProjectController.mutator.apply(mutation);

    const updatedSceneDataPath = mockProjectController.project.scenes.getById(sceneData.id)?.data.path;
    const updatedSceneManifestPath = mockProjectController.project.scenes.getById(sceneData.id)?.manifest.path;
    const updatedSceneDefinitionPath = mockProjectController.projectDefinition.scenes.find((sceneManifest) => sceneManifest.id === sceneData.id)?.path;
    const updatedOldFile = mock.fileSystem.files[mockOldPath];
    const updatedNewFile = mock.fileSystem.files[mockNewPath];

    // Assert
    /* Initial values */
    expect(initialSceneDataPath).toBe(mockOldPath);
    expect(initialSceneManifestPath).toBe(mockOldPath);
    expect(initialSceneDefinitionPath).toBe(mockOldPath);
    expect(initialOldFile).toBeDefined();
    expect(initialNewFile).toBeUndefined();
    /* Updated values */
    expect(updatedSceneDataPath).toBe(mockNewPath);
    expect(updatedSceneManifestPath).toBe(mockNewPath);
    expect(updatedSceneDefinitionPath).toBe(mockNewPath);
    expect(updatedOldFile).toBeUndefined();
    expect(updatedNewFile).toBeDefined();
  });

  test("Attempting to move a non-existent scene throws an error", async () => {
    // Setup
    const mock = new MockProject(({ manifest }) => ({
      manifest: manifest(),
      assets: [],
      scenes: [],
    }));
    const mockProjectController = await MockProjectController.create(mock);

    const mockNewPath = 'scenes/newScene.pzscene';
    // Create a scene data object with a non-existent ID
    const fakeSceneData = {
      id: 'non-existent-scene-id',
      path: 'fake/path.pzscene',
    } as any;
    const mutation = new MoveSceneMutation(fakeSceneData, mockNewPath);

    // Test
    const testFunc = (): Promise<void> => mockProjectController.mutator.apply(mutation);

    // Assert
    await expect(testFunc).rejects.toThrow(`Cannot move scene - No scene exists with Id '${fakeSceneData.id}'`);
  });
});
