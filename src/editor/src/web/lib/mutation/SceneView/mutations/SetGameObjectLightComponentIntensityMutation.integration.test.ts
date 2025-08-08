import { describe, test, expect } from 'vitest';

import { DirectionalLightComponent, PointLightComponent } from '@polyzone/runtime/src/world';
import { DirectionalLightComponentDefinition, GameObjectDefinition, PointLightComponentDefinition } from '@polyzone/runtime/src/cartridge';

import { DirectionalLightComponentData, loadObjectDefinition, PointLightComponentData } from '@lib/project/data';

import { MockProject } from '@test/integration/mock/project/MockProject';
import { MockProjectController } from '@test/integration/mock/project/MockProjectController';
import { MockSceneViewController } from '@test/integration/mock/scene/MockSceneViewController';

import { SetGameObjectLightComponentIntensityMutation } from './SetGameObjectLightComponentIntensityMutation';

describe(SetGameObjectLightComponentIntensityMutation.name, () => {
  test("Changing DirectionalLight intensity updates state correctly", async () => {
    // Setup
    const initialIntensity = 0.8;
    let mockGameObjectDefinition!: GameObjectDefinition;
    let mockDirectionalLightComponentDefinition!: DirectionalLightComponentDefinition;
    const mock = new MockProject(({ manifest, scene }) => ({
      manifest: manifest(),
      assets: [],
      scenes: [
        scene('sample', ({ config, object }) => ({
          config: config(),
          objects: [
            mockGameObjectDefinition = object('Mock object', ({ directionalLightComponent }) => ({
              components: [
                mockDirectionalLightComponentDefinition = directionalLightComponent({
                  intensity: initialIntensity,
                }),
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
    const mockGameObjectData = mockScene.data.getGameObject(mockGameObjectDefinition.id);
    const mockDirectionalLightComponentData = mockGameObjectData.getComponent(mockDirectionalLightComponentDefinition.id, DirectionalLightComponentData);
    const mockGameObject = mockSceneViewController.findGameObjectById(mockGameObjectData.id)!;
    const mockDirectionalLightComponent = mockGameObject.getComponent(mockDirectionalLightComponentDefinition.id, DirectionalLightComponent);

    const initialDataValue = mockDirectionalLightComponentData.intensity;
    const initialBabylonValue = mockDirectionalLightComponent.intensity;
    const initialDefinitionValue = mockSceneViewController.sceneDefinition.objects[0].components[0] as DirectionalLightComponentDefinition;

    const mutation = new SetGameObjectLightComponentIntensityMutation(mockGameObjectData, mockDirectionalLightComponentData);

    // Test
    await mockSceneViewController.mutator.beginContinuous(mutation);

    // Apply several updates in series
    let finalIntensity: number = initialIntensity;
    for (let i = 0; i < 3; i++) {
      finalIntensity = 0.2 + i * 0.3; // 0.2, 0.5, 0.8
      await mockSceneViewController.mutator.updateContinuous(mutation, { intensity: finalIntensity });

      // Each update should modify the data and Babylon state
      expect(mockDirectionalLightComponentData.intensity, `DirectionalLight data should have intermediate intensity after update ${i}`).toEqual(finalIntensity);
      expect(mockDirectionalLightComponent.intensity, `Babylon DirectionalLight should have intermediate intensity after update ${i}`).toEqual(finalIntensity);

      // But definition should not be updated until apply()
      const afterUpdateDefinitionValue = mockSceneViewController.sceneDefinition.objects[0].components[0] as DirectionalLightComponentDefinition;
      expect(afterUpdateDefinitionValue.intensity, `DirectionalLight definition should still have initial intensity during update ${i}`).toEqual(initialIntensity);
    }

    // Apply should only persist the final value
    await mockSceneViewController.mutator.apply(mutation);

    const finalDataValue = mockDirectionalLightComponentData.intensity;
    const finalBabylonValue = mockDirectionalLightComponent.intensity;
    const finalDefinitionValue = mockSceneViewController.sceneDefinition.objects[0].components[0] as DirectionalLightComponentDefinition;

    // Assert
    /* Initial state */
    expect(initialDataValue, "DirectionalLight data should have the initial intensity").toEqual(initialIntensity);
    expect(initialBabylonValue, "Babylon DirectionalLight should have the initial intensity").toEqual(initialIntensity);
    expect(initialDefinitionValue.intensity, "DirectionalLight definition should have the initial intensity").toEqual(initialIntensity);

    /* After apply - only final value should be persisted */
    expect(finalDataValue, "DirectionalLight data should have the final intensity").toEqual(finalIntensity);
    expect(finalBabylonValue, "Babylon DirectionalLight should have the final intensity").toEqual(finalIntensity);
    expect(finalDefinitionValue.intensity, "DirectionalLight definition should have the final intensity persisted").toEqual(finalIntensity);
  });

  test("Changing PointLight intensity updates state correctly", async () => {
    // Setup
    const initialIntensity = 0.6;
    let mockGameObjectDefinition!: GameObjectDefinition;
    let mockPointLightComponentDefinition!: PointLightComponentDefinition;
    const mock = new MockProject(({ manifest, scene }) => ({
      manifest: manifest(),
      assets: [],
      scenes: [
        scene('sample', ({ config, object }) => ({
          config: config(),
          objects: [
            mockGameObjectDefinition = object('Mock object', ({ pointLightComponent }) => ({
              components: [
                mockPointLightComponentDefinition = pointLightComponent({
                  intensity: initialIntensity,
                }),
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
    const mockGameObjectData = mockScene.data.getGameObject(mockGameObjectDefinition.id);
    const mockPointLightComponentData = mockGameObjectData.getComponent(mockPointLightComponentDefinition.id, PointLightComponentData);
    const mockGameObject = mockSceneViewController.findGameObjectById(mockGameObjectData.id)!;
    const mockPointLightComponent = mockGameObject.getComponent(mockPointLightComponentDefinition.id, PointLightComponent);

    const initialDataValue = mockPointLightComponentData.intensity;
    const initialBabylonValue = mockPointLightComponent.intensity;
    const initialDefinitionValue = mockSceneViewController.sceneDefinition.objects[0].components[0] as PointLightComponentDefinition;

    const mutation = new SetGameObjectLightComponentIntensityMutation(mockGameObjectData, mockPointLightComponentData);

    // Test
    await mockSceneViewController.mutator.beginContinuous(mutation);

    // Apply several updates in series
    let finalIntensity: number = initialIntensity;
    for (let i = 0; i < 3; i++) {
      finalIntensity = 0.1 + i * 0.25; // 0.1, 0.35, 0.6
      await mockSceneViewController.mutator.updateContinuous(mutation, { intensity: finalIntensity });

      // Each update should modify the data and Babylon state
      expect(mockPointLightComponentData.intensity, `PointLight data should have intermediate intensity after update ${i}`).toEqual(finalIntensity);
      expect(mockPointLightComponent.intensity, `Babylon PointLight should have intermediate intensity after update ${i}`).toEqual(finalIntensity);

      // But definition should not be updated until apply()
      const afterUpdateDefinitionValue = mockSceneViewController.sceneDefinition.objects[0].components[0] as PointLightComponentDefinition;
      expect(afterUpdateDefinitionValue.intensity, `PointLight definition should still have initial intensity during update ${i}`).toEqual(initialIntensity);
    }

    // Apply should only persist the final value
    await mockSceneViewController.mutator.apply(mutation);

    const finalDataValue = mockPointLightComponentData.intensity;
    const finalBabylonValue = mockPointLightComponent.intensity;
    const finalDefinitionValue = mockSceneViewController.sceneDefinition.objects[0].components[0] as PointLightComponentDefinition;

    // Assert
    /* Initial state */
    expect(initialDataValue, "PointLight data should have the initial intensity").toEqual(initialIntensity);
    expect(initialBabylonValue, "Babylon PointLight should have the initial intensity").toEqual(initialIntensity);
    expect(initialDefinitionValue.intensity, "PointLight definition should have the initial intensity").toEqual(initialIntensity);

    /* After apply - only final value should be persisted */
    expect(finalDataValue, "PointLight data should have the final intensity").toEqual(finalIntensity);
    expect(finalBabylonValue, "Babylon PointLight should have the final intensity").toEqual(finalIntensity);
    expect(finalDefinitionValue.intensity, "PointLight definition should have the final intensity persisted").toEqual(finalIntensity);
  });

  test("Error handling when GameObject doesn't exist", async () => {
    // Setup
    const initialIntensity = 1.0;
    let mockGameObjectDefinition!: GameObjectDefinition;
    let mockDirectionalLightComponentDefinition!: DirectionalLightComponentDefinition;
    const mock = new MockProject(({ manifest, scene }) => ({
      manifest: manifest(),
      assets: [],
      scenes: [
        scene('sample', ({ config, object }) => {
          mockGameObjectDefinition = object('Mock object', ({ directionalLightComponent }) => ({
            components: [
              mockDirectionalLightComponentDefinition = directionalLightComponent({
                intensity: initialIntensity,
              }),
            ],
          }));

          return {
            config: config(),
            objects: [], // GameObject not added to scene
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

    // Create mutation with GameObject not added to scene
    const mockGameObjectData = loadObjectDefinition(
      mockGameObjectDefinition,
      mockProjectController.project.assets,
    );
    const mockDirectionalLightComponentData = mockGameObjectData.getComponent(mockDirectionalLightComponentDefinition.id, DirectionalLightComponentData);
    const mutationWithInvalidGameObjectId = new SetGameObjectLightComponentIntensityMutation(
      mockGameObjectData,
      mockDirectionalLightComponentData,
    );

    // Test
    const testFunc = async (): Promise<void> => {
      await mockSceneViewController.mutator.beginContinuous(mutationWithInvalidGameObjectId);
    };

    // Assert
    await expect(testFunc).rejects.toThrow(`No GameObject exists with ID '${mockGameObjectData.id}' in scene`);
  });

  test("Error handling when light component doesn't exist", async () => {
    // Setup
    const mock = new MockProject(({ manifest, scene }) => ({
      manifest: manifest(),
      assets: [],
      scenes: [
        scene('sample', ({ config, object }) => ({
          config: config(),
          objects: [
            object('Mock object', () => ({
              components: [], // No components
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
    const mockGameObjectData = mockScene.data.objects[0];

    // Create mutation with non-existent component ID
    const mutationWithInvalidComponentId = new SetGameObjectLightComponentIntensityMutation(
      mockGameObjectData,
      { id: 'non-existent-component-id' } as any,
    );

    // Test
    const testFunc = async (): Promise<void> => {
      await mockSceneViewController.mutator.beginContinuous(mutationWithInvalidComponentId);
    };

    // Assert
    await expect(testFunc).rejects.toThrow(); // Should throw when trying to get non-existent component
  });
});
