import { IFileSystem } from "@polyzone/runtime/src/filesystem";

export abstract class IWritableFileSystem extends IFileSystem {
  public abstract writeFile(path: string, data: Uint8Array): Promise<void>;
  public abstract deleteFile(path: string): Promise<void>;
  public abstract moveFile(oldPath: string, newPath: string): Promise<void>;
  public abstract get writingState(): WritingState;
}

export enum WritingState {
  Writing,
  UpToDate,
  Failed,
}
