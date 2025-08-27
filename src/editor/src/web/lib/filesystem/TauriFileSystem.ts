import { convertFileSrc } from '@tauri-apps/api/core';
import { readFile, writeFile, remove, rename, exists } from '@tauri-apps/plugin-fs';
import { makeObservable, runInAction } from 'mobx';

import { VirtualFile } from "@polyzone/runtime/src/filesystem";
import { joinToNativePath } from '@lib/util/path';
import { IWritableFileSystem, WritingState } from './IWritableFileSystem';

/**
 * Minimum amount of time the FS will stay in the 'Writing' state for,
 * to make sure the UI doesn't flicker.
 */
const MinimumWritingStatusDurationMs = 500;

// @TODO Eventing like onFinishSave or whatever so that fs events can wait until
// finished saving.
// + Also maybe some way to disable saving

export class TauriFileSystem extends IWritableFileSystem {
  private readonly projectRootDir: string;
  private _writingState: WritingState = WritingState.UpToDate;
  private withWritingStateTimeout: ReturnType<typeof setTimeout> | undefined;

  public constructor(projectRootDir: string) {
    super(`pzedfs`);
    this.projectRootDir = projectRootDir;

    // @NOTE List of private property names, so that MobX can reference them
    type PrivateProperties = '_writingState' | 'projectRootDir' | 'withWritingStateTimeout';
    makeObservable<TauriFileSystem, PrivateProperties>(this, {
      '_writingState': true,
      'writingState': true,
      'projectRootDir': true,
      'getUrlForPath': true,
      'readFile': true,
      'writeFile': true,
      'withWritingStateTimeout': true,
    });
  }

  public getUrlForPath(path: string): string {
    // @NOTE Append a random parameter to asset requests to prevent browser/babylon from caching the data
    const cacheBustParam = (~~(Math.random() * 0x10000 + 0x10000)).toString(16);
    const url = new URL(convertFileSrc(this.resolvePathFromProjectRoot(path)));
    url.searchParams.set('cache_bust', cacheBustParam);
    return url.toString();
  }

  public async readFile(path: string): Promise<VirtualFile> {
    const fileBytes = await readFile(this.resolvePathFromProjectRoot(path));
    return new VirtualFile(fileBytes);
  }

  public async writeFile(path: string, data: Uint8Array): Promise<void> {
    try {
      await this.withWritingState(() =>
        writeFile(this.resolvePathFromProjectRoot(path), data),
      );
    } catch (e) {
      runInAction(() => {
        this.writingState = WritingState.Failed;
      });
      console.error(`Failed to write file: `, e);
      throw e;
    }
  }

  public async deleteFile(path: string): Promise<void> {
    try {
      await this.withWritingState(() =>
        remove(this.resolvePathFromProjectRoot(path)),
      );
    } catch (e) {
      runInAction(() => {
        this.writingState = WritingState.Failed;
      });
      console.error(`Failed to delete file: `, e);
      throw e;
    }
  }

  public async moveFile(oldPath: string, newPath: string): Promise<void> {
    oldPath = this.resolvePathFromProjectRoot(oldPath);
    newPath = this.resolvePathFromProjectRoot(newPath);

    if (!await exists(oldPath)) {
      throw new Error(`Cannot move file: oldPath '${oldPath}' does not exist`);
    }
    if (await exists(newPath)) {
      throw new Error(`Cannot move file: newPath '${newPath}' already exists - this operation is not allowed to replace files`);
    }

    await rename(
      oldPath,
      newPath,
    );
  }

  private async withWritingState(fn: (...args: any[]) => Promise<void>): Promise<void> {
    this.writingState = WritingState.Writing;
    const startWriteTime = performance.now();

    await fn();

    const writingDuration = performance.now() - startWriteTime;
    const waitTime = Math.max(MinimumWritingStatusDurationMs - writingDuration, 0);

    // Cancel previous timer if starting a new one to prevent race conditions
    if (this.withWritingStateTimeout !== undefined) {
      runInAction(() => {
        clearTimeout(this.withWritingStateTimeout);
      });
    }

    // Start new timer to clear writing state
    setTimeout(() => {
      runInAction(() => {
        this.writingState = WritingState.UpToDate;
      });
    }, waitTime);
  }

  private resolvePathFromProjectRoot(...pathSegments: string[]): string {
    return joinToNativePath(this.projectRootDir, ...pathSegments);
  }

  public get writingState(): WritingState {
    return this._writingState;
  }
  private set writingState(value: WritingState) {
    this._writingState = value;
  }
}
