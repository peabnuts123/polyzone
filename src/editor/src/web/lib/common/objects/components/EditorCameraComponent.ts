import { ObjectNode, SceneNode } from '@lopoly/engine/scene';
import { CameraComponentData } from '@polyzone/runtime/cartridge/data';
import { EditorObject } from '../EditorObject';
import { IEditorObjectComponent } from './IEditorObjectComponent';

// @TODO A Gizmo node
export class EditorCameraComponent implements IEditorObjectComponent {
  public readonly id: string;
  public readonly editorObject: EditorObject;
  public readonly sceneNode: SceneNode;

  public constructor(id: string, object: EditorObject, sceneNode: SceneNode) {
    this.id = id;
    this.editorObject = object;
    this.sceneNode = sceneNode;
  }

  public onDestroy(): void {
    this.sceneNode.destroy();
  }

  public static instantiateFromData(data: CameraComponentData, object: EditorObject, atIndex: number | undefined): Promise<EditorCameraComponent> {
    return object.registerComponentInstance((componentParentSceneNode) => {
      const sceneNode = new ObjectNode(object.scene.lopolyScene, `Camera:${data.id}`, componentParentSceneNode);
      const cameraComponent = new EditorCameraComponent(data.id, object, sceneNode);
      return cameraComponent;
    }, atIndex);
  }
}
