import { describe, test, expect } from 'vitest';

import { GameObjectDefinition } from '@polyzone/runtime/src/cartridge';

import { MockProject } from '@test/integration/mock/project/MockProject';
import { MockProjectController } from '@test/integration/mock/project/MockProjectController';
import { MockSceneViewController } from '@test/integration/mock/scene/MockSceneViewController';

import { DeleteGameObjectMutation } from './DeleteGameObjectMutation';
import { loadObjectDefinition } from '@lib/project/data';

describe(DeleteGameObjectMutation.name, () => {
  test("Deleting a top-level GameObject", async () => {
    // Setup
    let mockGameObjectDefinition!: GameObjectDefinition;
    const mock = new MockProject(({ manifest, scene }) => ({
      manifest: manifest(),
      assets: [],
      scenes: [
        scene('sample', ({ config, object }) => ({
          config: config(),
          objects: [
            mockGameObjectDefinition = object('Target object'),
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

    const initialDataObjects = [...mockScene.data.objects];
    const initialBabylonGameObjects = mockSceneViewController.babylonScene.transformNodes.length;
    const initialDefinitionObjects = [...mockSceneViewController.sceneDefinition.objects];

    const mutation = new DeleteGameObjectMutation(mockGameObjectData);

    // Test
    await mockSceneViewController.mutator.apply(mutation);

    const finalDataObjects = mockScene.data.objects;
    const finalBabylonGameObjects = mockSceneViewController.babylonScene.transformNodes.length;
    const finalDefinitionObjects = mockSceneViewController.sceneDefinition.objects;

    // Assert
    /* Initial state */
    expect(initialDataObjects).toHaveLength(1);
    expect(initialBabylonGameObjects).toBe(1);
    expect(initialDefinitionObjects).toHaveLength(1);
    expect(initialDataObjects[0].id).toBe(mockGameObjectDefinition.id);
    expect(initialDefinitionObjects[0].id).toBe(mockGameObjectDefinition.id);

    /* Final state */
    expect(finalDataObjects).toHaveLength(0);
    expect(finalBabylonGameObjects).toBe(0);
    expect(finalDefinitionObjects).toHaveLength(0);
  });

  test("Deleting a child GameObject", async () => {
    // Setup
    let mockParentGameObjectDefinition!: GameObjectDefinition;
    let mockChildGameObjectDefinition!: GameObjectDefinition;
    const mock = new MockProject(({ manifest, scene }) => ({
      manifest: manifest(),
      assets: [],
      scenes: [
        scene('sample', ({ config, object }) => ({
          config: config(),
          objects: [
            mockParentGameObjectDefinition = object('Parent object', () => ({
              children: [
                mockChildGameObjectDefinition = object('Child object'),
              ],
            })),
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
    const mockChildGameObjectData = mockParentGameObjectData.children[0];

    const initialDataObjects = [...mockScene.data.objects];
    const initialParentChildren = [...mockParentGameObjectData.children];
    const initialBabylonGameObjects = mockSceneViewController.babylonScene.transformNodes.length;
    const initialDefinitionObjects = [...mockSceneViewController.sceneDefinition.objects];
    const initialDefinitionParentChildren = [...(mockSceneViewController.sceneDefinition.objects[0].children ?? [])];

    const mutation = new DeleteGameObjectMutation(mockChildGameObjectData);

    // Test
    await mockSceneViewController.mutator.apply(mutation);

    const finalDataObjects = mockScene.data.objects;
    const finalParentChildren = mockParentGameObjectData.children;
    const finalBabylonGameObjects = mockSceneViewController.babylonScene.transformNodes.length;
    const finalDefinitionObjects = mockSceneViewController.sceneDefinition.objects;
    const finalDefinitionParentChildren = mockSceneViewController.sceneDefinition.objects[0].children ?? [];

    // Assert
    /* Initial state */
    expect(initialDataObjects).toHaveLength(1);
    expect(initialParentChildren).toHaveLength(1);
    expect(initialBabylonGameObjects).toBe(2);
    expect(initialDefinitionObjects).toHaveLength(1);
    expect(initialDefinitionParentChildren).toHaveLength(1);
    expect(initialParentChildren[0].id).toBe(mockChildGameObjectDefinition.id);
    expect(initialDefinitionParentChildren[0].id).toBe(mockChildGameObjectDefinition.id);

    /* Final state - top-level objects should remain unchanged */
    expect(finalDataObjects).toHaveLength(1);
    expect(finalDefinitionObjects).toHaveLength(1);
    expect(finalDataObjects[0].id, "Top-level object should remain the same").toBe(mockParentGameObjectDefinition.id);
    expect(finalDefinitionObjects[0].id, "Top-level object should remain the same").toBe(mockParentGameObjectDefinition.id);

    /* Final state - parent should have no children */
    expect(finalParentChildren).toHaveLength(0);
    expect(finalBabylonGameObjects).toBe(1);
    expect(finalDefinitionParentChildren).toHaveLength(0);
  });

  test("Deleting a GameObject with multiple children removes all descendants", async () => {
    // Setup
    let mockParentGameObjectDefinition!: GameObjectDefinition;
    const mock = new MockProject(({ manifest, scene }) => ({
      manifest: manifest(),
      assets: [],
      scenes: [
        scene('sample', ({ config, object }) => ({
          config: config(),
          objects: [
            mockParentGameObjectDefinition = object('Parent object', () => ({
              children: [
                object('Child 1', () => ({
                  children: [
                    object('Grandchild'),
                  ],
                })),
                object('Child 2'),
              ],
            })),
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

    const initialDataObjects = [...mockScene.data.objects];
    const initialBabylonGameObjects = mockSceneViewController.babylonScene.transformNodes.length;
    const initialDefinitionObjects = [...mockSceneViewController.sceneDefinition.objects];

    const mutation = new DeleteGameObjectMutation(mockParentGameObjectData);

    // Test
    await mockSceneViewController.mutator.apply(mutation);

    const finalDataObjects = mockScene.data.objects;
    const finalBabylonGameObjects = mockSceneViewController.babylonScene.transformNodes.length;
    const finalDefinitionObjects = mockSceneViewController.sceneDefinition.objects;

    // Assert
    /* Initial state */
    expect(initialDataObjects).toHaveLength(1);
    expect(initialBabylonGameObjects).toBe(4); // Parent + 2 children + 1 grandchild
    expect(initialDefinitionObjects).toHaveLength(1);
    expect(initialDataObjects[0].id).toBe(mockParentGameObjectDefinition.id);
    expect(initialDefinitionObjects[0].id).toBe(mockParentGameObjectDefinition.id);

    /* Final state - all objects should be removed */
    expect(finalDataObjects).toHaveLength(0);
    expect(finalBabylonGameObjects).toBe(0);
    expect(finalDefinitionObjects).toHaveLength(0);
  });

  test("Error when GameObject doesn't exist in Babylon scene", async () => {
    // Setup
    let mockGameObjectDefinition!: GameObjectDefinition;
    const mock = new MockProject(({ manifest, scene }) => ({
      manifest: manifest(),
      assets: [],
      scenes: [
        scene('sample', ({ config, object }) => {
          mockGameObjectDefinition = object('non-existent object');
          return {
            config: config(),
            objects: [],
          };
        }),
      ],
    }));
    const mockProjectController = await MockProjectController.create(mock);
    const mockScene = mockProjectController.project.scenes.getByPath(mock.scenes[0].path)!;
    const mockSceneViewController = await MockSceneViewController.create(
      mockProjectController,
      mockScene,
    );
    const fakeParentGameObjectData = loadObjectDefinition(
      mockGameObjectDefinition,
      mockProjectController.project.assets,
    );

    const mutation = new DeleteGameObjectMutation(fakeParentGameObjectData);

    // Test
    const testFunc = (): Promise<void> => mockSceneViewController.mutator.apply(mutation);

    // Assert
    await expect(testFunc).rejects.toThrow(`No GameObject exists with ID '${mockGameObjectDefinition.id}' in scene`);
  });
});
