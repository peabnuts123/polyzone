import type { FunctionComponent } from "react";

import type { GameObjectData, IComposerComponentData } from "@lib/project/data";
import type { ISceneViewController } from "@lib/composer/scene";

export interface InspectorComponentProps<TComponentType extends IComposerComponentData> {
  component: TComponentType;
  controller: ISceneViewController;
  gameObject: GameObjectData;
}

export type InspectorComponent<TComponentType extends IComposerComponentData> = FunctionComponent<InspectorComponentProps<TComponentType>>;
