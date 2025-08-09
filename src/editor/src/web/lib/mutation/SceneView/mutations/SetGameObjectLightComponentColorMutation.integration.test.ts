import { describe, test, expect } from 'vitest';
import { v4 as uuid } from 'uuid';

import { Color3 } from '@polyzone/core/src/util';
import { toColor3Core } from '@polyzone/runtime/src/util/color';
import { DirectionalLightComponent, PointLightComponent } from '@polyzone/runtime/src/world';
import { DirectionalLightComponentDefinition, GameObjectDefinition, PointLightComponentDefinition } from '@polyzone/runtime/src/cartridge';

import { DirectionalLightComponentData, loadObjectDefinition, PointLightComponentData } from '@lib/project/data';

import { MockProject } from '@test/integration/mock/project/MockProject';
import { MockProjectController } from '@test/integration/mock/project/MockProjectController';
import { MockSceneViewController } from '@test/integration/mock/scene/MockSceneViewController';

import { SetGameObjectLightComponentColorMutation } from './SetGameObjectLightComponentColorMutation';

describe(SetGameObjectLightComponentColorMutation.name, () => {
  test("Changing DirectionalLight color updates state correctly", async () => {
    // Setup
    const initialColor = new Color3(100, 150, 200);
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
                  color: { r: initialColor.r, g: initialColor.g, b: initialColor.b },
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

    const initialDataValue = mockDirectionalLightComponentData.color;
    const initialBabylonValue = toColor3Core(mockDirectionalLightComponent.color); // @NOTE Explicitly convert WrappedColor3Babylon into Color3
    const initialDefinitionValue = mockSceneViewController.sceneDefinition.objects[0].components[0] as DirectionalLightComponentDefinition;

    const mutation = new SetGameObjectLightComponentColorMutation(mockGameObjectData, mockDirectionalLightComponentData);

    // Test
    await mockSceneViewController.mutator.beginContinuous(mutation);

    // Apply several updates in series
    let finalColor: Color3 = initialColor;
    for (let i = 0; i < 3; i++) {
      finalColor = new Color3(50 + i * 30, 100 + i * 20, 150 + i * 10);
      await mockSceneViewController.mutator.updateContinuous(mutation, { color: finalColor });

      // Each update should modify the data and Babylon state
      expect(mockDirectionalLightComponentData.color, `DirectionalLight data should have intermediate color after update ${i}`).toEqual(finalColor);
      // @NOTE Explicitly convert WrappedColor3Babylon into Color3
      expect(toColor3Core(mockDirectionalLightComponent.color), `Babylon DirectionalLight should have intermediate color after update ${i}`).toEqual(finalColor);

      // But definition should not be updated until apply()
      const afterUpdateDefinitionValue = mockSceneViewController.sceneDefinition.objects[0].components[0] as DirectionalLightComponentDefinition;
      expect(afterUpdateDefinitionValue.color, `DirectionalLight definition should still have initial color during update ${i}`).toEqual({ r: initialColor.r, g: initialColor.g, b: initialColor.b });
    }

    // Apply should only persist the final value
    await mockSceneViewController.mutator.apply(mutation);

    const finalDataValue = mockDirectionalLightComponentData.color;
    const finalBabylonValue = toColor3Core(mockDirectionalLightComponent.color); // @NOTE Explicitly convert WrappedColor3Babylon into Color3
    const finalDefinitionValue = mockSceneViewController.sceneDefinition.objects[0].components[0] as DirectionalLightComponentDefinition;

    // Assert
    /* Initial state */
    expect(initialDataValue, "DirectionalLight data should have the initial color").toEqual(initialColor);
    expect(initialBabylonValue, "Babylon DirectionalLight should have the initial color").toEqual(initialColor);
    expect(initialDefinitionValue.color, "DirectionalLight definition should have the initial color").toEqual({ r: initialColor.r, g: initialColor.g, b: initialColor.b });

    /* After apply - only final value should be persisted */
    expect(finalDataValue, "DirectionalLight data should have the final color").toEqual(finalColor);
    expect(finalBabylonValue, "Babylon DirectionalLight should have the final color").toEqual(finalColor);
    expect(finalDefinitionValue.color, "DirectionalLight definition should have the final color persisted").toEqual({ r: finalColor.r, g: finalColor.g, b: finalColor.b });
  });

  test("Changing PointLight color updates state correctly", async () => {
    // Setup
    const initialColor = new Color3(80, 120, 160);
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
                  color: { r: initialColor.r, g: initialColor.g, b: initialColor.b },
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

    const initialDataValue = mockPointLightComponentData.color;
    const initialBabylonValue = toColor3Core(mockPointLightComponent.color); // @NOTE Explicitly convert WrappedColor3Babylon into Color3
    const initialDefinitionValue = mockSceneViewController.sceneDefinition.objects[0].components[0] as PointLightComponentDefinition;

    const mutation = new SetGameObjectLightComponentColorMutation(mockGameObjectData, mockPointLightComponentData);

    // Test
    await mockSceneViewController.mutator.beginContinuous(mutation);

    // Apply several updates in series
    let finalColor: Color3 = initialColor;
    for (let i = 0; i < 3; i++) {
      finalColor = new Color3(20 + i * 40, 60 + i * 30, 200 + i * 15);
      await mockSceneViewController.mutator.updateContinuous(mutation, { color: finalColor });

      // Each update should modify the data and Babylon state
      expect(mockPointLightComponentData.color, `PointLight data should have intermediate color after update ${i}`).toEqual(finalColor);
      // @NOTE Explicitly convert WrappedColor3Babylon into Color3
      expect(toColor3Core(mockPointLightComponent.color), `Babylon PointLight should have intermediate color after update ${i}`).toEqual(finalColor);

      // But definition should not be updated until apply()
      const afterUpdateDefinitionValue = mockSceneViewController.sceneDefinition.objects[0].components[0] as PointLightComponentDefinition;
      expect(afterUpdateDefinitionValue.color, `PointLight definition should still have initial color during update ${i}`).toEqual({ r: initialColor.r, g: initialColor.g, b: initialColor.b });
    }

    // Apply should only persist the final value
    await mockSceneViewController.mutator.apply(mutation);

    const finalDataValue = mockPointLightComponentData.color;
    const finalBabylonValue = toColor3Core(mockPointLightComponent.color); // @NOTE Explicitly convert WrappedColor3Babylon into Color3
    const finalDefinitionValue = mockSceneViewController.sceneDefinition.objects[0].components[0] as PointLightComponentDefinition;

    // Assert
    /* Initial state */
    expect(initialDataValue, "PointLight data should have the initial color").toEqual(initialColor);
    expect(initialBabylonValue, "Babylon PointLight should have the initial color").toEqual(initialColor);
    expect(initialDefinitionValue.color, "PointLight definition should have the initial color").toEqual({ r: initialColor.r, g: initialColor.g, b: initialColor.b });

    /* After apply - only final value should be persisted */
    expect(finalDataValue, "PointLight data should have the final color").toEqual(finalColor);
    expect(finalBabylonValue, "Babylon PointLight should have the final color").toEqual(finalColor);
    expect(finalDefinitionValue.color, "PointLight definition should have the final color persisted").toEqual({ r: finalColor.r, g: finalColor.g, b: finalColor.b });
  });

  test("Error handling when GameObject doesn't exist", async () => {
    // Setup
    const initialColor = new Color3(255, 255, 255);
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
                color: { r: initialColor.r, g: initialColor.g, b: initialColor.b },
              }),
            ],
          }));

          return {
            config: config(),
            objects: [],
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
    const mutationWithInvalidGameObjectId = new SetGameObjectLightComponentColorMutation(
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
    const nonExistentComponentData = new PointLightComponentData(uuid(), 1, Color3.white());
    const mutationWithInvalidComponentId = new SetGameObjectLightComponentColorMutation(
      mockGameObjectData,
      nonExistentComponentData,
    );

    // Test
    const testFunc = async (): Promise<void> => {
      await mockSceneViewController.mutator.beginContinuous(mutationWithInvalidComponentId);
    };

    // Assert
    await expect(testFunc).rejects.toThrow(); // Should throw when trying to get non-existent component
  });
});
