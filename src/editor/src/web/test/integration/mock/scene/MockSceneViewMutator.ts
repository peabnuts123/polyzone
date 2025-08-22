import { SceneViewMutator, SceneViewMutatorNew } from "@lib/mutation/SceneView/SceneViewMutator";

/* @TODO Remove, replace with new */
/**
 * Mock version of `SceneViewMutator` that does not interact with the file system.
 */
export class MockSceneViewMutator extends SceneViewMutator {
  public override persistChanges(): Promise<void> {
    return Promise.resolve();
  }
}
export class MockSceneViewMutatorNew extends SceneViewMutatorNew {
  public override persistChanges(): Promise<void> {
    return Promise.resolve();
  }
}
