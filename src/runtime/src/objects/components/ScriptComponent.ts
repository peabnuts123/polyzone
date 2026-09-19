import { ObjectNode } from '@lopoly/engine/scene';
import { ScriptComponent as ScriptComponentCore } from '@polyzone/core/objects/components';
import { IGameObjectComponent } from './IGameObjectComponent';
import { ScriptComponentData } from '@polyzone/runtime/cartridge';
import { CustomScript } from '@polyzone/core/objects/CustomScript';
import { ScriptLoader } from '@polyzone/runtime/ScriptLoader';
import { Scene } from '@polyzone/runtime/scene';
import { GameObject } from '@polyzone/runtime/objects/GameObject';
import { Input } from '@polyzone/runtime/input';


export class ScriptComponent extends ScriptComponentCore implements IGameObjectComponent {
  public readonly id: string;
  public readonly scene: Scene;
  public readonly gameObject: GameObject;
  public readonly sceneNode: ObjectNode;
  // @TODO Mutable
  public readonly script: CustomScript | undefined;

  public constructor(id: string, scene: Scene, gameObject: GameObject, sceneNode: ObjectNode, script: CustomScript | undefined) {
    super();
    this.id = id;
    this.scene = scene;
    this.gameObject = gameObject;
    this.sceneNode = sceneNode;
    this.script = script;
  }

  public override init(): void {
    this.script?.init();
  }

  public override onUpdate(deltaTime: number, time: number): void {
    this.script?.onUpdate(deltaTime, time);
  }

  public override onDestroy(): void {
    this.script?.onDestroy();
  }


  public static instantiateFromData(data: ScriptComponentData, scene: Scene, gameObject: GameObject, scriptLoader: ScriptLoader): Promise<ScriptComponent> {
    return gameObject.registerComponentInstance((componentParentSceneNode) => {
      let scriptInstance: CustomScript | undefined = undefined;
      if (data.scriptAsset) {
        const scriptModule = scriptLoader.getModule(data.scriptAsset);
        if (
          scriptModule === undefined ||
          scriptModule === null ||
          !(scriptModule instanceof Object) ||
          !('default' in scriptModule)
        ) {
          throw new Error(`Cannot load ${ScriptComponent.name}. Module is missing default export: ${data.scriptAsset.path}`);
        }

        // Ensure script is of correct type
        const CustomScriptInstance = scriptModule.default as new (...args: ConstructorParameters<typeof CustomScript>) => CustomScript;
        if (
          !(
            (CustomScriptInstance instanceof Object) &&
            Object.prototype.isPrototypeOf.call(CustomScript, CustomScriptInstance)
          )
        ) {
          throw new Error(`Cannot ${ScriptComponent.name}. Default export from script '${data.scriptAsset.path}' is not of type '${CustomScript.name}': ${CustomScriptInstance}`);
        }

        // @NOTE Instantiate a subclass of `CustomScriptComponent` with additional types to conform to `IGameObjectComponent`
        scriptInstance = new CustomScriptInstance({
          id: data.id,
          gameObject,
          scene,
          input: new Input(scene.lopolyScene.engine.inputSystem),
        });
      }
      const sceneNode = new ObjectNode(scene.lopolyScene, `Script:${data.id}`, componentParentSceneNode);
      const scriptComponent = new ScriptComponent(data.id, scene, gameObject, sceneNode, scriptInstance);
      return Promise.resolve(scriptComponent);
    });
  }
}
