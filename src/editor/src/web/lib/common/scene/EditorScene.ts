import { type IEngine } from "@lopoly/engine/Engine";
import { Scene as LoPolyScene, SceneLighting } from "@lopoly/engine/scene";

import {
  MeshComponentData,
  ScriptComponentData,
  CameraComponentData,
  PointLightComponentData,
  DirectionalLightComponentData,
} from "@lib/project/data/components";
import {
  EditorMeshComponent,
  EditorCameraComponent,
  EditorDirectionalLightComponent,
  EditorPointLightComponent,
  EditorScriptComponent,
  IEditorObjectComponent,
} from '@lib/common/objects/components';
import { EditorObject } from "@lib/common/objects/EditorObject";
import { AssetCache } from "@polyzone/runtime/assets";
import { GameObjectData, IComposerComponentData } from "@lib/project/data";
import { ISelectableObject, isSelectableObject } from "@lib/composer/scene/components/ISelectableObject";
import { ComponentDependencyManager } from "../ComponentDependencyManager";
import { SceneViewSelectionCache } from "@lib/composer/scene/SceneViewSelectionCache";
import { isAssetDependentComponent } from "@lib/composer/scene/components/IAssetDependentComponent";
import { Color3 } from "@polyzone/core/math";

export class EditorScene {
  // References
  public readonly lopolyScene: LoPolyScene;
  private readonly assetCache: AssetCache;
  public readonly componentDependencyManager: ComponentDependencyManager;
  public readonly selectionCache: SceneViewSelectionCache; // @TODO Rename / move type

  // State
  public readonly topLevelEditorObjects: EditorObject[];

  public constructor(
    engine: IEngine,
    assetCache: AssetCache,
  ) {
    this.assetCache = assetCache;
    this.componentDependencyManager = new ComponentDependencyManager();
    this.selectionCache = new SceneViewSelectionCache();
    this.topLevelEditorObjects = [];

    this.lopolyScene = new LoPolyScene(engine);
  }

  public destroy(): void {
    this.topLevelEditorObjects.forEach((object) => object.destroy());
  }

  public destroyEditorObject(object: EditorObject): void {
    // Destroy children
    const childrenToDelete: EditorObject[] = [];
    object.forEachChild((child) => childrenToDelete.push(child));
    for (const child of childrenToDelete) {
      this.destroyEditorObject(child);
    }

    // Destroy self
    if (object.parent !== undefined) {
      // Remove object from parent's children
      object.parent = undefined;
    } else {
      // Remove object from scene
      const index = this.topLevelEditorObjects.indexOf(object);
      if (index === -1) {
        throw new Error(`Error trying to destroy ${EditorObject.name} with no parent - it is not present in the collection of top-level objects. Does this ${EditorObject.name} belong to this scene?`);
      }
      this.topLevelEditorObjects.splice(index, 1);
    }

    object.onDestroy();
  }

  public async createEditorObject(objectData: GameObjectData, parentObject?: EditorObject): Promise<EditorObject> {
    // Construct blank object
    const object = new EditorObject(
      objectData.id,
      objectData.name,
      this,
      parentObject,
    );
    object.position = objectData.transform.position;
    object.rotation.euler = objectData.transform.rotation;
    object.scale = objectData.transform.scale;

    // Construct child objects recursively
    await Promise.all(objectData.children.map((childObjectData) =>
      this.createEditorObject(
        childObjectData,
        object,
      )),
    );

    // Load components
    await Promise.all(objectData.components.map(async (componentData) =>
      this.createEditorObjectComponent(
        componentData,
        object,
        objectData,
      ),
    ));

    // Add top-level objects to scene
    if (parentObject === undefined) {
      this.addEditorObject(object);
    }

    return object;
  }

  public async createEditorObjectComponent(
    componentData: IComposerComponentData,
    object: EditorObject,
    objectData: GameObjectData,
    atIndex?: number,
  ): Promise<void> {
    let newComponent: IEditorObjectComponent | undefined = undefined;

    if (componentData instanceof MeshComponentData) {
      /* Mesh component */
      newComponent = await EditorMeshComponent.instantiateFromData(componentData, object, atIndex, this.assetCache);
    } else if (componentData instanceof ScriptComponentData) {
      /* Custom component script */
      newComponent = await EditorScriptComponent.instantiateFromData(componentData, object, atIndex);
    } else if (componentData instanceof CameraComponentData) {
      /* Camera component */
      newComponent = await EditorCameraComponent.instantiateFromData(componentData, object, atIndex);
    } else if (componentData instanceof DirectionalLightComponentData) {
      /* Directional Light component */
      newComponent = await EditorDirectionalLightComponent.instantiateFromData(componentData, object, atIndex);
    } else if (componentData instanceof PointLightComponentData) {
      /* Point Light component */
      newComponent = await EditorPointLightComponent.instantiateFromData(componentData, object, atIndex);
    } else {
      throw new Error(`Unimplemented component data type: ${componentData.constructor.name}`);
    }

    // Only continue processing if a component was actually made
    if (newComponent === undefined) return;

    // Store selectable objects in cache (for efficient lookup of model => editor object on click)
    // @TODO move selectable object stuff to here outside of MeshComponent
    if (isSelectableObject(newComponent)) {
      this.addToSelectionCache(objectData.id, newComponent);
    }

    // Store asset dependencies in a cache (for reloading components when assets change)
    if (isAssetDependentComponent(newComponent)) {
      this.componentDependencyManager.registerDependency(
        componentData,
        objectData,
        newComponent.assetDependencyIds,
      );
    }
  }

  public addToSelectionCache(objectId: string, component: ISelectableObject): void {
    this.selectionCache.add(objectId, component.allSelectableMeshes);
  }

  public removeFromSelectionCache(component: ISelectableObject): void {
    this.selectionCache.remove(component.allSelectableMeshes);
  }

  public addEditorObject(object: EditorObject): void {
    this.topLevelEditorObjects.push(object);
  }

  public findEditorObjectById(objectId: string): EditorObject | undefined {
    for (const topLevelObject of this.topLevelEditorObjects) {
      if (topLevelObject.id === objectId) {
        return topLevelObject;
      }
      const result = topLevelObject.findChild((child) => child.id === objectId, true);
      if (result !== undefined) {
        return result;
      }
    }

    return undefined;
  }

  public clear(): void {
    this.selectionCache.clear();
    this.componentDependencyManager.clear();
    // @NOTE Clone the collection to mutate it while iterating
    [...this.topLevelEditorObjects].forEach((topLevelObject) => {
      this.destroyEditorObject(topLevelObject);
    });
  }

  public get lighting(): SceneLighting { return this.lopolyScene.lighting; }
  public get clearColour(): Color3 { return this.lopolyScene.clearColor; }
  public set clearColour(value: Color3) { this.lopolyScene.clearColor = value; }
}

