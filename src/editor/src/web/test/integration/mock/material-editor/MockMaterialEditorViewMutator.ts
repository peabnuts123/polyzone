import { MaterialEditorViewMutator, MaterialEditorViewMutatorNew } from "@lib/mutation/MaterialEditor/MaterialEditorView";

/**
 * Mock version of `MaterialEditorViewMutator` that does not interact with the file system.
 */
export class MockMaterialEditorViewMutator extends MaterialEditorViewMutator {
  public override persistChanges(): Promise<void> {
    return Promise.resolve();
  }
}
export class MockMaterialEditorViewMutatorNew extends MaterialEditorViewMutatorNew {
  public override persistChanges(): Promise<void> {
    return Promise.resolve();
  }
}
