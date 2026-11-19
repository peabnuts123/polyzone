// @TODO `Rotation` should be throwing a lint / ts error because it is only used as a type
import { type Vector3, Rotation } from "@polyzone/core/math";
import { Scene } from "../scene/Scene";
import { GameObjectComponent } from "./GameObjectComponent";

export type GameObjectId = string;

/**
 * An object that lives within the game world.
 * Components are used to build up behaviours, whereas a GameObject by itself does nothing.
 */
export abstract class GameObject {
  // @TODO createComponent(componentDefinition: IComponentDefinition) // Some kind of definition
  // /**
  //  * Add a component to this GameObject
  //  */
  // public abstract addComponent(component: GameObjectComponent): void;
  /**
   * Remove a component from this GameObject.
   * @param componentId The ID of the component to remove.
   */
  public abstract removeComponent(componentId: string): void;

  /**
   * Called once, after the game object is added to the world.
   * When a scene is loaded, all objects are loaded before this is called.
   */
  public abstract init(): void;

  /**
   * Called once per frame.
   * @param deltaTime Time (in seconds) since the last frame.
   * @param time Continuously increasing time value (in seconds)
   */
  public abstract onUpdate(deltaTime: number, time: number): void;

  // @TODO surely we don't want `destroy` AND `onDestroy`
  /**
   * Destroy this GameObject, removing it (and all of its components)
   * from the World.
   */
  public abstract destroy(): void;

  /**
   * Iterate through the children of this {@link GameObject}.
   * @param fn Iterator function.
   * @param recursive True = Iterate children-of-children, etc. False = Iterate direct children only. Default value: False.
   */
  public abstract forEachChild(fn: (child: GameObject) => void, recursive?: boolean): void;

  /**
   * Find a specific {@link GameObject} within this {@link GameObject}'s children using a tester function.
   * The first {@link GameObject} that the function returns `true` for will be returned.
   *
   * @param fn Tester function.
   * @param recursive True = Iterate children-of-children, etc. False = Iterate direct children only. Default value: False.
   */
  public abstract findChild(fn: (child: GameObject) => boolean, recursive?: boolean): GameObject | undefined;


  /**
   * Called when this GameObject is destroyed.
   */
  // public abstract onDestroy(): void;
  /**
   * Get direct children of this GameObject.
   */
  // public abstract getChildren(): GameObject[];
  /**
   * Get components currently attached to this GameObject.
   */
  // public abstract getComponents(): GameObjectComponent[];

  /** Unique identifier for this GameObject */
  public abstract get id(): GameObjectId;
  /** Human-friendly name for this object */
  public abstract set name(value: string);
  public abstract get name(): string;

  public abstract get parent(): GameObject | undefined;
  public abstract set parent(value: GameObject | undefined);
  public abstract get position(): Vector3;
  public abstract set position(value: Vector3);
  public abstract get rotation(): Rotation;
  public abstract get scale(): Vector3;
  public abstract set scale(value: Vector3);
  public abstract get absolutePosition(): Vector3;
  public abstract set absolutePosition(value: Vector3);
  public abstract get absoluteRotation(): Rotation;
  public abstract get absoluteScale(): Vector3;
  public abstract set absoluteScale(value: Vector3);
  // public abstract get worldMatrix(): Matrix4; // @TODO Matrix4 type


  public abstract get scene(): Scene;
  public abstract get components(): readonly GameObjectComponent[];

}
