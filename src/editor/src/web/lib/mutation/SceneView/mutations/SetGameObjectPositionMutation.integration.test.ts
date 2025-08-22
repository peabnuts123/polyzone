import { describe, test, expect } from 'vitest';

import { Vector3 } from '@polyzone/core/src/util';
import { GameObjectDefinition } from '@polyzone/runtime/src/cartridge';

import { MockProject } from '@test/integration/mock/project/MockProject';
import { MockProjectController } from '@test/integration/mock/project/MockProjectController';
import { MockSceneViewController } from '@test/integration/mock/scene/MockSceneViewController';

import { loadObjectDefinition } from '@lib/project/data';
import { SetGameObjectPositionMutation } from './SetGameObjectPositionMutation';
import { expectVector3ToEqual } from '@test/util/assert';

describe(SetGameObjectPositionMutation.name, () => {
  test("Fully applying continuous mutation updates state correctly", async () => {
    // Setup
    const initialPosition = { x: 1, y: 2, z: 3 };
    let mockGameObjectDefinition!: GameObjectDefinition;
    const mock = new MockProject(({ manifest, scene }) => ({
      manifest: manifest(),
      assets: [],
      scenes: [
        scene('sample', ({ config, object }) => ({
          config: config(),
          objects: [
            mockGameObjectDefinition = object('Mock object', () => ({
              transform: {
                position: initialPosition,
                rotation: { x: 0, y: 0, z: 0 },
                scale: { x: 1, y: 1, z: 1 },
              },
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
    const mockGameObjectData = mockScene.data.getGameObject(mockGameObjectDefinition.id);
    const mockGameObject = mockSceneViewController.findGameObjectById(mockGameObjectData.id)!;

    const initialDataPosition = mockGameObjectData.transform.position;
    const initialBabylonPosition = mockGameObject.transform.localPosition.clone();
    const initialDefinitionPosition = mockSceneViewController.sceneDefinition.objects[0].transform.position;

    const mutation = new SetGameObjectPositionMutation(mockGameObjectData.id);

    // Test
    await mockSceneViewController.mutatorNew.beginContinuous(mutation);

    // Apply several position updates in series
    let finalPosition: Vector3 = new Vector3(0, 0, 0);
    for (let i = 0; i < 3; i++) {
      finalPosition = new Vector3(5 + i * 2, 10 + i * 3, 15 + i * 4);
      await mockSceneViewController.mutatorNew.updateContinuous(mutation, {
        position: finalPosition,
      });

      // Each update should modify the data and Babylon state
      expectVector3ToEqual(mockGameObjectData.transform.position, finalPosition, `GameObject data position should be updated after step ${i}`);
      expectVector3ToEqual(mockGameObject.transform.localPosition, finalPosition, `Babylon GameObject position should be updated after step ${i}`);

      // But definition should not be updated until apply()
      const afterUpdateDefinitionPosition = mockSceneViewController.sceneDefinition.objects[0].transform.position;
      expectVector3ToEqual(afterUpdateDefinitionPosition, initialPosition, `GameObject definition position should remain initial value during update ${i}`);
    }

    // Apply should only persist the final value
    await mockSceneViewController.mutatorNew.apply(mutation);

    const finalDataPosition = mockGameObjectData.transform.position;
    const finalBabylonPosition = mockGameObject.transform.localPosition;
    const finalDefinitionPosition = mockSceneViewController.sceneDefinition.objects[0].transform.position;

    // Assert
    /* Initial state */
    expectVector3ToEqual(initialDataPosition, initialPosition, `GameObject data should have the initial position`);
    expectVector3ToEqual(initialBabylonPosition, initialPosition, `Babylon GameObject should have the initial position`);
    expectVector3ToEqual(initialDefinitionPosition, initialPosition, `GameObject definition should have the initial position`);

    /* Final state - only final value should be persisted */
    expectVector3ToEqual(finalDataPosition, finalPosition, `GameObject data should have the final position`);
    expectVector3ToEqual(finalBabylonPosition, finalPosition, `Babylon GameObject should have the final position`);
    expectVector3ToEqual(finalDefinitionPosition, finalPosition, `GameObject definition should have the final position`);
  });

  test("Error when GameObject doesn't exist in scene", async () => {
    // Setup
    let mockNonExistentGameObjectDefinition!: GameObjectDefinition;
    const mock = new MockProject(({ manifest, scene }) => {
      return {
        manifest: manifest(),
        assets: [],
        scenes: [
          scene('sample', ({ config, object }) => {
            // Create a non-existent GameObject definition but don't add it to the scene
            mockNonExistentGameObjectDefinition = object('Non-existent object');
            return {
              config: config(),
              objects: [], // Empty - GameObject exists in definition but not in scene
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

    // Create a GameObject that exists in data but not in Babylon scene
    const nonExistentGameObjectData = loadObjectDefinition(
      mockNonExistentGameObjectDefinition,
      mockProjectController.project.assets,
    );

    const mutation = new SetGameObjectPositionMutation(nonExistentGameObjectData.id);

    // Test
    const testFunc = async (): Promise<void> => {
      await mockSceneViewController.mutatorNew.beginContinuous(mutation);
    };

    // Assert
    await expect(testFunc(), "Should throw error when GameObject doesn't exist in scene").rejects.toThrow(`No GameObject exists with ID '${nonExistentGameObjectData.id}' in scene`);
  });

  test("Undo reverts position mutation to original state", async () => {
    // Setup
    const initialPosition = { x: 1, y: 2, z: 3 };
    const newPosition = new Vector3(10, 20, 30);
    let mockGameObjectDefinition!: GameObjectDefinition;
    const mock = new MockProject(({ manifest, scene }) => ({
      manifest: manifest(),
      assets: [],
      scenes: [
        scene('sample', ({ config, object }) => ({
          config: config(),
          objects: [
            mockGameObjectDefinition = object('Mock object', () => ({
              transform: {
                position: initialPosition,
                rotation: { x: 0, y: 0, z: 0 },
                scale: { x: 1, y: 1, z: 1 },
              },
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
    const mockGameObjectData = mockScene.data.getGameObject(mockGameObjectDefinition.id);
    const mockGameObject = mockSceneViewController.findGameObjectById(mockGameObjectData.id)!;

    // Capture initial state
    const initialDataPosition = mockGameObjectData.transform.position;
    const initialBabylonPosition = mockGameObject.transform.localPosition.clone();
    const initialDefinitionPosition = mockSceneViewController.sceneDefinition.objects[0].transform.position;

    const mutation = new SetGameObjectPositionMutation(mockGameObjectData.id);

    // Apply mutation (begin + update + apply)
    await mockSceneViewController.mutatorNew.applyInstantly(mutation, {
      position: newPosition,
    });

    // Capture state after mutation
    const afterMutationDataPosition = mockGameObjectData.transform.position;
    const afterMutationBabylonPosition = mockGameObject.transform.localPosition.clone();
    const afterMutationDefinitionPosition = mockSceneViewController.sceneDefinition.objects[0].transform.position;

    // Undo the mutation
    await mockSceneViewController.mutatorNew.undo();

    // Capture state after undo
    const afterUndoDataPosition = mockGameObjectData.transform.position;
    const afterUndoBabylonPosition = mockGameObject.transform.localPosition.clone();
    const afterUndoDefinitionPosition = mockSceneViewController.sceneDefinition.objects[0].transform.position;

    // Assert initial state
    expectVector3ToEqual(initialDataPosition, initialPosition, `GameObject data should have initial position`);
    expectVector3ToEqual(initialBabylonPosition, initialPosition, `Babylon GameObject should have initial position`);
    expectVector3ToEqual(initialDefinitionPosition, initialPosition, `GameObject definition should have initial position`);

    // Assert state after mutation
    expectVector3ToEqual(afterMutationDataPosition, newPosition, `GameObject data should have new position`);
    expectVector3ToEqual(afterMutationBabylonPosition, newPosition, `Babylon GameObject should have new position`);
    expectVector3ToEqual(afterMutationDefinitionPosition, newPosition, `GameObject definition should have new position`);

    // Assert state after undo matches initial state
    expectVector3ToEqual(afterUndoDataPosition, initialPosition, `GameObject data should have initial position`);
    expectVector3ToEqual(afterUndoBabylonPosition, initialPosition, `Babylon GameObject should have initial position`);
    expectVector3ToEqual(afterUndoDefinitionPosition, initialPosition, `GameObject definition should have initial position`);
  });
});
