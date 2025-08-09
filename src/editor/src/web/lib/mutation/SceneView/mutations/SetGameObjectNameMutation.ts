import { resolvePathForSceneObjectMutation } from "@lib/mutation/util";
import { ISceneMutation } from "../ISceneMutation";
import { SceneViewMutationArguments } from "../SceneViewMutationArguments";
import { IContinuousSceneMutation } from "../IContinuousSceneMutation";

export interface SetGameObjectNameMutationUpdateArgs {
  name: string;
}

export class SetGameObjectNameMutation implements ISceneMutation, IContinuousSceneMutation<SetGameObjectNameMutationUpdateArgs> {
  // State
  private readonly gameObjectId: string;
  private _hasBeenApplied: boolean = false;

  // Undo state
  // @TODO These should probably be the same lol
  private oldDataName: string | undefined = undefined;
  private oldSceneName: string | undefined = undefined;


  public constructor(gameObjectId: string) {
    this.gameObjectId = gameObjectId;
  }

  public begin({ SceneViewController }: SceneViewMutationArguments): void {
    const gameObjectData = SceneViewController.scene.getGameObject(this.gameObjectId);
    const gameObject = SceneViewController.findGameObjectById(this.gameObjectId);
    if (gameObject === undefined) throw new Error(`Cannot begin mutation - no game object exists in the scene with id '${this.gameObjectId}'`);

    // - Store undo values
    this.oldDataName = gameObjectData.name;
    this.oldSceneName = gameObject.name;
  }

  public update({ SceneViewController }: SceneViewMutationArguments, { name }: SetGameObjectNameMutationUpdateArgs): void {
    const gameObjectData = SceneViewController.scene.getGameObject(this.gameObjectId);
    const gameObject = SceneViewController.findGameObjectById(this.gameObjectId);
    if (gameObject === undefined) throw new Error(`Cannot update mutation - no game object exists in the scene with id '${this.gameObjectId}'`);

    // - 1. Data
    gameObjectData.name = name;
    // - 2. Babylon state
    gameObject.name = name;
  }

  public apply({ SceneViewController }: SceneViewMutationArguments): void {
    const gameObjectData = SceneViewController.scene.getGameObject(this.gameObjectId);

    // - 3. JSONC
    const mutationPath = resolvePathForSceneObjectMutation(this.gameObjectId, SceneViewController.sceneDefinition, (gameObject) => gameObject.name);
    SceneViewController.sceneJson.mutate(mutationPath, gameObjectData.name);
  }

  public undo(_args: SceneViewMutationArguments): void {
    // @TODO
    // - Apply undo values
    throw new Error("Method not implemented.");
  }

  public get description(): string {
    return `Rename object`;
  }

  public get hasBeenApplied(): boolean { return this._hasBeenApplied; }
  public set hasBeenApplied(value: boolean) { this._hasBeenApplied = value; }
}
