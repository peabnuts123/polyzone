import { ModelNode } from '@lopoly/engine/scene/nodes';

export class SceneViewSelectionCache {
  private cache: Map<ModelNode, string>;

  public constructor() {
    this.cache = new Map();
  }

  public get(modelNode: ModelNode): string | undefined {
    return this.cache.get(modelNode);
  }

  public add(gameObjectId: string, modelNodes: ModelNode[]): void {
    for (const modelNode of modelNodes) {
      this.cache.set(modelNode, gameObjectId);
    }
  }

  public remove(modelNodes: ModelNode[]): void {
    for (const modelNode of modelNodes) {
      this.cache.delete(modelNode);
    }
  }

  public clear(): void {
    this.cache.clear();
  }
}
