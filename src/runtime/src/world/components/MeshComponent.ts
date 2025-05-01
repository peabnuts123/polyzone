import type { InstantiatedEntries } from "@babylonjs/core/assetContainer";

import { MeshComponent as MeshComponentCore } from "@polyzone/core/src/world/components";

import { GameObject } from "../GameObject";
import { MeshAsset } from "../assets/MeshAsset";

/**
 * Loads a mesh for this GameObject
 */
export class MeshComponent extends MeshComponentCore {
  public readonly id: string;
  public readonly gameObject: GameObject;

  /** Instances (clones) of model assets in the scene */
  protected readonly sceneInstances: InstantiatedEntries | undefined;

  /**
   * @param data Data needed to construct a GameObjectComponent.
   * @param asset Model assets loaded by Babylon
   */
  public constructor(id: string, gameObject: GameObject, asset: MeshAsset | undefined) {
    super();
    this.id = id;
    this.gameObject = gameObject;

    if (asset !== undefined) {
      this.sceneInstances = asset.assetContainer.instantiateModelsToScene();
      this.sceneInstances.rootNodes.forEach((node) => {
        node.parent = this.gameObject.transform.node;
      });
    }
  }

  public override onDestroy(): void {
    this.sceneInstances?.dispose();
  }
}
