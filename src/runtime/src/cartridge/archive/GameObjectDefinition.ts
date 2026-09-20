import type { GameObjectData } from '@polyzone/runtime/cartridge'; // eslint-disable-line @typescript-eslint/no-unused-vars

import { ComponentDefinition } from "./components";
import { Vector3Definition } from "./util";

/**
 * Raw data from the cartridge archive before being loaded by the engine into a {@link GameObjectData}.
 */
export interface GameObjectDefinition {
  id: string;
  name: string;
  transform: {
    position: Vector3Definition;
    rotation: Vector3Definition;
    scale: Vector3Definition;
  }
  components: ComponentDefinition[]; // @TODO Should probably be nullable too - everything should kind of be nullable TBH
  children: GameObjectDefinition[] | undefined;
}
