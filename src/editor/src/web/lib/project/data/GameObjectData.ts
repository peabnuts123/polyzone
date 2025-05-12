import { makeAutoObservable } from "mobx";

import { ClassReference } from "@polyzone/core/src/util";

import type { IComposerComponentData } from "./components";
import type { TransformData } from "./TransformData";
import { IGameObjectData, GameObjectData as GameObjectDataRuntime } from "@polyzone/runtime/src/cartridge";

export class GameObjectData implements IGameObjectData {
  private _gameObjectData: GameObjectDataRuntime;

  public constructor(id: string, name: string, transform: TransformData, components: IComposerComponentData[], children: GameObjectData[]) {
    this._gameObjectData = new GameObjectDataRuntime(id,name, transform, components, children);

    makeAutoObservable(this);
    makeAutoObservable(this._gameObjectData);
  }

  /**
   * Get a component on this GameObjectData. If the component cannot be found, an Error is thrown.
   * @param componentId Id of the component to get.
   */
  public getComponent(componentId: string): IComposerComponentData;
  /**
   * Get a component on this GameObjectData. If the component cannot be found or is not of the expected type,
   * an Error is thrown.
   * @param componentId Id of the component to get.
   * @param ExpectedComponentType Expected type of the component.
   */
  public getComponent<TComponent extends IComposerComponentData>(componentId: string, ExpectedComponentType: ClassReference<TComponent>): TComponent;
  /**
   * Get a component on this GameObjectData. If the component cannot be found or is not of the expected type,
   * an Error is thrown.
   * @param componentId Id of the component to get.
   * @param ExpectedComponentType Array of possible expected types of the component.
   */
  public getComponent<TComponent extends IComposerComponentData>(componentId: string, ExpectedComponentTypes: ClassReference<TComponent>[]): TComponent;
  public getComponent<TComponent extends IComposerComponentData>(componentId: string, expectedTypeOrTypes: ClassReference<TComponent> | ClassReference<TComponent>[] | undefined = undefined): TComponent {
    const component = this.components.find((component) => component.id === componentId);

    if (component === undefined) {
      throw new Error(`No component with ID '${componentId}' exists on GameObjectData '${this.name}' (${this.id})`);
    }

    if (expectedTypeOrTypes === undefined) {
      return component as TComponent;
    }

    let expectedComponentTypes: ClassReference<TComponent>[] = [];
    if (Array.isArray(expectedTypeOrTypes)) {
      expectedComponentTypes = expectedTypeOrTypes;
    } else {
      expectedComponentTypes.push(expectedTypeOrTypes);
    }

    const instanceOfAnyComponentType = expectedComponentTypes.some((ComponentType) => component instanceof ComponentType);
    if (!instanceOfAnyComponentType) {
      const expectedComponentTypeNames = expectedComponentTypes.map((x) => x.name).join('|');
      throw new Error(`Component with ID '${componentId}' on GameObjectData '${this.name}' (${this.id}) is not of expected type. (Expected='${expectedComponentTypeNames}') (Actual='${component.constructor.name}')`);
    }

    // Sadly we have to launder as the `instanceof` check is inside a `some()` aggregation
    return component as TComponent;
  }

  /**
   * Find a GameObject in this GameObject's children.
   * @param gameObjectId ID of the GameObject to find.
   */
  public findGameObjectInChildren(gameObjectId: string): GameObjectData | undefined {
    // Iterate children objects
    for (const childObject of this.children) {
      if (childObject.id === gameObjectId) {
        // Found object as direct child
        return childObject;
      } else {
        // Look for object as descendent of child
        const childResult = childObject.findGameObjectInChildren(gameObjectId);
        if (childResult !== undefined) {
          return childResult;
        }
      }
    }

    return undefined;
  }

  /**
   * Find the parent of a GameObject in this GameObject's children.
   * @param gameObjectId The ID of the GameObject whose parent is to be found.
   * @returns The parent GameObjectData if found, otherwise undefined.
   */
  public findGameObjectParentInChildren(gameObjectId: string): GameObjectData | undefined {
    // Iterate children objects
    for (const childObject of this.children) {
      if (childObject.id === gameObjectId) {
        // Found object as direct child - this object is the parent
        return this;
      } else {
        // Look for object as descendent of child
        const childResult = childObject.findGameObjectParentInChildren(gameObjectId);
        if (childResult !== undefined) {
          return childResult;
        }
      }
    }

    return undefined;
  }

  public get id(): string { return this._gameObjectData.id; }
  public get name(): string { return this._gameObjectData.name; }
  public set name(name: string) { this._gameObjectData.name = name; }
  public get transform(): TransformData { return this._gameObjectData.transform as TransformData; }
  public set transform(transform: TransformData) { this._gameObjectData.transform = transform; }
  public get components(): IComposerComponentData[] { return this._gameObjectData.components as IComposerComponentData[]; }
  public set components(components: IComposerComponentData[]) { this._gameObjectData.components = components; }
  public get children(): GameObjectData[] { return this._gameObjectData.children as GameObjectData[]; }
  public set children(children: GameObjectData[]) { this._gameObjectData.children = children; }
}
