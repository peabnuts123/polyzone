import { SceneDefinition, SceneManifest } from '@lib/project';
import { JsoncContainer } from '@lib/util/JsoncContainer';
import { SceneData } from '@lib/project/data';
import { IEditorAssetDb } from '@lib/project/data/AssetDb';
import { SceneDb, SceneDbRecord } from '@lib/project/data/SceneDb';

/**
 * Utility function for creating a SceneDb instance from mock data.
 */
export function createMockSceneDb(
  sceneManifests: SceneManifest[],
  sceneDefinition: SceneDefinition,
  assetDb: IEditorAssetDb,
): SceneDb {
  // @NOTE Every scene uses the same definition
  return new SceneDb(
    sceneManifests.map((sceneManifest) => ({
      manifest: sceneManifest,
      data: new SceneData(
        sceneDefinition,
        sceneManifest,
        assetDb,
      ),
      jsonc: new JsoncContainer<SceneDefinition>(JSON.stringify(sceneDefinition, null, 2)),
    } satisfies SceneDbRecord)),
    assetDb,
  );
}
