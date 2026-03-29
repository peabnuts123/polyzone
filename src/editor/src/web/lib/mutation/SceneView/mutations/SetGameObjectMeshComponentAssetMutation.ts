import type { MeshComponentDefinition } from "@polyzone/runtime/src/cartridge";

import { GameObjectData, MeshComponentData } from "@lib/project/data";
import { resolvePathForSceneObjectMutation } from "@lib/mutation/util";
import type { MeshAssetData } from "@lib/project/data/assets";
import { BaseSceneMutation } from "../ISceneMutation";
import { SceneViewMutationArguments } from "../SceneViewMutationArguments";

interface MutationArgs {
  meshAsset: MeshAssetData | undefined;
}

export class SetGameObjectMeshComponentAssetMutation extends BaseSceneMutation<MutationArgs> {
  private readonly gameObjectId: string;
  private readonly componentId: string;

  public constructor(gameObject: GameObjectData, component: MeshComponentData, meshAsset: MeshAssetData | undefined) {
    super({ meshAsset });
    this.gameObjectId = gameObject.id;
    this.componentId = component.id;
  }

  public override async apply({ SceneViewController }: SceneViewMutationArguments, { meshAsset }: MutationArgs): Promise<void> {
    // 1. Update data
    const gameObjectData = SceneViewController.scene.getGameObject(this.gameObjectId);
    const componentData = gameObjectData.getComponent(this.componentId, MeshComponentData);
    // - Replace asset reference
    componentData.meshAsset = meshAsset;

    // 2. Update babylon scene
    await SceneViewController.reinitializeComponentInstance(componentData, gameObjectData);

    // 3. Modify JSONC
    // - Replace ID of asset in component definition
    const updatedValue = meshAsset?.id ?? null;
    const componentIndex = gameObjectData.components.indexOf(componentData);
    const mutationPath = resolvePathForSceneObjectMutation(
      this.gameObjectId,
      SceneViewController.sceneDefinition,
      (gameObject) => (gameObject.components[componentIndex] as MeshComponentDefinition).meshFileId,
    );
    SceneViewController.sceneJson.mutate(mutationPath, updatedValue);
  }

  protected override getUndoArgs({ SceneViewController }: SceneViewMutationArguments): MutationArgs {
    const gameObjectData = SceneViewController.scene.getGameObject(this.gameObjectId);
    const componentData = gameObjectData.getComponent(this.componentId, MeshComponentData);

    return {
      meshAsset: componentData.meshAsset,
    };
  }

  public override get description(): string {
    if (this.args.meshAsset !== undefined) {
      return `Change mesh asset`;
    } else {
      return `Remove mesh asset`;
    }
  }
}
