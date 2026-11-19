import { SceneNode, DirectionalLightNode, ObjectNode } from '@lopoly/engine/scene';
import { Color3 } from '@polyzone/core/math';
import { DirectionalLightComponentData } from '@polyzone/runtime/cartridge';
import { EditorObject } from '../EditorObject';
import { IEditorObjectComponent } from './IEditorObjectComponent';

// @TODO Gizmo node + directional light node under top-level `sceneNode`
export class EditorDirectionalLightComponent implements IEditorObjectComponent {
  public readonly id: string;
  public readonly editorObject: EditorObject;
  public readonly sceneNode: SceneNode;

  private readonly directionalLightNode: DirectionalLightNode;

  public constructor(id: string, object: EditorObject, sceneNode: SceneNode, directionalLightNode: DirectionalLightNode) {
    this.id = id;
    this.editorObject = object;
    this.sceneNode = sceneNode;
    this.directionalLightNode = directionalLightNode;
  }

  public onDestroy(): void {
    this.sceneNode.destroy();
  }

  public static async instantiateFromData(data: DirectionalLightComponentData, object: EditorObject, atIndex: number | undefined): Promise<EditorDirectionalLightComponent> {
    return object.registerComponentInstance((componentParentSceneNode) => {
      const sceneNode = new ObjectNode(object.scene.lopolyScene, `DirectionalLight:${data.id}`, componentParentSceneNode);
      const directionalLightNode = new DirectionalLightNode(object.scene.lopolyScene, `${sceneNode.name}:Light`, {
        color: data.color.clone(),
        intensity: data.intensity,
      }, componentParentSceneNode);
      const directionalLightComponent = new EditorDirectionalLightComponent(data.id, object, sceneNode, directionalLightNode);
      return Promise.resolve(directionalLightComponent);
    }, atIndex);
  }

  public get color(): Color3 { return this.directionalLightNode.color; }
  public set color(value: Color3) { this.directionalLightNode.color = value; }
  public get intensity(): number { return this.directionalLightNode.intensity; }
  public set intensity(value: number) { this.directionalLightNode.intensity = value; }
}
