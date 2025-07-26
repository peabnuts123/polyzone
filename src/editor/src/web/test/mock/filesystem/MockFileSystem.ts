
import { VirtualFile } from '@polyzone/runtime/src/filesystem';

import { ProjectDefinition, SceneDefinition } from '@lib/project';
import { IWritableFileSystem, WritingState } from '@lib/filesystem/IWritableFileSystem';


/**
 * Mock file system has a table of mock files, indexed by path.
 */
export class MockFileSystem extends IWritableFileSystem {
  public static readonly resolverProtocol = `mockfs://`;

  private virtualFiles: Record<string, VirtualFile>;

  public constructor() {
    super(MockFileSystem.resolverProtocol);
    this.virtualFiles = {};
  }

  public addMockFile(path: string, fileContents: string): void {
    this.virtualFiles[path] = new VirtualFile(new TextEncoder().encode(fileContents));
  }

  public static forProjectDefinition(projectFileName: string, projectDefinition: ProjectDefinition, sceneDefinition: SceneDefinition): MockFileSystem {
    const mockfileSystem = new MockFileSystem();

    // Empty file stubs for assets
    for (const assetDefinition of projectDefinition.assets) {
      mockfileSystem.addMockFile(assetDefinition.path, '');
    }

    // Every scene has the same definition
    for (const sceneManifest of projectDefinition.scenes) {
      mockfileSystem.addMockFile(sceneManifest.path, JSON.stringify(sceneDefinition, null, 2));
    }

    // Project file
    mockfileSystem.addMockFile(projectFileName, JSON.stringify(projectDefinition, null, 2));

    return mockfileSystem;
  }

  public readFile(path: string): Promise<VirtualFile> {
    if (this.virtualFiles[path] === undefined) {
      throw new Error(`File not found: ${path}`);
    }
    return Promise.resolve(this.virtualFiles[path]);
  }
  public writeFile(path: string, data: Uint8Array): Promise<void> {
    this.virtualFiles[path] = new VirtualFile(data);
    return Promise.resolve();
  }
  public moveFile(oldPath: string, newPath: string): Promise<void> {
    if (this.virtualFiles[oldPath] === undefined) {
      throw new Error(`File not found: ${oldPath}`);
    }
    this.virtualFiles[newPath] = this.virtualFiles[oldPath];
    delete this.virtualFiles[oldPath];
    return Promise.resolve();
  }
  public get writingState(): WritingState {
    return WritingState.UpToDate;
  }
  public getUrlForPath(_path: string): string {
    // @NOTE Not implemented. Ideally nothing should call this in a test
    throw new Error('Method not mocked.');
  }
}
