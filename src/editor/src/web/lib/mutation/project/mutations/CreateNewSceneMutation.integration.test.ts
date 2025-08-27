import { describe, test, expect } from 'vitest';

import { TauriMockConfig } from '@lib/tauri/mock/BrowserMock';
import { MockProject } from '@test/integration/mock/project/MockProject';
import { MockProjectController } from '@test/integration/mock/project/MockProjectController';
import { randomHash } from '@test/util';

import { CreateNewSceneMutation } from './CreateNewSceneMutation';

describe(CreateNewSceneMutation.name, () => {
  test("Calling apply() updates state correctly", async () => {
    // Setup
    const mock = new MockProject(({ manifest }) => ({
      manifest: manifest(),
      assets: [],
      scenes: [],
    }));
    const mockProjectController = await MockProjectController.create(mock);

    const mockNewScenePath = 'scenes/newScene.pzscene';
    const mockNewSceneHash = randomHash();
    TauriMockConfig.polyzone.hashDataResult = mockNewSceneHash; // Mock tauri response
    const mutation = new CreateNewSceneMutation(mockNewScenePath);

    const initialProjectDataScenes = [...mockProjectController.project.scenes.getAll()];
    const initialSceneData = mockProjectController.project.scenes.getByPath(mockNewScenePath);
    const initialSceneDefinition = mockProjectController.projectDefinition.scenes.find((sceneManifest) => sceneManifest.path === mockNewScenePath);
    const initialSceneFile = mock.fileSystem.files[mockNewScenePath];

    // Test
    await mockProjectController.mutatorNew.apply(mutation);

    const updatedProjectDataScenes = [...mockProjectController.project.scenes.getAll()];
    const updatedSceneData = mockProjectController.project.scenes.getByPath(mockNewScenePath);
    const updatedSceneDefinition = mockProjectController.projectDefinition.scenes.find((sceneManifest) => sceneManifest.path === mockNewScenePath);
    const updatedSceneFile = mock.fileSystem.files[mockNewScenePath];

    await mockProjectController.mutatorNew.undo();

    const finalProjectDataScenes = [...mockProjectController.project.scenes.getAll()];
    const finalSceneData = mockProjectController.project.scenes.getByPath(mockNewScenePath);
    const finalSceneDefinition = mockProjectController.projectDefinition.scenes.find((sceneManifest) => sceneManifest.path === mockNewScenePath);
    const finalSceneFile = mock.fileSystem.files[mockNewScenePath];

    // Assert
    /* Initial values */
    expect(initialProjectDataScenes).toHaveLength(0);
    expect(initialSceneData).toBeUndefined();
    expect(initialSceneDefinition).toBeUndefined();
    expect(initialSceneFile).toBeUndefined();

    /* Updated values */
    expect(updatedProjectDataScenes).toHaveLength(1);
    expect(updatedSceneData).toBeDefined();
    expect(updatedSceneData?.manifest.hash).toBe(mockNewSceneHash);
    expect(updatedSceneData?.manifest.path).toBe(mockNewScenePath);
    expect(updatedSceneDefinition).toBeDefined();
    expect(updatedSceneDefinition?.hash).toBe(mockNewSceneHash);
    expect(updatedSceneDefinition?.path).toBe(mockNewScenePath);
    expect(updatedSceneFile).toBeDefined();

    /* After undo */
    expect(finalProjectDataScenes).toHaveLength(0);
    expect(finalSceneData).toBeUndefined();
    expect(finalSceneDefinition).toBeUndefined();
    expect(finalSceneFile).toBeUndefined();
  });
});
