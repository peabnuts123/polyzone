import { makeAutoObservable } from "mobx";

import { GameObjectData, IComposerComponentData } from "@lib/project/data";

export interface ComponentDependency {
  /** Data for the component which has a dependency on some assets */
  componentData: IComposerComponentData;
  /** Data for the game object that holds this component */
  gameObjectData: GameObjectData;
  /** IDs of the assets on which the component is dependent */
  assetIds: string[];
}

export class ComponentDependencyManager {
  /**
   * A map of component IDs and data about the assets on which the components depend.
   *
   * Key = ID of the component.
   * Value = Data about the component's dependencies.
   */
  private readonly componentDependencies: Map<string, ComponentDependency>;
  /**
   * A map of asset IDs and data about the components that depend on them.
   *
   * Key = ID of the asset.
   * Value = Data about the component's that depend on this asset.
   */
  private readonly assetDependents: Map<string, ComponentDependency[]>;

  public constructor() {
    this.componentDependencies = new Map();
    this.assetDependents = new Map();

    makeAutoObservable(this);
  }

  /**
   * @param componentData Data for the component whose dependencies are being registered.
   * @param gameObjectData Data for the game object on which this component lives
   * @param assetIds IDs of the assets on which this component has a dependency
   */
  public registerDependency(componentData: IComposerComponentData, gameObjectData: GameObjectData, assetIds: string[]): void {
    let componentDependencyData = this.componentDependencies.get(componentData.id);
    if (componentDependencyData === undefined) {
      componentDependencyData = {
        componentData,
        gameObjectData,
        assetIds: [],
      };
    }

    // Push new / unique asset dependencies into component dependency data
    for (const assetId of assetIds) {
      if (!componentDependencyData.assetIds.includes(assetId)) {
        componentDependencyData.assetIds.push(assetId);
      }

      const assetDependentData = this.assetDependents.get(assetId) || [];

      // Push new / unique component dependents into asset dependent data
      if (!assetDependentData.some((dependentData) => dependentData.componentData.id === componentData.id)) {
        assetDependentData.push(componentDependencyData);
      }
      this.assetDependents.set(assetId, assetDependentData);
    }

    this.componentDependencies.set(componentData.id, componentDependencyData);
  }

  public unregisterDependency(componentId: string): void {
    const assetDependency = this.componentDependencies.get(componentId);
    if (assetDependency === undefined) {
      console.warn(`[ComponentDependencyManager] (unregisterDependency) Attempted to unregister component with no dependencies: (component='${componentId}')`);
      return;
    }

    // Remove this component's dependency data
    this.componentDependencies.delete(componentId);

    // Remove this references to this component from all assets on which it depended
    for (const assetId of assetDependency.assetIds) {
      let assetDependentData = this.assetDependents.get(assetId);
      if (
        // No dependent data registered for this asset
        assetDependentData === undefined ||
        // OR no dependency registered for this component
        !assetDependentData.some((dependentData) => dependentData.componentData.id === componentId)
      ) {
        console.warn(`[ComponentDependencyManager] (unregisterDependency) Unregistering dependency that was previously not registered: (componentId='${componentId}') => (assetId='${assetId}')`);
      } else {
        // Remove component dependency on this asset
        assetDependentData = assetDependentData.filter((dependentData) => dependentData.componentData.id !== componentId);
        this.assetDependents.set(assetId, assetDependentData);
      }
    }
  }

  public getAllDependentsForAssetIds(assetIds: string[]): ComponentDependency[] {
    // return this.assetDependents.get(assetId) || [];
    const allDependents: ComponentDependency[] = [];
    for (const assetId of assetIds) {
      // Look up dependent data for asset ID
      const assetDependentData = this.assetDependents.get(assetId);
      if (assetDependentData !== undefined) {
        // For any dependent of this asset
        for (const dependent of assetDependentData) {
          // ... check whether we already have collected this dependent component in `allDependents`
          if (!allDependents.some((d) => d.componentData.id === dependent.componentData.id)) {
            // ... if not, collect it
            allDependents.push(dependent);
          }
        }
      }
    }

    return allDependents;
  }

  public clear(): void {
    this.componentDependencies.clear();
    this.assetDependents.clear();
  }
}
