import { ClassReference } from "@polyzone/core/src/util";
import { GameObjectComponent } from "@polyzone/core/src/world";
import { DirectionalLightComponent, PointLightComponent } from "@polyzone/runtime/src/world";
import { DirectionalLightComponentDefinition, PointLightComponentDefinition } from "@polyzone/runtime/src/cartridge";

import { DirectionalLightComponentData, GameObjectData, IComposerComponentData, PointLightComponentData } from "@lib/project/data";
import { resolvePathForSceneObjectMutation } from "@lib/mutation/util";
import { SceneViewMutationArguments } from "../SceneViewMutationArguments";
import { BaseContinuousSceneMutation } from "../IContinuousSceneMutation";

export interface SetGameObjectLightComponentIntensityMutationUpdateArgs {
  intensity: number;
}

type AnyLightComponentDefinition = DirectionalLightComponentDefinition | PointLightComponentDefinition;
interface AnyLightComponentData extends IComposerComponentData {
  intensity: number;
}
const LightComponentDataTypes: ClassReference<AnyLightComponentData>[] = [DirectionalLightComponentData, PointLightComponentData];
interface AnyLightComponent extends GameObjectComponent {
  intensity: number;
}
const LightComponentTypes: ClassReference<AnyLightComponent>[] = [DirectionalLightComponent, PointLightComponent];

export class SetGameObjectLightComponentIntensityMutation extends BaseContinuousSceneMutation<SetGameObjectLightComponentIntensityMutationUpdateArgs> {
  // Mutation parameters
  private readonly gameObjectId: string;
  private readonly componentId: string;

  public constructor(gameObject: GameObjectData, component: AnyLightComponentData) {
    super();
    this.gameObjectId = gameObject.id;
    this.componentId = component.id;
  }

  public override update({ SceneViewController }: SceneViewMutationArguments, { intensity }: SetGameObjectLightComponentIntensityMutationUpdateArgs): Promise<void> {
    const gameObjectData = SceneViewController.scene.getGameObject(this.gameObjectId);
    const componentData = gameObjectData.getComponent(this.componentId, LightComponentDataTypes);
    const gameObject = SceneViewController.findGameObjectById(this.gameObjectId);
    if (gameObject === undefined) throw new Error(`Cannot apply mutation - no game object exists in the scene with id '${this.gameObjectId}'`);
    const component = gameObject.getComponent(this.componentId, LightComponentTypes);

    // - 1. Data
    componentData.intensity = intensity;
    // - 2. Babylon state
    component.intensity = intensity;

    return Promise.resolve();
  }

  public override apply({ SceneViewController }: SceneViewMutationArguments): Promise<void> {
    const gameObjectData = SceneViewController.scene.getGameObject(this.gameObjectId);
    const componentData = gameObjectData.getComponent(this.componentId, LightComponentDataTypes);
    const componentIndex = gameObjectData.components.findIndex((component) => component.id === this.componentId);

    // - 3. JSONC
    const mutationPath = resolvePathForSceneObjectMutation(
      this.gameObjectId,
      SceneViewController.sceneDefinition,
      (gameObject) => (gameObject.components[componentIndex] as AnyLightComponentDefinition).intensity,
    );
    SceneViewController.sceneJson.mutate(mutationPath, componentData.intensity);

    return Promise.resolve();
  }

  protected override getUndoArgs({ SceneViewController }: SceneViewMutationArguments): SetGameObjectLightComponentIntensityMutationUpdateArgs {
    const gameObjectData = SceneViewController.scene.getGameObject(this.gameObjectId);
    const componentData = gameObjectData.getComponent(this.componentId, LightComponentDataTypes);

    return {
      intensity: componentData.intensity,
    };
  }

  public override get description(): string {
    return `Change light intensity`;
  }
}
