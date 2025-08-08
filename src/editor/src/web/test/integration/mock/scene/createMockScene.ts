import { v4 as uuid } from 'uuid';

import {
  AssetType,
  CameraComponentDefinition,
  ComponentDefinitionType,
  DirectionalLightComponentDefinition,
  GameObjectDefinition,
  MeshComponentDefinition,
  PointLightComponentDefinition,
  ScriptComponentDefinition,
} from '@polyzone/runtime/src/cartridge';

import { AssetDefinitionOfType, SceneDefinition, SceneManifest } from "@lib/project";

import { randomHash } from '@test/util';


export interface MockScene {
  manifest: SceneManifest;
  definition: SceneDefinition;
}

export type SceneDefinitionConfig = SceneDefinition['config'];

export interface CreateMockSceneTools {
  config(mutator?: (config: SceneDefinitionConfig) => void): SceneDefinitionConfig;
  object: typeof createMockGameObject
}

export function createMockScene(name: string, ctor?: (tools: CreateMockSceneTools) => SceneDefinition): MockScene {
  const tools: CreateMockSceneTools = {
    config(mutator): SceneDefinitionConfig {
      const config = {
        clearColor: { r: 0, g: 0, b: 0 },
        lighting: {
          ambient: {
            intensity: 0.8,
            color: { r: 200, g: 100, b: 200 },
          },
        },
      };
      if (mutator) {
        mutator(config);
      }
      return config;
    },
    object: createMockGameObject,
  };

  let definition: SceneDefinition;
  if (ctor) {
    definition = ctor(tools);
  } else {
    definition = {
      config: tools.config(),
      objects: [],
    };
  }

  const manifest: SceneManifest = {
    id: uuid(),
    hash: randomHash(),
    path: `scenes/${name}.pzscene`,
  };

  return {
    manifest,
    definition,
  };
}

export interface CreateMockGameObjectTools {
  meshComponent(meshAsset?: AssetDefinitionOfType<AssetType.Mesh>): MeshComponentDefinition;
  scriptComponent(scriptAsset?: AssetDefinitionOfType<AssetType.Script>): ScriptComponentDefinition;
  cameraComponent(): CameraComponentDefinition;
  directionalLightComponent(options?: Partial<Pick<DirectionalLightComponentDefinition, 'intensity' | 'color'>>): DirectionalLightComponentDefinition;
  pointLightComponent(options?: Partial<Pick<PointLightComponentDefinition, 'intensity' | 'color'>>): PointLightComponentDefinition;
  object: typeof createMockGameObject;
}

export function createMockGameObject(name: string, ctor?: (tools: CreateMockGameObjectTools) => Partial<Omit<GameObjectDefinition, 'name'>>): GameObjectDefinition {
  let partialObject: Partial<GameObjectDefinition> = {};
  if (ctor) {
    partialObject = ctor({
      meshComponent(meshAsset) {
        return {
          id: uuid(),
          meshFileId: meshAsset?.id ?? null, // @TODO lol we have GOT to sort out `null`
          type: ComponentDefinitionType.Mesh,
        };
      },
      scriptComponent(scriptAsset) {
        return {
          id: uuid(),
          type: ComponentDefinitionType.Script,
          scriptFileId: scriptAsset?.id,
        };
      },
      cameraComponent() {
        return {
          id: uuid(),
          type: ComponentDefinitionType.Camera,
        };
      },
      directionalLightComponent(options) {
        return {
          id: uuid(),
          type: ComponentDefinitionType.DirectionalLight,
          intensity: 1.0,
          color: { r: 255, g: 255, b: 255 },
          ...options,
        };
      },
      pointLightComponent(options) {
        return {
          id: uuid(),
          type: ComponentDefinitionType.PointLight,
          intensity: 1.0,
          color: { r: 255, g: 255, b: 255 },
          ...options,
        };
      },
      object: createMockGameObject,
    });
  }


  return {
    id: uuid(),
    name,
    transform: {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
    },
    children: [],
    components: [],
    ...partialObject,
  };
}
