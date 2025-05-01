import type { IComponentData } from '@polyzone/runtime/src/cartridge'; // eslint-disable-line @typescript-eslint/no-unused-vars

import type { CartridgeArchive } from '../CartridgeArchive'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { CameraComponentDefinition } from './CameraComponentDefinition';
import { DirectionalLightComponentDefinition } from './DirectionalLightComponentDefinition';
import { MeshComponentDefinition } from './MeshComponentDefinition';
import { PointLightComponentDefinition } from './PointLightComponentDefinition';
import { ScriptComponentDefinition } from './ScriptComponentDefinition';


export interface ComponentDefinitionBase {
  id: string;
}

/**
 * Raw game object component data within the {@link CartridgeArchive}.
 * i.e. The raw data in the archive before being loaded by the engine into a {@link IComponentData}.
 */
export type ComponentDefinition = CameraComponentDefinition
  | DirectionalLightComponentDefinition
  | MeshComponentDefinition
  | PointLightComponentDefinition
  | ScriptComponentDefinition;
