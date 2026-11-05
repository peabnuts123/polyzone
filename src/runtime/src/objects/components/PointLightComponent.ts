import { PointLightNode, SceneNode } from '@lopoly/engine/scene';
import { PointLightComponent as PointLightComponentCore } from '@polyzone/core/objects/components/PointLightComponent';
import { Color3 } from '@polyzone/core/math';
import { PointLightComponentData } from '@polyzone/runtime/cartridge/data';
import { GameObject } from '@polyzone/runtime/objects/GameObject';
import { IGameObjectComponent } from './IGameObjectComponent';

export class PointLightComponent extends PointLightComponentCore implements IGameObjectComponent {
  public readonly id: string;
  public readonly gameObject: GameObject;
  private readonly pointLightNode: PointLightNode;

  public constructor(id: string, gameObject: GameObject, pointLightNode: PointLightNode) {
    super();
    this.id = id;
    this.gameObject = gameObject;
    this.pointLightNode = pointLightNode;
  }

  public init(): void { }
  public onUpdate(): void { }
  public onDestroy(): void {
    this.pointLightNode.color = Color3.fuchsia();
    this.pointLightNode.destroy();
  }

  public static async instantiateFromData(data: PointLightComponentData, gameObject: GameObject, atIndex: number | undefined): Promise<PointLightComponent> {
    return gameObject.registerComponentInstance((componentParentSceneNode) => {
      const pointLightNode = new PointLightNode(gameObject.scene.lopolyScene, `PointLight:${data.id}`, {
        color: data.color.clone(),
        intensity: data.intensity,
      }, componentParentSceneNode);
      const pointLightComponent = new PointLightComponent(data.id, gameObject, pointLightNode);
      return Promise.resolve(pointLightComponent);
    }, atIndex);
  }

  public override get color(): Color3 { return this.pointLightNode.color; }
  public override set color(value: Color3) { this.pointLightNode.color = value; }
  public override get intensity(): number { return this.pointLightNode.intensity; }
  public override set intensity(value: number) { this.pointLightNode.intensity = value; }

  public get sceneNode(): SceneNode { return this.pointLightNode; }
}
