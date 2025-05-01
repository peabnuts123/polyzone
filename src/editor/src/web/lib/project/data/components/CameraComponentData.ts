import { makeAutoObservable } from "mobx";
import { v4 as uuid } from 'uuid';

import {
  type CameraComponentDefinition,
  type ComponentDefinition,
  ComponentDefinitionType,
  CameraComponentData as CameraComponentDataRuntime,
  type ICameraComponentData,
} from "@polyzone/runtime/src/cartridge";

import type { IComposerComponentData } from "./IComposerComponentData";

export class CameraComponentData implements IComposerComponentData, ICameraComponentData {
  private _cameraComponentData: CameraComponentDataRuntime;

  public constructor(id: string) {
    this._cameraComponentData = new CameraComponentDataRuntime(id);

    makeAutoObservable(this);
    makeAutoObservable(this._cameraComponentData);
  }

  public toComponentDefinition(): ComponentDefinition {
    return {
      id: this.id,
      type: ComponentDefinitionType.Camera,
    } satisfies CameraComponentDefinition as CameraComponentDefinition;
  }

  public static createDefault(): CameraComponentData {
    return new CameraComponentData(uuid());
  }

  public get componentName(): string {
    return `Camera`;
  }

  public get id(): string { return this._cameraComponentData.id; }
}
