import { AssetDb } from "../data/AssetDb";
import type { IProjectController } from "../ProjectController";
import { ProjectAssetEvent } from "../watcher/assets";
import { ProjectFileEvent } from "../watcher/project";
import { ProjectSceneEvent } from "../watcher/scenes";

import { ProjectScanners } from './scanners/project';
import { SceneScanners } from './scanners/scene';


// Config
const DebounceTimeMilliseconds = 1000;

export type ReportProblemFn = (problemKey: string, path: string[], description: string) => void;

export interface ScannerContext {
  projectController: IProjectController;
  assetDb: AssetDb;
}

// @TODO Problem scanner backlog
// - Shouldn't the scanner hierarchy really be project -> (scene manifests/assets) -> scenes -> objects -> components
// - Duplicate files in asset list will cause problems in zip archive
// - Duplicate scenes in scene list
// - Types referenced in package.json don't match editor version
// - Types referenced are correct, but there is a newer version
// - Things with the same guid: scene objects, assets, etc.
// - Errors in script files
// - Asset dependency is missing e.g. missing texture files
// - Reference to asset that is not monitored by PolyZone
// - Something about Material assets?

export class ProblemScanner {
  private readonly projectController: IProjectController;
  private cancelDebounce: (() => void) | undefined = undefined;
  private stopListeningToFileSystemEvents: () => void;

  public constructor(projectController: IProjectController) {
    this.projectController = projectController;

    // Subscribe to file events
    const stopListeningToAssetEvents = this.projectController.filesWatcher.onAssetChanged((event) => this.onFileChanged(event));
    const stopListeningToSceneEvents = this.projectController.filesWatcher.onSceneChanged((event) => this.onFileChanged(event));
    const stopListeningToProjectFileEvents = this.projectController.filesWatcher.onProjectFileChanged((event) => this.onFileChanged(event));
    this.stopListeningToFileSystemEvents = () => {
      stopListeningToAssetEvents();
      stopListeningToSceneEvents();
      stopListeningToProjectFileEvents();
    };
  }

  private onFileChanged(event: ProjectAssetEvent | ProjectSceneEvent | ProjectFileEvent): void {
    console.log(`[DEBUG] [ProblemScanner] (onFileChanged) Got event:`, event);

    // Cancel debounce timer if there is one ongoing
    if (this.cancelDebounce !== undefined) {
      console.log(`[DEBUG] [ProblemScanner] (onFileChanged) Debounc'd!`);
      this.cancelDebounce();
    }

    // Trigger scan after X time of no events
    const cancelDebounceKey = window.setTimeout(() => {
      this.cancelDebounce = undefined;
      this.scanForProblems();
    }, DebounceTimeMilliseconds);

    // Store new cancel function
    this.cancelDebounce = () => {
      clearTimeout(cancelDebounceKey);
    };
  }

  private scanForProblems(): void {
    // @TODO where do these go?
    const reportProblem: ReportProblemFn = (problemKey, path, description) => {
      this.debug_printProblem(problemKey, path, description);
    };
    const scannerContext: ScannerContext = {
      projectController: this.projectController,
      assetDb: this.projectController.project.assets,
    };

    console.log(`[ProblemScanner] (scanForProblems) Scanning project for problems...`);

    // Scan project
    const project = this.projectController.projectDefinition;
    for (const projectScanner of ProjectScanners) {
      projectScanner.scan(project, reportProblem, scannerContext);
    }

    // Scan scenes
    for (const scene of this.projectController.project.scenes.getAll()) {
      console.log(`[ProblemScanner] (scanForProblems) Scanning scene '${scene.manifest.path}' for problems...`);
      const sceneDefinition = scene.jsonc.value;
      for (const sceneScanner of SceneScanners) {
        sceneScanner.scan(sceneDefinition, scene.manifest.path, reportProblem, scannerContext);
      }
    }
  }

  private debug_printProblem(problemKey: string, path: string[], description: string): void {
    console.log(`[ProblemScanner] (debug_printProblem) Found problem: (key='${problemKey}') "${path.join(' > ')}: ${description}"`);
  }

  public onDestroy(): void {
    this.stopListeningToFileSystemEvents();
    if (this.cancelDebounce !== undefined) {
      this.cancelDebounce();
    }
  }
}
