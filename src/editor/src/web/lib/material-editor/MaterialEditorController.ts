import { makeAutoObservable, runInAction } from 'mobx';
import { v4 as uuid } from 'uuid';

import { ProjectController } from '@lib/project/ProjectController';
import { MeshAssetData } from '@lib/project/data/assets';
import { ModelMaterialEditorController } from './model/ModelMaterialEditorController';

export interface TabData {
  id: string;
  modelEditorController?: ModelMaterialEditorController;
}

export class MaterialEditorController {
  private _currentlyOpenTabs: TabData[] = [];

  private readonly projectController: ProjectController;

  public constructor(projectController: ProjectController) {
    this.projectController = projectController;

    // Open 1 blank tab
    this.openNewTab();

    makeAutoObservable(this);
  }


  public async loadModelForTab(tabId: string, model: MeshAssetData): Promise<void> {
    for (const tab of this.currentlyOpenTabs) {
      if (tab.id === tabId) {
        // Unload possible previously-loaded model
        if (tab.modelEditorController !== undefined) {
          tab.modelEditorController?.destroy();
        }

        const controller = new ModelMaterialEditorController(
          model,
          this.projectController,
        );

        runInAction(() => {
          tab.modelEditorController = controller;
        });
        return;
      }
    }

    throw new Error(`Could not load model for tab - no tab exists with ID '${tabId}'`);
  }

  public openNewTab(): TabData {
    const newTabData: TabData = {
      id: uuid(),
      modelEditorController: undefined,
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

    // Unload model
    this.currentlyOpenTabs[tabIndex].modelEditorController?.destroy();

    runInAction(() => {
      this.currentlyOpenTabs.splice(tabIndex, 1);
    });
  }

  /** Called when the app is unloaded (e.g. page refresh) */
  public onDestroy(): void {
    // Destroy all model editor controllers
    for (const tab of this.currentlyOpenTabs) {
      tab.modelEditorController?.destroy();
    }
  }

  public get currentlyOpenTabs(): TabData[] {
    return this._currentlyOpenTabs;
  }
}
