import { makeAutoObservable } from "mobx";
import { v4 as uuid } from 'uuid';

import {
  ComponentDefinitionType,
  type ComponentDefinition,
  type ScriptComponentDefinition,
  ScriptComponentData as ScriptComponentDataRuntime,
  type IScriptComponentData,
} from "@polyzone/runtime/src/cartridge";

import type { ScriptAssetData } from "@lib/project/data/assets";
import { IComposerComponentData } from "./IComposerComponentData";

export class ScriptComponentData implements IComposerComponentData, IScriptComponentData {
  private _scriptComponentData: ScriptComponentDataRuntime;

  public constructor(id: string, scriptAsset: ScriptAssetData | undefined) {
    this._scriptComponentData = new ScriptComponentDataRuntime(id, scriptAsset);
    makeAutoObservable(this);
    makeAutoObservable(this._scriptComponentData);
  }

  public toComponentDefinition(): ComponentDefinition {
    return {
      id: this.id,
      type: ComponentDefinitionType.Script,
      scriptFileId: this.scriptAsset?.id ?? null,
    } satisfies ScriptComponentDefinition as ScriptComponentDefinition;
  }

  public static createDefault(): ScriptComponentData {
    return new ScriptComponentData(
      uuid(),
      undefined,
    );
  }

  public get componentName(): string {
    return `Script`;
  }

  public get id(): string { return this._scriptComponentData.id; }
  public get scriptAsset(): ScriptAssetData | undefined { return this._scriptComponentData.scriptAsset as ScriptAssetData | undefined; }
  public set scriptAsset(scriptAsset: ScriptAssetData | undefined) { this._scriptComponentData.scriptAsset = scriptAsset; }
}
