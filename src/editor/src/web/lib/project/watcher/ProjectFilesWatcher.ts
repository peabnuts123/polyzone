import { invoke } from "@lib/util/TauriCommands";
import { ProjectController } from "../ProjectController";
import { ProjectAssetEventListener, ProjectAssetsWatcher } from "./assets";
import { ProjectSceneEventListener, ProjectScenesWatcher } from "./scenes";
import { ProjectFileEventListener, ProjectFileWatcher } from "./project";

export class ProjectFilesWatcher {
  private readonly projectController: ProjectController;
  private readonly assetsWatcher: ProjectAssetsWatcher;
  private readonly scenesWatcher: ProjectScenesWatcher;
  private readonly projectFileWatcher: ProjectFileWatcher;

  public constructor(projectController: ProjectController) {
    this.projectController = projectController;
    this.assetsWatcher = new ProjectAssetsWatcher(projectController);
    this.scenesWatcher = new ProjectScenesWatcher(projectController);
    this.projectFileWatcher = new ProjectFileWatcher(projectController);
  }

  public async watch(): Promise<void> {
    // Start watching project for file changes on disk
    await invoke('start_watching_project_files');

    await Promise.all([
      this.assetsWatcher.startListening(),
      this.scenesWatcher.startListening(),
      this.projectFileWatcher.startListening(),
    ]);
  }

  public onAssetChanged(callback: ProjectAssetEventListener): () => void {
    return this.assetsWatcher.onAssetChanged(callback);
  }

  public onSceneChanged(callback: ProjectSceneEventListener): () => void {
    return this.scenesWatcher.onSceneChanged(callback);
  }

  public onProjectFileChanged(callback: ProjectFileEventListener): () => void {
    return this.projectFileWatcher.onProjectFileChanged(callback);
  }

  public onDestroy(): void {
    this.assetsWatcher.onDestroy();
    this.scenesWatcher.onDestroy();
    this.projectFileWatcher.onDestroy();
  }
}
