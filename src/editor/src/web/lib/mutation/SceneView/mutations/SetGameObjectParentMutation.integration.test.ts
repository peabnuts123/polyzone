import { describe, test, expect } from 'vitest';

import { GameObjectDefinition } from '@polyzone/runtime/src/cartridge';

import { MockProject } from '@test/integration/mock/project/MockProject';
import { MockProjectController } from '@test/integration/mock/project/MockProjectController';
import { MockSceneViewController } from '@test/integration/mock/scene/MockSceneViewController';

import { loadObjectDefinition } from '@lib/project/data';
import { SetGameObjectParentMutation } from './SetGameObjectParentMutation';

describe(SetGameObjectParentMutation.name, () => {
  test("Moving a top-level GameObject to become a child of another GameObject", async () => {
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
            mockParentGameObjectDefinition = object('Parent Object'),
            mockChildGameObjectDefinition = object('Child Object'),
            object('Third Object'),
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
    const mockChildGameObjectData = mockScene.data.getGameObject(mockChildGameObjectDefinition.id);
    const mockParentGameObject = mockSceneViewController.findGameObjectById(mockParentGameObjectData.id)!;
    const mockChildGameObject = mockSceneViewController.findGameObjectById(mockChildGameObjectData.id)!;

    const initialDataTopLevelObjects = [...mockScene.data.objects];
    const initialParentDataChildren = [...mockParentGameObjectData.children];
    const initialChildPosition = mockScene.data.objects.indexOf(mockChildGameObjectData);
    const initialParentBabylonChildren = [...mockParentGameObject.transform.children];
    const initialChildBabylonParent = mockChildGameObject.transform.parent;
    const initialDefinitionTopLevelObjects = [...mockSceneViewController.sceneDefinition.objects];
    const initialParentDefinitionChildren = mockSceneViewController.sceneDefinition.objects.find(obj => obj.id === mockParentGameObjectDefinition.id)?.children ?? [];

    const mutation = new SetGameObjectParentMutation({
      gameObject: mockChildGameObjectData,
      newParent: mockParentGameObjectData,
    });

    // Test
    /* Apply */
    await mockSceneViewController.mutatorNew.apply(mutation);

    const updatedDataTopLevelObjects = [...mockScene.data.objects];
    const updatedParentDataChildren = [...mockParentGameObjectData.children];
    const updatedParentBabylonChildren = [...mockParentGameObject.transform.children];
    const updatedChildBabylonParent = mockChildGameObject.transform.parent;
    const updatedDefinitionTopLevelObjects = [...mockSceneViewController.sceneDefinition.objects];
    const updatedParentDefinitionChildren = mockSceneViewController.sceneDefinition.objects.find(obj => obj.id === mockParentGameObjectDefinition.id)?.children ?? [];

    /* Undo */
    await mockSceneViewController.mutatorNew.undo();

    const finalDataTopLevelObjects = [...mockScene.data.objects];
    const finalParentDataChildren = [...mockParentGameObjectData.children];
    const finalChildPosition = mockScene.data.objects.indexOf(mockChildGameObjectData);
    const finalParentBabylonChildren = [...mockParentGameObject.transform.children];
    const finalChildBabylonParent = mockChildGameObject.transform.parent;
    const finalDefinitionTopLevelObjects = [...mockSceneViewController.sceneDefinition.objects];
    const finalParentDefinitionChildren = mockSceneViewController.sceneDefinition.objects.find(obj => obj.id === mockParentGameObjectDefinition.id)?.children ?? [];

    // Assert
    /* @NOTE we can't assert Babylon top-level objects length as Babylon objects aren't stored in a hierarchy */

    /* Initial state - both objects should be top-level */
    expect(initialDataTopLevelObjects).toHaveLength(3);
    expect(initialParentDataChildren).toHaveLength(0);
    expect(initialChildPosition).toBe(1);
    expect(initialParentBabylonChildren).toHaveLength(0);
    expect(initialChildBabylonParent).toBeUndefined();
    expect(initialDefinitionTopLevelObjects).toHaveLength(3);
    expect(initialParentDefinitionChildren).toHaveLength(0);

    /* Update state - child should be under parent */
    expect(updatedDataTopLevelObjects).toHaveLength(2);
    expect(updatedParentDataChildren).toHaveLength(1);
    expect(updatedParentBabylonChildren).toHaveLength(1);
    expect(updatedChildBabylonParent).toBe(mockParentGameObject.transform);
    expect(updatedDefinitionTopLevelObjects).toHaveLength(2);
    expect(updatedParentDefinitionChildren).toHaveLength(1);

    /* Final state - child object should be back at top level */
    expect(finalDataTopLevelObjects).toHaveLength(3);
    expect(finalParentDataChildren).toHaveLength(0);
    expect(finalChildPosition).toBe(1);
    expect(finalParentBabylonChildren).toHaveLength(0);
    expect(finalChildBabylonParent).toBeUndefined();
    expect(finalDefinitionTopLevelObjects).toHaveLength(3);
    expect(finalParentDefinitionChildren).toHaveLength(0);
  });

  test("Moving a child GameObject to become a top-level GameObject", async () => {
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
            mockParentGameObjectDefinition = object('Parent Object', () => ({
              children: [
                mockChildGameObjectDefinition = object('Child Object'),
                object('Sibling Object'),
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
    const mockChildGameObjectData = mockScene.data.getGameObject(mockChildGameObjectDefinition.id);
    const mockParentGameObject = mockSceneViewController.findGameObjectById(mockParentGameObjectData.id)!;
    const mockChildGameObject = mockSceneViewController.findGameObjectById(mockChildGameObjectData.id)!;

    const initialDataTopLevelObjects = [...mockScene.data.objects];
    const initialParentDataChildren = [...mockParentGameObjectData.children];
    const initialChildPosition = mockParentGameObjectData.children.indexOf(mockChildGameObjectData);
    const initialParentBabylonChildren = [...mockParentGameObject.transform.children];
    const initialChildBabylonParent = mockChildGameObject.transform.parent;
    const initialDefinitionTopLevelObjects = [...mockSceneViewController.sceneDefinition.objects];
    const initialParentDefinitionChildren = mockSceneViewController.sceneDefinition.objects[0].children ?? [];

    const mutation = new SetGameObjectParentMutation({
      gameObject: mockChildGameObjectData,
      newParent: undefined,
    });

    // Test
    await mockSceneViewController.mutatorNew.apply(mutation);

    const updatedDataTopLevelObjects = [...mockScene.data.objects];
    const updatedParentDataChildren = [...mockParentGameObjectData.children];
    const updatedParentBabylonChildren = [...mockParentGameObject.transform.children];
    const updatedChildBabylonParent = mockChildGameObject.transform.parent;
    const updatedDefinitionObjects = [...mockSceneViewController.sceneDefinition.objects];
    const updatedParentDefinitionChildren = mockSceneViewController.sceneDefinition.objects[0].children ?? [];

    await mockSceneViewController.mutatorNew.undo();

    const finalDataTopLevelObjects = [...mockScene.data.objects];
    const finalParentDataChildren = [...mockParentGameObjectData.children];
    const finalChildPosition = mockParentGameObjectData.children.indexOf(mockChildGameObjectData);
    const finalParentBabylonChildren = [...mockParentGameObject.transform.children];
    const finalChildBabylonParent = mockChildGameObject.transform.parent;
    const finalDefinitionTopLevelObjects = [...mockSceneViewController.sceneDefinition.objects];
    const finalParentDefinitionChildren = mockSceneViewController.sceneDefinition.objects[0].children ?? [];

    // Assert
    /* @NOTE we can't assert Babylon top-level objects length as Babylon objects aren't stored in a hierarchy */

    /* Initial state - child should be under parent */
    expect(initialDataTopLevelObjects).toHaveLength(1);
    expect(initialParentDataChildren).toHaveLength(2);
    expect(initialChildPosition).toBe(0);
    expect(initialParentBabylonChildren).toHaveLength(2);
    expect(initialChildBabylonParent).toBe(mockParentGameObject.transform);
    expect(initialDefinitionTopLevelObjects).toHaveLength(1);
    expect(initialParentDefinitionChildren).toHaveLength(2);

    /* Updated state - child should be top-level */
    expect(updatedDataTopLevelObjects).toHaveLength(2);
    expect(updatedParentDataChildren).toHaveLength(1);
    expect(updatedParentBabylonChildren).toHaveLength(1);
    expect(updatedChildBabylonParent).toBeUndefined();
    expect(updatedDefinitionObjects).toHaveLength(2);
    expect(updatedParentDefinitionChildren).toHaveLength(1);

    /* Final state - child object should be back under parent in same position */
    expect(finalDataTopLevelObjects).toHaveLength(1);
    expect(finalParentDataChildren).toHaveLength(2);
    expect(finalChildPosition).toBe(0);
    expect(finalParentBabylonChildren).toHaveLength(2);
    expect(finalChildBabylonParent).toBe(mockParentGameObject.transform);
    expect(finalDefinitionTopLevelObjects).toHaveLength(1);
    expect(finalParentDefinitionChildren).toHaveLength(2);
  });

  test("Moving a GameObject from one parent to another parent", async () => {
    // Setup
    let mockParentAGameObjectDefinition!: GameObjectDefinition;
    let mockParentBGameObjectDefinition!: GameObjectDefinition;
    let mockChildGameObjectDefinition!: GameObjectDefinition;
    const mock = new MockProject(({ manifest, scene }) => ({
      manifest: manifest(),
      assets: [],
      scenes: [
        scene('sample', ({ config, object }) => ({
          config: config(),
          objects: [
            mockParentAGameObjectDefinition = object('Parent A', () => ({
              children: [
                mockChildGameObjectDefinition = object('Child Object'),
                object('Sibling A'),
              ],
            })),
            mockParentBGameObjectDefinition = object('Parent B'),
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
    const mockParentAGameObjectData = mockScene.data.getGameObject(mockParentAGameObjectDefinition.id);
    const mockParentBGameObjectData = mockScene.data.getGameObject(mockParentBGameObjectDefinition.id);
    const mockChildGameObjectData = mockScene.data.getGameObject(mockChildGameObjectDefinition.id);
    const mockParentAGameObject = mockSceneViewController.findGameObjectById(mockParentAGameObjectData.id)!;
    const mockParentBGameObject = mockSceneViewController.findGameObjectById(mockParentBGameObjectData.id)!;
    const mockChildGameObject = mockSceneViewController.findGameObjectById(mockChildGameObjectData.id)!;

    const initialDataTopLevelObjects = [...mockScene.data.objects];
    const initialParentADataChildren = [...mockParentAGameObjectData.children];
    const initialParentBDataChildren = [...mockParentBGameObjectData.children];
    const initialChildPosition = mockParentAGameObjectData.children.indexOf(mockChildGameObjectData);
    const initialParentABabylonChildren = [...mockParentAGameObject.transform.children];
    const initialParentBBabylonChildren = [...mockParentBGameObject.transform.children];
    const initialChildBabylonParent = mockChildGameObject.transform.parent;
    const initialDefinitionTopLevelObjects = [...mockSceneViewController.sceneDefinition.objects];
    const initialParentADefinitionChildren = [...(mockSceneViewController.sceneDefinition.objects.find(obj => obj.id === mockParentAGameObjectDefinition.id)?.children ?? [])];
    const initialParentBDefinitionChildren = [...(mockSceneViewController.sceneDefinition.objects.find(obj => obj.id === mockParentBGameObjectDefinition.id)?.children ?? [])];

    const mutation = new SetGameObjectParentMutation({
      gameObject: mockChildGameObjectData,
      newParent: mockParentBGameObjectData,
    });

    // Test
    await mockSceneViewController.mutatorNew.apply(mutation);

    const updatedDataTopLevelObjects = [...mockScene.data.objects];
    const updatedParentADataChildren = [...mockParentAGameObjectData.children];
    const updatedParentBDataChildren = [...mockParentBGameObjectData.children];
    const updatedParentABabylonChildren = [...mockParentAGameObject.transform.children];
    const updatedParentBBabylonChildren = [...mockParentBGameObject.transform.children];
    const updatedChildBabylonParent = mockChildGameObject.transform.parent;
    const updatedDefinitionObjects = [...mockSceneViewController.sceneDefinition.objects];
    const updatedParentADefinitionChildren = mockSceneViewController.sceneDefinition.objects.find(obj => obj.id === mockParentAGameObjectDefinition.id)?.children ?? [];
    const updatedParentBDefinitionChildren = mockSceneViewController.sceneDefinition.objects.find(obj => obj.id === mockParentBGameObjectDefinition.id)?.children ?? [];

    /* Undo */
    await mockSceneViewController.mutatorNew.undo();

    const finalDataTopLevelObjects = [...mockScene.data.objects];
    const finalParentADataChildren = [...mockParentAGameObjectData.children];
    const finalParentBDataChildren = [...mockParentBGameObjectData.children];
    const finalChildPosition = mockParentAGameObjectData.children.indexOf(mockChildGameObjectData);
    const finalParentABabylonChildren = [...mockParentAGameObject.transform.children];
    const finalParentBBabylonChildren = [...mockParentBGameObject.transform.children];
    const finalChildBabylonParent = mockChildGameObject.transform.parent;
    const finalDefinitionTopLevelObjects = [...mockSceneViewController.sceneDefinition.objects];
    const finalParentADefinitionChildren = [...(mockSceneViewController.sceneDefinition.objects.find(obj => obj.id === mockParentAGameObjectDefinition.id)?.children ?? [])];
    const finalParentBDefinitionChildren = [...(mockSceneViewController.sceneDefinition.objects.find(obj => obj.id === mockParentBGameObjectDefinition.id)?.children ?? [])];

    // Assert
    /* Initial state - child should be under Parent A */
    expect(initialDataTopLevelObjects).toHaveLength(2);
    expect(initialParentADataChildren).toHaveLength(2);
    expect(initialParentBDataChildren).toHaveLength(0);
    expect(initialChildPosition).toBe(0);
    expect(initialParentABabylonChildren).toHaveLength(2);
    expect(initialParentBBabylonChildren).toHaveLength(0);
    expect(initialChildBabylonParent).toBe(mockParentAGameObject.transform);
    expect(initialDefinitionTopLevelObjects).toHaveLength(2);
    expect(initialParentADefinitionChildren).toHaveLength(2);
    expect(initialParentBDefinitionChildren).toHaveLength(0);

    /* Updated state - child should be under Parent B */
    expect(updatedDataTopLevelObjects).toHaveLength(2); // Same top-level objects
    expect(updatedParentADataChildren).toHaveLength(1);
    expect(updatedParentBDataChildren).toHaveLength(1);
    expect(updatedParentABabylonChildren).toHaveLength(1);
    expect(updatedParentBBabylonChildren).toHaveLength(1);
    expect(updatedChildBabylonParent).toBe(mockParentBGameObject.transform);
    expect(updatedDefinitionObjects).toHaveLength(2); // Same top-level objects
    expect(updatedParentADefinitionChildren).toHaveLength(1);
    expect(updatedParentBDefinitionChildren).toHaveLength(1);

    /* Final state - child should be back under Parent A */
    expect(finalDataTopLevelObjects).toHaveLength(2);
    expect(finalParentADataChildren).toHaveLength(2);
    expect(finalParentBDataChildren).toHaveLength(0);
    expect(finalChildPosition).toBe(0);
    expect(finalParentABabylonChildren).toHaveLength(2);
    expect(finalParentBBabylonChildren).toHaveLength(0);
    expect(finalChildBabylonParent).toBe(mockParentAGameObject.transform);
    expect(finalDefinitionTopLevelObjects).toHaveLength(2);
    expect(finalParentADefinitionChildren).toHaveLength(2);
    expect(finalParentBDefinitionChildren).toHaveLength(0);
  });

  test("Moving a GameObject with a specific sibling target (before)", async () => {
    // Setup
    let mockParentGameObjectDefinition!: GameObjectDefinition;
    let mockSibling1GameObjectDefinition!: GameObjectDefinition;
    let mockSibling2GameObjectDefinition!: GameObjectDefinition;
    let mockMovingGameObjectDefinition!: GameObjectDefinition;
    const mock = new MockProject(({ manifest, scene }) => ({
      manifest: manifest(),
      assets: [],
      scenes: [
        scene('sample', ({ config, object }) => ({
          config: config(),
          objects: [
            mockParentGameObjectDefinition = object('Parent Object', () => ({
              children: [
                mockSibling1GameObjectDefinition = object('Sibling 1'),
                mockSibling2GameObjectDefinition = object('Sibling 2'),
              ],
            })),
            mockMovingGameObjectDefinition = object('Moving Object'),
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
    const mockSibling1GameObjectData = mockParentGameObjectData.children[0];
    const mockMovingGameObjectData = mockScene.data.getGameObject(mockMovingGameObjectDefinition.id);
    const mockParentGameObject = mockSceneViewController.findGameObjectById(mockParentGameObjectData.id)!;
    const mockMovingGameObject = mockSceneViewController.findGameObjectById(mockMovingGameObjectData.id)!;

    const initialDataTopLevelObjects = [...mockScene.data.objects];
    const initialParentDataChildren = [...mockParentGameObjectData.children];
    const initialBabylonTransformNodes = mockSceneViewController.babylonScene.transformNodes.length;
    const initialParentBabylonChildren = [...mockParentGameObject.transform.children];
    const initialMovingBabylonParent = mockMovingGameObject.transform.parent;
    const initialDefinitionObjects = [...mockSceneViewController.sceneDefinition.objects];
    const initialParentDefinitionChildren = [...(mockSceneViewController.sceneDefinition.objects.find(obj => obj.id === mockParentGameObjectDefinition.id)?.children ?? [])];

    const mutation = new SetGameObjectParentMutation({
      gameObject: mockMovingGameObjectData,
      newParent: mockParentGameObjectData,
      before: mockSibling1GameObjectData,
    });

    // Test
    await mockSceneViewController.mutatorNew.apply(mutation);

    const finalDataTopLevelObjects = mockScene.data.objects;
    const finalParentDataChildren = mockParentGameObjectData.children;
    const finalBabylonTransformNodes = mockSceneViewController.babylonScene.transformNodes.length;
    const finalParentBabylonChildren = mockParentGameObject.transform.children;
    const finalMovingBabylonParent = mockMovingGameObject.transform.parent;
    const finalDefinitionObjects = mockSceneViewController.sceneDefinition.objects;
    const finalParentDefinitionChildren = mockSceneViewController.sceneDefinition.objects.find(obj => obj.id === mockParentGameObjectDefinition.id)?.children ?? [];

    // Assert
    /* Initial state - Moving Object should be top-level, Parent should have 2 children */
    expect(initialDataTopLevelObjects).toHaveLength(2);
    expect(initialParentDataChildren).toHaveLength(2);
    expect(initialBabylonTransformNodes).toBe(4);
    expect(initialParentBabylonChildren).toHaveLength(2);
    expect(initialMovingBabylonParent).toBeUndefined();
    expect(initialDefinitionObjects).toHaveLength(2);
    expect(initialParentDefinitionChildren).toHaveLength(2);
    expect(initialParentDataChildren[0].id).toBe(mockSibling1GameObjectDefinition.id);
    expect(initialParentDataChildren[1].id).toBe(mockSibling2GameObjectDefinition.id);

    /* Final state - Moving Object should be first child, positioned before Sibling 1 */
    expect(finalDataTopLevelObjects).toHaveLength(1); // Only parent remains top-level
    expect(finalParentDataChildren).toHaveLength(3); // Parent now has 3 children
    expect(finalBabylonTransformNodes).toBe(4); // Same number of transform nodes
    expect(finalParentBabylonChildren).toHaveLength(3);
    expect(finalMovingBabylonParent).toBe(mockParentGameObject.transform);
    expect(finalDefinitionObjects).toHaveLength(1); // Only parent remains top-level
    expect(finalParentDefinitionChildren).toHaveLength(3);

    // Assert correct order: "Moving Object", "Sibling 1", "Sibling 2"
    expect(finalParentDataChildren[0].id).toBe(mockMovingGameObjectDefinition.id);
    expect(finalParentDataChildren[1].id).toBe(mockSibling1GameObjectDefinition.id);
    expect(finalParentDataChildren[2].id).toBe(mockSibling2GameObjectDefinition.id);
    // Babylon children don't maintain sibling order - just verify correct parent-child relationships
    expect(finalParentBabylonChildren.some(child => child.gameObject.id === mockMovingGameObjectDefinition.id)).toBe(true);
    expect(finalParentBabylonChildren.some(child => child.gameObject.id === mockSibling1GameObjectDefinition.id)).toBe(true);
    expect(finalParentBabylonChildren.some(child => child.gameObject.id === mockSibling2GameObjectDefinition.id)).toBe(true);
    expect(finalParentDefinitionChildren[0].id).toBe(mockMovingGameObjectDefinition.id);
    expect(finalParentDefinitionChildren[1].id).toBe(mockSibling1GameObjectDefinition.id);
    expect(finalParentDefinitionChildren[2].id).toBe(mockSibling2GameObjectDefinition.id);
  });

  test("Moving a GameObject with a specific sibling target (after)", async () => {
    // Setup
    let mockParentGameObjectDefinition!: GameObjectDefinition;
    let mockSibling1GameObjectDefinition!: GameObjectDefinition;
    let mockSibling2GameObjectDefinition!: GameObjectDefinition;
    let mockMovingGameObjectDefinition!: GameObjectDefinition;
    const mock = new MockProject(({ manifest, scene }) => ({
      manifest: manifest(),
      assets: [],
      scenes: [
        scene('sample', ({ config, object }) => ({
          config: config(),
          objects: [
            mockParentGameObjectDefinition = object('Parent Object', () => ({
              children: [
                mockSibling1GameObjectDefinition = object('Sibling 1'),
                mockSibling2GameObjectDefinition = object('Sibling 2'),
              ],
            })),
            mockMovingGameObjectDefinition = object('Moving Object'),
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
    const mockSibling1GameObjectData = mockParentGameObjectData.children[0];
    const mockMovingGameObjectData = mockScene.data.getGameObject(mockMovingGameObjectDefinition.id);
    const mockParentGameObject = mockSceneViewController.findGameObjectById(mockParentGameObjectData.id)!;
    const mockMovingGameObject = mockSceneViewController.findGameObjectById(mockMovingGameObjectData.id)!;

    const initialDataTopLevelObjects = [...mockScene.data.objects];
    const initialParentDataChildren = [...mockParentGameObjectData.children];
    const initialBabylonTransformNodes = mockSceneViewController.babylonScene.transformNodes.length;
    const initialParentBabylonChildren = [...mockParentGameObject.transform.children];
    const initialMovingBabylonParent = mockMovingGameObject.transform.parent;
    const initialDefinitionObjects = [...mockSceneViewController.sceneDefinition.objects];
    const initialParentDefinitionChildren = [...(mockSceneViewController.sceneDefinition.objects.find(obj => obj.id === mockParentGameObjectDefinition.id)?.children ?? [])];

    const mutation = new SetGameObjectParentMutation({
      gameObject: mockMovingGameObjectData,
      newParent: mockParentGameObjectData,
      after: mockSibling1GameObjectData,
    });

    // Test
    await mockSceneViewController.mutatorNew.apply(mutation);

    const finalDataTopLevelObjects = mockScene.data.objects;
    const finalParentDataChildren = mockParentGameObjectData.children;
    const finalBabylonTransformNodes = mockSceneViewController.babylonScene.transformNodes.length;
    const finalParentBabylonChildren = mockParentGameObject.transform.children;
    const finalMovingBabylonParent = mockMovingGameObject.transform.parent;
    const finalDefinitionObjects = mockSceneViewController.sceneDefinition.objects;
    const finalParentDefinitionChildren = mockSceneViewController.sceneDefinition.objects.find(obj => obj.id === mockParentGameObjectDefinition.id)?.children ?? [];

    // Assert
    /* Initial state - Moving Object should be top-level, Parent should have 2 children */
    expect(initialDataTopLevelObjects).toHaveLength(2);
    expect(initialParentDataChildren).toHaveLength(2);
    expect(initialBabylonTransformNodes).toBe(4);
    expect(initialParentBabylonChildren).toHaveLength(2);
    expect(initialMovingBabylonParent).toBeUndefined();
    expect(initialDefinitionObjects).toHaveLength(2);
    expect(initialParentDefinitionChildren).toHaveLength(2);
    expect(initialParentDataChildren[0].id).toBe(mockSibling1GameObjectDefinition.id);
    expect(initialParentDataChildren[1].id).toBe(mockSibling2GameObjectDefinition.id);

    /* Final state - Moving Object should be second child, positioned after Sibling 1 */
    expect(finalDataTopLevelObjects).toHaveLength(1); // Only parent remains top-level
    expect(finalParentDataChildren).toHaveLength(3); // Parent now has 3 children
    expect(finalBabylonTransformNodes).toBe(4); // Same number of transform nodes
    expect(finalParentBabylonChildren).toHaveLength(3);
    expect(finalMovingBabylonParent).toBe(mockParentGameObject.transform);
    expect(finalDefinitionObjects).toHaveLength(1); // Only parent remains top-level
    expect(finalParentDefinitionChildren).toHaveLength(3);

    // Assert correct order: "Sibling 1", "Moving Object", "Sibling 2"
    expect(finalParentDataChildren[0].id).toBe(mockSibling1GameObjectDefinition.id);
    expect(finalParentDataChildren[1].id).toBe(mockMovingGameObjectDefinition.id);
    expect(finalParentDataChildren[2].id).toBe(mockSibling2GameObjectDefinition.id);
    // Babylon children don't maintain sibling order - just verify correct parent-child relationships
    expect(finalParentBabylonChildren.some(child => child.gameObject.id === mockMovingGameObjectDefinition.id)).toBe(true);
    expect(finalParentBabylonChildren.some(child => child.gameObject.id === mockSibling1GameObjectDefinition.id)).toBe(true);
    expect(finalParentBabylonChildren.some(child => child.gameObject.id === mockSibling2GameObjectDefinition.id)).toBe(true);
    expect(finalParentDefinitionChildren[0].id).toBe(mockSibling1GameObjectDefinition.id);
    expect(finalParentDefinitionChildren[1].id).toBe(mockMovingGameObjectDefinition.id);
    expect(finalParentDefinitionChildren[2].id).toBe(mockSibling2GameObjectDefinition.id);
  });

  test("Error when target GameObject doesn't exist in the scene", async () => {
    // Setup
    let mockParentGameObjectDefinition!: GameObjectDefinition;
    let mockNonExistentGameObjectDefinition!: GameObjectDefinition;
    const mock = new MockProject(({ manifest, scene }) => ({
      manifest: manifest(),
      assets: [],
      scenes: [
        scene('sample', ({ config, object }) => {
          // Create a non-existent GameObject definition but don't add it to the scene
          mockNonExistentGameObjectDefinition = object('Non-existent Object');
          return {
            config: config(),
            objects: [
              mockParentGameObjectDefinition = object('Parent Object'),
            ],
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
    const mockParentGameObjectData = mockScene.data.getGameObject(mockParentGameObjectDefinition.id);

    // Create a GameObject that exists in data but not in Babylon scene
    const nonExistentGameObjectData = loadObjectDefinition(
      mockNonExistentGameObjectDefinition,
      mockProjectController.project.assets,
    );

    const mutation = new SetGameObjectParentMutation({
      gameObject: nonExistentGameObjectData,
      newParent: mockParentGameObjectData,
    });

    // Test
    const testFunc = (): Promise<void> => mockSceneViewController.mutatorNew.apply(mutation);

    // Assert
    await expect(testFunc(), "Should throw error when target GameObject doesn't exist in scene").rejects.toThrow(`No GameObject exists with ID '${nonExistentGameObjectData.id}' in scene`);
  });

  test("Error when new parent GameObject doesn't exist in the scene", async () => {
    // Setup
    let mockMovingGameObjectDefinition!: GameObjectDefinition;
    let mockNonExistentParentGameObjectDefinition!: GameObjectDefinition;
    const mock = new MockProject(({ manifest, scene }) => ({
      manifest: manifest(),
      assets: [],
      scenes: [
        scene('sample', ({ config, object }) => {
          // Create a non-existent parent GameObject definition but don't add it to the scene
          mockNonExistentParentGameObjectDefinition = object('Non-existent Parent');
          return {
            config: config(),
            objects: [
              mockMovingGameObjectDefinition = object('Moving Object'),
            ],
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
    const mockMovingGameObjectData = mockScene.data.getGameObject(mockMovingGameObjectDefinition.id);

    // Create a non-existent parent GameObject (exists in data but not in Babylon scene)
    const nonExistentParentGameObjectData = loadObjectDefinition(
      mockNonExistentParentGameObjectDefinition,
      mockProjectController.project.assets,
    );

    const mutation = new SetGameObjectParentMutation({
      gameObject: mockMovingGameObjectData,
      newParent: nonExistentParentGameObjectData,
    });

    // Test
    const testFunc = (): Promise<void> => mockSceneViewController.mutatorNew.apply(mutation);

    // Assert
    await expect(testFunc(), "Should throw error when new parent GameObject doesn't exist in scene").rejects.toThrow(`No GameObject exists with ID '${nonExistentParentGameObjectData.id}' in scene`);
  });

  test("Error when sibling target doesn't exist", async () => {
    // Setup
    let mockParentGameObjectDefinition!: GameObjectDefinition;
    let mockMovingGameObjectDefinition!: GameObjectDefinition;
    let mockNonExistentSiblingGameObjectDefinition!: GameObjectDefinition;
    const mock = new MockProject(({ manifest, scene }) => {
      return {
        manifest: manifest(),
        assets: [],
        scenes: [
          scene('sample', ({ config, object }) => {
            // Create the non-existent sibling definition but don't add it to the scene
            mockNonExistentSiblingGameObjectDefinition = object('Non-existent Sibling');

            return {
              config: config(),
              objects: [
                mockParentGameObjectDefinition = object('Parent Object', ({ object }) => ({
                  children: [
                    object('Existing Child'),
                  ],
                })),
                mockMovingGameObjectDefinition = object('Moving Object'),
              ],
            };
          }),
        ],
      };
    });

    const mockProjectController = await MockProjectController.create(mock);
    const mockScene = mockProjectController.project.scenes.getByPath(mock.scenes[0].path)!;
    const mockSceneViewController = await MockSceneViewController.create(
      mockProjectController,
      mockScene,
    );

    const mockParentGameObjectData = mockScene.data.getGameObject(mockParentGameObjectDefinition.id);
    const mockMovingGameObjectData = mockScene.data.getGameObject(mockMovingGameObjectDefinition.id);

    // Create a non-existent sibling GameObject (exists in data but not in Babylon scene)
    const nonExistentSiblingGameObjectData = loadObjectDefinition(
      mockNonExistentSiblingGameObjectDefinition,
      mockProjectController.project.assets,
    );

    const mutation = new SetGameObjectParentMutation({
      gameObject: mockMovingGameObjectData,
      newParent: mockParentGameObjectData,
      before: nonExistentSiblingGameObjectData,
    });

    // Test
    const testFunc = (): Promise<void> => mockSceneViewController.mutatorNew.apply(mutation);

    // Assert
    await expect(testFunc(), "Should throw error when sibling target GameObject doesn't exist in scene").rejects.toThrow(`Cannot apply mutation - cannot find object with ID '${nonExistentSiblingGameObjectData.id}' as child of object with ID '${mockParentGameObjectData.id}'`);
  });

  test("Transform preservation when reparenting (position/rotation/scale maintained in world space)", async () => {
    // Setup
    let _mockParentGameObjectDefinition!: GameObjectDefinition;
    let _mockChildGameObjectDefinition!: GameObjectDefinition;
    const mock = new MockProject(({ manifest, scene }) => ({
      manifest: manifest(),
      assets: [],
      scenes: [
        scene('sample', ({ config, object }) => ({
          config: config(),
          objects: [
            _mockParentGameObjectDefinition = object('Parent Object', ({ object }) => ({
              transform: {
                position: { x: 10, y: 5, z: 3 },
                rotation: { x: 45, y: 30, z: 15 },
                scale: { x: 2, y: 1.5, z: 0.8 },
              },
              children: [
                _mockChildGameObjectDefinition = object('Child Object', () => ({
                  transform: {
                    position: { x: 2, y: 1, z: -1 },
                    rotation: { x: 15, y: -10, z: 25 },
                    scale: { x: 0.5, y: 2, z: 1.2 },
                  },
                })),
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
    const mockParentGameObjectData = mockScene.data.getGameObject(_mockParentGameObjectDefinition.id);
    const mockChildGameObjectData = mockParentGameObjectData.children[0];
    const mockChildGameObject = mockSceneViewController.findGameObjectById(mockChildGameObjectData.id)!;

    // Capture initial world space transform values
    const initialChildWorldPosition = mockChildGameObject.transform.absolutePosition.clone();
    const initialChildWorldRotation = mockChildGameObject.transform.absoluteRotation.clone();
    const initialChildWorldScale = mockChildGameObject.transform.absoluteScale.clone();

    const mutation = new SetGameObjectParentMutation({
      gameObject: mockChildGameObjectData,
      newParent: undefined, // Make it top-level
    });

    // Test
    await mockSceneViewController.mutatorNew.apply(mutation);

    // Capture final world space transform values (now should be the local values since it's top-level)
    const finalChildWorldPosition = mockChildGameObject.transform.absolutePosition.clone();
    const finalChildWorldRotation = mockChildGameObject.transform.absoluteRotation.clone();
    const finalChildWorldScale = mockChildGameObject.transform.absoluteScale.clone();

    // Assert that world space transforms are preserved
    expect(finalChildWorldPosition.x, "World position X should be preserved").toBeCloseTo(initialChildWorldPosition.x, 1);
    expect(finalChildWorldPosition.y, "World position Y should be preserved").toBeCloseTo(initialChildWorldPosition.y, 1);
    expect(finalChildWorldPosition.z, "World position Z should be preserved").toBeCloseTo(initialChildWorldPosition.z, 1);

    expect(finalChildWorldRotation.x, "World rotation X should be preserved").toBeCloseTo(initialChildWorldRotation.x, 1);
    expect(finalChildWorldRotation.y, "World rotation Y should be preserved").toBeCloseTo(initialChildWorldRotation.y, 1);
    expect(finalChildWorldRotation.z, "World rotation Z should be preserved").toBeCloseTo(initialChildWorldRotation.z, 1);
    expect(finalChildWorldRotation.w, "World rotation W should be preserved").toBeCloseTo(initialChildWorldRotation.w, 1);

    expect(finalChildWorldScale.x, "World scaling X should be preserved").toBeCloseTo(initialChildWorldScale.x, 1);
    expect(finalChildWorldScale.y, "World scaling Y should be preserved").toBeCloseTo(initialChildWorldScale.y, 1);
    expect(finalChildWorldScale.z, "World scaling Z should be preserved").toBeCloseTo(initialChildWorldScale.z, 1);
  });
});
