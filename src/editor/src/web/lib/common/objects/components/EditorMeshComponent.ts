import { ModelNode, ObjectNode, SceneNode } from '@lopoly/engine/scene';
import { MeshComponentData } from '@polyzone/runtime/cartridge/data';
import { AssetCache } from '@polyzone/runtime/assets';
import { IEditorObjectComponent } from './IEditorObjectComponent';
import { EditorObject } from '../EditorObject';
import { IAssetDependentComponent, ISelectableObject } from '@lib/composer/scene/components';

export class EditorMeshComponent implements IEditorObjectComponent, ISelectableObject, IAssetDependentComponent {
  public readonly id: string;
  public readonly editorObject: EditorObject;
  public readonly sceneNode: SceneNode;

  private _modelNode: ModelNode | undefined;

  /** Meshes populated into the selection cache */
  public readonly allSelectableMeshes: ModelNode[];
  /** IDs of assets this component is dependent on */
  public readonly assetDependencyIds: string[];

  protected constructor(data: MeshComponentData, object: EditorObject, sceneNode: SceneNode, modelNode: ModelNode | undefined) {
    this.id = data.id;
    this.editorObject = object;
    this.sceneNode = sceneNode;
    this._modelNode = modelNode;

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

  public onDestroy(): void {
    this.sceneNode.destroy();
  }

  public static async instantiateFromData(data: MeshComponentData, object: EditorObject, atIndex: number | undefined, assetCache: AssetCache): Promise<EditorMeshComponent> {
    return object.registerComponentInstance(async (componentParentSceneNode) => {
      const sceneNode = new ObjectNode(object.scene.lopolyScene, `Mesh:${data.id}`, componentParentSceneNode);

      let modelNode: ModelNode | undefined = undefined;
      if (data.meshAsset) {
        const meshAsset = await assetCache.loadAsset(data.meshAsset);
        modelNode = new ModelNode(object.scene.lopolyScene, `${sceneNode.name}:Mesh`, meshAsset.model, componentParentSceneNode);
      }

      const meshComponent = new EditorMeshComponent(data, object, sceneNode, modelNode);
      return meshComponent;
    }, atIndex);
  }

  // @TODO Mutable, how? Need to update selection caches and stuff.
  public get modelNode(): ModelNode | undefined { return this._modelNode; }
//   public set modelNode(value: ModelNode | undefined) {
//     // Destroy existing model node (if one exists)
//     if (this._modelNode !== undefined) {
//       this._modelNode.destroy();
//     }

//     // Assign new value
//     this._modelNode = value;

//     // (if setting a defined value) Set model node's parent
//     if (this._modelNode !== undefined) {
//       this._modelNode.parent = this.sceneNode;
//     }
//   }
}
