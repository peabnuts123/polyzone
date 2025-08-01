import { CameraComponentDefinition, ComponentDefinitionType, DirectionalLightComponentDefinition, MeshComponentDefinition, PointLightComponentDefinition, GameObjectDefinition, ScriptComponentDefinition, AssetType } from "@polyzone/runtime/src/cartridge/archive";
import { isDefined, toColor3Core, toVector3Core } from "@polyzone/runtime/src/util";
import { LoadObjectDefinitionFn } from "@polyzone/runtime/src/cartridge";

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
        const meshComponentDefinition = componentDefinition as MeshComponentDefinition;
        let meshAsset: MeshAssetData | undefined = undefined;
        if (isDefined(meshComponentDefinition.meshFileId)) {
          meshAsset = assetDb.getById(meshComponentDefinition.meshFileId, AssetType.Mesh);
        }
        components.push(new MeshComponentData(componentDefinition.id, meshAsset));
        break;
      }
      case ComponentDefinitionType.Script: {
        const scriptComponentDefinition = componentDefinition as ScriptComponentDefinition;
        let scriptAsset: ScriptAssetData | undefined = undefined;
        if (isDefined(scriptComponentDefinition.scriptFileId)) {
          // @TODO Nah dog… these Ids my be invalid lol
          scriptAsset = assetDb.getById(scriptComponentDefinition.scriptFileId, AssetType.Script);
        }
        components.push(new ScriptComponentData(componentDefinition.id, scriptAsset));
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
        components.push(new DirectionalLightComponentData(componentDefinition.id, directionalLightComponentDefinition.intensity, color));
        break;
      }
      case ComponentDefinitionType.PointLight: {
        const pointLightComponentDefinition = componentDefinition as PointLightComponentDefinition;
        const color = toColor3Core(pointLightComponentDefinition.color);
        components.push(new PointLightComponentData(componentDefinition.id, pointLightComponentDefinition.intensity, color));
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
