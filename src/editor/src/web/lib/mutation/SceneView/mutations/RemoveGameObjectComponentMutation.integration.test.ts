import { describe, test, expect } from 'vitest';

import { AssetType, GameObjectDefinition, MeshComponentDefinition, PointLightComponentDefinition } from '@polyzone/runtime/src/cartridge';

import { MockProject } from '@test/integration/mock/project/MockProject';
import { MockProjectController } from '@test/integration/mock/project/MockProjectController';
import { MockSceneViewController } from '@test/integration/mock/scene/MockSceneViewController';

import { loadObjectDefinition, MeshComponentData, PointLightComponentData } from '@lib/project/data';
import { RemoveGameObjectComponentMutation } from './RemoveGameObjectComponentMutation';
import { MockAssets } from '@test/integration/mock/assets';
import { MeshAssetDefinition } from '@lib/project';

describe(RemoveGameObjectComponentMutation.name, () => {
  test("Removing a mesh component updates all state correctly", async () => {
    // Setup
    let mockGameObjectDefinition!: GameObjectDefinition;
    let mockMeshComponentDefinition!: MeshComponentDefinition;
    const mock = new MockProject(({ manifest, asset, scene }) => {
      let mockMeshAssetDefinition: MeshAssetDefinition;
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
    const meshComponentToRemove = mockGameObjectData.getComponent(mockMeshComponentDefinition.id, MeshComponentData);
    const mockGameObject = mockSceneViewController.findGameObjectById(mockGameObjectData.id)!;

    const initialDataComponents = [...mockGameObjectData.components];
    const initialBabylonComponents = [...mockGameObject.components];
    const initialDefinitionComponents = [...mockSceneViewController.sceneDefinition.objects[0].components];

    const mutation = new RemoveGameObjectComponentMutation(mockGameObjectData, meshComponentToRemove);

    // Test
    await mockSceneViewController.mutator.apply(mutation);

    const finalDataComponents = mockGameObjectData.components;
    const finalBabylonComponents = mockGameObject.components;
    const finalDefinitionComponents = mockSceneViewController.sceneDefinition.objects[0].components;

    // Assert
    /* Initial state */
    expect(initialDataComponents, "Initial data should have one mesh component").toHaveLength(1);
    expect(initialDataComponents[0], "Initial data component should be the mesh component").toBe(meshComponentToRemove);
    expect(initialBabylonComponents, "Initial Babylon object should have one component").toHaveLength(1);
    expect(initialBabylonComponents[0].id, "Initial Babylon component should have correct ID").toBe(meshComponentToRemove.id);
    expect(initialDefinitionComponents, "Initial definition should have one component").toHaveLength(1);
    expect(initialDefinitionComponents[0].id, "Initial definition component should have correct ID").toBe(meshComponentToRemove.id);

    /* Final state */
    expect(finalDataComponents, "Data should have no components after removal").toHaveLength(0);
    expect(finalBabylonComponents, "Babylon object should have no components after removal").toHaveLength(0);
    expect(finalDefinitionComponents, "Definition should have no components after removal").toHaveLength(0);
  });

  test("Removing a mesh component from GameObject with multiple components", async () => {
    // Setup
    let mockGameObjectDefinition!: GameObjectDefinition;
    let mockMeshComponentDefinition!: MeshComponentDefinition;
    let mockPointLightComponentDefinition!: PointLightComponentDefinition;
    const mock = new MockProject(({ manifest, asset, scene }) => {
      let mockMeshAssetDefinition: MeshAssetDefinition;
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
              mockGameObjectDefinition = object('Mock object', ({ meshComponent, pointLightComponent }) => ({
                components: [
                  mockMeshComponentDefinition = meshComponent(mockMeshAssetDefinition),
                  mockPointLightComponentDefinition = pointLightComponent(),
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
    const meshComponentToRemove = mockGameObjectData.getComponent(mockMeshComponentDefinition.id, MeshComponentData);
    const pointLightComponentToKeep = mockGameObjectData.getComponent(mockPointLightComponentDefinition.id, PointLightComponentData);
    const mockGameObject = mockSceneViewController.findGameObjectById(mockGameObjectData.id)!;

    const initialDataComponents = [...mockGameObjectData.components];
    const initialBabylonComponents = [...mockGameObject.components];
    const initialDefinitionComponents = [...mockSceneViewController.sceneDefinition.objects[0].components];

    const mutation = new RemoveGameObjectComponentMutation(mockGameObjectData, meshComponentToRemove);

    // Test
    await mockSceneViewController.mutator.apply(mutation);

    const finalDataComponents = mockGameObjectData.components;
    const finalBabylonComponents = mockGameObject.components;
    const finalDefinitionComponents = mockSceneViewController.sceneDefinition.objects[0].components;

    // Assert
    /* Initial state */
    expect(initialDataComponents, "Initial data should have two components").toHaveLength(2);
    expect(initialBabylonComponents, "Initial Babylon object should have two components").toHaveLength(2);
    expect(initialDefinitionComponents, "Initial definition should have two components").toHaveLength(2);

    /* Final state - mesh component removed, point light component remains */
    expect(finalDataComponents, "Data should have one component remaining").toHaveLength(1);
    expect(finalDataComponents[0], "Remaining data component should be the point light").toBe(pointLightComponentToKeep);
    expect(finalBabylonComponents, "Babylon object should have one component remaining").toHaveLength(1);
    expect(finalBabylonComponents[0].id, "Remaining Babylon component should have correct ID").toBe(pointLightComponentToKeep.id);
    expect(finalDefinitionComponents, "Definition should have one component remaining").toHaveLength(1);
    expect(finalDefinitionComponents[0].id, "Remaining definition component should have correct ID").toBe(pointLightComponentToKeep.id);
  });

  test("Error when GameObject doesn't exist in Babylon scene", async () => {
    // Setup
    let mockGameObjectDefinition!: GameObjectDefinition;
    let mockMeshComponentDefinition!: MeshComponentDefinition;
    const mock = new MockProject(({ manifest, asset, scene }) => {
      let mockMeshAssetDefinition: MeshAssetDefinition;
      return {
        manifest: manifest(),
        assets: [
          mockMeshAssetDefinition = asset(AssetType.Mesh, 'models/sphere.obj', MockAssets.models.sphereObj),
          asset(AssetType.MeshSupplementary, 'models/sphere.mtl', MockAssets.models.sphereMtl),
        ],
        scenes: [
          scene('sample', ({ config, object }) => {
            mockGameObjectDefinition = object('Mock object', ({ meshComponent }) => ({
              components: [
                mockMeshComponentDefinition = meshComponent(mockMeshAssetDefinition),
              ],
            }));
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

    // Add the GameObject to the data layer but not to the Babylon scene
    const mockGameObjectData = loadObjectDefinition(
      mockGameObjectDefinition,
      mockProjectController.project.assets,
    );
    const meshComponentToRemove = mockGameObjectData.getComponent(mockMeshComponentDefinition.id, MeshComponentData);

    const mutation = new RemoveGameObjectComponentMutation(mockGameObjectData, meshComponentToRemove);

    // Test
    const testFunc = (): Promise<void> => mockSceneViewController.mutator.apply(mutation);

    // Assert
    await expect(testFunc).rejects.toThrow(`No GameObject exists with ID '${mockGameObjectData.id}' in scene`);
  });
});
