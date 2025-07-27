import { describe, test, expect } from 'vitest';

import { MockProjectController } from '@test/mock/project/MockProjectController';
import { MockSceneViewController } from '@test/mock/scene/MockSceneViewController';

import { SetGameObjectNameMutation } from './SetGameObjectNameMutation';

describe(SetGameObjectNameMutation.name, () => {
  test("Calling update() and then apply() updates state correctly", async () => {
    // Setup
    const mockProjectController = new MockProjectController();
    const mockScene = mockProjectController.project.scenes.getAll()[0];
    const mockSceneViewController = MockSceneViewController.create(mockProjectController, mockScene);

    const mockGameObjectData = mockScene.data.objects[0];
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
