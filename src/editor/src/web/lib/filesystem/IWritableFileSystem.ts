import { IFileSystem } from '@lopoly/engine/filesystem';

export interface IWritableFileSystem extends IFileSystem {
  writeFile(path: string, data: Uint8Array): Promise<void>;
  deleteFile(path: string): Promise<void>;
  moveFile(oldPath: string, newPath: string): Promise<void>;
  get writingState(): WritingState;
}

export enum WritingState {
  Writing,
  UpToDate,
  Failed,
}
