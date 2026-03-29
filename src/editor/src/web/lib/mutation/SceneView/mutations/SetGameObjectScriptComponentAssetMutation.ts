import type { ScriptComponentDefinition } from "@polyzone/runtime/src/cartridge";

import { GameObjectData, ScriptComponentData } from "@lib/project/data";
import { resolvePathForSceneObjectMutation } from "@lib/mutation/util";
import type { ScriptAssetData } from "@lib/project/data/assets";
import { BaseSceneMutation } from "../ISceneMutation";
import { SceneViewMutationArguments } from "../SceneViewMutationArguments";

interface MutationArgs {
  scriptAsset: ScriptAssetData | undefined;
}

export class SetGameObjectScriptComponentAssetMutation extends BaseSceneMutation<MutationArgs> {
  // Mutation parameters
  private readonly gameObjectId: string;
  private readonly componentId: string;

  public constructor(gameObject: GameObjectData, component: ScriptComponentData, scriptAsset: ScriptAssetData | undefined) {
    super({ scriptAsset });
    this.gameObjectId = gameObject.id;
    this.componentId = component.id;
  }

  public override apply({ SceneViewController }: SceneViewMutationArguments, { scriptAsset }: MutationArgs): Promise<void> {
    // 1. Update data
    const gameObjectData = SceneViewController.scene.getGameObject(this.gameObjectId);
    const componentData = gameObjectData.getComponent(this.componentId, ScriptComponentData);
    // - Replace asset reference
    componentData.scriptAsset = scriptAsset;
    const componentIndex = gameObjectData.components.indexOf(componentData);

    // 2. Update babylon scene
    // @NOTE No need to do anything - script components are not loaded in the composer

    // 3. Modify JSONC
    // - Replace ID of asset in component definition
    const updatedValue = scriptAsset?.id ?? null;
    const mutationPath = resolvePathForSceneObjectMutation(
      this.gameObjectId,
      SceneViewController.sceneDefinition,
      (gameObject) => (gameObject.components[componentIndex] as ScriptComponentDefinition).scriptFileId,
    );
    SceneViewController.sceneJson.mutate(mutationPath, updatedValue);

    return Promise.resolve();
  }

  protected override getUndoArgs({ SceneViewController }: SceneViewMutationArguments): MutationArgs {
    const gameObjectData = SceneViewController.scene.getGameObject(this.gameObjectId);
    const componentData = gameObjectData.getComponent(this.componentId, ScriptComponentData);

    return {
      scriptAsset: componentData.scriptAsset,
    };
  }

  public override get description(): string {
    if (this.args.scriptAsset !== undefined) {
      return `Change script asset`;
    } else {
      return `Remove script asset`;
    }
  }
}
