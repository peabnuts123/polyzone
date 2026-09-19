import { GameObject } from "../objects/GameObject";
import { GameObjectQuery, QueryFn, SceneQuery } from "./SceneQuery";

export abstract class Scene {
  public abstract readonly path: string;

  public abstract query<TResult>(queryFn: QueryFn<SceneQuery, TResult>): TResult;
  public abstract query<TResult>(relativeTo: GameObject, queryFn: QueryFn<GameObjectQuery, TResult>): TResult;
}
