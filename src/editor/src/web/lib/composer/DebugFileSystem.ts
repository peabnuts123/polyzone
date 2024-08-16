import { IFileSystem, VirtualFile } from "@fantasy-console/runtime/src/filesystem";

export const DebugFileSystemRoot: string = `/project`;

export class DebugFileSystem implements IFileSystem {
  private fileSystemRoot: string;

  public constructor() {
    this.fileSystemRoot = DebugFileSystemRoot;
  }

  public getUrlForPath(path: string): string {
    return `${this.fileSystemRoot}/${path}`;
  }

  public async readFile(path: string): Promise<VirtualFile> {
    const url = this.getUrlForPath(path);
    const result = await fetch(url);
    const fileBytes = await result.arrayBuffer();
    return new VirtualFile(
      new Uint8Array(fileBytes),
    );
  }
}
