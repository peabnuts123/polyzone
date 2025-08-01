import { convertFileSrc } from '@tauri-apps/api/core';
import { readFile, writeFile, rename, exists } from '@tauri-apps/plugin-fs';
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

  public constructor(projectRootDir: string) {
    super(`pzedfs`);
    this.projectRootDir = projectRootDir;

    // @NOTE List of private property names, so that MobX can reference them
    type PrivateProperties = '_writingState' | 'projectRootDir';
    makeObservable<TauriFileSystem, PrivateProperties>(this, {
      '_writingState': true,
      'writingState': true,
      'projectRootDir': true,
      'getUrlForPath': true,
      'readFile': true,
      'writeFile': true,
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
    this.writingState = WritingState.Writing;
    const startWriteTime = performance.now();

    try {
      await writeFile(this.resolvePathFromProjectRoot(path), data);

      const writingDuration = performance.now() - startWriteTime;
      const waitTime = Math.max(MinimumWritingStatusDurationMs - writingDuration, 0);
      setTimeout(() => {
        runInAction(() => {
          this.writingState = WritingState.UpToDate;
        });
      }, waitTime);
    } catch (e) {
      runInAction(() => {
        this.writingState = WritingState.Failed;
      });
      console.error(`Failed to write file: `, e);
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
