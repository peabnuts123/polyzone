import { ModelNode } from "@lopoly/engine/scene/nodes";

export interface ISelectableObject {
  // @TODO Probably doesn't need to be an array any more.
  get allSelectableMeshes(): ModelNode[];
}

export function isSelectableObject(object: object | undefined): object is ISelectableObject {
  return typeof object === 'object' && 'allSelectableMeshes' in object;
}
