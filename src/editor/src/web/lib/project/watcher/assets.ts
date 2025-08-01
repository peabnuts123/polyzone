import { runInAction } from "mobx";
import { UnwatchFn } from "@tauri-apps/plugin-fs";
import { listen } from "@tauri-apps/api/event";

import { AssetType } from "@polyzone/runtime/src/cartridge";

import { TauriEvents } from "@lib/util/TauriEvents";
import { resolvePath } from "@lib/util/JsoncContainer";
import { AssetDefinition, ProjectDefinition } from "../definition";
import type { IProjectController } from "../ProjectController";
import { AssetData } from "../data/AssetData";
import { createAssetData } from "../data/AssetDb";


// EVENTS - INCOMING
// @NOTE These must match `AssetFsEvent` enum in: src/editor/src/app/src/filesystem/assets.rs
/** Event from the backend specifying an asset has been created. */
export interface RawAssetCreatedEvent {
  create: {
    assetId: string;
    path: string;
    hash: string;
    type: AssetType;
  },
}
/** Event from the backend specifying an asset has been deleted. */
export interface RawAssetDeletedEvent {
  delete: {
    assetId: string;
  },
}
/** Event from the backend specifying an asset has been modified. */
export interface RawAssetModifiedEvent {
  modify: {
    assetId: string;
    newHash: string;
  },
}
/** Event from the backend specifying an asset has been renamed. */
export interface RawAssetRenamedEvent {
  rename: {
    assetId: string;
    newPath: string;
  },
}
/** Any event from the backend for a project asset. */
export type RawAssetEvent = RawAssetCreatedEvent | RawAssetDeletedEvent | RawAssetModifiedEvent | RawAssetRenamedEvent;


// EVENTS - OUTGOING
/** Type of project asset event, for use by frontend eventing / notifying system (i.e. not from the backend). */
export enum ProjectAssetEventType {
  Create = "create",
  Delete = "delete",
  Modify = "modify",
  Rename = "rename",
}
/** Frontend event that an asset has been created. */
export interface ProjectAssetCreatedEvent {
  type: ProjectAssetEventType.Create;
  asset: AssetData;
}
/** Frontend event that an asset has been deleted. */
export interface ProjectAssetDeletedEvent {
  type: ProjectAssetEventType.Delete;
  asset: AssetData;
  /** Direct and transitive dependents of the asset related to this event */
  assetDependents: string[];
  /** Direct and transitive dependencies of the asset related to this event */
  assetDependencies: string[];
}
/** Frontend event that an asset has been modified. */
export interface ProjectAssetModifiedEvent {
  type: ProjectAssetEventType.Modify;
  asset: AssetData;
  oldHash: string;
  /** Direct and transitive dependents of the asset related to this event */
  assetDependents: string[];
  /** Direct and transitive dependencies of the asset related to this event */
  assetDependencies: string[];
}
/** Frontend event that an asset has been renamed. */
export interface ProjectAssetRenamedEvent {
  type: ProjectAssetEventType.Rename;
  asset: AssetData;
  oldPath: string;
}
/** Any frontend event that a project asset has been updated. */
export type ProjectAssetEvent = ProjectAssetCreatedEvent | ProjectAssetDeletedEvent | ProjectAssetModifiedEvent | ProjectAssetRenamedEvent;

/** Callback function for project asset events. */
export type ProjectAssetEventListener = (event: ProjectAssetEvent) => void;

export class ProjectAssetsWatcher {
  private readonly projectController: IProjectController;
  private stopListeningForEvents: UnwatchFn | undefined = undefined;

  private readonly eventListeners: ProjectAssetEventListener[] = [];

  public constructor(projectController: IProjectController) {
    this.projectController = projectController;
  }

  public async startListening(): Promise<void> {
    this.stopListeningForEvents = await listen<RawAssetEvent[]>(TauriEvents.OnProjectAssetsUpdated, (e) => {
      this.onProjectAssetsUpdated(e.payload);
    });
  }

  public onAssetChanged(callback: ProjectAssetEventListener) {
    this.eventListeners.push(callback);

    // Unlisten function
    return () => {
      const listenerIndex = this.eventListeners.indexOf(callback);
      if (listenerIndex !== -1) {
        this.eventListeners.splice(listenerIndex, 1);
      }
    };
  }

  public onDestroy(): void {
    if (this.stopListeningForEvents) {
      this.stopListeningForEvents();
    }
  }

  private onProjectAssetsUpdated(updates: RawAssetEvent[]): void {
    console.log(`[ProjectAssetsWatcher] (onProjectAssetsUpdated)`, updates);

    const events: ProjectAssetEvent[] = [];
    runInAction(() => {
      for (const update of updates) {
        if ('create' in update) {
          events.push(this.applyCreate(update));
        } else if ('delete' in update) {
          events.push(this.applyDelete(update));
        } else if ('modify' in update) {
          events.push(this.applyModify(update));
        } else if ('rename' in update) {
          events.push(this.applyRename(update));
        }
      }
    });

    // Notify all listeners of asset events
    for (const event of events) {
      for (const listener of this.eventListeners) {
        listener(event);
      }
    }

    // Ensure any mutations to the project file are written to disk
    void this.projectController.mutator.persistChanges();
  }

  private applyCreate({ create: event }: RawAssetCreatedEvent): ProjectAssetCreatedEvent {
    const { assetId, path, hash, type } = event;
    const assetDb = this.projectController.project.assets;

    // 1. Update data
    console.log(`[ProjectAssetsWatcher] (applyCreate) New asset: ${path} (${assetId})`);
    const newAssetDefinition: AssetDefinition = {
      id: assetId,
      path,
      hash,
      type,
    };
    const newAsset = createAssetData(
      newAssetDefinition,
      assetDb.fileSystem,
    );
    assetDb.add(newAsset);

    // 2. Update JSON
    const newObjectIndex = this.projectController.projectDefinition.assets.length;
    const jsonPath = resolvePath((project: ProjectDefinition) => project.assets[newObjectIndex]);
    this.projectController.projectJson.mutate(jsonPath, newAssetDefinition, { isArrayInsertion: true });

    return {
      type: ProjectAssetEventType.Create,
      asset: newAsset,
    };
  }

  private applyDelete({ delete: event }: RawAssetDeletedEvent): ProjectAssetDeletedEvent {
    const { assetId } = event;
    const assetDb = this.projectController.project.assets;

    // 1. Update data
    const asset = assetDb.findById(assetId);
    if (asset === undefined) throw new Error(`Cannot apply 'Delete' event: No asset found in AssetDb with id: ${assetId}`);
    console.log(`[ProjectAssetsWatcher] (applyDelete) Asset deleted: ${asset.path}`);
    assetDb.remove(assetId);

    // 2. Update JSON
    const jsonIndex = this.projectController.projectDefinition.assets.findIndex((asset) => asset.id === assetId);
    if (jsonIndex === -1) throw new Error(`Cannot apply 'Delete' event: No asset found in ProjectDefinition with id: ${assetId}`);
    const jsonPath = resolvePath((project: ProjectDefinition) => project.assets[jsonIndex]);
    this.projectController.projectJson.delete(jsonPath);

    // Look up dependencies
    const assetDependencies = this.projectController.assetCache.getAssetDependencies(assetId);
    const assetDependents = this.projectController.assetCache.getAssetDependents(assetId);

    // Invalidate asset (and dependents) in asset cache
    this.projectController.assetCache.delete(assetId);

    return {
      type: ProjectAssetEventType.Delete,
      asset,
      assetDependencies,
      assetDependents,
    };
  }

  private applyModify({ modify: event }: RawAssetModifiedEvent): ProjectAssetModifiedEvent {
    const { assetId, newHash } = event;
    const assetDb = this.projectController.project.assets;

    // 1. Update data
    const asset = assetDb.findById(assetId);
    if (asset === undefined) throw new Error(`Cannot apply 'Modify' event: No asset found in AssetDb with id: ${assetId}`);
    console.log(`[ProjectAssetsWatcher] (applyModify) Asset modified: ${asset.path}`);
    const oldHash = asset.hash;
    asset.hash = newHash;

    // 2. Update JSON
    const jsonIndex = this.projectController.projectDefinition.assets.findIndex((asset) => asset.id === assetId);
    if (jsonIndex === -1) throw new Error(`Cannot apply 'Modify' event: No asset found in ProjectDefinition with id: ${assetId}`);
    const jsonPath = resolvePath((project: ProjectDefinition) => project.assets[jsonIndex].hash);
    this.projectController.projectJson.mutate(jsonPath, newHash);

    // Look up dependencies
    const assetDependencies = this.projectController.assetCache.getAssetDependencies(assetId);
    const assetDependents = this.projectController.assetCache.getAssetDependents(assetId);

    // Invalidate asset (and dependents) in asset cache
    this.projectController.assetCache.delete(assetId);

    return {
      type: ProjectAssetEventType.Modify,
      asset,
      oldHash,
      assetDependencies,
      assetDependents,
    };
  }

  private applyRename({ rename: event }: RawAssetRenamedEvent): ProjectAssetRenamedEvent {
    const { assetId, newPath } = event;
    const assetDb = this.projectController.project.assets;

    // 1. Update data
    const asset = assetDb.findById(assetId);
    if (asset === undefined) throw new Error(`Cannot apply 'Rename' event: No asset found in AssetDb with id: ${assetId}`);
    console.log(`[ProjectAssetsWatcher] (applyRename) Asset renamed: ${asset.path} -> ${newPath}`);
    const oldPath = asset.path;
    asset.path = newPath;

    // 2. Update JSON
    const jsonIndex = this.projectController.projectDefinition.assets.findIndex((asset) => asset.id === assetId);
    if (jsonIndex === -1) throw new Error(`Cannot apply 'Rename' event: No asset found in ProjectDefinition with id: ${assetId}`);
    const jsonPath = resolvePath((project: ProjectDefinition) => project.assets[jsonIndex].path);
    this.projectController.projectJson.mutate(jsonPath, newPath);

    return {
      type: ProjectAssetEventType.Rename,
      asset,
      oldPath,
    };
  }
}
