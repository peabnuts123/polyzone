import { Color3 } from "@babylonjs/core/Maths/math.color";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { Vector3 as Vector3Babylon } from "@babylonjs/core/Maths/math.vector";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { Scene as BabylonScene } from '@babylonjs/core/scene';

import { GameObjectComponent, ScriptComponent } from "@polyzone/core/src/world";

import {
  MeshComponentData,
  ScriptComponentData,
  CameraComponentData,
  PointLightComponentData,
  DirectionalLightComponentData,
  IComponentData,
  IGameObjectData,
} from '../cartridge';
import { toColor3Babylon } from "../util";
import { ScriptLoader } from "../ScriptLoader";
import {
  MeshComponent,
  CameraComponent,
  DirectionalLightComponent,
  PointLightComponent,
} from './components';
import { MeshAsset } from "./assets/MeshAsset";
import { Transform } from "./Transform";
import { AssetCache } from "./assets";
import { GameObject } from "./GameObject";


export async function createGameObject(
  gameObjectData: IGameObjectData,
  parentTransform: Transform | undefined = undefined,
  scene: BabylonScene,
  createGameObjectComponent: (
    gameObject: GameObject,
    componentData: IComponentData,
  ) => Promise<GameObjectComponent | undefined>,
): Promise<GameObject> {
  // Construct game object transform for constructing scene's hierarchy
  const transform = new Transform(
    gameObjectData.name,
    scene,
    parentTransform,
    gameObjectData.transform,
  );

  // Create all child objects first
  await Promise.all(gameObjectData.children.map((childObjectData) =>
    createGameObject(
      childObjectData,
      transform,
      scene,
      createGameObjectComponent,
    )),
  );

  // Create blank object
  const gameObject = new GameObject(
    gameObjectData.id,
    gameObjectData.name,
    transform,
  );
  transform.gameObject = gameObject;

  // Load game object components
  await Promise.all(gameObjectData.components.map(async (componentData) => {
    const component = await createGameObjectComponent(
      gameObject,
      componentData,
    );
    if (component !== undefined) {
      gameObject.addComponent(component);
    }
  }));

  return gameObject;
}

export async function createGameObjectComponent(
  gameObject: GameObject,
  componentData: IComponentData,
  scene: BabylonScene,
  assetCache: AssetCache,
  scriptLoader: ScriptLoader,
): Promise<GameObjectComponent | undefined> {
  let newComponent: GameObjectComponent | undefined = undefined;

  if (componentData instanceof MeshComponentData) {
    /* Mesh component */
    let meshAsset: MeshAsset | undefined = undefined;
    if (componentData.meshAsset !== undefined) {
      meshAsset = await assetCache.loadAsset(componentData.meshAsset, scene);
    }
    newComponent = new MeshComponent(componentData.id, gameObject, meshAsset);
  } else if (componentData instanceof ScriptComponentData) {
    /* Custom component script */
    // Instantiate instance of script component (i.e. user-defined class)
    // Obviously only do this if the script component has a script asset assigned to it
    // otherwise, do nothing.
    if (componentData.scriptAsset) {
      // Script "asset" itself which may contain metadata about the asset rather than the script data itself
      // @TODO Where can this go? What can reference it? It currently doesn't have any data, so, ignore for now.
      // I guess the code here will reference it?
      // const scriptAsset = await assetCache.loadAsset(componentData.scriptAsset, scene);

      const scriptModule = scriptLoader.getModule(componentData.scriptAsset);
      if (
        scriptModule === undefined ||
        scriptModule === null ||
        !(scriptModule instanceof Object) ||
        !('default' in scriptModule)
      ) {
        throw new Error(`Module is missing default export: ${componentData.scriptAsset.path}`);
      }

      // Ensure script is of correct type
      const CustomScriptComponent = scriptModule.default as new (...args: ConstructorParameters<typeof ScriptComponent>) => ScriptComponent;
      if (
        !(
          (CustomScriptComponent instanceof Object) &&
          Object.prototype.isPrototypeOf.call(ScriptComponent, CustomScriptComponent)
        )
      ) {
        throw new Error(`Cannot add component to GameObject. Default export from script '${componentData.scriptAsset.path}' is not of type 'ScriptComponent': ${CustomScriptComponent}`);
      }

      // Construct new instance of script component
      gameObject.addComponent(new CustomScriptComponent(componentData.id, gameObject));
    }
  } else if (componentData instanceof CameraComponentData) {
    /* Camera component */
    const camera = new FreeCamera("Main Camera", Vector3Babylon.Zero(), scene, true);
    camera.inputs.clear();
    gameObject.addComponent(new CameraComponent(componentData.id, gameObject, camera));
  } else if (componentData instanceof DirectionalLightComponentData) {
    /* Directional Light component */
    const light = new DirectionalLight(`light_directional`, Vector3Babylon.Down(), scene);
    light.specular = Color3.Black();
    light.intensity = componentData.intensity;
    light.diffuse = toColor3Babylon(componentData.color);
    newComponent = new DirectionalLightComponent(componentData.id, gameObject, light);
  } else if (componentData instanceof PointLightComponentData) {
    /* Point Light component */
    const light = new PointLight(`light_point`, Vector3Babylon.Zero(), scene);
    light.specular = Color3.Black();
    light.intensity = componentData.intensity;
    light.diffuse = toColor3Babylon(componentData.color);
    newComponent = new PointLightComponent(componentData.id, gameObject, light);
  } else {
    console.error(`(createGameObjectComponent) Unrecognised component data: `, componentData);
  }

  return newComponent;
}
