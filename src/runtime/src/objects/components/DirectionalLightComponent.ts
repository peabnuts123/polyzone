import { SceneNode, DirectionalLightNode } from '@lopoly/engine/scene';
import { DirectionalLightComponent as DirectionalLightComponentCore } from '@polyzone/core/objects/components/DirectionalLightComponent';
import { Color3 } from '@polyzone/core/math';
import { DirectionalLightComponentData } from '@polyzone/runtime/cartridge';
import { Scene } from '@polyzone/runtime/scene';
import { GameObject } from '@polyzone/runtime/objects/GameObject';
import { IGameObjectComponent } from './IGameObjectComponent';

export class DirectionalLightComponent extends DirectionalLightComponentCore implements IGameObjectComponent {
  public readonly id: string;
  public readonly scene: Scene;
  public readonly gameObject: GameObject;
  private readonly directionalLightNode: DirectionalLightNode;

  public constructor(id: string, scene: Scene, gameObject: GameObject, directionalLightNode: DirectionalLightNode) {
    super();
    this.id = id;
    this.scene = scene;
    this.gameObject = gameObject;
    this.directionalLightNode = directionalLightNode;
  }

  public static async instantiateFromData(data: DirectionalLightComponentData, scene: Scene, gameObject: GameObject): Promise<DirectionalLightComponent> {
    return gameObject.registerComponentInstance((componentParentSceneNode) => {
      const directionalLightNode = new DirectionalLightNode(scene.lopolyScene, `DirectionalLight:${data.id}`, {
        color: data.color.clone(),
        intensity: data.intensity,
      }, componentParentSceneNode);
      const directionalLightComponent = new DirectionalLightComponent(data.id, scene, gameObject, directionalLightNode);
      return Promise.resolve(directionalLightComponent);
    });
  }

  public override get color(): Color3 { return this.directionalLightNode.color; }
  public override set color(value: Color3) { this.directionalLightNode.color = value; }
  public override get intensity(): number { return this.directionalLightNode.intensity; }
  public override set intensity(value: number) { this.directionalLightNode.intensity = value; }

  public get sceneNode(): SceneNode { return this.directionalLightNode; }
}
