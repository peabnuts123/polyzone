import { makeAutoObservable } from "mobx";
import { IFileSystem } from "@polyzone/runtime/src/filesystem";
import { ProjectDefinition, ProjectManifest } from "../definition";
import { AssetDb, type IEditorAssetDb } from "./AssetDb";
import { SceneDb, type IEditorSceneDb } from "./SceneDb";

export interface ProjectDataConstructorArgs {
  rootPath: string;
  fileName: string;
  definition: ProjectDefinition;
  fileSystem: IFileSystem;
}

export class ProjectData {
  public readonly rootPath: string;
  public fileName: string;
  public readonly assets: IEditorAssetDb;
  public readonly scenes: IEditorSceneDb;
  public readonly manifest: ProjectManifest;

  public constructor(rootPath: string, fileName: string, manifest: ProjectManifest, assets: IEditorAssetDb, scenes: IEditorSceneDb) {
    this.rootPath = rootPath;
    this.fileName = fileName;
    this.manifest = manifest;
    this.assets = assets;
    this.scenes = scenes;

    makeAutoObservable(this);
  }

  public static async new({
    rootPath,
    fileName,
    definition,
    fileSystem,
  }: ProjectDataConstructorArgs): Promise<ProjectData> {
    const assetDb = new AssetDb(
      definition.assets,
      fileSystem,
    );
    const sceneDb = await SceneDb.new(
      definition.scenes,
      assetDb,
      fileSystem,
    );

    // @NOTE passing args positionally 😕
    return new ProjectData(
      rootPath,
      fileName,
      definition.manifest,
      assetDb,
      sceneDb,
    );
  }
}
