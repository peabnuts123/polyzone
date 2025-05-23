import type { SceneDefinition } from '../../archive';
import { IAssetDb } from '../assets/AssetDb';
import { loadObjectDefinition, SceneData } from './SceneData';

export class SceneDb {
  private scenes: SceneData[];

  public constructor(sceneDefinitions: SceneDefinition[], assetDb: IAssetDb) {
    this.scenes = sceneDefinitions.map((sceneDefinition) =>
      new SceneData(sceneDefinition, assetDb, loadObjectDefinition),
    );
  }

  public getByPathSuffix(pathSuffix: string): SceneData {
    const scenes = this.scenes.filter((scene) => {
      // Strip file extension from scene path
      const pathName = scene.path.replace(/\.[^.]+$/, '');
      // Test that suffix at least matches the path
      const looseMatch = pathName.endsWith(pathSuffix);
      // suffix must also match AT LEAST the entire file name of the scene
      // (i.e. last segment of the path)
      const pathSegments = pathName.split('/');
      return looseMatch && pathSuffix.endsWith(pathSegments[pathSegments.length - 1]);
    });

    if (scenes.length === 0) {
      throw new Error(`No scene matching suffix: ${pathSuffix}`);
    } else if (scenes.length > 1) {
      throw new Error(`More than one scene matches suffix: ${pathSuffix}`);
    } else {
      return scenes[0];
    }
  }

  public get allScenes(): SceneData[] {
    return this.scenes;
  }
}
