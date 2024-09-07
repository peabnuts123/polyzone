import { makeObservable, observable } from "mobx";

import { TransformConfig } from "@fantasy-console/runtime/src/cartridge/config";
import type { Vector3 } from '@fantasy-console/core/src/util';


export class TransformConfigComposer extends TransformConfig {
  public constructor(position: Vector3, rotation: number) {
    super(position, rotation);

    makeObservable(this, {
      position: observable,
      rotation: observable,
    });
  }
}
