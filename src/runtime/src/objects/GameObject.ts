import { IScene, ObjectNode, SceneNode } from '@lopoly/engine/scene';
import { Matrix4 } from '@lopoly/engine/math';
import { GameObject as GameObjectCore } from '@polyzone/core/objects/GameObject';
import { Vector3, Rotation } from '@polyzone/core/math';
import { Scene } from '@polyzone/runtime/scene';
import { GameObjectComponent } from './components';
import { ClassReference } from '@polyzone/core/util/types';

export class GameObject extends GameObjectCore {
  public readonly id: string;
  public readonly scene: Scene;
  private readonly _components: GameObjectComponent[];
  private sceneNode: ComponentsObjectNode;

  public constructor(id: string, name: string, scene: Scene, parent?: GameObject) {
    super();
    this.id = id;
    this.scene = scene;
    this._components = [];
    this.sceneNode = new ComponentsObjectNode(scene.lopolyScene, name, this, parent?.sceneNode);
  }

  // @NOTE Intended to be always be called once when creating a new game object.
  // When instantiating a scene, all objects are first created before init() is called.
  public override init(): void {
    this.components.forEach((component) => component.init());
    this.sceneNode.forEachChildObject((child) => child.init());
  }

  public override onUpdate(deltaTime: number, time: number): void {
    this.components.forEach((component) => component.onUpdate(deltaTime, time));
    this.sceneNode.forEachChildObject((child) => child.onUpdate(deltaTime, time));
  }

  public override destroy(): void {
    // Notify scene - it will call `onDestroy()`
    this.scene.destroyGameObject(this);
  }

  public onDestroy(): void {
    this.components.forEach((component) => component.onDestroy());
    this.sceneNode.destroy();
    // @TODO should this be enabled? It previously wasn't here. But surely we need it?
    // this.sceneNode.forEachChildGameObject((child) => child.destroy());
  }

  public async registerComponentInstance<TGameObjectComponent extends GameObjectComponent>(fn: (componentParentSceneNode: SceneNode) => TGameObjectComponent | Promise<TGameObjectComponent>, atIndex?: number): Promise<TGameObjectComponent> {
    const componentInstance = await fn(this.sceneNode.componentNodesParent);
    if (this.components.includes(componentInstance)) {
      throw new Error(`Cannot add component to ${GameObject.name}: component already belongs to this ${GameObject.name}`);
    }
    if (!this.sceneNode.componentNodesParent.findChild((child) => child === componentInstance.sceneNode)) {
      throw new Error(`Component did not register the ${GameObject.name}'s scene node as its parent`);
    }

    if (atIndex !== undefined) {
      this._components.splice(atIndex, 0, componentInstance);
    } else {
      this._components.push(componentInstance);
    }

    return componentInstance;
  }

  public override removeComponent(componentId: string): void {
    const componentIndex = this.components.findIndex((component) => component.id === componentId);

    if (componentIndex === undefined) {
      throw new Error(`Cannot remove component from ${GameObject.name}. No component exists on ${GameObject.name} with Id: '${componentId}'`);
    }

    const componentInstance = this._components.splice(componentIndex, 0)[0];

    componentInstance.onDestroy();
    componentInstance.sceneNode.destroy();
  }

  /**
   * Get a component on this {@link GameObject}. If the component cannot be found, an Error is thrown.
   * @param componentId Id of the component to get.
   */
  public getComponent(componentId: string): GameObjectComponent;
  /**
   * Get a component on this {@link GameObject}. If the component cannot be found or is not of the expected type,
   * an Error is thrown.
   * @param componentId Id of the component to get.
   * @param ExpectedComponentType Expected type of the component.
   */
  public getComponent<TComponent extends GameObjectComponent>(componentId: string, ExpectedComponentType: ClassReference<TComponent>): TComponent;
  /**
   * Get a component on this {@link GameObject}. If the component cannot be found or is not of the expected type,
   * an Error is thrown.
   * @param componentId Id of the component to get.
   * @param ExpectedComponentType Array of possible expected types of the component.
   */
  public getComponent<TComponent extends GameObjectComponent>(componentId: string, ExpectedComponentTypes: ClassReference<TComponent>[]): TComponent;
  public getComponent<TComponent extends GameObjectComponent>(componentId: string, maybeExpectedTypeOrTypes?: ClassReference<TComponent> | ClassReference<TComponent>[]): TComponent {
    const component = this.components.find((component) => component.id === componentId);
    if (component === undefined) {
      throw new Error(`No component with ID '${componentId}' exists on ${GameObject.name} '${this.name}' (${this.id})`);
    }

    if (maybeExpectedTypeOrTypes === undefined) {
      // Pretty sure in this scenario `TComponent` will just be `GameObjectComponent`
      return component as TComponent;
    }

    let expectedComponentTypes: ClassReference<TComponent>[] = [];
    if (Array.isArray(maybeExpectedTypeOrTypes)) {
      expectedComponentTypes = maybeExpectedTypeOrTypes;
    } else {
      expectedComponentTypes.push(maybeExpectedTypeOrTypes);
    }

    const instanceOfAnyComponentType = expectedComponentTypes.some((ComponentType) => component instanceof ComponentType);
    if (!instanceOfAnyComponentType) {
      const expectedComponentTypeNames = expectedComponentTypes.map((x) => x.name).join('|');
      throw new Error(`Component with ID '${componentId}' on ${GameObject.name} '${this.name}' (${this.id}) is not of expected type. (Expected='${expectedComponentTypeNames}') (Actual='${component.constructor.name}')`);
    }

    // Sadly we have to launder as the `instanceof` check is inside a `some()` aggregation
    return component as TComponent;
  }

  public override forEachChild(fn: (child: GameObject) => void, recursive: boolean = false): void {
    this.sceneNode.forEachChildObject(fn, recursive);
  }

  public override findChild(fn: (child: GameObject) => boolean, recursive: boolean = false): GameObject | undefined {
    return this.sceneNode.findChildObject(fn, recursive);
  }

  public override get parent(): GameObject | undefined { return this.sceneNode.parent?.object; }
  public override set parent(value: GameObject | undefined) { this.sceneNode.parent = value?.sceneNode; }
  public override set name(value: string) { this.sceneNode.name = value; }
  public override get name(): string { return this.sceneNode.name; }
  public /* @TODO override */ get worldMatrix(): Matrix4 { return this.sceneNode.worldMatrix; }
  public override get position(): Vector3 { return this.sceneNode.position; }
  public override set position(value: Vector3) { this.sceneNode.position = value; }
  public override get rotation(): Rotation { return this.sceneNode.rotation; }
  public override get scale(): Vector3 { return this.sceneNode.scale; }
  public override set scale(value: Vector3) { this.sceneNode.scale = value; }
  public override get absolutePosition(): Vector3 { return this.sceneNode.absolutePosition; }
  public override set absolutePosition(value: Vector3) { this.sceneNode.absolutePosition = value; }
  public override get absoluteRotation(): Rotation { return this.sceneNode.absoluteRotation; }
  public override get absoluteScale(): Vector3 { return this.sceneNode.absoluteScale; }
  public override set absoluteScale(value: Vector3) { this.sceneNode.absoluteScale = value; }

  public override get components(): readonly GameObjectComponent[] { return this._components; }
}


/**
 * A {@link SceneNode} that implements PolyZone's object-type hierarchy:
 * Objects that have children as well as components.
 */
export class ComponentsObjectNode<TObject = GameObject> extends SceneNode {
  public readonly object: TObject;

  public readonly componentNodesParent: ObjectNode;

  public constructor(scene: IScene, name: string, object: TObject, parent?: ComponentsObjectNode<TObject>) {
    super(scene, name, parent);
    this.object = object;
    this.componentNodesParent = new ObjectNode(scene, `__components`, this);
  }

  /*
    @NOTE We need to leave base class methods `forEachChild` and `findChild` untouched
    as they are called by LoPoly as part of the engine. We instead offer these two
    strongly-typed overloads, which should be more useful anyway.
    Just note that base methods will return native LoPoly types (e.g. `SceneNode`) and won't
    skip component children.
  */

  public forEachChildObject(fn: (child: TObject) => void, recursive: boolean = false): void {
    super.forEachChild((child) => {
      if (child !== this.componentNodesParent) {
        const childObjectNode = child as ComponentsObjectNode<TObject>;
        fn(childObjectNode.object);
        if (recursive) {
          childObjectNode.forEachChildObject(fn, recursive);
        }
      }
    }, { includeDisabled: false });
  }

  public findChildObject(fn: (child: TObject) => boolean, recursive: boolean = false): TObject | undefined {
    let result: TObject | undefined;
    super.forEachChild((child) => {
      // Stop iterating if we've found a result already (we have no way of `break`ing this loop)
      if (result !== undefined) return;

      if (child !== this.componentNodesParent) {
        const childObjectNode = child as ComponentsObjectNode<TObject>;
        if (fn(childObjectNode.object)) {
          // Direct child is result
          result = childObjectNode.object;
          return;
        }

        if (recursive) {
          const childResult = childObjectNode.findChildObject(fn, recursive);
          if (childResult) {
            // Nested descendent is result
            result = childResult;
            return;
          }
        }
      }
    }, { includeDisabled: false });

    return result;
  }

  public override get parent(): ComponentsObjectNode<TObject> | undefined {
    return super.parent as ComponentsObjectNode<TObject>;
  }
  public override set parent(value: ComponentsObjectNode<TObject> | undefined) {
    super.parent = value;
  }
}
