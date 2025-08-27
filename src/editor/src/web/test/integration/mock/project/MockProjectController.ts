
import { AssetCache } from '@polyzone/runtime/src/world/assets';

import { IProjectController } from '@lib/project/ProjectController';
import { ProjectData } from '@lib/project/data/ProjectData';
import { ProjectDefinition } from '@lib/project';
import { JsoncContainer } from '@lib/util/JsoncContainer';
import { ProjectFilesWatcher } from '@lib/project/watcher/ProjectFilesWatcher';
import { AssetDb } from '@lib/project/data/AssetDb';
import { Func } from '@lib/util/types';
import { SceneDb } from '@lib/project/data/SceneDb';

import { MockFileSystem } from '../filesystem/MockFileSystem';
import { MockProjectMutator, MockProjectMutatorNew } from './MockProjectMutator';
import { MockProject } from './MockProject';
import { MutationController } from '@lib/mutation/MutationController';

/**
 * Mock version of `ProjectController` that just houses state, and otherwise contains no logic.
 */
export class MockProjectController implements IProjectController {
  public isLoadingProject = false;
  public hasLoadedProject = true;
  public project: ProjectData;
  public projectJson: JsoncContainer<ProjectDefinition>;
  public mutationController: MutationController;
  public mutator: MockProjectMutator;
  public mutatorNew: MockProjectMutatorNew;
  public fileSystem: MockFileSystem;
  public filesWatcher: ProjectFilesWatcher;
  public assetCache: AssetCache;

  public constructor(
    project: ProjectData,
    projectJson: JsoncContainer<ProjectDefinition>,
    fileSystem: MockFileSystem,
    assetCache: AssetCache,
  ) {
    this.project = project;
    this.projectJson = projectJson;
    this.fileSystem = fileSystem;
    this.assetCache = assetCache;
    this.mutationController = new MutationController();
    this.mutator = new MockProjectMutator(this);
    this.mutatorNew = new MockProjectMutatorNew(this, this.mutationController);
    this.filesWatcher = new ProjectFilesWatcher(this);
  }

  public static async create(mockProject: MockProject): Promise<MockProjectController> {
    const mockFileSystem = mockProject.fileSystem;
    const { definition: projectDefinition, jsonc: projectJsonc, path: projectPath } = mockProject.project;

    const assetDb = new AssetDb(
      projectDefinition.assets,
      mockFileSystem,
    );
    const sceneDb = await SceneDb.new(
      projectDefinition.scenes,
      assetDb,
      mockFileSystem,
    );
    const projectData = new ProjectData(
      `/path/to/project`,
      projectPath,
      projectDefinition.manifest,
      assetDb,
      sceneDb,
    );
    const assetCache = new AssetCache(assetDb);

    return new MockProjectController(
      projectData,
      projectJsonc,
      mockFileSystem,
      assetCache,
    );
  }

  public loadProject: (projectPath: string) => Promise<void> = () => {
    return Promise.resolve();
  };
  public reloadProjectFileFromFs: Func<Promise<ProjectData>> = () => {
    return Promise.resolve(this.project);
  };
  public onDestroy: Func<void> = () => {
    /* No-op */
  };

  public get projectDefinition(): ProjectDefinition {
    return this.projectJson.value;
  }
}
