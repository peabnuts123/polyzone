import { describe, test, expect } from 'vitest';

import { Vector3 } from '@polyzone/core/src/util';
import { GameObjectDefinition } from '@polyzone/runtime/src/cartridge';

import { MockProject } from '@test/integration/mock/project/MockProject';
import { MockProjectController } from '@test/integration/mock/project/MockProjectController';
import { MockSceneViewController } from '@test/integration/mock/scene/MockSceneViewController';

import { loadObjectDefinition } from '@lib/project/data';
import { SetGameObjectPositionMutation } from './SetGameObjectPositionMutation';
import { IVector3Like } from '@babylonjs/core/Maths/math.like';

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
    await mockSceneViewController.mutator.beginContinuous(mutation);

    /*
      @NOTE Easiest just to assert everything as .x .y .z separately since there are multiple
      different types of Vector3 at play here, and none of them ~quite work with .toEqual() because
      of different internal properties.
    */
    const expectVector3ToEqual = (actual: IVector3Like, expected: IVector3Like, formatAssertMessage: (propertyName: string) => string): void => {
      // @TODO could actually just map these to a new object with x/y/z on it for better diffs.
      expect(actual.x, formatAssertMessage('X')).toBe(expected.x);
      expect(actual.y, formatAssertMessage('Y')).toBe(expected.y);
      expect(actual.z, formatAssertMessage('Z')).toBe(expected.z);
    };

    // Apply several position updates in series
    let finalPosition: Vector3 = new Vector3(0, 0, 0);
    for (let i = 0; i < 3; i++) {
      finalPosition = new Vector3(5 + i * 2, 10 + i * 3, 15 + i * 4);
      await mockSceneViewController.mutator.updateContinuous(mutation, {
        position: finalPosition,
      });

      // Each update should modify the data and Babylon state
      expectVector3ToEqual(mockGameObjectData.transform.position, finalPosition, (property) => `GameObject data position ${property} should be updated after step ${i}`);
      expectVector3ToEqual(mockGameObject.transform.localPosition, finalPosition, (property) => `Babylon GameObject position ${property} should be updated after step ${i}`);

      // But definition should not be updated until apply()
      const afterUpdateDefinitionPosition = mockSceneViewController.sceneDefinition.objects[0].transform.position;
      expectVector3ToEqual(afterUpdateDefinitionPosition, initialPosition, (property) => `GameObject definition position ${property} should remain initial during update ${i}`);
    }

    // Apply should only persist the final value
    await mockSceneViewController.mutator.apply(mutation);

    const finalDataPosition = mockGameObjectData.transform.position;
    const finalBabylonPosition = mockGameObject.transform.localPosition;
    const finalDefinitionPosition = mockSceneViewController.sceneDefinition.objects[0].transform.position;

    // Assert
    /* Initial state */
    expectVector3ToEqual(initialDataPosition, initialPosition, (property) => `GameObject data should have the initial position ${property}`);
    expectVector3ToEqual(initialBabylonPosition, initialPosition, (property) => `Babylon GameObject should have the initial position ${property}`);
    expectVector3ToEqual(initialDefinitionPosition, initialPosition, (property) => `GameObject definition should have the initial position ${property}`);

    /* Final state - only final value should be persisted */
    expectVector3ToEqual(finalDataPosition, finalPosition, (property) => `GameObject data should have the final position ${property}`);
    expectVector3ToEqual(finalBabylonPosition, finalPosition, (property) => `Babylon GameObject should have the final position ${property}`);
    expectVector3ToEqual(finalDefinitionPosition, finalPosition, (property) => `GameObject definition should have the final position ${property} persisted`);
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
      await mockSceneViewController.mutator.beginContinuous(mutation);
    };

    // Assert
    await expect(testFunc(), "Should throw error when GameObject doesn't exist in scene").rejects.toThrow(`No GameObject exists with ID '${nonExistentGameObjectData.id}' in scene`);
  });
});
