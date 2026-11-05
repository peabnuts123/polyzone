import { ModelNode, ObjectNode } from "@lopoly/engine/scene/nodes";

import { MeshComponent as MeshComponentRuntime } from "@polyzone/runtime/objects/components";
import type { GameObject } from "@polyzone/runtime/objects";
import type { AssetCache } from "@polyzone/runtime/assets";

import { MeshComponentData } from "@lib/project/data/components";
import type { ISelectableObject } from "./ISelectableObject";
import type { IAssetDependentComponent } from "./IAssetDependentComponent";

export class MeshComponent extends MeshComponentRuntime implements ISelectableObject, IAssetDependentComponent {
  /** Meshes populated into the selection cache */
  public readonly allSelectableMeshes: ModelNode[];
  /** IDs of assets this component is dependent on */
  public readonly assetDependencyIds: string[];

  /**
   * @param data Data needed to construct a GameObjectComponent.
   * @param asset Model assets loaded by Babylon
   */
  protected constructor(data: MeshComponentData, gameObject: GameObject, modelNode: ModelNode | ObjectNode) {
    super(data.id, gameObject, modelNode);

    // Build asset dependency cache
    if (data.meshAsset === undefined) {
      this.assetDependencyIds = [];
    } else {
      this.assetDependencyIds = [data.meshAsset.id];
    }

    // Build selection cache data
    this.allSelectableMeshes = [];
    if (modelNode instanceof ModelNode) {
      this.allSelectableMeshes.push(modelNode);
    }
  }

  // @TODO Any way to share this with base class?
  public static override async instantiateFromData(data: MeshComponentData, gameObject: GameObject, atIndex: number | undefined, assetCache: AssetCache): Promise<MeshComponent> {
    return gameObject.registerComponentInstance(async (componentParentSceneNode) => {
      let modelNode: ModelNode | ObjectNode;
      if (data.meshAsset) {
        const meshAsset = await assetCache.loadAsset(data.meshAsset);
        modelNode = new ModelNode(gameObject.scene.lopolyScene, `Mesh:${data.id}`, meshAsset.model, componentParentSceneNode);
      } else {
        // @TODO This is hacking around nullable model
        modelNode = new ObjectNode(gameObject.scene.lopolyScene, `Mesh:${data.id}`, componentParentSceneNode);
      }
      const meshComponent = new MeshComponent(data, gameObject, modelNode);
      return meshComponent;
    }, atIndex);
  }
}
