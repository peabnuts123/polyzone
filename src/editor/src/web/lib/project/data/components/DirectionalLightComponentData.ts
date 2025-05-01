import { makeAutoObservable } from "mobx";
import { v4 as uuid } from 'uuid';

import { Color3 } from '@polyzone/core/src/util';
import {
  type ComponentDefinition,
  ComponentDefinitionType,
  type DirectionalLightComponentDefinition,
  DirectionalLightComponentData as DirectionalLightComponentDataRuntime,
  type IDirectionalLightComponentData,
} from "@polyzone/runtime/src/cartridge";
import { toColor3Definition } from "@polyzone/runtime/src/util";

import type { IComposerComponentData } from "./IComposerComponentData";

export class DirectionalLightComponentData implements IComposerComponentData, IDirectionalLightComponentData {
  private _directionalLightComponentData: DirectionalLightComponentDataRuntime;

  public constructor(id: string, intensity: number, color: Color3) {
    this._directionalLightComponentData = new DirectionalLightComponentDataRuntime(id, intensity, color);

    makeAutoObservable(this);
    makeAutoObservable(this._directionalLightComponentData);
  }

  public toComponentDefinition(): ComponentDefinition {
    return {
      id: this.id,
      type: ComponentDefinitionType.DirectionalLight,
      color: toColor3Definition(this.color),
      intensity: this.intensity,
    } satisfies DirectionalLightComponentDefinition as DirectionalLightComponentDefinition;
  }

  public static createDefault(): DirectionalLightComponentData {
    return new DirectionalLightComponentData(
      uuid(),
      1,
      Color3.white(),
    );
  }

  public get componentName(): string {
    return `Directional Light`;
  }

  public get id(): string { return this._directionalLightComponentData.id; }
  public get intensity(): number { return this._directionalLightComponentData.intensity; }
  public set intensity(value: number) { this._directionalLightComponentData.intensity = value; }
  public get color(): Color3 { return this._directionalLightComponentData.color; }
  public set color(value: Color3) { this._directionalLightComponentData.color = value; }
}
