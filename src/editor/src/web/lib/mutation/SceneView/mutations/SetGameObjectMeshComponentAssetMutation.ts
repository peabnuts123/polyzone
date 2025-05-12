import type { MeshComponentDefinition } from "@polyzone/runtime/src/cartridge";

import { GameObjectData, MeshComponentData } from "@lib/project/data";
import { resolvePathForSceneObjectMutation } from "@lib/mutation/util";
import type { MeshAssetData } from "@lib/project/data/assets";
import { ISceneMutation } from "../ISceneMutation";
import { SceneViewMutationArguments } from "../SceneViewMutationArguments";

export class SetGameObjectMeshComponentAssetMutation implements ISceneMutation {
  // Mutation parameters
  private readonly gameObjectId: string;
  private readonly componentId: string;
  private readonly meshAsset: MeshAssetData | undefined;

  public constructor(gameObject: GameObjectData, component: MeshComponentData, meshAsset: MeshAssetData | undefined) {
    this.gameObjectId = gameObject.id;
    this.componentId = component.id;
    this.meshAsset = meshAsset;
  }

  apply({ SceneViewController }: SceneViewMutationArguments): void {
    // 1. Update data
    const gameObjectData = SceneViewController.scene.getGameObject(this.gameObjectId);
    const componentData = gameObjectData.getComponent(this.componentId, MeshComponentData);
    // - Replace asset reference
    componentData.meshAsset = this.meshAsset;

    // 2. Update babylon scene
    /* @NOTE async */ void SceneViewController.reinitializeComponentInstance(componentData, gameObjectData);

    // 3. Modify JSONC
    // - Replace ID of asset in component definition
    const updatedValue = this.meshAsset?.id ?? null;
    const componentIndex = gameObjectData.components.indexOf(componentData);
    const mutationPath = resolvePathForSceneObjectMutation(
      this.gameObjectId,
      SceneViewController.sceneDefinition,
      (gameObject) => (gameObject.components[componentIndex] as MeshComponentDefinition).meshFileId,
    );
    SceneViewController.sceneJson.mutate(mutationPath, updatedValue);
  }
  undo(_args: SceneViewMutationArguments): void {
    throw new Error("Method not implemented.");
  }

  get description(): string {
    if (this.meshAsset !== undefined) {
      return `Change mesh asset`;
    } else {
      return `Remove mesh asset`;
    }
  }
}
