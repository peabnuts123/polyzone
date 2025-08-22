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
import { expectQuaternionToEqual, expectVector3ToEqual } from '@test/util/assert';

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

    // Test utilities
    /**
     * Truncate the precision of a Vector3, for "close-enough" test assertions
     */
    const truncateVector3 = (vector: IVector3Like): IVector3Like => ({
      x: Number(vector.x.toFixed(4)),
      y: Number(vector.y.toFixed(4)),
      z: Number(vector.z.toFixed(4)),
    });

    // Test
    await mockSceneViewController.mutator.beginContinuous(mutation);

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
      expectVector3ToEqual(truncateVector3(mockGameObjectData.transform.rotation), finalRotationEuler, `GameObject data rotation should be updated after step ${i}`);
      expectQuaternionToEqual(mockGameObject.transform.localRotation, finalRotationQuaternion, `Babylon GameObject rotation should be updated after step ${i}`);

      // But definition should not be updated until apply()
      const afterUpdateDefinitionRotation = mockSceneViewController.sceneDefinition.objects[0].transform.rotation;
      expectVector3ToEqual(afterUpdateDefinitionRotation, initialRotation, `GameObject definition rotation should remain initial during update ${i}`);
    }

    // Apply should only persist the final value
    await mockSceneViewController.mutator.apply(mutation);

    const finalDataRotation = mockGameObjectData.transform.rotation;
    const finalBabylonRotation = mockGameObject.transform.localRotation;
    const finalDefinitionRotation = mockSceneViewController.sceneDefinition.objects[0].transform.rotation;

    // Assert
    /* Initial state */
    expectVector3ToEqual(initialDataRotation, initialRotation, `GameObject data should have the initial rotation`);
    expectQuaternionToEqual(initialBabylonRotation, Quaternion.fromEuler(toVector3Core(initialRotation)), `Babylon GameObject should have the initial rotation`);
    expectVector3ToEqual(initialDefinitionRotation, initialRotation, `GameObject definition should have the initial rotation`);

    /* Final state - only final value should be persisted */
    expectVector3ToEqual(truncateVector3(finalDataRotation), finalRotationEuler, `GameObject data should have the final rotation`);
    expectQuaternionToEqual(finalBabylonRotation, finalRotationQuaternion, `Babylon GameObject should have the final rotation`);
    expectVector3ToEqual(truncateVector3(finalDefinitionRotation), finalRotationEuler, `GameObject definition should have the final rotation`);
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
