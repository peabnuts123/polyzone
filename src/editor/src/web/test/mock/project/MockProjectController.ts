import { v4 as uuid } from 'uuid';

import { AssetType, ComponentDefinitionType } from '@polyzone/runtime/src/cartridge';
import { AssetCache } from '@polyzone/runtime/src/world/assets';

import { IProjectController } from '@lib/project/ProjectController';
import { ProjectData } from '@lib/project/data/ProjectData';
import { AssetDefinition, AssetDefinitionOfType, ProjectDefinition, SceneDefinition } from '@lib/project';
import { JsoncContainer } from '@lib/util/JsoncContainer';
import type { ProjectMutator } from '@lib/mutation/Project/ProjectMutator';
import { ProjectFilesWatcher } from '@lib/project/watcher/ProjectFilesWatcher';

import { randomHash } from '@test/util';
import { MockFileSystem } from '@test/mock/filesystem/MockFileSystem';

import { createMockProjectData } from './index';
import { AssetDataOfType } from '@lib/project/data';
import { createAssetData } from '@lib/project/data/AssetDb';
import { MockProjectMutator } from './MockProjectMutator';

// @TODO move this out somewhere, along with making mock ProjectDefinitions
function mockAsset(assetDefinition?: Partial<AssetDefinition>): AssetDefinition {
  return {
    /* Defaults */
    id: uuid(),
    hash: randomHash(),
    type: AssetType.Script,
    path: `scripts/script${~~(Math.random() * 100)}.ts`,
    /* Override with provided definition */
    ...assetDefinition,
  };
}

/**
 * Mock version of `ProjectController` that just houses state, and otherwise contains no logic.
 */
export class MockProjectController implements IProjectController {
  public isLoadingProject = false;
  public hasLoadedProject = true;
  public project: ProjectData;
  public projectJson: JsoncContainer<ProjectDefinition>;
  public get projectDefinition(): ProjectDefinition {
    return this.projectJson.value;
  }
  public mutator: ProjectMutator;
  public fileSystem: MockFileSystem;
  public filesWatcher: ProjectFilesWatcher;
  public assetCache: AssetCache;

  public constructor() {
    // @TODO move the particulars of project / scene definition out of here
    const mockProjectDefinition: ProjectDefinition = {
      manifest: {
        projectName: "Mock Project",
      },
      assets: [
        mockAsset({
          type: AssetType.Script,
          path: 'scripts/player-controller.ts',
        }),
        mockAsset({
          type: AssetType.Mesh,
          path: 'models/player.obj',
        }),
        mockAsset({
          type: AssetType.Texture,
          path: 'textures/player.png',
        }),
      ],
      scenes: [
        {
          id: uuid(),
          hash: randomHash(),
          path: 'scenes/game.pzscene',
        },
      ],
    };
    const mockSceneDefinition: SceneDefinition = {
      config: {
        clearColor: { r: 0, g: 0, b: 0 },
        lighting: {
          ambient: {
            intensity: 0.5,
            color: { r: 255, g: 255, b: 255 },
          },
        },
      },
      objects: [
        {
          id: uuid(),
          name: "Camera",
          transform: {
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 },
          },
          children: [],
          components: [
            {
              id: uuid(),
              type: ComponentDefinitionType.Camera,
            },
          ],
        },
      ],
    };
    const projectFileName = 'mock-project.pzproj';
    const mockFileSystem = MockFileSystem.forProjectDefinition(
      projectFileName,
      mockProjectDefinition,
      mockSceneDefinition,
    );
    this.project = createMockProjectData(
      '/path/to/project',
      projectFileName,
      mockProjectDefinition,
      mockSceneDefinition,
      mockFileSystem,
    );
    this.projectJson = new JsoncContainer<ProjectDefinition>(JSON.stringify(mockProjectDefinition));
    this.mutator = new MockProjectMutator(this);
    this.fileSystem = mockFileSystem;
    // @TODO Should this be a mocked interface?
    this.filesWatcher = new ProjectFilesWatcher(this);
    this.assetCache = new AssetCache(this.project.assets);
  }

  /**
   * Test utility that configures the mock to include an asset, from a given asset definition.
   * Adds the asset to the mock file system, asset DB and project definition.
   * @param assetDefinition The asset to add.
   * @param assetFileContents (Optional) Contents of the asset file within the mock file system.
   * @returns AssetData instance for the newly added asset.
   */
  public addAsset<TAssetType extends AssetType>(assetDefinition: AssetDefinitionOfType<TAssetType>, assetFileContents: string = ""): AssetDataOfType<TAssetType> {
    // Add asset definition to mock file system
    this.fileSystem.addMockFile(assetDefinition.path, assetFileContents);

    // Create and initialise asset data
    const assetData: AssetDataOfType<TAssetType> = createAssetData(assetDefinition, this.fileSystem);
    // @TODO Why does this need to be type laundered???
    assetData.loadDefinition(assetDefinition as any, this.project.assets);

    // Mutate project definition
    this.projectJson.mutate((project) =>
      project.assets[this.project.assets.assets.length],
      assetDefinition as AssetDefinition,
      { isArrayInsertion: true },
    );

    // Add asset to AssetDb
    this.project.assets.add(assetData);

    return assetData;
  }

  public loadProject(_projectPath: string): Promise<void> {
    return Promise.resolve();
  }
  public reloadProjectFileFromFs(): Promise<ProjectData> {
    return Promise.resolve(this.project);
  }
  public onDestroy(): void { }
}
