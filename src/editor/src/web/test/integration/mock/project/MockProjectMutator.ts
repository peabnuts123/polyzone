import { ProjectMutator } from "@lib/mutation/Project";

/**
 * Mock version of `ProjectMutator` that does not interact with the file system.
 */
export class MockProjectMutator extends ProjectMutator {
  public override persistChanges(): Promise<void> {
    return Promise.resolve();
  }
}
