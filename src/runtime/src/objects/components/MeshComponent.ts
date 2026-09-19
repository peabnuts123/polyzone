import { MeshComponent as MeshComponentCore } from '@polyzone/core/objects/components/MeshComponent';
import { IGameObjectComponent } from './IGameObjectComponent';
import { ModelNode, ObjectNode, SceneNode } from '@lopoly/engine/scene';
import { MeshComponentData } from '@polyzone/runtime/cartridge/data';
import { AssetCache } from '@polyzone/runtime/assets';
import { Scene } from '@polyzone/runtime/scene';
import { GameObject } from '@polyzone/runtime/objects/GameObject';

export class MeshComponent extends MeshComponentCore implements IGameObjectComponent {
  public readonly id: string;
  public readonly scene: Scene;
  public readonly gameObject: GameObject;

  // @TODO Make model optional / settable
  private readonly modelNode: ModelNode | ObjectNode;

  private constructor(id: string, scene: Scene, gameObject: GameObject, modelNode: ModelNode | ObjectNode) {
    super();
    this.id = id;
    this.scene = scene;
    this.gameObject = gameObject;
    this.modelNode = modelNode;
  }

  public static async instantiateFromData(data: MeshComponentData, scene: Scene, gameObject: GameObject, assetCache: AssetCache): Promise<MeshComponent> {
    return gameObject.registerComponentInstance(async (componentParentSceneNode) => {
      let modelNode: ModelNode | ObjectNode;
      if (data.meshAsset) {
        const meshAsset = await assetCache.loadAsset(data.meshAsset);
        modelNode = new ModelNode(scene.lopolyScene, `Mesh:${data.id}`, meshAsset.model, componentParentSceneNode);
      } else {
        // @TODO This is hacking around nullable model
        modelNode = new ObjectNode(scene.lopolyScene, `Mesh:${data.id}`, componentParentSceneNode);
      }
      const meshComponent = new MeshComponent(data.id, scene, gameObject, modelNode);
      return meshComponent;
    });
  }

  public get sceneNode(): SceneNode { return this.modelNode; }
}
