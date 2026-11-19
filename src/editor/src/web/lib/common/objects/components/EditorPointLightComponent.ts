import { SceneNode, PointLightNode, ObjectNode } from '@lopoly/engine/scene';
import { Color3 } from '@polyzone/core/math';
import { PointLightComponentData } from '@polyzone/runtime/cartridge/data';
import { EditorObject } from '../EditorObject';
import { IEditorObjectComponent } from './IEditorObjectComponent';

// @TODO Gizmo node + directional light node under top-level `sceneNode`
export class EditorPointLightComponent implements IEditorObjectComponent {
  public readonly id: string;
  public readonly editorObject: EditorObject;
  public readonly sceneNode: SceneNode;

  private readonly pointLightNode: PointLightNode;

  public constructor(id: string, object: EditorObject, sceneNode: SceneNode, pointLightNode: PointLightNode) {
    this.id = id;
    this.editorObject = object;
    this.sceneNode = sceneNode;
    this.pointLightNode = pointLightNode;
  }

  public onDestroy(): void {
    this.pointLightNode.destroy();
  }

  public static async instantiateFromData(data: PointLightComponentData, object: EditorObject, atIndex: number | undefined): Promise<EditorPointLightComponent> {
    return object.registerComponentInstance((componentParentSceneNode) => {
      const sceneNode = new ObjectNode(object.scene.lopolyScene, `PointLight:${data.id}`, componentParentSceneNode);
      const pointLightNode = new PointLightNode(object.scene.lopolyScene, `${sceneNode.name}:Light`, {
        color: data.color.clone(),
        intensity: data.intensity,
      }, componentParentSceneNode);
      const pointLightComponent = new EditorPointLightComponent(data.id, object, sceneNode, pointLightNode);
      return Promise.resolve(pointLightComponent);
    }, atIndex);
  }

  public get color(): Color3 { return this.pointLightNode.color; }
  public set color(value: Color3) { this.pointLightNode.color = value; }
  public get intensity(): number { return this.pointLightNode.intensity; }
  public set intensity(value: number) { this.pointLightNode.intensity = value; }
}
