import type { SceneData } from '@polyzone/runtime/cartridge'; // eslint-disable-line @typescript-eslint/no-unused-vars

import { GameObjectDefinition } from "./GameObjectDefinition";
import { Color3Definition } from "./util";


/**
 * Raw data from the cartridge archive before being loaded by the engine into a {@link SceneData}.
 */
export interface SceneDefinition {
  path: string;
  config: {
    clearColor: Color3Definition;
    lighting: {
      ambient: {
        intensity: number;
        color: Color3Definition;
      }
    }
  }
  objects: GameObjectDefinition[];
}
