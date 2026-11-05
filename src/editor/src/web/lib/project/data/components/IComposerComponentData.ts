import { IComponentData } from "@polyzone/runtime/cartridge";
import { ComponentDefinition } from "@polyzone/runtime/cartridge/archive";

/**
 * Component data that is specific to the composer.
 */
export interface IComposerComponentData extends IComponentData {
  id: string;
  get componentName(): string;
  toComponentDefinition(): ComponentDefinition;
}
