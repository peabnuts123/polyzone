import type { SceneData } from '@polyzone/runtime/src/cartridge'; // eslint-disable-line @typescript-eslint/no-unused-vars

import type { CartridgeArchive } from './CartridgeArchive'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { GameObjectDefinition } from "./GameObjectDefinition";
import { ColorDefinition } from "./util";


/**
 * Raw game scene definition within the {@link CartridgeArchive}.
 * i.e. The raw data in the archive before being loaded by the engine into a {@link SceneData}.
 */
export interface SceneDefinition {
  path: string;
  config: {
    clearColor: ColorDefinition;
    lighting: {
      ambient: {
        intensity: number;
        color: ColorDefinition;
      }
    }
  }
  objects: GameObjectDefinition[];
}
