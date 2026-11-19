import { ObjectNode } from '@lopoly/engine/scene';
import { ScriptComponentData } from '@polyzone/runtime/cartridge';
import { EditorObject } from '../EditorObject';
import { IEditorObjectComponent } from './IEditorObjectComponent';

// @TODO A Gizmo node
export class EditorScriptComponent implements IEditorObjectComponent {
  public readonly id: string;
  public readonly editorObject: EditorObject;
  public readonly sceneNode: ObjectNode;

  public constructor(id: string, object: EditorObject, sceneNode: ObjectNode) {
    this.id = id;
    this.editorObject = object;
    this.sceneNode = sceneNode;
  }

  public onDestroy(): void {
    this.sceneNode.destroy();
  }

  public static instantiateFromData(data: ScriptComponentData, object: EditorObject, atIndex: number | undefined): Promise<EditorScriptComponent> {
    return object.registerComponentInstance((componentParentSceneNode) => {
      const sceneNode = new ObjectNode(object.scene.lopolyScene, `Script:${data.id}`, componentParentSceneNode);
      const scriptComponent = new EditorScriptComponent(data.id, object, sceneNode);
      return Promise.resolve(scriptComponent);
    }, atIndex);
  }
}
