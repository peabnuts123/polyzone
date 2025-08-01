import { MaterialDefinition } from "@polyzone/runtime/src/world";

export interface MockMaterial {
  definition: MaterialDefinition;
  data: Uint8Array;
}
export function createMockMaterial(config?: Partial<MaterialDefinition>): MockMaterial {
  const definition: MaterialDefinition = {
    ...config,
  };
  const data = new TextEncoder().encode(JSON.stringify(definition));

  return {
    definition,
    data,
  };
}
