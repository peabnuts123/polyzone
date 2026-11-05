import { MeshComponent as MeshComponentCore } from '@polyzone/core/objects/components/MeshComponent';
import { IGameObjectComponent } from './IGameObjectComponent';
import { ModelNode, ObjectNode, SceneNode } from '@lopoly/engine/scene';
import { MeshComponentData } from '@polyzone/runtime/cartridge/data';
import { AssetCache } from '@polyzone/runtime/assets';
import { GameObject } from '@polyzone/runtime/objects/GameObject';

export class MeshComponent extends MeshComponentCore implements IGameObjectComponent {
  public readonly id: string;
  public readonly gameObject: GameObject;

  // @TODO Make model optional / settable
  private readonly modelNode: ModelNode | ObjectNode;

  protected constructor(id: string, gameObject: GameObject, modelNode: ModelNode | ObjectNode) {
    super();
    this.id = id;
    this.gameObject = gameObject;
    this.modelNode = modelNode;
  }

  public init(): void { }
  public onUpdate(): void { }
  public onDestroy(): void {
    this.sceneNode.destroy();
  }

  public static async instantiateFromData(data: MeshComponentData, gameObject: GameObject, atIndex: number | undefined, assetCache: AssetCache): Promise<MeshComponent> {
    return gameObject.registerComponentInstance(async (componentParentSceneNode) => {
      let modelNode: ModelNode | ObjectNode;
      if (data.meshAsset) {
        const meshAsset = await assetCache.loadAsset(data.meshAsset);
        modelNode = new ModelNode(gameObject.scene.lopolyScene, `Mesh:${data.id}`, meshAsset.model, componentParentSceneNode);
      } else {
        // @TODO This is hacking around nullable model
        modelNode = new ObjectNode(gameObject.scene.lopolyScene, `Mesh:${data.id}`, componentParentSceneNode);
      }
      const meshComponent = new MeshComponent(data.id, gameObject, modelNode);
      return meshComponent;
    }, atIndex);
  }

  public get sceneNode(): SceneNode { return this.modelNode; }
}
