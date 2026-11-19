import { makeAutoObservable } from "mobx";
import { v4 as uuid } from 'uuid';

import {
  ComponentDefinitionType,
  type IMeshComponentData,
  MeshComponentData as MeshComponentDataRuntime,
  type MeshComponentDefinition,
  type ComponentDefinition,
} from "@polyzone/runtime/cartridge";

import type { MeshAssetData } from "@lib/project/data/assets";
import { EditorMeshComponent } from "@lib/common/objects/components";
import type { IComposerComponentData } from "./IComposerComponentData";

export class MeshComponentData implements IComposerComponentData, IMeshComponentData {
  private _meshComponentData: MeshComponentDataRuntime;

  // @TODO is this good? Is this useful? I think maybe it should be removed
  // +1 I agree (2026/11/18)
  public componentInstance: EditorMeshComponent | undefined = undefined;

  public constructor(id: string, meshAsset: MeshAssetData | undefined) {
    this._meshComponentData = new MeshComponentDataRuntime(id, meshAsset);

    makeAutoObservable(this);
    makeAutoObservable(this._meshComponentData);
  }

  public toComponentDefinition(): ComponentDefinition {
    return {
      id: this.id,
      type: ComponentDefinitionType.Mesh,
      meshFileId: this.meshAsset?.id ?? null,
    } satisfies MeshComponentDefinition as MeshComponentDefinition;
  }

  public static createDefault(): MeshComponentData {
    return new MeshComponentData(
      uuid(),
      undefined,
    );
  }

  public get componentName(): string {
    return `Mesh`;
  }

  public get id(): string { return this._meshComponentData.id; }
  public get meshAsset(): MeshAssetData | undefined { return this._meshComponentData.meshAsset as MeshAssetData | undefined; }
  public set meshAsset(meshAsset: MeshAssetData | undefined) { this._meshComponentData.meshAsset = meshAsset; }
}
