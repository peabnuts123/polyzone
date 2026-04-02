import { describe, test, expect } from 'vitest';
import { v4 as uuid } from 'uuid';

import { GameObjectDefinition } from '@polyzone/runtime/src/cartridge';
import { ComponentDefinitionType } from '@polyzone/runtime/src/cartridge/archive/components/ComponentDefinitionType';

import { loadObjectDefinition } from '@lib/project/data';
import { MockProject } from '@test/integration/mock/project/MockProject';
import { MockProjectController } from '@test/integration/mock/project/MockProjectController';
import { MockSceneViewController } from '@test/integration/mock/scene/MockSceneViewController';

import { CreateGameObjectFromDefinitionMutation, CreateGameObjectType } from './CreateGameObjectFromDefinitionMutation';

describe(CreateGameObjectFromDefinitionMutation.name, () => {
  describe(CreateGameObjectType.CreateNew, () => {
    test("Creating a new GameObject as a top-level object", async () => {
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

      const definition = blankDefinition();
      const mutation = new CreateGameObjectFromDefinitionMutation({
        type: CreateGameObjectType.CreateNew,
        definition,
      });

      // Test
      await mockSceneViewController.mutatorNew.apply(mutation);

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

      /* ID should not be scrambled for CreateNew */
      expect(definition.id).toBe('new-object-id');
      expect(finalDataObjects[0].id).toBe('new-object-id');
    });

    test("Creating a new GameObject as a child of an existing parent", async () => {
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

      const mutation = new CreateGameObjectFromDefinitionMutation({
        type: CreateGameObjectType.CreateNew,
        definition: blankDefinition(),
        parent: mockParentGameObjectData,
      });

      // Test
      await mockSceneViewController.mutatorNew.apply(mutation);

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
  });

  describe(CreateGameObjectType.Paste, () => {
    test("Pasting a GameObject as a top-level object", async () => {
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

      const definition = nonBlankDefinition('Pasted Object');
      const original = cloneGameObjectDefinition(definition);
      const mutation = new CreateGameObjectFromDefinitionMutation({
        type: CreateGameObjectType.Paste,
        definition,
      });

      // Test
      await mockSceneViewController.mutatorNew.apply(mutation);

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
      expect(finalBabylonGameObjects).toBe(2); // @NOTE child object counts too
      expect(finalDefinitionObjects).toHaveLength(1);

      /* IDs should be scrambled for Paste */
      expect(definition.id).not.toBe(original.id);
      expect(definition.components[0].id).not.toBe(original.components[0].id);
      expect(definition.children![0].id).not.toBe(original.children![0].id);

      /* Name should be preserved */
      expect(finalDataObjects[0].name).toBe('Pasted Object');
      expect(finalDefinitionObjects[0].name).toBe('Pasted Object');
    });

    test("Pasting a GameObject as a child of an existing parent", async () => {
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

      const definition = nonBlankDefinition('Pasted Object');
      const original = cloneGameObjectDefinition(definition);
      const mutation = new CreateGameObjectFromDefinitionMutation({
        type: CreateGameObjectType.Paste,
        definition,
        parent: mockParentGameObjectData,
      });

      const initialDataObjects = [...mockScene.data.objects];
      const initialParentChildren = [...mockParentGameObjectData.children];
      const initialBabylonGameObjects = mockSceneViewController.babylonScene.transformNodes.length;
      const initialDefinitionObjects = [...mockSceneViewController.sceneDefinition.objects];
      const initialDefinitionParentChildren = [...(mockSceneViewController.sceneDefinition.objects[0].children ?? [])];

      // Test
      await mockSceneViewController.mutatorNew.apply(mutation);

      const finalDataObjects = mockScene.data.objects;
      const finalParentChildren = mockParentGameObjectData.children;
      const finalBabylonGameObjects = mockSceneViewController.babylonScene.transformNodes.length;
      const finalDefinitionObjects = mockSceneViewController.sceneDefinition.objects;
      const finalDefinitionParentChildren = mockSceneViewController.sceneDefinition.objects[0].children ?? [];

      // Assert
      /* Initial state */
      expect(initialDataObjects).toHaveLength(1);
      expect(initialParentChildren).toHaveLength(0);
      expect(initialBabylonGameObjects).toBe(1);
      expect(initialDefinitionObjects).toHaveLength(1);
      expect(initialDefinitionParentChildren).toHaveLength(0);

      /* Final state - top-level objects should remain unchanged */
      expect(finalDataObjects).toHaveLength(1);
      expect(finalDefinitionObjects).toHaveLength(1);
      expect(finalDataObjects[0].id).toEqual(mockParentGameObjectDefinition.id);

      /* Final state - parent should have one child */
      expect(finalParentChildren).toHaveLength(1);
      expect(finalBabylonGameObjects).toBe(3); // @NOTE child object counts too
      expect(finalDefinitionParentChildren).toHaveLength(1);

      /* IDs should be scrambled, name preserved */
      expect(definition.id).not.toBe(original.id);
      expect(definition.components[0].id).not.toBe(original.components[0].id);
      expect(definition.children![0].id).not.toBe(original.children![0].id);
      expect(finalParentChildren[0].name).toBe('Pasted Object');
    });
  });

  describe(CreateGameObjectType.Duplicate, () => {
    test("Duplicating a GameObject as a top-level object", async () => {
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

      const definition = nonBlankDefinition('Duplicated Object');
      const original = cloneGameObjectDefinition(definition);
      const mutation = new CreateGameObjectFromDefinitionMutation({
        type: CreateGameObjectType.Duplicate,
        definition,
      });

      // Test
      await mockSceneViewController.mutatorNew.apply(mutation);

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
      expect(finalBabylonGameObjects).toBe(2); // @NOTE child object counts too
      expect(finalDefinitionObjects).toHaveLength(1);

      /* IDs should be scrambled for Duplicate */
      expect(definition.id).not.toBe(original.id);
      expect(definition.components[0].id).not.toBe(original.components[0].id);
      expect(definition.children![0].id).not.toBe(original.children![0].id);

      /* Name should be preserved */
      expect(finalDataObjects[0].name).toBe('Duplicated Object');
      expect(finalDefinitionObjects[0].name).toBe('Duplicated Object');
    });

    test("Duplicating a GameObject as a child of an existing parent", async () => {
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

      const definition = nonBlankDefinition('Duplicated Object');
      const original = cloneGameObjectDefinition(definition);
      const mutation = new CreateGameObjectFromDefinitionMutation({
        type: CreateGameObjectType.Duplicate,
        definition,
        parent: mockParentGameObjectData,
      });

      const initialDataObjects = [...mockScene.data.objects];
      const initialParentChildren = [...mockParentGameObjectData.children];
      const initialBabylonGameObjects = mockSceneViewController.babylonScene.transformNodes.length;
      const initialDefinitionObjects = [...mockSceneViewController.sceneDefinition.objects];
      const initialDefinitionParentChildren = [...(mockSceneViewController.sceneDefinition.objects[0].children ?? [])];

      // Test
      await mockSceneViewController.mutatorNew.apply(mutation);

      const finalDataObjects = mockScene.data.objects;
      const finalParentChildren = mockParentGameObjectData.children;
      const finalBabylonGameObjects = mockSceneViewController.babylonScene.transformNodes.length;
      const finalDefinitionObjects = mockSceneViewController.sceneDefinition.objects;
      const finalDefinitionParentChildren = mockSceneViewController.sceneDefinition.objects[0].children ?? [];

      // Assert
      /* Initial state */
      expect(initialDataObjects).toHaveLength(1);
      expect(initialParentChildren).toHaveLength(0);
      expect(initialBabylonGameObjects).toBe(1);
      expect(initialDefinitionObjects).toHaveLength(1);
      expect(initialDefinitionParentChildren).toHaveLength(0);

      /* Final state - top-level objects should remain unchanged */
      expect(finalDataObjects).toHaveLength(1);
      expect(finalDefinitionObjects).toHaveLength(1);
      expect(finalDataObjects[0].id).toEqual(mockParentGameObjectDefinition.id);

      /* Final state - parent should have one child */
      expect(finalParentChildren).toHaveLength(1);
      expect(finalBabylonGameObjects).toBe(3); // @NOTE child object counts too
      expect(finalDefinitionParentChildren).toHaveLength(1);

      /* IDs should be scrambled, name preserved */
      expect(definition.id).not.toBe(original.id);
      expect(definition.components[0].id).not.toBe(original.components[0].id);
      expect(definition.children![0].id).not.toBe(original.children![0].id);
      expect(finalParentChildren[0].name).toBe('Duplicated Object');
    });
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

    const mutation = new CreateGameObjectFromDefinitionMutation({
      type: CreateGameObjectType.CreateNew,
      definition: blankDefinition(),
      parent: fakeParentGameObjectData,
    });

    // Test
    const testFunc = (): Promise<void> => mockSceneViewController.mutatorNew.apply(mutation);

    // Assert
    await expect(testFunc).rejects.toThrow("No GameObject exists with ID 'fake-parent-id'");
  });
});


function blankDefinition(id: string = 'new-object-id'): GameObjectDefinition {
  return {
    id,
    name: "New Object",
    transform: {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
    },
    children: [],
    components: [],
  };
}

function nonBlankDefinition(name: string = 'My Cool Object'): GameObjectDefinition {
  return {
    id: uuid(),
    name,
    transform: {
      position: { x: 5, y: 10, z: -3 },
      rotation: { x: 0, y: 45, z: 0 },
      scale: { x: 2, y: 2, z: 2 },
    },
    children: [
      {
        id: uuid(),
        name: 'Child Object',
        transform: {
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
        },
        children: [],
        components: [],
      },
    ],
    components: [
      {
        id: uuid(),
        type: ComponentDefinitionType.Camera,
      },
    ],
  };
}

function cloneGameObjectDefinition(definition: GameObjectDefinition): GameObjectDefinition {
  return JSON.parse(JSON.stringify(definition)) as GameObjectDefinition;
}
