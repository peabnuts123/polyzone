import { describe, test, expect } from 'vitest';

import { GameObjectDefinition } from '@polyzone/runtime/src/cartridge';

import { loadObjectDefinition } from '@lib/project/data';
import { MockProject } from '@test/integration/mock/project/MockProject';
import { MockProjectController } from '@test/integration/mock/project/MockProjectController';
import { MockSceneViewController } from '@test/integration/mock/scene/MockSceneViewController';

import { CreateBlankGameObjectMutation } from './CreateBlankGameObjectMutation';

describe(CreateBlankGameObjectMutation.name, () => {
  test("Creating a blank GameObject as a top-level object", async () => {
    // Setup
    const mock = new MockProject(({ manifest, scene }) => ({
      manifest: manifest(),
      assets: [],
      scenes: [
        scene('sample', ({ config }) => ({
          config: config(),
          objects: [],
        })),
      ],
    }));
    const mockProjectController = await MockProjectController.create(mock);
    const mockScene = mockProjectController.project.scenes.getByPath(mock.scenes[0].path)!;
    const mockSceneViewController = await MockSceneViewController.create(
      mockProjectController,
      mockScene,
    );

    const initialDataObjects = [...mockScene.data.objects];
    const initialBabylonGameObjects = mockSceneViewController.babylonScene.transformNodes.length;
    const initialDefinitionObjects = [...mockSceneViewController.sceneDefinition.objects];

    const mutation = new CreateBlankGameObjectMutation();

    // Test
    await mockSceneViewController.mutator.apply(mutation);

    const finalDataObjects = mockScene.data.objects;
    const finalBabylonGameObjects = mockSceneViewController.babylonScene.transformNodes.length;
    const finalDefinitionObjects = mockSceneViewController.sceneDefinition.objects;

    // Assert
    /* Initial state */
    expect(initialDataObjects).toHaveLength(0);
    expect(initialBabylonGameObjects).toBe(0);
    expect(initialDefinitionObjects).toHaveLength(0);

    /* Final state */
    expect(finalDataObjects).toHaveLength(1);
    expect(finalBabylonGameObjects).toBe(1);
    expect(finalDefinitionObjects).toHaveLength(1);
  });

  test("Creating a blank GameObject as a child of an existing parent", async () => {
    // Setup
    let mockParentGameObjectDefinition!: GameObjectDefinition;
    const mock = new MockProject(({ manifest, scene }) => ({
      manifest: manifest(),
      assets: [],
      scenes: [
        scene('sample', ({ config, object }) => ({
          config: config(),
          objects: [
            mockParentGameObjectDefinition = object('Parent object'),
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
    const mockParentGameObjectData = mockScene.data.getGameObject(mockParentGameObjectDefinition.id);
    const mockParentGameObject = mockSceneViewController.findGameObjectById(mockParentGameObjectData.id)!;

    const initialDataObjects = [...mockScene.data.objects];
    const initialParentChildren = [...mockParentGameObjectData.children];
    const initialBabylonGameObjects = mockSceneViewController.babylonScene.transformNodes.length;
    const initialBabylonParentChildren = mockParentGameObject.transform.children.length;
    const initialDefinitionObjects = [...mockSceneViewController.sceneDefinition.objects];
    const initialDefinitionParentChildren = [...(mockSceneViewController.sceneDefinition.objects[0].children ?? [])];

    const mutation = new CreateBlankGameObjectMutation(mockParentGameObjectData);

    // Test
    await mockSceneViewController.mutator.apply(mutation);

    const finalDataObjects = mockScene.data.objects;
    const finalParentChildren = mockParentGameObjectData.children;
    const finalBabylonGameObjects = mockSceneViewController.babylonScene.transformNodes.length;
    const finalBabylonParentChildren = mockParentGameObject.transform.children.length;
    const finalDefinitionObjects = mockSceneViewController.sceneDefinition.objects;
    const finalDefinitionParentChildren = mockSceneViewController.sceneDefinition.objects[0].children ?? [];

    // Assert
    /* Initial state */
    expect(initialDataObjects).toHaveLength(1);
    expect(initialParentChildren).toHaveLength(0);
    expect(initialBabylonGameObjects).toBe(1);
    expect(initialBabylonParentChildren).toBe(0);
    expect(initialDefinitionObjects).toHaveLength(1);
    expect(initialDefinitionParentChildren).toHaveLength(0);

    /* Final state - top-level objects should remain unchanged */
    expect(finalDataObjects).toHaveLength(1);
    expect(finalDefinitionObjects).toHaveLength(1);
    expect(finalDataObjects[0].id, "Top-level object should remain the same").toEqual(mockParentGameObjectDefinition.id);
    expect(finalDefinitionObjects[0].id, "Top-level object should remain the same").toEqual(mockParentGameObjectDefinition.id);

    /* Final state - parent should have one child */
    expect(finalParentChildren).toHaveLength(1);
    expect(finalBabylonGameObjects).toBe(2);
    expect(finalBabylonParentChildren).toBe(1);
    expect(finalDefinitionParentChildren).toHaveLength(1);
  });

  test("Error when parent GameObject doesn't exist in scene", async () => {
    // Setup
    const mock = new MockProject(({ manifest, scene }) => ({
      manifest: manifest(),
      assets: [],
      scenes: [
        scene('sample', ({ config }) => ({
          config: config(),
          objects: [],
        })),
      ],
    }));
    const mockProjectController = await MockProjectController.create(mock);
    const mockScene = mockProjectController.project.scenes.getByPath(mock.scenes[0].path)!;
    const mockSceneViewController = await MockSceneViewController.create(
      mockProjectController,
      mockScene,
    );

    // Create a fake parent object that doesn't exist in the scene
    const fakeParentGameObjectDefinition: GameObjectDefinition = {
      id: 'fake-parent-id',
      name: 'Fake parent',
      transform: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      },
      children: [],
      components: [],
    };
    const fakeParentGameObjectData = loadObjectDefinition(
      fakeParentGameObjectDefinition,
      mockProjectController.project.assets,
    );

    const mutation = new CreateBlankGameObjectMutation(fakeParentGameObjectData);

    // Test
    const testFunc = (): Promise<void> => mockSceneViewController.mutator.apply(mutation);

    // Assert
    await expect(testFunc).rejects.toThrow("No GameObject exists with ID 'fake-parent-id'");
  });
});
