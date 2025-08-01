import { VirtualFile } from '@polyzone/runtime/src/filesystem';
import Resolver from '@polyzone/runtime/src/Resolver';

import { IWritableFileSystem, WritingState } from '@lib/filesystem/IWritableFileSystem';


export interface MockFile {
  path: string;
  data: Uint8Array;
}

/**
 * Mock file system serves a copy of the content from `./mock-project`.
 */
export class MockFileSystem extends IWritableFileSystem {
  public files: Record<string, Uint8Array>;
  public writingState: WritingState = WritingState.UpToDate;

  public constructor(files: MockFile[]) {
    super(`mockfs`);

    this.files = {};
    for (const file of files) {
      this.files[file.path] = file.data;
    }

    // @NOTE All file systems automatically deregistered via setup file `deregisterAllFileSystems.ts`
    Resolver.registerFileSystem(this);
  }

  public writeFile(path: string, data: Uint8Array): Promise<void> {
    return Promise.resolve(this.writeFileSync(path, data));
  }
  public writeFileSync(path: string, data: Uint8Array): void {
    this.files[path] = data;
  }

  public moveFile(oldPath: string, newPath: string): Promise<void> {
    return Promise.resolve(this.moveFileSync(oldPath, newPath));
  }
  public moveFileSync(oldPath: string, newPath: string): void {
    if (!(oldPath in this.files)) {
      throw new Error(`File not found: ${oldPath}`);
    }
    this.files[newPath] = this.files[oldPath];
    delete this.files[oldPath];
  }

  public getUrlForPath(path: string): string {
    // Create an "object URL" that can be used to fetch the file at this path
    const fileBytes = this.files[path];
    if (!fileBytes) {
      throw new Error(`File not found: ${path}`);
    }
    const objectUrl = URL.createObjectURL(new Blob([fileBytes]));
    // @NOTE release object URL after 10 seconds
    // Is this chill?
    setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
    }, 10_000);
    return objectUrl;
  }

  public async readFile(path: string): Promise<VirtualFile> {
    return Promise.resolve(this.readFileSync(path));
  }
  public readFileSync(path: string): VirtualFile {
    const data = this.files[path];
    if (!data) {
      throw new Error(`File not found: ${path}`);
    }
    return new VirtualFile(data);
  }
}
