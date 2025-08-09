import { describe, test, expect } from 'vitest';

import { AssetType, GameObjectDefinition, ScriptComponentDefinition } from '@polyzone/runtime/src/cartridge';

import { MockProject } from '@test/integration/mock/project/MockProject';
import { MockProjectController } from '@test/integration/mock/project/MockProjectController';
import { MockSceneViewController } from '@test/integration/mock/scene/MockSceneViewController';
import { MockAssets } from '@test/integration/mock/assets';

import { loadObjectDefinition, ScriptComponentData } from '@lib/project/data';
import { ScriptAssetDefinition } from '@lib/project/definition';
import { SetGameObjectScriptComponentAssetMutation } from './SetGameObjectScriptComponentAssetMutation';

describe(SetGameObjectScriptComponentAssetMutation.name, () => {
  test("Assigning a script asset to a component with no asset updates the state correctly", async () => {
    // Setup
    let mockGameObjectDefinition!: GameObjectDefinition;
    let mockScriptComponentDefinition!: ScriptComponentDefinition;
    let mockScriptAssetDefinition!: ScriptAssetDefinition;
    const mock = new MockProject(({ manifest, asset, scene }) => {
      return {
        manifest: manifest(),
        assets: [
          mockScriptAssetDefinition = asset(AssetType.Script, 'scripts/my-object.ts', MockAssets.scripts.myObject),
        ],
        scenes: [
          scene('sample', ({ config, object }) => ({
            config: config(),
            objects: [
              mockGameObjectDefinition = object('Mock object', ({ scriptComponent }) => ({
                components: [
                  mockScriptComponentDefinition = scriptComponent(), // Create script component with no asset
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
    const mockScriptComponentData = mockGameObjectData.getComponent(mockScriptComponentDefinition.id, ScriptComponentData);
    const mockScriptAssetData = mockProjectController.project.assets.getById(mockScriptAssetDefinition.id, AssetType.Script);

    const initialDataValue = mockScriptComponentData.scriptAsset;
    const initialDefinitionValue = (mockSceneViewController.sceneDefinition.objects[0].components[0] as ScriptComponentDefinition).scriptFileId;

    const mutation = new SetGameObjectScriptComponentAssetMutation(
      mockGameObjectData,
      mockScriptComponentData,
      mockScriptAssetData,
    );

    // Test
    await mockSceneViewController.mutator.apply(mutation);

    const finalDataValue = mockScriptComponentData.scriptAsset;
    const finalDefinitionValue = (mockSceneViewController.sceneDefinition.objects[0].components[0] as ScriptComponentDefinition).scriptFileId;

    // Assert
    /* Initial state */
    expect(initialDataValue, "ScriptComponent data should have no script asset initially").toBeUndefined();
    expect(initialDefinitionValue, "ScriptComponent definition should have no script asset initially").toBeUndefined();

    /* Final state */
    expect(finalDataValue?.id, "ScriptComponent data should have the assigned script asset").toBe(mockScriptAssetDefinition.id);
    expect(finalDefinitionValue, "ScriptComponent definition should have the assigned script asset").toBe(mockScriptAssetDefinition.id);
  });

  test("Changing from one script asset to another updates the state correctly", async () => {
    // Setup
    let mockGameObjectDefinition!: GameObjectDefinition;
    let mockScriptComponentDefinition!: ScriptComponentDefinition;
    let mockFirstScriptAssetDefinition!: ScriptAssetDefinition;
    let mockSecondScriptAssetDefinition!: ScriptAssetDefinition;
    const mock = new MockProject(({ manifest, asset, scene }) => {
      return {
        manifest: manifest(),
        assets: [
          mockFirstScriptAssetDefinition = asset(AssetType.Script, 'scripts/my-object.ts', MockAssets.scripts.myObject),
          mockSecondScriptAssetDefinition = asset(AssetType.Script, 'scripts/other-script.ts', MockAssets.scripts.myObject), // Using same data for simplicity
        ],
        scenes: [
          scene('sample', ({ config, object }) => ({
            config: config(),
            objects: [
              mockGameObjectDefinition = object('Mock object', ({ scriptComponent }) => ({
                components: [
                  mockScriptComponentDefinition = scriptComponent(mockFirstScriptAssetDefinition),
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
    const mockScriptComponentData = mockGameObjectData.getComponent(mockScriptComponentDefinition.id, ScriptComponentData);
    const mockSecondScriptAssetData = mockProjectController.project.assets.getById(mockSecondScriptAssetDefinition.id, AssetType.Script);

    const initialDataValue = mockScriptComponentData.scriptAsset;
    const initialDefinitionValue = (mockSceneViewController.sceneDefinition.objects[0].components[0] as ScriptComponentDefinition).scriptFileId;

    const mutation = new SetGameObjectScriptComponentAssetMutation(
      mockGameObjectData,
      mockScriptComponentData,
      mockSecondScriptAssetData,
    );

    // Test
    await mockSceneViewController.mutator.apply(mutation);

    const finalDataValue = mockScriptComponentData.scriptAsset;
    const finalDefinitionValue = (mockSceneViewController.sceneDefinition.objects[0].components[0] as ScriptComponentDefinition).scriptFileId;

    // Assert
    /* Initial state */
    expect(initialDataValue?.id, "ScriptComponent data should have the first script asset initially").toBe(mockFirstScriptAssetDefinition.id);
    expect(initialDefinitionValue, "ScriptComponent definition should have the first script asset initially").toBe(mockFirstScriptAssetDefinition.id);

    /* Final state */
    expect(finalDataValue?.id, "ScriptComponent data should have the second script asset").toBe(mockSecondScriptAssetDefinition.id);
    expect(finalDefinitionValue, "ScriptComponent definition should have the second script asset").toBe(mockSecondScriptAssetDefinition.id);
  });

  test("Removing a script asset updates the state correctly", async () => {
    // Setup
    let mockGameObjectDefinition!: GameObjectDefinition;
    let mockScriptComponentDefinition!: ScriptComponentDefinition;
    let mockScriptAssetDefinition!: ScriptAssetDefinition;
    const mock = new MockProject(({ manifest, asset, scene }) => {
      return {
        manifest: manifest(),
        assets: [
          mockScriptAssetDefinition = asset(AssetType.Script, 'scripts/my-object.ts', MockAssets.scripts.myObject),
        ],
        scenes: [
          scene('sample', ({ config, object }) => ({
            config: config(),
            objects: [
              mockGameObjectDefinition = object('Mock object', ({ scriptComponent }) => ({
                components: [
                  mockScriptComponentDefinition = scriptComponent(mockScriptAssetDefinition),
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
    const mockScriptComponentData = mockGameObjectData.getComponent(mockScriptComponentDefinition.id, ScriptComponentData);

    const initialDataValue = mockScriptComponentData.scriptAsset;
    const initialDefinitionValue = (mockSceneViewController.sceneDefinition.objects[0].components[0] as ScriptComponentDefinition).scriptFileId;

    const mutation = new SetGameObjectScriptComponentAssetMutation(
      mockGameObjectData,
      mockScriptComponentData,
      undefined, // Remove the script asset
    );

    // Test
    await mockSceneViewController.mutator.apply(mutation);

    const finalDataValue = mockScriptComponentData.scriptAsset;
    const finalDefinitionValue = (mockSceneViewController.sceneDefinition.objects[0].components[0] as ScriptComponentDefinition).scriptFileId;

    // Assert
    /* Initial state */
    expect(initialDataValue?.id, "ScriptComponent data should have the script asset initially").toBe(mockScriptAssetDefinition.id);
    expect(initialDefinitionValue, "ScriptComponent definition should have the script asset initially").toBe(mockScriptAssetDefinition.id);

    /* Final state */
    expect(finalDataValue, "ScriptComponent data should have no script asset").toBeUndefined();
    expect(finalDefinitionValue, "ScriptComponent definition should have no script asset").toBeNull();
  });

  test("Attempting to modify a component on a non-existent GameObject throws an error", async () => {
    // Setup
    let mockScriptAssetDefinition!: ScriptAssetDefinition;
    let mockGameObjectDefinition!: GameObjectDefinition;
    const mock = new MockProject(({ manifest, asset, scene }) => {
      return {
        manifest: manifest(),
        assets: [
          mockScriptAssetDefinition = asset(AssetType.Script, 'scripts/my-object.ts', MockAssets.scripts.myObject),
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
    const mockScriptAssetData = mockProjectController.project.assets.getById(mockScriptAssetDefinition.id, AssetType.Script);

    // Create a mock component data for a non-existent GameObject
    const mockScriptComponentData = ScriptComponentData.createDefault();

    // Add the GameObject to the data layer but not to the Babylon scene
    const nonExistentGameObjectData = loadObjectDefinition(
      mockGameObjectDefinition,
      mockProjectController.project.assets,
    );

    const mutation = new SetGameObjectScriptComponentAssetMutation(
      nonExistentGameObjectData,
      mockScriptComponentData,
      mockScriptAssetData,
    );

    // Test
    const testFunc = (): Promise<void> => mockSceneViewController.mutator.apply(mutation);

    // Assert
    await expect(testFunc(), "Should throw error when GameObject doesn't exist in scene").rejects.toThrow(`No GameObject exists with ID '${nonExistentGameObjectData.id}' in scene`);
  });

  test("Attempting to modify a non-existent component throws an error", async () => {
    // Setup
    let mockGameObjectDefinition!: GameObjectDefinition;
    let mockScriptAssetDefinition!: ScriptAssetDefinition;
    const mock = new MockProject(({ manifest, asset, scene }) => {
      return {
        manifest: manifest(),
        assets: [
          mockScriptAssetDefinition = asset(AssetType.Script, 'scripts/my-object.ts', MockAssets.scripts.myObject),
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
    const mockScriptAssetData = mockProjectController.project.assets.getById(mockScriptAssetDefinition.id, AssetType.Script);

    // Create a script component with a non-existent ID
    const nonExistentScriptComponentData = ScriptComponentData.createDefault();

    const mutation = new SetGameObjectScriptComponentAssetMutation(
      mockGameObjectData,
      nonExistentScriptComponentData,
      mockScriptAssetData,
    );

    // Test
    const testFunc = (): Promise<void> => mockSceneViewController.mutator.apply(mutation);

    // Assert
    await expect(testFunc(), "Should throw error when component doesn't exist on GameObject").rejects.toThrow(`No component with ID '${nonExistentScriptComponentData.id}' exists on GameObjectData`);
  });
});
