import { describe, test, expect } from 'vitest';

import { AssetType, GameObjectDefinition, MeshComponentDefinition } from '@polyzone/runtime/src/cartridge';

import { MockProject } from '@test/integration/mock/project/MockProject';
import { MockProjectController } from '@test/integration/mock/project/MockProjectController';
import { MockSceneViewController } from '@test/integration/mock/scene/MockSceneViewController';
import { MockAssets } from '@test/integration/mock/assets';

import { loadObjectDefinition, MeshComponentData } from '@lib/project/data';
import { MeshAssetDefinition } from '@lib/project/definition';
import { SetGameObjectMeshComponentAssetMutation } from './SetGameObjectMeshComponentAssetMutation';

describe(SetGameObjectMeshComponentAssetMutation.name, () => {
  test("Assigning a mesh asset to a component with no asset updates the state correctly", async () => {
    // Setup
    let mockGameObjectDefinition!: GameObjectDefinition;
    let mockMeshComponentDefinition!: MeshComponentDefinition;
    let mockMeshAssetDefinition!: MeshAssetDefinition;
    const mock = new MockProject(({ manifest, asset, scene }) => {
      return {
        manifest: manifest(),
        assets: [
          mockMeshAssetDefinition = asset(AssetType.Mesh, 'models/sphere.obj', MockAssets.models.sphereObj),
          asset(AssetType.MeshSupplementary, 'models/sphere.mtl', MockAssets.models.sphereMtl),
        ],
        scenes: [
          scene('sample', ({ config, object }) => ({
            config: config(),
            objects: [
              mockGameObjectDefinition = object('Mock object', ({ meshComponent }) => ({
                components: [
                  mockMeshComponentDefinition = meshComponent(), // Create mesh component with no asset
                ],
              })),
            ],
          })),
        ],
      };
    });
    const mockProjectController = await MockProjectController.create(mock);
    const mockScene = mockProjectController.project.scenes.getByPath(mock.scenes[0].path)!;
    const mockSceneViewController = await MockSceneViewController.create(
      mockProjectController,
      mockScene,
    );
    const mockGameObjectData = mockScene.data.getGameObject(mockGameObjectDefinition.id);
    const mockMeshComponentData = mockGameObjectData.getComponent(mockMeshComponentDefinition.id, MeshComponentData);
    const mockMeshAssetData = mockProjectController.project.assets.getById(mockMeshAssetDefinition.id, AssetType.Mesh);

    const initialDataValue = mockMeshComponentData.meshAsset;
    const initialDefinitionValue = (mockSceneViewController.sceneDefinition.objects[0].components[0] as MeshComponentDefinition).meshFileId;

    const mutation = new SetGameObjectMeshComponentAssetMutation(
      mockGameObjectData,
      mockMeshComponentData,
      mockMeshAssetData,
    );

    // Test
    await mockSceneViewController.mutator.apply(mutation);

    const finalDataValue = mockMeshComponentData.meshAsset;
    const finalDefinitionValue = (mockSceneViewController.sceneDefinition.objects[0].components[0] as MeshComponentDefinition).meshFileId;

    // Assert
    /* Initial state */
    expect(initialDataValue, "MeshComponent data should have no mesh asset initially").toBeUndefined();
    expect(initialDefinitionValue, "MeshComponent definition should have no mesh asset initially").toBeNull();

    /* Final state */
    expect(finalDataValue?.id, "MeshComponent data should have the assigned mesh asset").toBe(mockMeshAssetDefinition.id);
    expect(finalDefinitionValue, "MeshComponent definition should have the assigned mesh asset").toBe(mockMeshAssetDefinition.id);
  });

  test("Changing from one mesh asset to another updates the state correctly", async () => {
    // Setup
    let mockGameObjectDefinition!: GameObjectDefinition;
    let mockMeshComponentDefinition!: MeshComponentDefinition;
    let mockFirstMeshAssetDefinition!: MeshAssetDefinition;
    let mockSecondMeshAssetDefinition!: MeshAssetDefinition;
    const mock = new MockProject(({ manifest, asset, scene }) => {
      return {
        manifest: manifest(),
        assets: [
          mockFirstMeshAssetDefinition = asset(AssetType.Mesh, 'models/sphere.obj', MockAssets.models.sphereObj),
          asset(AssetType.MeshSupplementary, 'models/sphere.mtl', MockAssets.models.sphereMtl),
          mockSecondMeshAssetDefinition = asset(AssetType.Mesh, 'models/cube.obj', MockAssets.models.sphereObj), // Using same data for simplicity
        ],
        scenes: [
          scene('sample', ({ config, object }) => ({
            config: config(),
            objects: [
              mockGameObjectDefinition = object('Mock object', ({ meshComponent }) => ({
                components: [
                  mockMeshComponentDefinition = meshComponent(mockFirstMeshAssetDefinition),
                ],
              })),
            ],
          })),
        ],
      };
    });
    const mockProjectController = await MockProjectController.create(mock);
    const mockScene = mockProjectController.project.scenes.getByPath(mock.scenes[0].path)!;
    const mockSceneViewController = await MockSceneViewController.create(
      mockProjectController,
      mockScene,
    );
    const mockGameObjectData = mockScene.data.getGameObject(mockGameObjectDefinition.id);
    const mockMeshComponentData = mockGameObjectData.getComponent(mockMeshComponentDefinition.id, MeshComponentData);
    const mockSecondMeshAssetData = mockProjectController.project.assets.getById(mockSecondMeshAssetDefinition.id, AssetType.Mesh);

    const initialDataValue = mockMeshComponentData.meshAsset;
    const initialDefinitionValue = (mockSceneViewController.sceneDefinition.objects[0].components[0] as MeshComponentDefinition).meshFileId;

    const mutation = new SetGameObjectMeshComponentAssetMutation(
      mockGameObjectData,
      mockMeshComponentData,
      mockSecondMeshAssetData,
    );

    // Test
    await mockSceneViewController.mutator.apply(mutation);

    const finalDataValue = mockMeshComponentData.meshAsset;
    const finalDefinitionValue = (mockSceneViewController.sceneDefinition.objects[0].components[0] as MeshComponentDefinition).meshFileId;

    // Assert
    /* Initial state */
    expect(initialDataValue?.id, "MeshComponent data should have the first mesh asset initially").toBe(mockFirstMeshAssetDefinition.id);
    expect(initialDefinitionValue, "MeshComponent definition should have the first mesh asset initially").toBe(mockFirstMeshAssetDefinition.id);

    /* Final state */
    expect(finalDataValue?.id, "MeshComponent data should have the second mesh asset").toBe(mockSecondMeshAssetDefinition.id);
    expect(finalDefinitionValue, "MeshComponent definition should have the second mesh asset").toBe(mockSecondMeshAssetDefinition.id);
  });

  test("Removing a mesh asset updates the state correctly", async () => {
    // Setup
    let mockGameObjectDefinition!: GameObjectDefinition;
    let mockMeshComponentDefinition!: MeshComponentDefinition;
    let mockMeshAssetDefinition!: MeshAssetDefinition;
    const mock = new MockProject(({ manifest, asset, scene }) => {
      return {
        manifest: manifest(),
        assets: [
          mockMeshAssetDefinition = asset(AssetType.Mesh, 'models/sphere.obj', MockAssets.models.sphereObj),
          asset(AssetType.MeshSupplementary, 'models/sphere.mtl', MockAssets.models.sphereMtl),
        ],
        scenes: [
          scene('sample', ({ config, object }) => ({
            config: config(),
            objects: [
              mockGameObjectDefinition = object('Mock object', ({ meshComponent }) => ({
                components: [
                  mockMeshComponentDefinition = meshComponent(mockMeshAssetDefinition),
                ],
              })),
            ],
          })),
        ],
      };
    });
    const mockProjectController = await MockProjectController.create(mock);
    const mockScene = mockProjectController.project.scenes.getByPath(mock.scenes[0].path)!;
    const mockSceneViewController = await MockSceneViewController.create(
      mockProjectController,
      mockScene,
    );
    const mockGameObjectData = mockScene.data.getGameObject(mockGameObjectDefinition.id);
    const mockMeshComponentData = mockGameObjectData.getComponent(mockMeshComponentDefinition.id, MeshComponentData);

    const initialDataValue = mockMeshComponentData.meshAsset;
    const initialDefinitionValue = (mockSceneViewController.sceneDefinition.objects[0].components[0] as MeshComponentDefinition).meshFileId;

    const mutation = new SetGameObjectMeshComponentAssetMutation(
      mockGameObjectData,
      mockMeshComponentData,
      undefined, // Remove the mesh asset
    );

    // Test
    await mockSceneViewController.mutator.apply(mutation);

    const finalDataValue = mockMeshComponentData.meshAsset;
    const finalDefinitionValue = (mockSceneViewController.sceneDefinition.objects[0].components[0] as MeshComponentDefinition).meshFileId;

    // Assert
    /* Initial state */
    expect(initialDataValue?.id, "MeshComponent data should have the mesh asset initially").toBe(mockMeshAssetDefinition.id);
    expect(initialDefinitionValue, "MeshComponent definition should have the mesh asset initially").toBe(mockMeshAssetDefinition.id);

    /* Final state */
    expect(finalDataValue, "MeshComponent data should have no mesh asset").toBeUndefined();
    expect(finalDefinitionValue, "MeshComponent definition should have no mesh asset").toBeNull();
  });

  test("Attempting to modify a component on a non-existent GameObject throws an error", async () => {
    // Setup
    let mockMeshAssetDefinition!: MeshAssetDefinition;
    let mockGameObjectDefinition!: GameObjectDefinition;
    const mock = new MockProject(({ manifest, asset, scene }) => {
      return {
        manifest: manifest(),
        assets: [
          mockMeshAssetDefinition = asset(AssetType.Mesh, 'models/sphere.obj', MockAssets.models.sphereObj),
          asset(AssetType.MeshSupplementary, 'models/sphere.mtl', MockAssets.models.sphereMtl),
        ],
        scenes: [
          scene('sample', ({ config, object }) => {
            mockGameObjectDefinition = object('Mock');
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
    const mockMeshAssetData = mockProjectController.project.assets.getById(mockMeshAssetDefinition.id, AssetType.Mesh);

    // Create a mock component data for a non-existent GameObject
    const mockMeshComponentData = MeshComponentData.createDefault();

    // Add the GameObject to the data layer but not to the Babylon scene
    const nonExistentGameObjectData = loadObjectDefinition(
      mockGameObjectDefinition,
      mockProjectController.project.assets,
    );

    const mutation = new SetGameObjectMeshComponentAssetMutation(
      nonExistentGameObjectData,
      mockMeshComponentData,
      mockMeshAssetData,
    );

    // Test
    const testFunc = (): Promise<void> => mockSceneViewController.mutator.apply(mutation);

    // Assert
    await expect(testFunc(), "Should throw error when GameObject doesn't exist in scene").rejects.toThrow(`No GameObject exists with ID '${nonExistentGameObjectData.id}' in scene`);
  });

  test("Attempting to modify a non-existent component throws an error", async () => {
    // Setup
    let mockGameObjectDefinition!: GameObjectDefinition;
    let mockMeshAssetDefinition!: MeshAssetDefinition;
    const mock = new MockProject(({ manifest, asset, scene }) => {
      return {
        manifest: manifest(),
        assets: [
          mockMeshAssetDefinition = asset(AssetType.Mesh, 'models/sphere.obj', MockAssets.models.sphereObj),
          asset(AssetType.MeshSupplementary, 'models/sphere.mtl', MockAssets.models.sphereMtl),
        ],
        scenes: [
          scene('sample', ({ config, object }) => ({
            config: config(),
            objects: [
              mockGameObjectDefinition = object('Mock object'), // No components
            ],
          })),
        ],
      };
    });
    const mockProjectController = await MockProjectController.create(mock);
    const mockScene = mockProjectController.project.scenes.getByPath(mock.scenes[0].path)!;
    const mockSceneViewController = await MockSceneViewController.create(
      mockProjectController,
      mockScene,
    );
    const mockGameObjectData = mockScene.data.getGameObject(mockGameObjectDefinition.id);
    const mockMeshAssetData = mockProjectController.project.assets.getById(mockMeshAssetDefinition.id, AssetType.Mesh);

    // Create a mesh component with a non-existent ID
    const nonExistentMeshComponentData = MeshComponentData.createDefault();

    const mutation = new SetGameObjectMeshComponentAssetMutation(
      mockGameObjectData,
      nonExistentMeshComponentData,
      mockMeshAssetData,
    );

    // Test
    const testFunc = (): Promise<void> => mockSceneViewController.mutator.apply(mutation);

    // Assert
    await expect(testFunc(), "Should throw error when component doesn't exist on GameObject").rejects.toThrow(`No component with ID '${nonExistentMeshComponentData.id}' exists on GameObjectData`);
  });
});
