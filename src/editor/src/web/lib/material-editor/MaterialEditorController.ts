import { makeAutoObservable, runInAction } from 'mobx';
import { v4 as uuid } from 'uuid';

import type { IProjectController } from '@lib/project/ProjectController';
import { MaterialAssetData, MeshAssetData } from '@lib/project/data/assets';
import { ModelEditorViewController, type IModelEditorViewController } from './model/ModelEditorViewController';
import { MaterialEditorViewController, type IMaterialEditorViewController } from './material/MaterialEditorViewController';

export interface ModelTabData {
  id: string;
  type: 'model';
  modelEditorController: IModelEditorViewController;
}

export interface MaterialTabData {
  id: string;
  type: 'material';
  materialEditorController: IMaterialEditorViewController;
}

export interface IndeterminateTabData {
  id: string;
  type: undefined;
}

export type TabData = ModelTabData | MaterialTabData | IndeterminateTabData;

export interface IMaterialEditorController {
  loadModelForTab(tabId: string, model: MeshAssetData): Promise<void>;
  loadMaterialForTab(tabId: string, material: MaterialAssetData): Promise<void>;
  openNewTab(): TabData;
  closeTab(tabId: string): void;
  isTabEmpty(tabId: string): boolean;
  onDestroy(): void;
  get currentlyOpenTabs(): TabData[];
}

export class MaterialEditorController implements IMaterialEditorController {
  private _currentlyOpenTabs: TabData[] = [];

  private readonly projectController: IProjectController;

  public constructor(projectController: IProjectController) {
    this.projectController = projectController;

    // Open 1 blank tab
    this.openNewTab();

    makeAutoObservable(this);
  }


  public async loadModelForTab(tabId: string, model: MeshAssetData): Promise<void> {
    const tabIndex = this.currentlyOpenTabs.findIndex((tab) => tab.id === tabId);

    if (tabIndex === -1) {
      throw new Error(`Could not load model for tab - no tab exists with ID '${tabId}'`);
    }

    const tab = this.currentlyOpenTabs[tabIndex];

    // Unload possible previously-loaded model
    this.destroyTabController(tab);

    const controller = new ModelEditorViewController(
      model,
      this.projectController,
    );

    runInAction(() => {
      this.currentlyOpenTabs[tabIndex] = {
        id: tab.id,
        type: 'model',
        modelEditorController: controller,
      };
    });
  }

  public async loadMaterialForTab(tabId: string, material: MaterialAssetData): Promise<void> {
    const tabIndex = this.currentlyOpenTabs.findIndex((tab) => tab.id === tabId);

    if (tabIndex === -1) {
      throw new Error(`Could not load material for tab - no tab exists with ID '${tabId}'`);
    }

    const tab = this.currentlyOpenTabs[tabIndex];

    // Unload possible previously-loaded material
    this.destroyTabController(tab);

    const controller = new MaterialEditorViewController(
      material,
      this.projectController,
    );

    runInAction(() => {
      this.currentlyOpenTabs[tabIndex] = {
        id: tab.id,
        type: 'material',
        materialEditorController: controller,
      };
    });
  }

  public openNewTab(): TabData {
    const newTabData: TabData = {
      id: uuid(),
      type: undefined,
    };

    runInAction(() => {
      this.currentlyOpenTabs.push(newTabData);
    });

    return newTabData;
  }

  public closeTab(tabId: string): void {
    const tabIndex = this.currentlyOpenTabs.findIndex((tab) => tab.id === tabId);
    if (tabIndex === -1) {
      throw new Error(`Could not close tab - no tab exists with ID '${tabId}'`);
    }

    // Unload controller
    this.destroyTabController(this.currentlyOpenTabs[tabIndex]);

    runInAction(() => {
      this.currentlyOpenTabs.splice(tabIndex, 1);
    });
  }

  public isTabEmpty(tabId: string): boolean {
    const tabIndex = this.currentlyOpenTabs.findIndex((tab) => tab.id === tabId);
    if (tabIndex === -1) {
      throw new Error(`Could not check if tab is empty - no tab exists with ID '${tabId}'`);
    }
    return this.currentlyOpenTabs[tabIndex].type === undefined;
  }

  /** Called when the app is unloaded (e.g. page refresh) */
  public onDestroy(): void {
    // Destroy all controllers
    for (const tab of this.currentlyOpenTabs) {
      this.destroyTabController(tab);
    }
  }

  private destroyTabController(tab: TabData): void {
    if (tab.type === 'model') {
      tab.modelEditorController.destroy();
    } else if (tab.type === 'material') {
      tab.materialEditorController.destroy();
    }
  }

  public get currentlyOpenTabs(): TabData[] {
    return this._currentlyOpenTabs;
  }
}
