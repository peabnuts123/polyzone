import { Scene } from "../scene/Scene";
import { GameObject } from "./GameObject";

/**
 * A component that lives on a GameObject.
 * Components are used to build up behaviours for GameObjects (which
 * by themselves do nothing).
 * Extend from this class to create a custom Component.
 */
export abstract class GameObjectComponent {

  // @TODO really, you can't internalise `id` in the base constructor? Everyone gotta implement they own `id` property?
  /**
   * Called once, after the game object is added to the world.
   * When a scene is loaded, all objects are loaded before this is called.
   */
  public init(): void { }

  /**
   * Called once per frame
   * @param deltaTime Time (in seconds) since the previous frame
   * @param time Continuously increasing time value (in seconds)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public onUpdate(deltaTime: number, time: number): void { }
  /**
   * Called right before the GameObject this component is attached to
   * is destroyed.
   */
  public onDestroy(): void { } // @TODO is it needed?

  /** Unique identifier for this GameObjectComponent */
  public abstract get id(): string;
  public abstract get scene(): Scene;
  public abstract get gameObject(): GameObject;
}
