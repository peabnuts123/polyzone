import { IScene, ObjectNode, SceneNode } from '@lopoly/engine/scene';
import { GameObject as GameObjectCore } from '@polyzone/core/objects/GameObject';
import { Vector3 } from '@polyzone/core/math';
import { Rotation } from '@polyzone/core/transform';
import { Scene } from '@polyzone/runtime/scene';
import { GameObjectComponent } from './components';

export class GameObject extends GameObjectCore {
  public readonly id: string;
  public readonly scene: Scene;
  private readonly _components: GameObjectComponent[];
  private sceneNode: GameObjectNode;

  public constructor(id: string, name: string, scene: Scene, parent?: GameObject) {
    super();
    this.id = id;
    this.scene = scene;
    this._components = [];
    this.sceneNode = new GameObjectNode(scene.lopolyScene, name, this, parent?.sceneNode);
  }

  // @NOTE Intended to be always be called once when creating a new game object.
  // When instantiating a scene, all objects are first created before init() is called.
  public override init(): void {
    this.components.forEach((component) => component.init());
    this.sceneNode.forEachChildGameObject((child) => child.init());
  }

  public override onUpdate(deltaTime: number, time: number): void {
    this.components.forEach((component) => component.onUpdate(deltaTime, time));
    this.sceneNode.forEachChildGameObject((child) => child.onUpdate(deltaTime, time));
  }

  public override destroy(): void {
    // Notify scene - it will call `onDestroy()`
    this.scene.destroyGameObject(this);
  }

  public onDestroy(): void {
    this.components.forEach((component) => component.onDestroy());
    // @TODO should this be enabled? It previously wasn't here. But surely we need it?
    this.sceneNode.forEachChildGameObject((child) => child.destroy());
  }

  public async registerComponentInstance<TGameObjectComponent extends GameObjectComponent>(fn: (componentParentSceneNode: SceneNode) => TGameObjectComponent | Promise<TGameObjectComponent>): Promise<TGameObjectComponent> {
    const componentInstance = await fn(this.sceneNode.componentNodesParent);
    if (this.components.includes(componentInstance)) {
      throw new Error(`Cannot add component to ${GameObject.name}: component already belongs to this ${GameObject.name}`);
    }
    if (!this.sceneNode.componentNodesParent.findChild((child) => child === componentInstance.sceneNode)) {
      throw new Error(`Component did not register the ${GameObject.name}'s scene node as its parent`);
    }
    this._components.push(componentInstance);
    return componentInstance;
  }

  // public addComponentInstance(componentInstance: GameObjectComponent): void {
  //   if (this.components.includes(componentInstance)) {
  //     throw new Error(`Cannot add component to ${GameObject.name}: component already belongs to this ${GameObject.name}`);
  //   }

  //   this._components.push(componentInstance);
  //   componentInstance.sceneNode.parent = this.sceneNode.componentNodesParent;
  // }
  // public removeComponent(componentId: string): void {
  //   const componentInstance = this.componentInstances.find(({ component }) => component.id === componentId);

  //   if (componentInstance === undefined) {
  //     throw new Error(`Cannot remove component from GameObject. No component exists on GameObject with Id: '${componentId}'`);
  //   }

  //   if (componentInstance.node) {
  //     // @TODO Delete lol there is no destroy
  //     throw new Error(`Not implemented: There is no way to remove a component yet`);
  //     // this.componentNodesParent.removeChild(componentInstance.node);
  //   }
  //   componentInstance.component.onDestroy();
  // }

  // @TODO Put into core?
  // /**
  //  * Get a component on this GameObjectData. If the component cannot be found or is not of the expected type,
  //  * an Error is thrown.
  //  * @param componentId Id of the component to get.
  //  * @param ExpectedComponentType Expected type of the component.
  //  */
  // public getComponent<TComponent extends GameObjectComponent>(componentId: string, ExpectedComponentType: ClassReference<TComponent>): TComponent;
  // /**
  //  * Get a component on this GameObjectData. If the component cannot be found or is not of the expected type,
  //  * an Error is thrown.
  //  * @param componentId Id of the component to get.
  //  * @param ExpectedComponentType Array of possible expected types of the component.
  //  */
  // public getComponent<TComponent extends GameObjectComponent>(componentId: string, ExpectedComponentTypes: ClassReference<TComponent>[]): TComponent;
  // public getComponent<TComponent extends GameObjectComponent>(componentId: string, expectedTypeOrTypes: ClassReference<TComponent> | ClassReference<TComponent>[]): TComponent {
  //   // const component = this.componentNodesParent.findComponent((component) => component.id === componentId);
  //   const componentInstance = this.componentInstances.find(({ component }) => component.id === componentId);
  //   if (componentInstance === undefined) {
  //     throw new Error(`No component with ID '${componentId}' exists on GameObject '${this.name}' (${this.id})`);
  //   }

  //   const { component } = componentInstance;

  //   let expectedComponentTypes: ClassReference<TComponent>[] = [];
  //   if (Array.isArray(expectedTypeOrTypes)) {
  //     expectedComponentTypes = expectedTypeOrTypes;
  //   } else {
  //     expectedComponentTypes.push(expectedTypeOrTypes);
  //   }

  //   const instanceOfAnyComponentType = expectedComponentTypes.some((ComponentType) => component instanceof ComponentType);
  //   if (!instanceOfAnyComponentType) {
  //     const expectedComponentTypeNames = expectedComponentTypes.map((x) => x.name).join('|');
  //     throw new Error(`Component with ID '${componentId}' on GameObject '${this.name}' (${this.id}) is not of expected type. (Expected='${expectedComponentTypeNames}') (Actual='${component.constructor.name}')`);
  //   }

  //   // Sadly we have to launder as the `instanceof` check is inside a `some()` aggregation
  //   return component as TComponent;
  // }

  // @TODO lift into core?
  // /**
  //  * Find a GameObject in this GameObject's children.
  //  * @param gameObjectId ID of the GameObject to find.
  //  */
  // public findGameObjectInChildren(gameObjectId: string): GameObject | undefined {
  //   return this.selfNode.findChildGameObject((childGameObject) => childGameObject.id === gameObjectId, true);
  // }

  public forEachChild(fn: (child: GameObject) => void, recursive: boolean = false): void {
    this.sceneNode.forEachChildGameObject(fn, recursive);
  }

  public findChild(fn: (child: GameObject) => boolean, recursive: boolean = false): GameObject | undefined {
    return this.sceneNode.findChildGameObject(fn, recursive);
  }

  public override get parent(): GameObject | undefined { return this.sceneNode.parent?.gameObject; }
  public override set parent(value: GameObject | undefined) { this.sceneNode.parent = value?.sceneNode; }
  public override get name(): string { return this.sceneNode.name; }
  public get position(): Vector3 { return this.sceneNode.position; }
  public set position(value: Vector3) { this.sceneNode.position = value; }
  public get rotation(): Rotation { return this.sceneNode.rotation; }
  public get scale(): Vector3 { return this.sceneNode.scale; }
  public set scale(value: Vector3) { this.sceneNode.scale = value; }
  public get absolutePosition(): Vector3 { return this.sceneNode.absolutePosition; }
  public set absolutePosition(value: Vector3) { this.sceneNode.absolutePosition = value; }
  public get absoluteRotation(): Rotation { return this.sceneNode.absoluteRotation; }
  public get absoluteScale(): Vector3 { return this.sceneNode.absoluteScale; }
  public set absoluteScale(value: Vector3) { this.sceneNode.absoluteScale = value; }

  public get components(): readonly GameObjectComponent[] { return this._components; }
}

export class GameObjectNode extends SceneNode {
  public readonly gameObject: GameObject;
  public readonly componentNodesParent: ObjectNode;

  public constructor(scene: IScene, name: string, gameObject: GameObject, parent?: GameObjectNode) {
    super(scene, name, parent);
    this.gameObject = gameObject;
    this.componentNodesParent = new ObjectNode(scene, `__components`, this);
  }

  /*
    @NOTE We need to leave base class methods `forEachChild` and `findChild` untouched
    as they are called by LoPoly as part of the engine. We instead offer these two
    GameObject-specific overloads, which should be more useful anyway.
    Just note that base methods will return native LoPoly types (e.g. `SceneNode`).
  */

  public forEachChildGameObject(fn: (gameObject: GameObject) => void, recursive: boolean = false): void {
    super.forEachChild((child) => {
      if (child !== this.componentNodesParent) {
        const childGameObjectNode = child as GameObjectNode;
        fn(childGameObjectNode.gameObject);
        if (recursive) {
          childGameObjectNode.forEachChildGameObject(fn, recursive);
        }
      }
    }, false);
  }

  public findChildGameObject(fn: (gameObject: GameObject) => boolean, recursive: boolean = false): GameObject | undefined {
    let result: GameObject | undefined;
    super.forEachChild((child) => {
      // Stop iterating if we've found a result already (we have no way of `break`ing this loop)
      if (result !== undefined) return;

      if (child !== this.componentNodesParent) {
        const childGameObjectNode = child as GameObjectNode;
        if (fn(childGameObjectNode.gameObject)) {
          // Direct child is result
          result = childGameObjectNode.gameObject;
          return;
        }

        if (recursive) {
          const childResult = childGameObjectNode.findChildGameObject(fn, recursive);
          if (childResult) {
            // Nested descendent is result
            result = childResult;
            return;
          }
        }
      }
    }, false);

    return result;
  }

  public override get parent(): GameObjectNode | undefined {
    return super.parent as GameObjectNode;
  }
  public override set parent(value: GameObjectNode | undefined) {
    super.parent = value;
  }
}
