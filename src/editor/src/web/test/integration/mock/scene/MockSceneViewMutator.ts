import { SceneViewMutator } from "@lib/mutation/SceneView/SceneViewMutator";

/**
 * Mock version of `SceneViewMutator` that does not interact with the file system.
 */
export class MockSceneViewMutator extends SceneViewMutator {
  public override persistChanges(): Promise<void> {
    return Promise.resolve();
  }
}
