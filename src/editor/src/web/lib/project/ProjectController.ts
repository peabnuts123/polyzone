import { makeAutoObservable, runInAction } from "mobx";
import * as path from "@tauri-apps/api/path";
import { exists } from "@tauri-apps/plugin-fs";

import Resolver from '@polyzone/runtime/src/Resolver';
import { AssetCache } from "@polyzone/runtime/src/world";

import { IWritableFileSystem } from "@lib/filesystem/IWritableFileSystem";
import { TauriFileSystem } from '@lib/filesystem/TauriFileSystem';
import { JsoncContainer } from "@lib/util/JsoncContainer";
import { ProjectMutator, ProjectMutatorNew } from "@lib/mutation/Project";
import { invoke } from "@lib/util/TauriCommands";
import { ApplicationDataController } from '../application/ApplicationDataController';
import { ProjectDefinition } from "./definition";
import { ProjectFilesWatcher } from "./watcher/ProjectFilesWatcher";
import { ProblemScanner } from "./problems/ProblemScanner";
import { ProjectData } from "./data/ProjectData";
import { MutationController } from "@lib/mutation/MutationController";

export interface IProjectController {
  loadProject(projectPath: string): Promise<void>;
  reloadProjectFileFromFs(): Promise<ProjectData>;
  onDestroy(): void;

  get isLoadingProject(): boolean;
  get hasLoadedProject(): boolean;
  get project(): ProjectData;
  get projectJson(): JsoncContainer<ProjectDefinition>;
  get projectDefinition(): ProjectDefinition;
  get mutator(): ProjectMutator;
  get mutatorNew(): ProjectMutatorNew;
  get fileSystem(): IWritableFileSystem;
  get filesWatcher(): ProjectFilesWatcher;
  get assetCache(): AssetCache;
}

export class ProjectController implements IProjectController {
  private _isLoadingProject: boolean = false;
  private _projectJson: JsoncContainer<ProjectDefinition> | undefined = undefined;
  private readonly _mutator: ProjectMutator;
  private readonly _mutatorNew: ProjectMutatorNew;
  private readonly applicationDataController: ApplicationDataController;
  private readonly mutationController: MutationController;
  private _project: ProjectData | undefined = undefined;
  private _fileSystem: IWritableFileSystem | undefined = undefined;
  private _filesWatcher: ProjectFilesWatcher | undefined = undefined;
  private problemScanner: ProblemScanner | undefined = undefined;
  private _assetCache: AssetCache | undefined;

  public constructor(applicationDataController: ApplicationDataController, mutationController: MutationController) {
    this._mutator = new ProjectMutator(this);
    this._mutatorNew = new ProjectMutatorNew(this, mutationController);
    this.applicationDataController = applicationDataController;
    this.mutationController = mutationController;
    this.mutationController.setMutatorActive(this._mutatorNew, true);

    makeAutoObservable(this);
  }

  public async loadProject(projectPath: string): Promise<void> {
    this._isLoadingProject = true;

    // Check file exists
    if (!await exists(projectPath)) {
      runInAction(() => {
        this._isLoadingProject = false;
      });
      throw new ProjectFileNotFoundError(projectPath);
    }

    // Create file system relative to project
    const projectFileName = await path.basename(projectPath);
    const projectDirRoot = await path.resolve(projectPath, '..');
    const fileSystem = new TauriFileSystem(projectDirRoot);
    runInAction(() => {
      this._fileSystem = fileSystem;
    });

    // Bind file system to babylon resolver
    Resolver.registerFileSystem(fileSystem);

    // Notify backend that project is loaded
    await invoke('load_project', { projectFilePath: projectPath });

    const projectFile = await fileSystem.readFile(projectFileName);
    const projectJson = new JsoncContainer<ProjectDefinition>(projectFile.textContent);
    // @TODO validate :/

    const project = await ProjectData.new({
      rootPath: projectDirRoot,
      fileName: projectFileName,
      definition: projectJson.value,
      fileSystem,
    });

    this._assetCache = new AssetCache(project.assets);

    // Update app data
    await this.applicationDataController.mutateAppData((appData) => {
      const existingRecentProject = appData.recentProjects.find((recentProject) => recentProject.path === projectPath);
      if (existingRecentProject !== undefined) {
        // Existing app data, update record
        existingRecentProject.name = project.manifest.projectName;
        existingRecentProject.lastOpened = new Date();
      } else {
        // New project, add to recent projects (sorting and limiting is applied automatically)
        appData.recentProjects.push({
          path: projectPath,
          name: project.manifest.projectName,
          lastOpened: new Date(),
        });
      }

      return appData;
    });

    runInAction(() => {
      this._projectJson = projectJson;
      this._project = project;
      this._isLoadingProject = false;
    });

    // Start asset watcher
    this._filesWatcher = new ProjectFilesWatcher(this);
    await this._filesWatcher.watch();

    // Start problem scanner
    // @TODO just pass the watcher in directly (?)
    this.problemScanner = new ProblemScanner(this);
    // @TODO Run an initial scan for problems
  }

  public async reloadProjectFileFromFs(): Promise<ProjectData> {
    const oldProject = this.project;
    const projectFile = await this.fileSystem.readFile(oldProject.fileName);

    const projectJson = new JsoncContainer<ProjectDefinition>(projectFile.textContent);

    const project = await ProjectData.new({
      rootPath: oldProject.rootPath,
      fileName: oldProject.fileName,
      definition: projectJson.value,
      fileSystem: this.fileSystem,
    });

    runInAction(() => {
      this._projectJson = projectJson;
      this._project = project;
    });

    return project;
  }

  public onDestroy(): void {
    // Attempt to stop watching the FS before the page unloads
    // Generally sends a request to Tauri backend which is received but logs some
    // warnings when the response is sent back after the page has reloaded.
    // See: https://github.com/tauri-apps/tauri/issues/10266
    if (this.hasLoadedProject) {
      void invoke('unload_project');
    }
    this._filesWatcher?.onDestroy();
    this.problemScanner?.onDestroy();
    this.mutatorNew.deregister();
  }

  public get isLoadingProject(): boolean {
    return this._isLoadingProject;
  }

  public get hasLoadedProject(): boolean {
    return this._project !== undefined;
  }

  public get project(): ProjectData {
    if (this._project === undefined) {
      throw new ProjectNotLoadedError();
    }
    return this._project;
  }
  public get projectJson(): JsoncContainer<ProjectDefinition> {
    if (this._projectJson === undefined) {
      throw new ProjectNotLoadedError();
    }
    return this._projectJson;
  }
  public get projectDefinition(): ProjectDefinition {
    return this.projectJson.value;
  }

  public get mutator(): ProjectMutator {
    return this._mutator;
  }
  public get mutatorNew(): ProjectMutatorNew {
    return this._mutatorNew;
  }

  public get fileSystem(): IWritableFileSystem {
    if (this._fileSystem === undefined) {
      throw new ProjectNotLoadedError();
    }
    return this._fileSystem;
  }

  public get filesWatcher(): ProjectFilesWatcher {
    if (this._filesWatcher === undefined) {
      throw new ProjectNotLoadedError();
    }
    return this._filesWatcher;
  }

  public get assetCache(): AssetCache {
    if (this._assetCache === undefined) {
      throw new Error(`AssetCache has not been initialised yet - no project is loaded`);
    }
    return this._assetCache;
  }
}

export class ProjectNotLoadedError extends Error {
  public constructor() {
    super(`No project is currently loaded`);
  }
}

export class ProjectFileNotFoundError extends Error {
  public constructor(projectPath: string) {
    super(`No project file found at path: ${projectPath}`);
  }
}
