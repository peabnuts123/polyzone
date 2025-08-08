import { describe, test, expect } from 'vitest';

import { Vector3 } from '@polyzone/core/src/util';
import { Quaternion } from '@polyzone/core/src/util/Quaternion';
import { GameObjectDefinition } from '@polyzone/runtime/src/cartridge';
import { toVector3Core } from '@polyzone/runtime/src/util';

import { MockProject } from '@test/integration/mock/project/MockProject';
import { MockProjectController } from '@test/integration/mock/project/MockProjectController';
import { MockSceneViewController } from '@test/integration/mock/scene/MockSceneViewController';

import { loadObjectDefinition } from '@lib/project/data';
import { SetGameObjectRotationMutation } from './SetGameObjectRotationMutation';
import { IVector3Like } from '@babylonjs/core/Maths/math.like';

describe(SetGameObjectRotationMutation.name, () => {
  test("Fully applying continuous mutation updates state correctly", async () => {
    // Setup
    const initialRotation = { x: 0.5, y: 1.0, z: 1.5 }; // Euler angles in radians
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
                position: { x: 0, y: 0, z: 0 },
                rotation: initialRotation,
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

    const initialDataRotation = mockGameObjectData.transform.rotation;
    const initialBabylonRotation = mockGameObject.transform.localRotation.clone();
    const initialDefinitionRotation = mockSceneViewController.sceneDefinition.objects[0].transform.rotation;

    const mutation = new SetGameObjectRotationMutation(mockGameObjectData.id);

    // Test
    await mockSceneViewController.mutator.beginContinuous(mutation);

    /*
      Test assertion utilities
      There are several variants of Vector3 and Quaternion classes (WrappedVector3Babylon, ObservableVector3, etc.)
      which makes equality a bit difficult. So, asserting X/Y/Z/W individually.
     */
    const expectVector3ToEqual = (actual: IVector3Like, expected: IVector3Like, formatAssertMessage: (propertyName: string) => string): void => {
      expect(actual.x, formatAssertMessage('X')).toBeCloseTo(expected.x, 4);
      expect(actual.y, formatAssertMessage('Y')).toBeCloseTo(expected.y, 4);
      expect(actual.z, formatAssertMessage('Z')).toBeCloseTo(expected.z, 4);
    };
    const expectQuaternionToEqual = (actual: Quaternion, expected: Quaternion, formatAssertMessage: (propertyName: string) => string): void => {
      expect(actual.x, formatAssertMessage('X')).toBeCloseTo(expected.x, 4);
      expect(actual.y, formatAssertMessage('Y')).toBeCloseTo(expected.y, 4);
      expect(actual.z, formatAssertMessage('Z')).toBeCloseTo(expected.z, 4);
      expect(actual.w, formatAssertMessage('W')).toBeCloseTo(expected.w, 4);
    };

    // Apply several rotation updates in series
    let finalRotationQuaternion: Quaternion = Quaternion.fromEuler(new Vector3(0, 0, 0));
    let finalRotationEuler: Vector3 = new Vector3(0, 0, 0);
    for (let i = 0; i < 3; i++) {
      finalRotationEuler = new Vector3(0.5 + 0.1 * i, 1.0 + 0.1 * i, 1.5 + 0.1 * i);
      finalRotationQuaternion = Quaternion.fromEuler(finalRotationEuler);
      await mockSceneViewController.mutator.updateContinuous(mutation, {
        rotation: finalRotationQuaternion,
        resetGizmo: false,
      });

      // Each update should modify the data and Babylon state
      expectVector3ToEqual(mockGameObjectData.transform.rotation, finalRotationEuler, (property) => `GameObject data rotation ${property} should be updated after step ${i}`);
      expectQuaternionToEqual(mockGameObject.transform.localRotation, finalRotationQuaternion, (property) => `Babylon GameObject rotation ${property} should be updated after step ${i}`);

      // But definition should not be updated until apply()
      const afterUpdateDefinitionRotation = mockSceneViewController.sceneDefinition.objects[0].transform.rotation;
      expectVector3ToEqual(afterUpdateDefinitionRotation, initialRotation, (property) => `GameObject definition rotation ${property} should remain initial during update ${i}`);
    }

    // Apply should only persist the final value
    await mockSceneViewController.mutator.apply(mutation);

    const finalDataRotation = mockGameObjectData.transform.rotation;
    const finalBabylonRotation = mockGameObject.transform.localRotation;
    const finalDefinitionRotation = mockSceneViewController.sceneDefinition.objects[0].transform.rotation;

    // Assert
    /* Initial state */
    expectVector3ToEqual(initialDataRotation, initialRotation, (property) => `GameObject data should have the initial rotation ${property}`);
    expectQuaternionToEqual(initialBabylonRotation, Quaternion.fromEuler(toVector3Core(initialRotation)), (property) => `Babylon GameObject should have the initial rotation ${property}`);
    expectVector3ToEqual(initialDefinitionRotation, initialRotation, (property) => `GameObject definition should have the initial rotation ${property}`);

    /* Final state - only final value should be persisted */
    expectVector3ToEqual(finalDataRotation, finalRotationEuler, (property) => `GameObject data should have the final rotation ${property}`);
    expectQuaternionToEqual(finalBabylonRotation, finalRotationQuaternion, (property) => `Babylon GameObject should have the final rotation ${property}`);
    expectVector3ToEqual(finalDefinitionRotation, finalRotationEuler, (property) => `GameObject definition should have the final rotation ${property} persisted`);
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
            // Mock GameObject exists in definition but not added to scene
            mockNonExistentGameObjectDefinition = object('Non-existent object');
            return {
              config: config(),
              objects: [],
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

    const mutation = new SetGameObjectRotationMutation(nonExistentGameObjectData.id);

    // Test
    const testFunc = async (): Promise<void> => {
      await mockSceneViewController.mutator.beginContinuous(mutation);
    };

    // Assert
    await expect(testFunc(), "Should throw error when GameObject doesn't exist in scene").rejects.toThrow(`No GameObject exists with ID '${nonExistentGameObjectData.id}' in scene`);
  });
});
