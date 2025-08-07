import { describe, test, expect } from 'vitest';

import { GameObjectDefinition } from '@polyzone/runtime/src/cartridge';

import { MockProject } from '@test/integration/mock/project/MockProject';
import { MockProjectController } from '@test/integration/mock/project/MockProjectController';
import { MockSceneViewController } from '@test/integration/mock/scene/MockSceneViewController';

import { MeshComponentData } from '@lib/project/data';
import { AddGameObjectComponentMutation } from './AddGameObjectComponentMutation';

describe(AddGameObjectComponentMutation.name, () => {
  test("Adding a mesh component updates the state correctly", async () => {
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
    const mockGameObject = await mockSceneViewController.createGameObject(mockGameObjectData);
    mockSceneViewController.findGameObjectById = () => mockGameObject;

    const newMeshComponent = MeshComponentData.createDefault();
    const initialDataComponents = [...mockGameObjectData.components];
    const initialBabylonComponents = [...mockGameObject.components];
    const initialDefinitionComponents = [...mockSceneViewController.sceneDefinition.objects[0].components];

    const mutation = new AddGameObjectComponentMutation(mockGameObjectData.id, newMeshComponent);

    // Test
    await mockSceneViewController.mutator.apply(mutation);

    const finalDataComponents = mockGameObjectData.components;
    const finalBabylonComponents = mockGameObject.components;
    const finalDefinitionComponents = mockSceneViewController.sceneDefinition.objects[0].components;

    // Assert
    /* Initial state */
    expect(initialDataComponents, "Initial data should have no components").toHaveLength(0);
    expect(initialBabylonComponents, "Initial Babylon object should have no components").toHaveLength(0);
    expect(initialDefinitionComponents, "Initial definition should have no components").toHaveLength(0);

    /* Final state */
    expect(finalDataComponents, "Data should have the mesh component added").toHaveLength(1);
    expect(finalDataComponents[0], "Data component should be the mesh component").toBe(newMeshComponent);
    expect(finalBabylonComponents, "Babylon object should have the component added").toHaveLength(1);
    expect(finalBabylonComponents[0].id, "Babylon component should have correct ID").toBe(newMeshComponent.id);
    expect(finalDefinitionComponents, "Definition should have the component added").toHaveLength(1);
    expect(finalDefinitionComponents[0].id, "Definition component should have correct ID").toBe(newMeshComponent.id);
  });

  test("Attempting to add a component to a non-existent GameObject throws an error", async () => {
    // Setup
    let _mockGameObjectDefinition!: GameObjectDefinition;
    const mock = new MockProject(({ manifest, scene }) => ({
      manifest: manifest(),
      assets: [],
      scenes: [
        scene('sample', ({ config, object }) => ({
          config: config(),
          objects: [
            _mockGameObjectDefinition = object('Mock object'),
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

    const newMeshComponent = MeshComponentData.createDefault();
    const nonExistentGameObjectId = 'non-existent-id';
    const mutation = new AddGameObjectComponentMutation(nonExistentGameObjectId, newMeshComponent);

    // Test
    const testFunc = (): Promise<void> => mockSceneViewController.mutator.apply(mutation);

    // Assert
    await expect(testFunc(), "Should throw error when GameObject doesn't exist in scene").rejects.toThrowError(
      /No GameObject exists with ID 'non-existent-id'/,
    );
  });
});
