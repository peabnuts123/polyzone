import {
  GameObject as GameObjectRuntime,
  GameObjectComponent,
} from '@polyzone/runtime/objects';
import {
  DirectionalLightComponent as DirectionalLightComponentRuntime,
  PointLightComponent as PointLightComponentRuntime,
} from '@polyzone/runtime/objects/components';
import { AssetCache } from '@polyzone/runtime/assets';

import { CameraComponentData, DirectionalLightComponentData, IComposerComponentData, MeshComponentData, PointLightComponentData, ScriptComponentData } from '@lib/project/data/components';
import { IAssetDependentComponent, isAssetDependentComponent, ISelectableObject, isSelectableObject, MeshComponent } from '@lib/composer/scene/components';

export async function createEditorGameObjectComponent(
  componentData: IComposerComponentData,
  gameObject: GameObjectRuntime,
  atIndex: number | undefined,
  assetCache: AssetCache,
  addSelectableObjectToCache: (newComponent: ISelectableObject) => void,
  registerAssetDependentComponent: (newComponent: IAssetDependentComponent) => void,
): Promise<void> {
  let newComponent: GameObjectComponent | undefined = undefined;

  if (componentData instanceof MeshComponentData) {
    /* Mesh component */
    // @TODO Just use runtime component IMO, refactor selection stuff below
    newComponent = await MeshComponent.instantiateFromData(componentData, gameObject, atIndex, assetCache);
  } else if (componentData instanceof ScriptComponentData) {
    /* Custom component script */
    /* @NOTE Script has no effect in the Composer */
  } else if (componentData instanceof CameraComponentData) {
    /* Camera component */
    /* @NOTE Camera has no effect in the Composer */
  } else if (componentData instanceof DirectionalLightComponentData) {
    /* Directional Light component */
    // @TODO
    newComponent = await DirectionalLightComponentRuntime.instantiateFromData(componentData, gameObject, atIndex);
  } else if (componentData instanceof PointLightComponentData) {
    /* Point Light component */
    newComponent = await PointLightComponentRuntime.instantiateFromData(componentData, gameObject, atIndex);
  } else {
    throw new Error(`Unimplemented component data type: ${componentData.constructor.name}`);
  }

  // Only continue processing if a component was actually made
  if (newComponent === undefined) return;

  // Store selectable objects in cache (for efficient lookup of model => game object on click)
  // @TODO move selectable object stuff to here outside of MeshComponent
  if (isSelectableObject(newComponent)) {
    addSelectableObjectToCache(newComponent);
  }

  // Store asset dependencies in a cache (for reloading components when assets change)
  if (isAssetDependentComponent(newComponent)) {
    registerAssetDependentComponent(newComponent);
  }

  // return newComponent;
}
