import { makeAutoObservable } from "mobx";
import { v4 as uuid } from 'uuid';

import { ComponentDefinitionType, type ComponentDefinition, type ScriptComponentDefinition } from "@polyzone/runtime/src/cartridge";

import type { ScriptAssetData } from "@lib/project/data/AssetData";
import { IComposerComponentData } from "./IComposerComponentData";

export class ScriptComponentData implements IComposerComponentData {
  public readonly id: string;
  /** {@link ScriptAssetData} containing the script asset. */
  public scriptAsset: ScriptAssetData | undefined;

  public constructor(id: string, scriptAsset: ScriptAssetData | undefined) {
    this.id = id;
    this.scriptAsset = scriptAsset;

    makeAutoObservable(this);
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

  get componentName(): string {
    return `Script`;
  }
}
