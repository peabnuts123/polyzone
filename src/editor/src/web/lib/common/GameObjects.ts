import { Vector3 as Vector3Babylon } from '@babylonjs/core/Maths/math.vector';
import { Color3 as Color3Babylon } from '@babylonjs/core/Maths/math.color';
import "@babylonjs/loaders/OBJ/objFileLoader";
import "@babylonjs/loaders/glTF";
import { PointLight as PointLightBabylon } from '@babylonjs/core/Lights/pointLight';
import { DirectionalLight as DirectionalLightBabylon } from '@babylonjs/core/Lights/directionalLight';
import { Scene as BabylonScene } from '@babylonjs/core/scene';
import '@babylonjs/core/Culling/ray'; // @NOTE needed for mesh picking - contains side effects

import { GameObjectComponent } from '@polyzone/core/src/world';
import {
  GameObject as GameObjectRuntime,
  DirectionalLightComponent as DirectionalLightComponentRuntime,
  PointLightComponent as PointLightComponentRuntime,
} from '@polyzone/runtime/src/world';
import { toColor3Babylon } from '@polyzone/runtime/src/util';
import { AssetCache, MeshAsset } from '@polyzone/runtime/src/world/assets';

import { CameraComponentData, DirectionalLightComponentData, IComposerComponentData, MeshComponentData, PointLightComponentData, ScriptComponentData } from '@lib/project/data/components';
import { IAssetDependentComponent, isAssetDependentComponent, ISelectableObject, isSelectableObject, MeshComponent } from '@lib/composer/scene/components';

export async function createEditorGameObjectComponent(
  gameObject: GameObjectRuntime,
  componentData: IComposerComponentData,
  scene: BabylonScene,
  assetCache: AssetCache,
  addSelectableObjectToCache: (newComponent: ISelectableObject) => void,
  registerAssetDependentComponent: (newComponent: IAssetDependentComponent) => void,
): Promise<GameObjectComponent | undefined> {
  let newComponent: GameObjectComponent | undefined = undefined;

  if (componentData instanceof MeshComponentData) {
    /* Mesh component */
    let meshAsset: MeshAsset | undefined = undefined;
    if (componentData.meshAsset !== undefined) {
      meshAsset = await assetCache.loadAsset(componentData.meshAsset, scene);
    }
    const meshComponent = newComponent = new MeshComponent(componentData, gameObject, meshAsset);
    // Store reverse reference to new instance for managing instance later (e.g. autoload)
    componentData.componentInstance = meshComponent;
  } else if (componentData instanceof ScriptComponentData) {
    /* @NOTE Script has no effect in the Composer */
  } else if (componentData instanceof CameraComponentData) {
    /* @NOTE Camera has no effect in the Composer */
  } else if (componentData instanceof DirectionalLightComponentData) {
    /* Directional Light component */
    const light = new DirectionalLightBabylon(`light_directional`, Vector3Babylon.Down(), scene);
    light.specular = Color3Babylon.Black();
    light.intensity = componentData.intensity;
    light.diffuse = toColor3Babylon(componentData.color);
    newComponent = new DirectionalLightComponentRuntime(componentData.id, gameObject, light);
  } else if (componentData instanceof PointLightComponentData) {
    /* Point Light component */
    const light = new PointLightBabylon(`light_point`, Vector3Babylon.Zero(), scene);
    light.specular = Color3Babylon.Black();
    light.intensity = componentData.intensity;
    light.diffuse = toColor3Babylon(componentData.color);
    newComponent = new PointLightComponentRuntime(componentData.id, gameObject, light);
  } else {
    console.error(`[SceneViewController] (createGameObjectComponent) Unrecognised component data: `, componentData);
  }

  // Only continue processing if a component was actually made
  if (newComponent === undefined) return;

  // Store selectable objects in cache (for efficient lookup of model => game object on click)
  if (isSelectableObject(newComponent)) {
    addSelectableObjectToCache(newComponent);
  }

  // Store asset dependencies in a cache (for reloading components when assets change)
  if (isAssetDependentComponent(newComponent)) {
    registerAssetDependentComponent(newComponent);
  }

  return newComponent;
}
