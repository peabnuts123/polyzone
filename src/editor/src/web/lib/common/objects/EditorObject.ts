import { SceneNode } from '@lopoly/engine/scene';
import { Matrix4 } from '@lopoly/engine/math';

import { Vector3, Rotation } from '@polyzone/core/math';
import { ClassReference } from '@polyzone/core/util/types';
import { ComponentsObjectNode } from '@polyzone/runtime/objects';

import { EditorScene } from '@lib/common/scene/EditorScene';
import { IEditorObjectComponent } from './components';


export class EditorObject {
  public readonly id: string;
  public readonly scene: EditorScene;
  private readonly _components: IEditorObjectComponent[];
  private sceneNode: ComponentsObjectNode<EditorObject>;

  public constructor(id: string, name: string, scene: EditorScene, parent?: EditorObject) {
    this.id = id;
    this.scene = scene;
    this._components = [];
    this.sceneNode = new ComponentsObjectNode(scene.lopolyScene, name, this, parent?.sceneNode);
  }

  public destroy(): void {
    // Notify scene - it will call `onDestroy()`
    this.scene.destroyEditorObject(this);
  }

  public onDestroy(): void {
    this.components.forEach((component) => component.onDestroy());
    this.sceneNode.destroy();
    // @TODO should this be enabled? It previously wasn't here. But surely we need it?
    // this.sceneNode.forEachChildObject((child) => child.destroy());
  }

  public async registerComponentInstance<TComponent extends IEditorObjectComponent>(fn: (componentParentSceneNode: SceneNode) => TComponent | Promise<TComponent>, atIndex?: number): Promise<TComponent> {
    const componentInstance = await fn(this.sceneNode.componentNodesParent);
    if (this.components.includes(componentInstance)) {
      throw new Error(`Cannot add component to ${EditorObject.name}: component already belongs to this ${EditorObject.name}`);
    }
    if (!this.sceneNode.componentNodesParent.findChild((child) => child === componentInstance.sceneNode)) {
      throw new Error(`Component did not register the ${EditorObject.name}'s scene node as its parent`);
    }

    if (atIndex !== undefined) {
      this._components.splice(atIndex, 0, componentInstance);
    } else {
      this._components.push(componentInstance);
    }

    return componentInstance;
  }

  public removeComponent(componentId: string): void {
    const componentIndex = this.components.findIndex((component) => component.id === componentId);

    if (componentIndex === undefined) {
      throw new Error(`Cannot remove component from ${EditorObject.name}. No component exists on ${EditorObject.name} with Id: '${componentId}'`);
    }

    const componentInstance = this._components.splice(componentIndex, 0)[0];

    componentInstance.onDestroy();
    componentInstance.sceneNode.destroy();
  }

  /**
   * Get a component on this {@link EditorObject}. If the component cannot be found, an Error is thrown.
   * @param componentId Id of the component to get.
   */
  public getComponent(componentId: string): IEditorObjectComponent;
  /**
   * Get a component on this {@link EditorObject}. If the component cannot be found or is not of the expected type,
   * an Error is thrown.
   * @param componentId Id of the component to get.
   * @param ExpectedComponentType Expected type of the component.
   */
  public getComponent<TComponent extends IEditorObjectComponent>(componentId: string, ExpectedComponentType: ClassReference<TComponent>): TComponent;
  /**
   * Get a component on this {@link EditorObject}. If the component cannot be found or is not of the expected type,
   * an Error is thrown.
   * @param componentId Id of the component to get.
   * @param ExpectedComponentType Array of possible expected types of the component.
   */
  public getComponent<TComponent extends IEditorObjectComponent>(componentId: string, ExpectedComponentTypes: ClassReference<TComponent>[]): TComponent;
  public getComponent<TComponent extends IEditorObjectComponent>(componentId: string, maybeExpectedTypeOrTypes?: ClassReference<TComponent> | ClassReference<TComponent>[]): TComponent {
    const component = this.components.find((component) => component.id === componentId);
    if (component === undefined) {
      throw new Error(`No component with ID '${componentId}' exists on ${EditorObject.name} '${this.name}' (${this.id})`);
    }

    if (maybeExpectedTypeOrTypes === undefined) {
      // Pretty sure in this scenario `TComponent` will just be `IEditorObjectComponent`
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
      throw new Error(`Component with ID '${componentId}' on ${EditorObject.name} '${this.name}' (${this.id}) is not of expected type. (Expected='${expectedComponentTypeNames}') (Actual='${component.constructor.name}')`);
    }

    // Sadly we have to launder as the `instanceof` check is inside a `some()` aggregation
    return component as TComponent;
  }

  public forEachChild(fn: (child: EditorObject) => void, recursive: boolean = false): void {
    this.sceneNode.forEachChildObject(fn, recursive);
  }

  public findChild(fn: (child: EditorObject) => boolean, recursive: boolean = false): EditorObject | undefined {
    return this.sceneNode.findChildObject(fn, recursive);
  }

  public get parent(): EditorObject | undefined { return this.sceneNode.parent?.object; }
  public set parent(value: EditorObject | undefined) { this.sceneNode.parent = value?.sceneNode; }
  public set name(value: string) { this.sceneNode.name = value; }
  public get name(): string { return this.sceneNode.name; }
  public get worldMatrix(): Matrix4 { return this.sceneNode.worldMatrix; }
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

  public get components(): readonly IEditorObjectComponent[] { return this._components; }
}
