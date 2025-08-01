import { ModelEditorViewMutator } from "@lib/mutation/MaterialEditor/ModelEditorView";

/**
 * Mock version of `ModelEditorViewMutator` that does not interact with the file system.
 */
export class MockModelEditorViewMutator extends ModelEditorViewMutator {
  public override persistChanges(): Promise<void> {
    return Promise.resolve();
  }
}
