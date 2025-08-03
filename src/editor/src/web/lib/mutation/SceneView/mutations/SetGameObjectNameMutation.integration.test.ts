import { describe, test, expect } from 'vitest';

import { GameObjectDefinition } from '@polyzone/runtime/src/cartridge';

import { MockProject } from '@test/integration/mock/project/MockProject';
import { MockProjectController } from '@test/integration/mock/project/MockProjectController';
import { MockSceneViewController } from '@test/integration/mock/scene/MockSceneViewController';

import { SetGameObjectNameMutation } from './SetGameObjectNameMutation';

describe(SetGameObjectNameMutation.name, () => {
  test("Fully applying mutation updates state correctly", async () => {
    // Setup
    const initialName = 'Mock object';
    let mockGameObjectDefinition!: GameObjectDefinition;
    const mock = new MockProject(({ manifest, scene }) => ({
      manifest: manifest(),
      assets: [],
      scenes: [
        scene('sample', ({ config, object }) => ({
          config: config(),
          objects: [
            mockGameObjectDefinition = object(initialName),
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

    const initialDataValue = mockGameObjectData.name;
    const initialBabylonValue = mockGameObject.name;
    const initialDefinitionValue = mockSceneViewController.sceneDefinition.objects[0].name;

    const mutation = new SetGameObjectNameMutation(mockGameObjectData.id);

    // Test
    await mockSceneViewController.mutator.beginContinuous(mutation);
    // Apply several updates in series
    let intermediateName: string = '';
    for (let i = 0; i < 3; i++) {
      intermediateName = `${initialName} (step ${i})`;
      await mockSceneViewController.mutator.updateContinuous(mutation, { name: intermediateName });

      // Each update should modify the data and Babylon state
      expect(mockGameObjectData.name, `GameObject data should have intermediate name after update ${i}`).toEqual(intermediateName);
      expect(mockGameObject.name, `Babylon GameObject should have intermediate name after update ${i}`).toEqual(intermediateName);

      // But definition should not be updated until apply()
      const afterUpdateDefinitionValue = mockSceneViewController.sceneDefinition.objects[0].name;
      expect(afterUpdateDefinitionValue, `GameObject definition should still have initial name during update ${i}`).toEqual(initialName);
    }

    // Apply should only persist the final value
    await mockSceneViewController.mutator.apply(mutation);

    const finalDataValue = mockGameObjectData.name;
    const finalBabylonValue = mockGameObject.name;
    const finalDefinitionValue = mockSceneViewController.sceneDefinition.objects[0].name;

    // Assert
    /* Initial state */
    expect(initialDataValue, "GameObject data should have the initial name").toEqual(initialName);
    expect(initialBabylonValue, "Babylon GameObject should have the initial name").toEqual(initialName);
    expect(initialDefinitionValue, "GameObject definition should have the initial name").toEqual(initialName);

    /* After apply - only final value should be persisted */
    expect(finalDataValue, "GameObject data should have the final name").toEqual(intermediateName);
    expect(finalBabylonValue, "Babylon GameObject should have the final name").toEqual(intermediateName);
    expect(finalDefinitionValue, "GameObject definition should have the final name persisted").toEqual(intermediateName);
  });
});
