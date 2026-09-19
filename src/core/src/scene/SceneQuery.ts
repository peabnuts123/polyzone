import { GameObject } from "@polyzone/core/objects/GameObject";
import { GameObjectComponent } from "@polyzone/core/objects/GameObjectComponent";
import { ClassReference } from "@polyzone/core/util/types";

export interface IQueryResult<TResult> {
  get result(): TResult;
}
export type QueryFn<TQuery, TResult> = (query: TQuery) => IQueryResult<TResult>;


export abstract class SceneQuery {
  public abstract path(pathString: string): GameObjectQuery;
}

export abstract class GameObjectQuery implements IQueryResult<GameObject> {
  public abstract path(pathString: string): GameObjectQuery;
  public abstract component<TGameObjectComponent extends GameObjectComponent>(componentCtor: ClassReference<TGameObjectComponent>): GameObjectComponentQuery<TGameObjectComponent>;
  public abstract get result(): GameObject;
}

export abstract class GameObjectComponentQuery<TGameObjectComponent extends GameObjectComponent> implements IQueryResult<TGameObjectComponent> {
  public abstract get result(): TGameObjectComponent;
}

