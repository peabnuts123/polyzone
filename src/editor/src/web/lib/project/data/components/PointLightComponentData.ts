import { makeAutoObservable } from "mobx";
import { v4 as uuid } from 'uuid';

import { Color3 } from '@polyzone/core/src/util';
import {
  type ComponentDefinition,
  ComponentDefinitionType,
  type IPointLightComponentData,
  type PointLightComponentDefinition,
  PointLightComponentData as PointLightComponentDataRuntime,
} from "@polyzone/runtime/src/cartridge";
import { toColor3Definition } from "@polyzone/runtime/src/util";

import type { IComposerComponentData } from "./IComposerComponentData";

export class PointLightComponentData implements IComposerComponentData, IPointLightComponentData {
  private _pointLightComponentData: PointLightComponentDataRuntime;

  public constructor(id: string, intensity: number, color: Color3) {
    this._pointLightComponentData = new PointLightComponentDataRuntime(id, intensity, color);
    makeAutoObservable(this);
    makeAutoObservable(this._pointLightComponentData);
  }

  public toComponentDefinition(): ComponentDefinition {
    return {
      id: this.id,
      type: ComponentDefinitionType.PointLight,
      color: toColor3Definition(this.color),
      intensity: this.intensity,
    } satisfies PointLightComponentDefinition as PointLightComponentDefinition;
  }

  public static createDefault(): PointLightComponentData {
    return new PointLightComponentData(
      uuid(),
      1,
      Color3.white(),
    );
  }

  public get componentName(): string {
    return `Point Light`;
  }

  public get id(): string { return this._pointLightComponentData.id; }
  public get intensity(): number { return this._pointLightComponentData.intensity; }
  public set intensity(value: number) { this._pointLightComponentData.intensity = value; }
  public get color(): Color3 { return this._pointLightComponentData.color; }
  public set color(value: Color3) { this._pointLightComponentData.color = value; }
}
