import { ClassReference, Color3 } from "@polyzone/core/src/util";
import { GameObjectComponent } from "@polyzone/core/src/world";
import { DirectionalLightComponent, PointLightComponent } from "@polyzone/runtime/src/world";
import { ColorDefinition, DirectionalLightComponentDefinition, PointLightComponentDefinition } from "@polyzone/runtime/src/cartridge";

import { DirectionalLightComponentData, GameObjectData, IComposerComponentData, PointLightComponentData } from "@lib/project/data";
import { resolvePathForSceneObjectMutation } from "@lib/mutation/util";
import { SceneViewMutationArguments } from "../SceneViewMutationArguments";
import { BaseContinuousSceneMutation } from "../IContinuousSceneMutation";

export interface SetGameObjectLightComponentColorMutationUpdateArgs {
  color: Color3;
}

type AnyLightComponentDefinition = DirectionalLightComponentDefinition | PointLightComponentDefinition;
interface AnyLightComponentData extends IComposerComponentData {
  color: Color3;
}
const LightComponentDataTypes: ClassReference<AnyLightComponentData>[] = [DirectionalLightComponentData, PointLightComponentData];
interface AnyLightComponent extends GameObjectComponent {
  color: Color3;
}
const LightComponentTypes: ClassReference<AnyLightComponent>[] = [DirectionalLightComponent, PointLightComponent];

export class SetGameObjectLightComponentColorMutation extends BaseContinuousSceneMutation<SetGameObjectLightComponentColorMutationUpdateArgs> {
  private readonly gameObjectId: string;
  private readonly componentId: string;


  public constructor(gameObject: GameObjectData, component: AnyLightComponentData) {
    super();
    this.gameObjectId = gameObject.id;
    this.componentId = component.id;
  }

  public override update({ SceneViewController }: SceneViewMutationArguments, { color }: SetGameObjectLightComponentColorMutationUpdateArgs): Promise<void> {
    const gameObjectData = SceneViewController.scene.getGameObject(this.gameObjectId);
    const componentData = gameObjectData.getComponent(this.componentId, LightComponentDataTypes);
    const gameObject = SceneViewController.findGameObjectById(this.gameObjectId);
    if (gameObject === undefined) throw new Error(`Cannot apply mutation - no game object exists in the scene with id '${this.gameObjectId}'`);
    const component = gameObject.getComponent(this.componentId, LightComponentTypes);

    // - 1. Data
    componentData.color = color;
    // - 2. Babylon state
    component.color = color;

    return Promise.resolve();
  }

  public override apply({ SceneViewController }: SceneViewMutationArguments): Promise<void> {
    const gameObjectData = SceneViewController.scene.getGameObject(this.gameObjectId);
    const componentData = gameObjectData.getComponent(this.componentId, LightComponentDataTypes);

    const componentIndex = gameObjectData.components.findIndex((component) => component.id === this.componentId);

    // - 3. JSONC
    const updatedValue: ColorDefinition = { r: componentData.color.r, g: componentData.color.g, b: componentData.color.b };
    const mutationPath = resolvePathForSceneObjectMutation(
      this.gameObjectId,
      SceneViewController.sceneDefinition,
      (gameObject) => (gameObject.components[componentIndex] as AnyLightComponentDefinition).color,
    );
    SceneViewController.sceneJson.mutate(mutationPath, updatedValue);

    return Promise.resolve();
  }

  protected override getUndoArgs({ SceneViewController }: SceneViewMutationArguments): SetGameObjectLightComponentColorMutationUpdateArgs {
    const gameObjectData = SceneViewController.scene.getGameObject(this.gameObjectId);
    const componentData = gameObjectData.getComponent(this.componentId, LightComponentDataTypes);

    return {
      color: componentData.color,
    };
  }

  public override get description(): string {
    return `Change light color`;
  }
}
