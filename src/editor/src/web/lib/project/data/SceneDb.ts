import { makeAutoObservable } from "mobx";

import { SceneDefinition as RuntimeSceneDefinition } from "@polyzone/runtime/src/cartridge";
import { IFileSystem } from "@polyzone/runtime/src/filesystem";

import { JsoncContainer } from "@lib/util/JsoncContainer";
import { SceneDefinition, SceneManifest, toRuntimeSceneDefinition } from "../definition";
import { SceneData } from ".";
import type { IEditorAssetDb } from "./AssetDb";

export interface SceneDbRecord {
  manifest: SceneManifest;
  data: SceneData;
  jsonc: JsoncContainer<SceneDefinition>;
}

export interface IEditorSceneDb {
  add(manifest: SceneManifest, definitionJsonc: JsoncContainer<SceneDefinition>): SceneDbRecord;
  remove(sceneId: string): void;
  getById(id: string): SceneDbRecord | undefined;
  getByPath(path: string): SceneDbRecord | undefined;
  getAll(): SceneDbRecord[];
  getAllManifests(): SceneManifest[];
  getAllDefinitions(): SceneDefinition[];
  getAllRuntimeDefinitions(): RuntimeSceneDefinition[];
  getAllData(): SceneData[];
  get length(): number;
}

export class SceneDb implements IEditorSceneDb {
  private readonly records: SceneDbRecord[];
  private readonly assetDb: IEditorAssetDb;

  public constructor(records: SceneDbRecord[], assetDb: IEditorAssetDb) {
    this.records = records;
    this.assetDb = assetDb;
    makeAutoObservable(this);
  }

  public add(manifest: SceneManifest, definitionJsonc: JsoncContainer<SceneDefinition>): SceneDbRecord {
    const sceneData = new SceneData(definitionJsonc.value, manifest, this.assetDb);
    const newRecord = {
      manifest,
      jsonc: definitionJsonc,
      data: sceneData,
    } satisfies SceneDbRecord;
    this.records.push(newRecord);

    return newRecord;
  }

  public remove(sceneId: string): void {
    const sceneIndex = this.records.findIndex((record) => record.data.id === sceneId);
    if (sceneIndex === -1) {
      console.warn(`[SceneDb] (remove) Could not remove scene with ID '${sceneId}' from SceneDb - no scene exists with this ID`);
      return;
    }
    this.records.splice(sceneIndex, 1);
  }

  public getById(id: string): SceneDbRecord | undefined {
    return this.records.find((record) => record.data.id === id);
  }

  public getByPath(path: string): SceneDbRecord | undefined {
    return this.records.find((record) => record.data.path === path);
  }

  public getAll(): SceneDbRecord[] {
    return this.records;
  }

  public getAllManifests(): SceneManifest[] {
    return this.records.map((record) => record.manifest);
  }

  public getAllDefinitions(): SceneDefinition[] {
    return this.records.map((record) => record.jsonc.value);
  }

  public getAllRuntimeDefinitions(): RuntimeSceneDefinition[] {
    return this.records.map((record) =>
      toRuntimeSceneDefinition(record.jsonc.value, record.manifest.path),
    );
  }

  public getAllData(): SceneData[] {
    return this.records.map((record) => record.data);
  }

  public static async new(sceneManifests: SceneManifest[], assetDb: IEditorAssetDb, fileSystem: IFileSystem): Promise<SceneDb> {
    const records: SceneDbRecord[] = [];

    for (const sceneManifest of sceneManifests) {
      const sceneFile = await fileSystem.readFile(sceneManifest.path);
      const sceneJsonc = new JsoncContainer<SceneDefinition>(sceneFile.textContent);
      const sceneData = new SceneData(
        sceneJsonc.value,
        sceneManifest,
        assetDb,
      );

      records.push({
        jsonc: sceneJsonc,
        data: sceneData,
        manifest: sceneManifest,
      });
    }

    return new SceneDb(records, assetDb);
  }

  public get length(): number {
    return this.records.length;
  }
}
