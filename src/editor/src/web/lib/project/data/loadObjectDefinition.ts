import { ComponentDefinitionType, GameObjectDefinition, AssetType } from "@polyzone/runtime/cartridge/archive";
import { LoadObjectDefinitionFn } from "@polyzone/runtime/cartridge";
import { Color3, Vector3 } from "@polyzone/core/math";

import { AssetDb, type IEditorAssetDb } from "@lib/project/data/AssetDb";
import { MeshAssetData, ScriptAssetData } from "@lib/project/data/assets";
import { CameraComponentData, DirectionalLightComponentData, IComposerComponentData, MeshComponentData, PointLightComponentData, ScriptComponentData } from "./components";
import { GameObjectData } from "./GameObjectData";
import { TransformData } from "./TransformData";


/**
 * Copy of @see {@link loadObjectDefinition} with types adhering to `@polyzone/runtime`
 */
export const __loadObjectDefinitionForRuntime: LoadObjectDefinitionFn = (objectDefinition, assetDb) => {
  // @NOTE Runtime type checking so that `loadObjectDefinition` can be cast to `LoadObjectDefinitionFn`
  if ((assetDb as AssetDb).add === undefined) {
    throw new Error(`Received runtime instance of AssetDb when editor instance is required`);
  }

  return loadObjectDefinition(objectDefinition, assetDb as AssetDb);
};

export function loadObjectDefinition(objectDefinition: GameObjectDefinition, assetDb: IEditorAssetDb): GameObjectData {
  const components: IComposerComponentData[] = [];
  for (const componentDefinition of objectDefinition.components) {
    switch (componentDefinition.type) {
      case ComponentDefinitionType.Mesh: {
        let meshAsset: MeshAssetData | undefined = undefined;
        if (componentDefinition.meshFileId !== null) {
          meshAsset = assetDb.getById(componentDefinition.meshFileId, AssetType.Mesh);
        }
        components.push(new MeshComponentData(componentDefinition.id, meshAsset));
        break;
      }
      case ComponentDefinitionType.Script: {
        let scriptAsset: ScriptAssetData | undefined = undefined;
        if (componentDefinition.scriptFileId !== null) {
          // @TODO Nah dog… these Ids my be invalid lol
          scriptAsset = assetDb.getById(componentDefinition.scriptFileId, AssetType.Script);
        }
        components.push(new ScriptComponentData(componentDefinition.id, scriptAsset));
        break;
      }
      case ComponentDefinitionType.Camera: {
        components.push(new CameraComponentData(componentDefinition.id));
        break;
      }
      case ComponentDefinitionType.DirectionalLight: {
        const color = new Color3(componentDefinition.color);
        components.push(new DirectionalLightComponentData(componentDefinition.id, componentDefinition.intensity, color));
        break;
      }
      case ComponentDefinitionType.PointLight: {
        const color = new Color3(componentDefinition.color);
        components.push(new PointLightComponentData(componentDefinition.id, componentDefinition.intensity, color));
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
