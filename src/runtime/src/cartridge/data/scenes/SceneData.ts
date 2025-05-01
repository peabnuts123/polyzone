import { toVector3Core, toColor3Core, isDefined } from "@polyzone/runtime/src/util";
import { Color3 } from "@polyzone/core/src/util";

import { SceneDefinition, CameraComponentDefinition, ComponentDefinitionType, MeshComponentDefinition, ScriptComponentDefinition, DirectionalLightComponentDefinition, PointLightComponentDefinition, GameObjectDefinition, AssetType } from "../../archive";
import { IAssetDb } from "../assets/AssetDb";
import { IGameObjectData, GameObjectData } from "../GameObjectData";
import { CameraComponentData, IComponentData, DirectionalLightComponentData, MeshComponentData, PointLightComponentData, ScriptComponentData } from "../components";
import { TransformData } from "../TransformData";
import { IMeshAssetData, IScriptAssetData } from '../assets';


export interface SceneDataConfiguration {
  clearColor: Color3,
  lighting: {
    ambient: {
      intensity: number;
      color: Color3;
    },
  }
}

export interface ISceneData {
  get path(): string;
  get objects(): IGameObjectData[];
  get config(): SceneDataConfiguration;
}

/**
 * Data for a game scene i.e. loaded from the raw cartridge file
 * but not yet loaded into the game.
 */
export class SceneData implements ISceneData {
  public path: string;
  public objects: IGameObjectData[];
  public config: SceneDataConfiguration;

  public constructor(sceneDefinition: SceneDefinition, assetDb: IAssetDb, loadObjectDefinition: LoadObjectDefinitionFn) {
    /* Path */
    this.path = sceneDefinition.path;

    /* Config */
    this.config = {
      clearColor: toColor3Core(sceneDefinition.config.clearColor),
      lighting: {
        ambient: {
          intensity: sceneDefinition.config.lighting.ambient.intensity,
          color: toColor3Core(sceneDefinition.config.lighting.ambient.color),
        },
      },
    };

    /* Game Objects */
    this.objects = [];
    for (const objectDefinition of sceneDefinition.objects) {
      this.objects.push(loadObjectDefinition(objectDefinition, assetDb));
    }
  }
}

export type LoadObjectDefinitionFn = (objectDefinition: GameObjectDefinition, assetDb: IAssetDb) => IGameObjectData;

export function loadObjectDefinition(objectDefinition: GameObjectDefinition, assetDb: IAssetDb): IGameObjectData {
  const components: IComponentData[] = [];
  for (const componentDefinition of objectDefinition.components) {
    switch (componentDefinition.type) {
      case ComponentDefinitionType.Mesh: {
        const meshComponentDefinition = componentDefinition as MeshComponentDefinition;
        let meshAsset: IMeshAssetData | undefined = undefined;
        if (isDefined(meshComponentDefinition.meshFileId)) {
          meshAsset = assetDb.getById(meshComponentDefinition.meshFileId, AssetType.Mesh);
        }
        components.push(new MeshComponentData(meshComponentDefinition.id, meshAsset));
        break;
      }
      case ComponentDefinitionType.Script: {
        const scriptComponentDefinition = componentDefinition as ScriptComponentDefinition;
        let scriptAsset: IScriptAssetData | undefined = undefined;
        if (isDefined(scriptComponentDefinition.scriptFileId)) {
          scriptAsset = assetDb.getById(scriptComponentDefinition.scriptFileId, AssetType.Script);
        }
        components.push(new ScriptComponentData(scriptComponentDefinition.id, scriptAsset));
        break;
      }
      case ComponentDefinitionType.Camera: {
        const cameraComponentDefinition = componentDefinition as CameraComponentDefinition;
        components.push(new CameraComponentData(cameraComponentDefinition.id));
        break;
      }
      case ComponentDefinitionType.DirectionalLight: {
        const directionalLightComponentDefinition = componentDefinition as DirectionalLightComponentDefinition;
        const color = toColor3Core(directionalLightComponentDefinition.color);
        components.push(new DirectionalLightComponentData(directionalLightComponentDefinition.id, directionalLightComponentDefinition.intensity, color));
        break;
      }
      case ComponentDefinitionType.PointLight: {
        const pointLightComponentDefinition = componentDefinition as PointLightComponentDefinition;
        const color = toColor3Core(pointLightComponentDefinition.color);
        components.push(new PointLightComponentData(pointLightComponentDefinition.id, pointLightComponentDefinition.intensity, color));
        break;
      }
      default: {
        throw new Error(`Unknown component type: ${(componentDefinition as { type: string }).type}`);
      }
    }
  }

  // Load children (recursively)
  let children: GameObjectData[] = [];
  if (objectDefinition.children !== undefined) {
    children = objectDefinition.children.map((childObjectDefinition) => loadObjectDefinition(childObjectDefinition, assetDb));
  }

  return new GameObjectData(
    objectDefinition.id,
    objectDefinition.name,
    new TransformData(
      toVector3Core(objectDefinition.transform.position),
      toVector3Core(objectDefinition.transform.rotation),
      toVector3Core(objectDefinition.transform.scale),
    ),
    components,
    children,
  );
}
