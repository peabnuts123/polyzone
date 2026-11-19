import { IComponentData } from "@polyzone/runtime/cartridge";
import { ComponentDefinition } from "@polyzone/runtime/cartridge/archive";

/**
 * Component data that is specific to the editor.
 */
export interface IEditorComponentData extends IComponentData {
  id: string;
  get componentName(): string;
  toComponentDefinition(): ComponentDefinition;
}
