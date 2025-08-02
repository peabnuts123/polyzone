import { describe, test, expect } from 'vitest';

import { GameObjectDefinition } from '@polyzone/runtime/src/cartridge';

import { MockProject } from '@test/integration/mock/project/MockProject';
import { MockProjectController } from '@test/integration/mock/project/MockProjectController';
import { MockSceneViewController } from '@test/integration/mock/scene/MockSceneViewController';

import { SetGameObjectNameMutation } from './SetGameObjectNameMutation';

describe(SetGameObjectNameMutation.name, () => {
  test("Calling update() and then apply() updates state correctly", async () => {
    // Setup
    let mockGameObjectDefinition!: GameObjectDefinition;
    const mock = new MockProject(({ manifest, scene }) => ({
      manifest: manifest(),
      assets: [],
      scenes: [
        scene('sample', ({ config, object }) => ({
          config: config(),
          objects: [
            mockGameObjectDefinition = object('Mock object'),
          ],
        })),
      ],
    }));
    const mockProjectController = await MockProjectController.create(mock);
    const mockScene = mockProjectController.project.scenes.getByPath(mock.scenes[0].path)!;
    const mockSceneViewController = await MockSceneViewController.create(
      mockProjectController,
      mockScene,
    );
    const mockGameObjectData = mockScene.data.getGameObject(mockGameObjectDefinition.id);
    /* Mock `findGameObjectById` to return mock instance */
    const mockGameObject = await mockSceneViewController.createGameObject(mockGameObjectData);
    mockSceneViewController.findGameObjectById = () => mockGameObject;


    const initialDefinitionValue = mockSceneViewController.sceneDefinition.objects[0].name;
    const initialGameObjectName = mockGameObjectData.name;

    const mutation = new SetGameObjectNameMutation(mockGameObjectData.id);

    // Test
    await mockSceneViewController.mutator.beginContinuous(mutation);
    // Apply several mutations in series
    let newGameObjectName: string = "";
    for (let i = 0; i < 3; i++) {
      newGameObjectName = `${initialGameObjectName} (renamed ${i})`;
      await mockSceneViewController.mutator.updateContinuous(mutation, { name: newGameObjectName });

      expect(mockGameObjectData.name, "GameObject name should match mutation argument after mutation").toEqual(newGameObjectName);
    }
    const definitionValueAfterUpdating = mockSceneViewController.sceneDefinition.objects[0].name;

    // Apply mutation
    await mockSceneViewController.mutator.apply(mutation);
    const updatedDefinitionValue = mockSceneViewController.sceneDefinition.objects[0].name;

    // Assert
    expect(definitionValueAfterUpdating, "GameObject definition should not be modified before calling apply()").toEqual(initialDefinitionValue);
    expect(updatedDefinitionValue, "GameObject definition should match new name after mutation").toEqual(newGameObjectName);
  });
});
