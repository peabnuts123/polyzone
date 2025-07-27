
import { IFileSystem } from '@polyzone/runtime/src/filesystem';

import { ProjectData } from '@lib/project/data/ProjectData';
import { ProjectDefinition, SceneDefinition } from '@lib/project';
import { AssetDb } from '@lib/project/data/AssetDb';

import { createMockSceneDb } from '@test/mock/scene';


/**
 * Utility function for creating a ProjectData instance from mock data.
 */
export function createMockProjectData(
  rootPath: string,
  fileName: string,
  projectDefinition: ProjectDefinition,
  sceneDefinition: SceneDefinition,
  fileSystem: IFileSystem,
): ProjectData {
  const assetDb = new AssetDb(
    projectDefinition.assets,
    fileSystem,
  );
  const sceneDb = createMockSceneDb(
    projectDefinition.scenes,
    sceneDefinition,
    assetDb,
  );
  return new ProjectData(
    rootPath,
    fileName,
    projectDefinition.manifest,
    assetDb,
    sceneDb,
  );
}
