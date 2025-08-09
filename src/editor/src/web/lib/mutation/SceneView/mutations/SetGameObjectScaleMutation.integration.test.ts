import { describe, test, expect } from 'vitest';

import { Vector3 } from '@polyzone/core/src/util';
import { GameObjectDefinition } from '@polyzone/runtime/src/cartridge';

import { MockProject } from '@test/integration/mock/project/MockProject';
import { MockProjectController } from '@test/integration/mock/project/MockProjectController';
import { MockSceneViewController } from '@test/integration/mock/scene/MockSceneViewController';

import { loadObjectDefinition } from '@lib/project/data';
import { SetGameObjectScaleMutation } from './SetGameObjectScaleMutation';
import { IVector3Like } from '@babylonjs/core/Maths/math.like';

describe(SetGameObjectScaleMutation.name, () => {
  test("Fully applying continuous mutation with absolute scale updates state correctly", async () => {
    // Setup
    const initialScale = { x: 1, y: 2, z: 3 };
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
                rotation: { x: 0, y: 0, z: 0 },
                scale: initialScale,
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

    const initialDataScale = mockGameObjectData.transform.scale.clone();
    const initialBabylonScale = mockGameObject.transform.localScale.clone();
    const initialDefinitionScale = mockSceneViewController.sceneDefinition.objects[0].transform.scale;

    const mutation = new SetGameObjectScaleMutation(mockGameObjectData.id);

    // Test
    await mockSceneViewController.mutator.beginContinuous(mutation);

    /*
      Test assertion utilities
      There are several variants of Vector3 classes (WrappedVector3Babylon, ObservableVector3, etc.)
      which makes equality a bit difficult. So, asserting X/Y/Z individually.
     */
    const expectVector3ToEqual = (actual: IVector3Like, expected: IVector3Like, formatAssertMessage: (propertyName: string) => string): void => {
      // @TODO could actually just map these to a new object with x/y/z on it for better diffs.
      expect(actual.x, formatAssertMessage('X')).toBe(expected.x);
      expect(actual.y, formatAssertMessage('Y')).toBe(expected.y);
      expect(actual.z, formatAssertMessage('Z')).toBe(expected.z);
    };

    // Apply several scale updates in series
    let finalScale: Vector3 = new Vector3(0, 0, 0);
    for (let i = 0; i < 3; i++) {
      finalScale = new Vector3(2 + i * 0.5, 3 + i * 0.5, 4 + i * 0.5);
      await mockSceneViewController.mutator.updateContinuous(mutation, {
        scale: finalScale,
      });

      // Each update should modify the data and Babylon state
      expectVector3ToEqual(mockGameObjectData.transform.scale, finalScale, (property) => `GameObject data scale ${property} should be updated after step ${i}`);
      expectVector3ToEqual(mockGameObject.transform.localScale, finalScale, (property) => `Babylon GameObject scale ${property} should be updated after step ${i}`);

      // But definition should not be updated until apply()
      const afterUpdateDefinitionScale = mockSceneViewController.sceneDefinition.objects[0].transform.scale;
      expectVector3ToEqual(afterUpdateDefinitionScale, initialScale, (property) => `GameObject definition scale ${property} should remain initial during update ${i}`);
    }

    // Apply should only persist the final value
    await mockSceneViewController.mutator.apply(mutation);

    const finalDataScale = mockGameObjectData.transform.scale;
    const finalBabylonScale = mockGameObject.transform.localScale;
    const finalDefinitionScale = mockSceneViewController.sceneDefinition.objects[0].transform.scale;

    // Assert
    /* Initial state */
    expectVector3ToEqual(initialDataScale, initialScale, (property) => `GameObject data should have the initial scale ${property}`);
    expectVector3ToEqual(initialBabylonScale, initialScale, (property) => `Babylon GameObject should have the initial scale ${property}`);
    expectVector3ToEqual(initialDefinitionScale, initialScale, (property) => `GameObject definition should have the initial scale ${property}`);

    /* Final state - only final value should be persisted */
    expectVector3ToEqual(finalDataScale, finalScale, (property) => `GameObject data should have the final scale ${property}`);
    expectVector3ToEqual(finalBabylonScale, finalScale, (property) => `Babylon GameObject should have the final scale ${property}`);
    expectVector3ToEqual(finalDefinitionScale, finalScale, (property) => `GameObject definition should have the final scale ${property} persisted`);
  });

  test("Fully applying continuous mutation with delta scale updates state correctly", async () => {
    // Setup
    const initialScale = { x: 2, y: 3, z: 4 };
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
                rotation: { x: 0, y: 0, z: 0 },
                scale: initialScale,
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

    const initialDataScale = mockGameObjectData.transform.scale.clone();
    const initialBabylonScale = mockGameObject.transform.localScale.clone();
    const initialDefinitionScale = mockSceneViewController.sceneDefinition.objects[0].transform.scale;

    const mutation = new SetGameObjectScaleMutation(mockGameObjectData.id);

    // Test
    await mockSceneViewController.mutator.beginContinuous(mutation);

    const expectVector3ToEqual = (actual: IVector3Like, expected: IVector3Like, formatAssertMessage: (propertyName: string) => string): void => {
      expect(actual.x, formatAssertMessage('X')).toBe(expected.x);
      expect(actual.y, formatAssertMessage('Y')).toBe(expected.y);
      expect(actual.z, formatAssertMessage('Z')).toBe(expected.z);
    };

    // Apply several delta scale updates in series
    const deltaScales = [
      new Vector3(1.5, 2.0, 0.5),
      new Vector3(0.8, 1.2, 2.0),
      new Vector3(2.0, 0.5, 1.5),
    ];

    const expectedScale = new Vector3(initialScale.x, initialScale.y, initialScale.z);
    for (let i = 0; i < deltaScales.length; i++) {
      const deltaScale = deltaScales[i];
      expectedScale.multiplySelf(deltaScale);

      await mockSceneViewController.mutator.updateContinuous(mutation, {
        scaleDelta: deltaScale,
      });

      // Each update should modify the data and Babylon state
      expectVector3ToEqual(mockGameObjectData.transform.scale, expectedScale, (property) => `GameObject data scale ${property} should be updated after delta step ${i}`);
      expectVector3ToEqual(mockGameObject.transform.localScale, expectedScale, (property) => `Babylon GameObject scale ${property} should be updated after delta step ${i}`);

      // But definition should not be updated until apply()
      const afterUpdateDefinitionScale = mockSceneViewController.sceneDefinition.objects[0].transform.scale;
      expectVector3ToEqual(afterUpdateDefinitionScale, initialScale, (property) => `GameObject definition scale ${property} should remain initial during delta update ${i}`);
    }

    // Apply should only persist the final value
    await mockSceneViewController.mutator.apply(mutation);

    const finalDataScale = mockGameObjectData.transform.scale;
    const finalBabylonScale = mockGameObject.transform.localScale;
    const finalDefinitionScale = mockSceneViewController.sceneDefinition.objects[0].transform.scale;

    // Assert
    /* Initial state */
    expectVector3ToEqual(initialDataScale, initialScale, (property) => `GameObject data should have the initial scale ${property}`);
    expectVector3ToEqual(initialBabylonScale, initialScale, (property) => `Babylon GameObject should have the initial scale ${property}`);
    expectVector3ToEqual(initialDefinitionScale, initialScale, (property) => `GameObject definition should have the initial scale ${property}`);

    /* Final state - only final value should be persisted */
    expectVector3ToEqual(finalDataScale, expectedScale, (property) => `GameObject data should have the final scale ${property}`);
    expectVector3ToEqual(finalBabylonScale, expectedScale, (property) => `Babylon GameObject should have the final scale ${property}`);
    expectVector3ToEqual(finalDefinitionScale, expectedScale, (property) => `GameObject definition should have the final scale ${property} persisted`);
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

    const mutation = new SetGameObjectScaleMutation(nonExistentGameObjectData.id);

    // Test
    const testFunc = async (): Promise<void> => {
      await mockSceneViewController.mutator.beginContinuous(mutation);
    };

    // Assert
    await expect(testFunc(), "Should throw error when GameObject doesn't exist in scene").rejects.toThrow(`No GameObject exists with ID '${nonExistentGameObjectData.id}' in scene`);
  });
});
