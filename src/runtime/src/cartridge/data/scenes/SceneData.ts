import { Color3, Vector3 } from "@polyzone/core/math";

import { SceneDefinition, ComponentDefinitionType, GameObjectDefinition, AssetType } from "../../archive";
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
      clearColor: new Color3(sceneDefinition.config.clearColor),
      lighting: {
        ambient: {
          intensity: sceneDefinition.config.lighting.ambient.intensity,
          color: new Color3(sceneDefinition.config.lighting.ambient.color),
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
        const meshComponentDefinition = componentDefinition;
        let meshAsset: IMeshAssetData | undefined = undefined;
        if (meshComponentDefinition.meshFileId !== null) {
          meshAsset = assetDb.getById(meshComponentDefinition.meshFileId, AssetType.Mesh);
        }
        components.push(new MeshComponentData(meshComponentDefinition.id, meshAsset));
        break;
      }
      case ComponentDefinitionType.Script: {
        const scriptComponentDefinition = componentDefinition;
        let scriptAsset: IScriptAssetData | undefined = undefined;
        if (scriptComponentDefinition.scriptFileId !== null) {
          scriptAsset = assetDb.getById(scriptComponentDefinition.scriptFileId, AssetType.Script);
        }
        components.push(new ScriptComponentData(scriptComponentDefinition.id, scriptAsset));
        break;
      }
      case ComponentDefinitionType.Camera: {
        const cameraComponentDefinition = componentDefinition;
        components.push(new CameraComponentData(cameraComponentDefinition.id));
        break;
      }
      case ComponentDefinitionType.DirectionalLight: {
        const directionalLightComponentDefinition = componentDefinition;
        const color = new Color3(directionalLightComponentDefinition.color);
        components.push(new DirectionalLightComponentData(directionalLightComponentDefinition.id, directionalLightComponentDefinition.intensity, color));
        break;
      }
      case ComponentDefinitionType.PointLight: {
        const pointLightComponentDefinition = componentDefinition;
        const color = new Color3(pointLightComponentDefinition.color);
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
      new Vector3(objectDefinition.transform.position),
      new Vector3(objectDefinition.transform.rotation),
      new Vector3(objectDefinition.transform.scale),
    ),
    components,
    children,
  );
}
