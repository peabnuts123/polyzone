import { AssetCache } from "@polyzone/runtime/assets";
import {
  MeshComponentData,
  ScriptComponentData,
  CameraComponentData,
  PointLightComponentData,
  DirectionalLightComponentData,
  IComponentData,
  IGameObjectData,
} from '@polyzone/runtime/cartridge/data';
import { Scene } from "@polyzone/runtime/scene";
import { ScriptLoader } from "../ScriptLoader";
import {
  MeshComponent,
  CameraComponent,
  DirectionalLightComponent,
  PointLightComponent,
} from './components';
import { GameObject } from "./GameObject";
import { ScriptComponent } from "./components/ScriptComponent";

export type CreateGameObjectComponentFn = (
  componentData: IComponentData,
  gameObject: GameObject,
  atIndex?: number,
) => Promise<void>;

export async function createGameObject(
  gameObjectData: IGameObjectData,
  parent: GameObject | undefined,
  scene: Scene,
  createGameObjectComponent: CreateGameObjectComponentFn,
): Promise<GameObject> {
  // Construct blank GameObject
  const gameObject = new GameObject(
    gameObjectData.id,
    gameObjectData.name,
    scene,
    parent,
  );
  gameObject.position = gameObjectData.transform.position;
  gameObject.rotation.euler = gameObjectData.transform.rotation;
  gameObject.scale = gameObjectData.transform.scale;

  // Construct child objects recursively
  await Promise.all(gameObjectData.children.map((childObjectData) =>
    createGameObject(
      childObjectData,
      gameObject,
      scene,
      createGameObjectComponent,
    )),
  );

  // Load game object components
  await Promise.all(gameObjectData.components.map(async (componentData) => {
    return createGameObjectComponent(
      componentData,
      gameObject,
    );
  }));

  return gameObject;
}

// @TODO if the editor doesn't need the instance either, we don't need to return anything
export async function createGameObjectComponent(
  componentData: IComponentData,
  gameObject: GameObject,
  atIndex: number | undefined,
  assetCache: AssetCache,
  scriptLoader: ScriptLoader,
): Promise<void> {
  // let newComponentInstance: GameObjectComponent | undefined = undefined;

  if (componentData instanceof MeshComponentData) {
    /* Mesh component */
    /* newComponentInstance =  */await MeshComponent.instantiateFromData(componentData, gameObject, atIndex, assetCache);
  } else if (componentData instanceof ScriptComponentData) {
    /* Custom component script */
    /* newComponentInstance =  */await ScriptComponent.instantiateFromData(componentData, gameObject, atIndex, scriptLoader);
  } else if (componentData instanceof CameraComponentData) {
    /* Camera component */
    /* newComponentInstance =  */await CameraComponent.instantiateFromData(componentData, gameObject, atIndex);
  } else if (componentData instanceof DirectionalLightComponentData) {
    /* Directional Light component */
    // @TODO
    /* newComponentInstance =  */await DirectionalLightComponent.instantiateFromData(componentData, gameObject, atIndex);
  } else if (componentData instanceof PointLightComponentData) {
    /* Point Light component */
    /* newComponentInstance =  */await PointLightComponent.instantiateFromData(componentData, gameObject, atIndex);
  } else {
    throw new Error(`Unimplemented component data type: ${componentData.constructor.name}`);
  }

  // return newComponentInstance;
}
